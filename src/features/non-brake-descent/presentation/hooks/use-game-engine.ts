/**
 * ゲームエンジンフック
 *
 * NonBrakeDescentGame.tsx から状態管理・ゲームループロジックを抽出する。
 * 元のコードの動作を忠実に再現しつつ、プレゼンテーション層から分離する。
 *
 * B2-S1: setState updater 内の副作用をループ外へ分離。
 * 動的値（player/speed/ramps/camY/effect/combo/comboTimer/lastRamp/godMode）を
 * ref に昇格させ、ゲームループの依存配列を [state] のみに縮小した。
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Audio } from '../../audio';
import { Config } from '../../config';
import { EffectType, GameState, ObstacleType, SpeedRank } from '../../constants';
import { CollisionDomain } from '../../domains/collision-domain';
import { ComboDomain } from '../../domains/combo-domain';
import { DangerDomain } from '../../domains/danger-domain';
import { GeometryDomain } from '../../domains/geometry-domain';
import { ScoringDomain } from '../../domains/scoring-domain';
import { SpeedDomain } from '../../domains/speed-domain';
import { MathUtils } from '../../domains/math-utils';
import { EntityFactory } from '../../entities';
import { BackgroundGen, RampGen } from '../../generators';
import { useCheatCode } from '../../hooks';
import { ParticleSys } from '../../particles';
import { Physics } from '../../physics';
import type {
  ClearAnim,
  DeathState,
  EffectState,
  GameStateValue,
  InputState,
  NearMissEffect,
  Particle,
  Player,
  Ramp,
  ScorePopup,
  TouchKeys,
} from '../../types';
import type { GameWorld, UIState } from '../../application/game-loop/game-state';
import { advanceClock, createGameClock, triggerHitstop, triggerSlowMo } from '../../application/game-loop/game-clock';
import { resolveMotionScale, scaleFrames } from '../../application/game-loop/motion-scale';
import { useReducedMotion } from './use-reduced-motion';
import { useIsMobile } from './use-mobile';
import { getHighScore, saveScore } from '../../../../utils/score-storage';
import {
  spawnSpeedLines,
  updateSpeedLines,
} from '../../domain/services/speed-line-service';
import type { SpeedLine } from '../../domain/services/speed-line-service';
import { sampleTrail } from '../../domain/services/trail-service';
import type { TrailSample } from '../../domain/services/trail-service';
import { createDust } from '../../domain/services/dust-service';

const SCORE_KEY = 'non_brake_descent';

/** 残像トレイルの最大サンプル保持数 */
const MAX_TRAIL_SAMPLES = 10;

/** 着地時の土煙パーティクル数（通常着地） */
const DUST_PARTICLE_COUNT = 6;

type CollisionHandlerResult = boolean | 'slow';

type CollisionCallbacks = {
  onDie: (type: DeathState['type']) => void;
  onScore: (ox: number) => void;
  onEffect: (type: EffectState['type']) => void;
  onEnemyKill: (ox: number) => void;
  onBounce: (vx: number) => void;
};

/** 衝突ハンドラを生成する */
const createCollisionHandlers = (
  rank: typeof SpeedRank[keyof typeof SpeedRank],
  cb: CollisionCallbacks,
  godMode: boolean
): Partial<
  Record<
    (typeof ObstacleType)[keyof typeof ObstacleType],
    (col: ReturnType<typeof CollisionDomain.check>, obs: Ramp['obs'][number], ox: number, px: number) => CollisionHandlerResult
  >
> => {
  const { onDie, onScore, onEffect, onEnemyKill, onBounce } = cb;
  const die = godMode ? (() => {}) : onDie;
  const bounce = godMode ? (() => {}) : onBounce;
  const handleEnemy = (col: ReturnType<typeof CollisionDomain.check>, obs: Ramp['obs'][number], ox: number, px: number) => {
    if (!col.hit) return false;
    if (rank === SpeedRank.HIGH) {
      die('enemy');
      return true;
    }
    if (rank === SpeedRank.MID) {
      obs.t = ObstacleType.DEAD;
      onEnemyKill(ox);
      return 'slow';
    }
    bounce(px < ox ? -Config.combat.bounceSpeed : Config.combat.bounceSpeed);
    return false;
  };
  return {
    [ObstacleType.HOLE_S]: col => (col.ground && rank === SpeedRank.LOW ? (die('fall'), true) : false),
    [ObstacleType.HOLE_L]: col => (col.ground ? (die('fall'), true) : false),
    [ObstacleType.ROCK]: col => (col.hit ? (die('rock'), true) : false),
    [ObstacleType.ENEMY]: handleEnemy,
    [ObstacleType.ENEMY_V]: handleEnemy,
    [ObstacleType.SCORE]: (col, obs, ox) => (col.hit ? ((obs.t = ObstacleType.TAKEN), onScore(ox), false) : false),
    [ObstacleType.REVERSE]: (col, obs) => (col.hit ? ((obs.t = ObstacleType.TAKEN), onEffect('reverse'), false) : false),
    [ObstacleType.FORCE_JUMP]: (col, obs) => (col.hit ? ((obs.t = ObstacleType.TAKEN), onEffect('forceJ'), false) : false),
  };
};

/** ゲームエンジンフックの戻り値 */
export interface UseGameEngineResult {
  readonly gameState: GameStateValue;
  readonly world: GameWorld;
  readonly ui: UIState;
  readonly hiScore: number;
  readonly isNewHighScore: boolean;
  readonly clearAnim: ClearAnim;
  readonly death: DeathState | undefined;
  readonly countdown: number;
  readonly ramps: readonly Ramp[];
  readonly godMode: boolean;
  readonly isMobile: boolean;
  readonly buildings: ReturnType<typeof BackgroundGen.initBuildings>;
  readonly player: Player;
  readonly speed: number;
  readonly camY: number;
  readonly score: number;
  readonly effect: EffectState;
  readonly speedBonus: number;
  readonly combo: number;
  readonly comboTimer: number;
  readonly nearMissCount: number;
  readonly dangerLevel: number;
  readonly particles: Particle[];
  readonly jetParticles: Particle[];
  readonly scorePopups: ScorePopup[];
  readonly nearMissEffects: NearMissEffect[];
  readonly shake: number;
  readonly transitionEffect: number;
  readonly clouds: ReturnType<typeof BackgroundGen.initClouds>;
  readonly frameRef: React.MutableRefObject<number>;
  readonly startCountdown: () => void;
  readonly goToTitle: () => void;
  readonly touchKeys: React.MutableRefObject<TouchKeys>;
  readonly handleTouch: (
    key: keyof TouchKeys,
    value: boolean
  ) => (event: React.TouchEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => void;
  readonly handleTap: () => void;
  /** 速度線（HIGH ランク時に画面端から流れるエフェクト） */
  readonly speedLines: readonly SpeedLine[];
  /** プレイヤー残像トレイル */
  readonly playerTrail: readonly TrailSample[];
  /** アクセシビリティ: 動きを抑制するかどうか */
  readonly reducedMotion: boolean;
}

/** ゲームエンジンフック: 状態管理・ゲームループロジックを統合 */
export const useGameEngine = (
  onScoreChange?: (score: number) => void
): UseGameEngineResult => {
  const { width: W, height: H } = Config.screen;
  const { total: TOTAL, height: RAMP_H } = Config.ramp;
  const { min: MIN_SPD } = Config.speed;

  // --- 元の NonBrakeDescentGame.tsx と同じ状態定義 ---
  const [state, setState] = useState<GameStateValue>(GameState.TITLE);
  const [countdown, setCountdown] = useState(3);
  const [player, setPlayer] = useState<Player>(EntityFactory.createPlayer);
  const [speed, setSpeed] = useState<number>(MIN_SPD);
  const [camY, setCamY] = useState(0);
  const [ramps, setRamps] = useState<Ramp[]>([]);
  const [score, setScore] = useState(0);
  const [hiScore, setHiScore] = useState(0);
  const [lastRamp, setLastRamp] = useState(0);
  const [speedBonus, setSpeedBonus] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [effect, setEffect] = useState<EffectState>({ type: undefined, timer: 0 });
  const [death, setDeath] = useState<DeathState | undefined>(undefined);
  const [shake, setShake] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [jetParticles, setJetParticles] = useState<Particle[]>([]);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [nearMissEffects, setNearMissEffects] = useState<NearMissEffect[]>([]);
  const [nearMissCount, setNearMissCount] = useState(0);
  const [clearAnim, setClearAnim] = useState<ClearAnim>({ phase: 0, frame: 0 });
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [godMode, setGodMode] = useState(false);
  const [combo, setCombo] = useState(0);
  const [comboTimer, setComboTimer] = useState(0);
  const [transitionEffect, setTransitionEffect] = useState(0);
  const [clouds, setClouds] = useState(BackgroundGen.initClouds());
  const [buildings] = useState(BackgroundGen.initBuildings);
  const [dangerLevel, setDangerLevel] = useState(0);
  /** 速度線の状態 */
  const [speedLines, setSpeedLines] = useState<SpeedLine[]>([]);
  /** プレイヤー残像トレイルの状態 */
  const [playerTrail, setPlayerTrail] = useState<TrailSample[]>([]);

  const frameRef = useRef(0);
  const keys = useRef<Record<string, boolean>>({});
  const touchKeys = useRef<TouchKeys>({ left: false, right: false, accel: false, jump: false });
  const passedObs = useRef<Set<string>>(new Set());
  const clockRef = useRef(createGameClock());
  /** 前フレームの速度ランク（ランク変化時の BGM 切替検出に使用） */
  const prevRankRef = useRef(0);
  /** 前フレームのプレイヤー接地状態（着地検出に使用） */
  const prevOnGroundRef = useRef(true);
  const reducedMotion = useReducedMotion();
  const motionScaleRef = useRef(1);
  useEffect(() => {
    motionScaleRef.current = resolveMotionScale(reducedMotion);
  }, [reducedMotion]);

  // --- B2-S1: stale closure 回避のための ref 群 ---
  // ゲームループ useEffect の依存配列から動的 state を除外するため、
  // 各 setter 呼び出し時に同期更新する。
  const playerRef = useRef<Player>(EntityFactory.createPlayer());
  const speedRef = useRef<number>(MIN_SPD);
  const ramsRef = useRef<Ramp[]>([]);
  const camYRef = useRef<number>(0);
  const effectRef = useRef<EffectState>({ type: undefined, timer: 0 });
  const comboRef = useRef<number>(0);
  const comboTimerRef = useRef<number>(0);
  const lastRampRef = useRef<number>(0);
  const godModeRef = useRef<boolean>(false);

  const isMobile = useIsMobile();
  const handleCheat = useCheatCode('jinjinjin', () => {
    setGodMode(current => {
      const next = !current;
      godModeRef.current = next;
      Audio.init();
      Audio.play(next ? 'score' : 'death');
      return next;
    });
  });

  // --- コールバック ---

  const addParticles = useCallback((x: number, y: number, color: string, count: number) => {
    setParticles(prev => [...prev, ...EntityFactory.createParticles(x, y, color, count)]);
  }, []);

  const addScorePopup = useCallback((x: number, y: number, text: string, color: string) => {
    setScorePopups(prev => [...prev, EntityFactory.createScorePopup(x, y, text, color)]);
  }, []);

  const resetGameState = useCallback(() => {
    const initialPlayer = EntityFactory.createPlayer();
    playerRef.current = initialPlayer;
    setPlayer(initialPlayer);
    speedRef.current = MIN_SPD;
    setSpeed(MIN_SPD);
    camYRef.current = 0;
    setCamY(0);
    setScore(0);
    lastRampRef.current = 0;
    setLastRamp(0);
    setSpeedBonus(0);
    setStartTime(Date.now());
    const initialEffect: EffectState = { type: undefined, timer: 0 };
    effectRef.current = initialEffect;
    setEffect(initialEffect);
    setDeath(undefined);
    setParticles([]);
    setJetParticles([]);
    setScorePopups([]);
    setNearMissEffects([]);
    setNearMissCount(0);
    setClearAnim({ phase: 0, frame: 0 });
    setIsNewHighScore(false);
    comboRef.current = 0;
    setCombo(0);
    comboTimerRef.current = 0;
    setComboTimer(0);
    setTransitionEffect(0);
    setDangerLevel(0);
    setSpeedLines([]);
    setPlayerTrail([]);
    setClouds(BackgroundGen.initClouds());
    passedObs.current = new Set();
    frameRef.current = 0;
    clockRef.current = createGameClock();
    prevRankRef.current = 0;
    prevOnGroundRef.current = true;
    // BGM の速度ランクも初期化（前プレイの HIGH テンポが持ち越されないように）
    Audio.setSpeedRank(0);
  }, [MIN_SPD]);

  const startCountdown = useCallback(() => {
    Audio.init();
    const generated = RampGen.generate(TOTAL);
    ramsRef.current = generated;
    setRamps(generated);
    resetGameState();
    setCountdown(3);
    setState(GameState.COUNTDOWN);
    Audio.playMelody('start');
  }, [TOTAL, resetGameState]);

  const startGame = useCallback(() => {
    setState(GameState.PLAY);
    setStartTime(Date.now());
    Audio.startBGM();
  }, []);

  const goToTitle = useCallback(() => {
    setState(GameState.TITLE);
    setClearAnim({ phase: 0, frame: 0 });
    setIsNewHighScore(false);
    Audio.stopBGM();
    Audio.playMelody('title');
  }, []);

  const commitScore = useCallback(
    (finalScore: number) => {
      setScore(finalScore);
      setHiScore(prev => {
        if (finalScore > prev) {
          setIsNewHighScore(true);
          return finalScore;
        }
        return prev;
      });
      void saveScore(SCORE_KEY, finalScore);
    },
    []
  );

  const handleDeath = useCallback(
    (type: DeathState['type']) => {
      Audio.stopBGM();
      Audio.playMelody('gameOver');
      const rank = SpeedDomain.getRank(speedRef.current);
      const finalScore = ScoringDomain.calcFinal(score, speedBonus);
      commitScore(finalScore);
      setDeath({ type, frame: 0, fast: rank === SpeedRank.HIGH });
      setShake(rank === SpeedRank.HIGH ? 18 : 6);
      addParticles(playerRef.current.x, playerRef.current.ramp * RAMP_H - camYRef.current + 30, '#ff4444', rank === SpeedRank.HIGH ? 15 : 8);
      clockRef.current = triggerHitstop(clockRef.current, scaleFrames(Config.juice.hitstop.death, motionScaleRef.current));
      setState(GameState.DYING);
    },
    [score, speedBonus, RAMP_H, addParticles, commitScore]
  );

  const handleClear = useCallback(() => {
    Audio.stopBGM();
    const elapsed = (Date.now() - startTime) / 1000;
    const timeBonus = ScoringDomain.calcTimeBonus(elapsed);
    const finalScore = ScoringDomain.calcFinal(score, speedBonus, timeBonus);
    commitScore(finalScore);
    setClearAnim({ phase: 1, frame: 0 });
    setState(GameState.CLEAR);
    Audio.playMelody('clear');
  }, [score, speedBonus, startTime, commitScore]);

  const handleTouch = useCallback(
    (key: keyof TouchKeys, value: boolean) =>
      (event: React.TouchEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        touchKeys.current[key] = value;
      },
    []
  );

  const handleTap = useCallback(() => {
    if (state === GameState.TITLE || state === GameState.OVER || (state === GameState.CLEAR && clearAnim.phase === 2)) {
      startCountdown();
    }
  }, [state, clearAnim.phase, startCountdown]);

  // --- Effects ---

  // ハイスコア読込
  useEffect(() => {
    let mounted = true;
    void getHighScore(SCORE_KEY).then(stored => {
      if (mounted) setHiScore(stored);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // カウントダウン
  useEffect(() => {
    if (state !== GameState.COUNTDOWN) return;
    const iv = window.setInterval(() =>
      setCountdown(current => {
        if (current <= 1) {
          Audio.play('countdownGo');
          startGame();
          return 0;
        }
        Audio.play('countdown');
        return current - 1;
      }),
      Config.animation.countdownInterval
    );
    return () => window.clearInterval(iv);
  }, [state, startGame]);

  // 死亡アニメーション
  useEffect(() => {
    if (state !== GameState.DYING) return;
    const iv = window.setInterval(() => {
      // 死亡時ヒットストップ: 衝撃の一瞬を止める（死亡フレーム進行を凍結）
      const advance = advanceClock(clockRef.current);
      clockRef.current = advance.clock;
      if (!advance.shouldStepSim) {
        setShake(current => Math.max(0, current * Config.animation.shakeDecay));
        return;
      }
      setDeath(current => {
        if (!current) return current;
        if (current.frame >= Config.animation.deathFrames) {
          setState(GameState.OVER);
          window.setTimeout(() => {
            Audio.playMelody('gameOverScreen');
            Audio.playMelody('rankReveal');
          }, Config.animation.gameOverScreenDelay);
          return current;
        }
        return { ...current, frame: current.frame + 1 };
      });
      setShake(current => Math.max(0, current * Config.animation.shakeDecay));
    }, Config.animation.deathAnimInterval);
    return () => window.clearInterval(iv);
  }, [state]);

  // スコア通知
  useEffect(() => {
    if (!onScoreChange) return;
    onScoreChange(score);
  }, [score, onScoreChange]);

  // クリアアニメーション
  useEffect(() => {
    if (state !== GameState.CLEAR) return;
    const iv = window.setInterval(
      () =>
        setClearAnim(current => {
          if (current.phase === 1 && current.frame >= Config.animation.clearPhase1Frames) {
            Audio.playMelody('rankReveal');
            return { phase: 2, frame: 0 };
          }
          return { ...current, frame: current.frame + 1 };
        }),
      Config.animation.clearAnimInterval
    );
    return () => window.clearInterval(iv);
  }, [state]);

  // キーイベント
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      keys.current[event.code] = true;
      if (state === GameState.OVER || (state === GameState.CLEAR && clearAnim.phase === 2)) {
        if (event.code === 'Space') startCountdown();
        else if (event.code === 'Escape' || event.code === 'KeyT') goToTitle();
      } else if (state === GameState.TITLE) {
        if (event.code === 'Space') startCountdown();
        handleCheat(event.key);
      }
      event.preventDefault();
    };
    const up = (event: KeyboardEvent) => {
      keys.current[event.code] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [state, clearAnim.phase, startCountdown, goToTitle, handleCheat]);

  // タイトル BGM
  useEffect(() => {
    if (state === GameState.TITLE) {
      const t = window.setTimeout(() => Audio.playMelody('title'), Config.animation.titleMelodyDelay);
      return () => window.clearTimeout(t);
    }
    return;
  }, [state]);

  // ゲームループ
  // B2-S1: 依存配列を [state] のみに縮小。動的値はすべて ref 経由で読む。
  useEffect(() => {
    if (state !== GameState.PLAY) return;
    const loop = window.setInterval(() => {
      // タイムスケールゲート: 停止/間引き tick は sim をスキップ
      const advance = advanceClock(clockRef.current);
      clockRef.current = advance.clock;
      if (!advance.shouldStepSim) {
        setShake(current => Math.max(0, current * Config.animation.shakeDecay));
        return;
      }
      frameRef.current++;
      const keyState = keys.current;
      const touchState = touchKeys.current;

      // ref から現フレームの動的値を読み取る（stale closure 回避）
      const currentEffect = effectRef.current;
      const currentSpeed = speedRef.current;
      const currentPlayer = playerRef.current;
      const currentRamps = ramsRef.current;
      const currentCamY = camYRef.current;
      const currentCombo = comboRef.current;
      const currentComboTimer = comboTimerRef.current;
      const currentLastRamp = lastRampRef.current;
      const currentGodMode = godModeRef.current;

      const reverse = currentEffect.type === EffectType.REVERSE;
      const input: InputState = {
        left: reverse ? keyState.ArrowRight || touchState.right : keyState.ArrowLeft || touchState.left,
        right: reverse ? keyState.ArrowLeft || touchState.left : keyState.ArrowRight || touchState.right,
        accel: keyState.KeyZ || touchState.accel,
        jump: keyState.KeyX || touchState.jump,
      };

      // --- エフェクトタイマー更新 ---
      const nextEffect: EffectState = currentEffect.timer <= 0
        ? { type: undefined, timer: 0 }
        : { ...currentEffect, timer: currentEffect.timer - 1 };
      effectRef.current = nextEffect;
      setEffect(nextEffect);

      // --- 速度更新 ---
      const nextSpeed = SpeedDomain.accelerate(currentSpeed, input.accel);
      speedRef.current = nextSpeed;
      setSpeed(nextSpeed);

      // --- パーティクル系更新（副作用なし・純粋変換） ---
      setParticles(current => ParticleSys.updateAndFilter(current, ParticleSys.updateParticle));
      setScorePopups(current => ParticleSys.updateAndFilter(current, ParticleSys.updatePopup));
      setNearMissEffects(current => ParticleSys.updateAndFilter(current, ParticleSys.updateNearMiss));

      // --- コンボタイマー更新 ---
      const nextComboTimer = ComboDomain.tick(currentComboTimer);
      comboTimerRef.current = nextComboTimer;
      setComboTimer(nextComboTimer);

      setTransitionEffect(current => Math.max(0, current - 0.1));
      setClouds(current => ParticleSys.updateClouds(current, nextSpeed));

      // --- ジェットパーティクル更新 ---
      setJetParticles(prev => {
        let updated = ParticleSys.updateAndFilter(prev, ParticleSys.updateParticle);
        if (nextSpeed > Config.particle.jetSpeedThreshold && frameRef.current % 2 === 0) {
          const ramp = currentRamps[currentPlayer.ramp];
          if (ramp) {
            const geo = GeometryDomain.getRampGeometry(ramp, W, RAMP_H);
            const slopeY = GeometryDomain.getSlopeY(currentPlayer.x, geo, ramp.type);
            updated = [...updated, EntityFactory.createJetParticle(currentPlayer.x, currentPlayer.ramp * RAMP_H - currentCamY + slopeY, ramp.dir)];
          }
        }
        return updated;
      });

      // --- 速度線の更新・生成（HIGH ランク時のみ生成） ---
      const currentRank = SpeedDomain.getRank(nextSpeed);
      setSpeedLines(prev => {
        const updated = updateSpeedLines(prev);
        return motionScaleRef.current > 0
          ? spawnSpeedLines(updated, currentRank, W, H)
          : updated;
      });

      // --- プレイヤー残像トレイルの更新（高速時かつ reduced-motion 無効時のみサンプル追加） ---
      // 注: jetParticles と同様、当該 tick の setPlayer 更新前のプレイヤー位置（前フレーム相当）でサンプリングする。残像演出としては許容範囲。
      const trailRamp = currentRamps[currentPlayer.ramp];
      if (trailRamp) {
        const trailGeo = GeometryDomain.getRampGeometry(trailRamp, W, RAMP_H);
        const trailSlopeY = GeometryDomain.getSlopeY(currentPlayer.x, trailGeo, trailRamp.type);
        const trailY = currentPlayer.ramp * RAMP_H - currentCamY + trailSlopeY;
        const isHighSpeed = nextSpeed > Config.particle.jetSpeedThreshold;
        const enableTrail = motionScaleRef.current > 0 && isHighSpeed;
        setPlayerTrail(prev =>
          sampleTrail(prev, currentPlayer.x, trailY, enableTrail ? MAX_TRAIL_SAMPLES : 0)
        );
      }

      // --- 速度ランク変化の検出（BGM プロファイル切替） ---
      if (currentRank !== prevRankRef.current) {
        prevRankRef.current = currentRank;
        Audio.setSpeedRank(currentRank);
      }

      const currentRampForDanger = currentRamps[currentPlayer.ramp];
      if (currentRampForDanger) {
        setDangerLevel(DangerDomain.calcLevel(currentRampForDanger.obs, currentPlayer.x, currentRampForDanger.dir, nextSpeed, W));
      }

      // --- プレイヤー移動・遷移・衝突計算（副作用をすべて updater 外へ） ---
      // B2-S1: 2つの setPlayer(prev=>{...}) updater を1パスに統合し、
      //        副作用（Audio/setState/clockRef 操作）を updater の外で適用する。

      // ── フェーズ1: 移動・ジャンプ・ランプ遷移 ──
      const rampForMove = currentRamps[currentPlayer.ramp];
      if (!rampForMove) {
        // ramp が取れない場合はカメラのみ更新して終了
        const nextCamY = MathUtils.lerp(currentCamY, currentPlayer.ramp * RAMP_H - H / Config.camera.offsetDivisor, Config.camera.followRate);
        camYRef.current = nextCamY;
        setCamY(nextCamY);
        return;
      }

      let movedPlayer = Physics.applyMovement(currentPlayer, input, nextSpeed, rampForMove.dir);
      const jumpResult = Physics.applyJump(movedPlayer, input, nextEffect.type, nextEffect.timer);
      movedPlayer = jumpResult.player;
      const didJump = jumpResult.didJump;

      // ゴール／ランプ遷移を解決し、確定プレイヤーを求める
      const transition = Physics.checkTransition(movedPlayer, currentRamps, W);

      // ゴール時は handleClear を呼んで終了（updater 外で副作用）
      if (transition.isGoal) {
        handleClear();
        return;
      }

      // 遷移後の副作用を収集するためのローカル変数
      let afterTransitionPlayer = movedPlayer;
      let afterTransitionRamp = rampForMove;
      let didRampChange = false;
      let newLastRamp = currentLastRamp;
      let scoreDeltaFromRamp = 0;
      let newCombo = currentCombo;
      let newComboTimer2 = nextComboTimer;
      let shouldPlayCombo = false;
      let comboCountForAudio = 0;
      let newSpeedBonusDelta = 0;
      let comboPopupText = '';

      if (transition.transitioned) {
        afterTransitionPlayer = transition.player;
        afterTransitionRamp = currentRamps[transition.player.ramp] ?? rampForMove;
        didRampChange = true;

        if (transition.player.ramp > currentLastRamp) {
          newLastRamp = transition.player.ramp;
          const scoreResult = ScoringDomain.calcRampScore(nextSpeed, nextComboTimer > 0 ? currentCombo : 0);

          if (ComboDomain.shouldActivate(nextSpeed)) {
            const comboResult = ComboDomain.increment(currentCombo, nextComboTimer);
            newCombo = comboResult.combo;
            newComboTimer2 = comboResult.timer;
            if (comboResult.combo > 1) {
              const comboScore = ScoringDomain.calcRampScore(nextSpeed, comboResult.combo);
              scoreDeltaFromRamp = comboScore.base + comboScore.bonus;
              shouldPlayCombo = true;
              comboCountForAudio = comboResult.combo;
              comboPopupText = `+${comboScore.base + comboScore.bonus} (${comboResult.combo}x)`;
            } else {
              // combo=1 はポップアップなし（ベーススコアのみ加算）
              scoreDeltaFromRamp = scoreResult.base;
            }
          } else {
            const reset = ComboDomain.reset();
            newCombo = reset.combo;
            newComboTimer2 = reset.timer;
            scoreDeltaFromRamp = scoreResult.base;
          }
          newSpeedBonusDelta = SpeedDomain.getBonus(nextSpeed);
        }
      }

      // 着地検出: 前フレームが空中で確定プレイヤーが接地に変化したとき
      const wasOnGround = prevOnGroundRef.current;
      const justLanded = !wasOnGround && afterTransitionPlayer.onGround;
      prevOnGroundRef.current = afterTransitionPlayer.onGround;

      // ── フェーズ2: 衝突処理 ──
      // 遷移後のプレイヤー・ランプで衝突判定を行う（移動→遷移→衝突の順序を保持）
      let finalPlayer = afterTransitionPlayer;
      let collisionDied = false;
      let collisionSlowed = false;
      let newVxFromBounce: number | undefined;

      // 衝突処理中に発生した副作用を収集するローカル変数
      const audioEventsFromCollision: Array<() => void> = [];
      let scoreDeltaFromCollision = 0;
      let speedDeltaFromCollision = 0;
      const particlesFromCollision: Array<{ x: number; y: number; color: string; count: number }> = [];
      const popupsFromCollision: Array<{ x: number; y: number; text: string; color: string }> = [];
      const nearMissFromCollision: Array<{ x: number; y: number }> = [];
      let nearMissDeltaCount = 0;
      let nearMissScoreDelta = 0;
      let newEffectFromCollision: EffectState | undefined;
      let hitstopFrames = 0;
      let slowMoFrames = 0;
      let slowMoFactor = 1;

      const collisionRamp = currentRamps[afterTransitionPlayer.ramp];
      if (collisionRamp) {
        // 衝突ハンドラのコールバックは副作用を収集するだけ（即時適用しない）
        const handlers = createCollisionHandlers(
          SpeedDomain.getRank(nextSpeed),
          {
            onDie: (type) => {
              collisionDied = true;
              // handleDeath は updater 外で呼ぶ（後述）
              // type を記録するためにクロージャに保存
              audioEventsFromCollision.push(() => handleDeath(type));
            },
            onScore: (ox) => {
              audioEventsFromCollision.push(() => Audio.play('score'));
              scoreDeltaFromCollision += Config.score.item;
              particlesFromCollision.push({ x: ox, y: afterTransitionPlayer.ramp * RAMP_H - currentCamY + 25, color: '#ffdd00', count: 6 });
              popupsFromCollision.push({ x: ox, y: afterTransitionPlayer.ramp * RAMP_H - currentCamY, text: `+${Config.score.item}`, color: '#ffdd00' });
              hitstopFrames = Math.max(hitstopFrames, scaleFrames(Config.juice.hitstop.item, motionScaleRef.current));
            },
            onEffect: (type) => {
              if (!type) return;
              audioEventsFromCollision.push(() => Audio.play('hit'));
              newEffectFromCollision = { type, timer: Config.effect.duration };
            },
            onEnemyKill: (ox) => {
              audioEventsFromCollision.push(() => Audio.play('enemyKill'));
              scoreDeltaFromCollision += Config.score.enemy;
              speedDeltaFromCollision -= Config.combat.enemyKillSlowdown;
              particlesFromCollision.push({ x: ox, y: afterTransitionPlayer.ramp * RAMP_H - currentCamY + 25, color: '#ff8800', count: 10 });
              popupsFromCollision.push({ x: ox, y: afterTransitionPlayer.ramp * RAMP_H - currentCamY, text: `+${Config.score.enemy}`, color: '#ff8800' });
              hitstopFrames = Math.max(hitstopFrames, scaleFrames(Config.juice.hitstop.enemyKill, motionScaleRef.current));
            },
            onBounce: (vx) => {
              audioEventsFromCollision.push(() => Audio.play('hit'));
              newVxFromBounce = vx;
            },
          },
          currentGodMode
        );

        for (const obstacle of collisionRamp.obs) {
          if (!CollisionDomain.isActive(obstacle)) continue;
          const ox = GeometryDomain.getObstacleX(obstacle, collisionRamp, W);
          const col = CollisionDomain.check(afterTransitionPlayer.x, ox, afterTransitionPlayer.jumping, afterTransitionPlayer.y);
          const obsId = `${afterTransitionPlayer.ramp}-${obstacle.pos}`;

          if (CollisionDomain.isDangerous(obstacle.t) && col.nearMiss && !passedObs.current.has(obsId)) {
            passedObs.current.add(obsId);
            audioEventsFromCollision.push(() => Audio.play('nearMiss'));
            nearMissDeltaCount += 1;
            nearMissScoreDelta += Config.score.nearMiss;
            nearMissFromCollision.push({ x: ox, y: afterTransitionPlayer.ramp * RAMP_H - currentCamY + 25 });
            popupsFromCollision.push({ x: ox, y: afterTransitionPlayer.ramp * RAMP_H - currentCamY - 20, text: `NEAR MISS +${Config.score.nearMiss}`, color: '#44ffaa' });
            slowMoFrames = Math.max(slowMoFrames, scaleFrames(Config.juice.slowMo.nearMissFrames, motionScaleRef.current));
            slowMoFactor = Config.juice.slowMo.nearMissFactor;
          }

          const handler = handlers[obstacle.t];
          if (handler) {
            const result = handler(col, obstacle, ox, afterTransitionPlayer.x);
            if (result === true) {
              collisionDied = true;
              break;
            }
            if (result === 'slow') {
              collisionSlowed = true;
              break;
            }
          }
        }
      }

      // 衝突結果をプレイヤーに適用
      if (collisionSlowed) {
        finalPlayer = { ...afterTransitionPlayer, vx: -afterTransitionPlayer.vx * Config.combat.bounceMultiplier };
      } else if (newVxFromBounce !== undefined) {
        finalPlayer = { ...afterTransitionPlayer, vx: newVxFromBounce };
      }

      // ── 副作用の適用（updater 外） ──

      // ジャンプ音
      if (didJump) {
        Audio.play('jump');
      }

      // ランプ遷移の副作用
      if (didRampChange && transition.player.ramp > currentLastRamp) {
        lastRampRef.current = newLastRamp;
        setLastRamp(newLastRamp);
        comboRef.current = newCombo;
        setCombo(newCombo);
        comboTimerRef.current = newComboTimer2;
        setComboTimer(newComboTimer2);
        setScore(prev => prev + scoreDeltaFromRamp);
        setSpeedBonus(prev => prev + newSpeedBonusDelta);
        setTransitionEffect(1);
        if (shouldPlayCombo) {
          Audio.playCombo(comboCountForAudio);
          addScorePopup(W / 2, 120, comboPopupText, '#ffaa00');
        }
        Audio.play('rampChange');
      }

      // 着地の副作用
      if (justLanded) {
        Audio.play('land');
        if (motionScaleRef.current > 0) {
          // 着地点の画面 Y 座標を計算して土煙を生成。
          // camY は jetParticles/トレイルと同様に前フレーム相当だが、土煙は短命バーストのため許容範囲。
          const dustGeo = GeometryDomain.getRampGeometry(afterTransitionRamp, W, RAMP_H);
          const dustSlopeY = GeometryDomain.getSlopeY(afterTransitionPlayer.x, dustGeo, afterTransitionRamp.type);
          const dustScreenY = afterTransitionPlayer.ramp * RAMP_H - currentCamY + dustSlopeY;
          setParticles(prevParticles => [
            ...prevParticles,
            ...createDust(afterTransitionPlayer.x, dustScreenY, DUST_PARTICLE_COUNT),
          ]);
        }
      }

      // 衝突の副作用（死亡はこの中で handleDeath を呼ぶ）
      if (!collisionDied) {
        // 死亡していない場合のみスコア・エフェクト・パーティクルを適用
        if (scoreDeltaFromCollision !== 0) {
          setScore(prev => prev + scoreDeltaFromCollision);
        }
        if (nearMissScoreDelta !== 0) {
          setScore(prev => prev + nearMissScoreDelta);
          setNearMissCount(prev => prev + nearMissDeltaCount);
          for (const nm of nearMissFromCollision) {
            setNearMissEffects(prev => [...prev, EntityFactory.createNearMissEffect(nm.x, nm.y)]);
          }
        }
        if (speedDeltaFromCollision !== 0) {
          const newSpd = Math.max(MIN_SPD, nextSpeed + speedDeltaFromCollision);
          speedRef.current = newSpd;
          setSpeed(newSpd);
        }
        for (const p of particlesFromCollision) {
          addParticles(p.x, p.y, p.color, p.count);
        }
        for (const popup of popupsFromCollision) {
          addScorePopup(popup.x, popup.y, popup.text, popup.color);
        }
        if (newEffectFromCollision) {
          effectRef.current = newEffectFromCollision;
          setEffect(newEffectFromCollision);
        }
        if (hitstopFrames > 0) {
          clockRef.current = triggerHitstop(clockRef.current, hitstopFrames);
        }
        if (slowMoFrames > 0) {
          clockRef.current = triggerSlowMo(clockRef.current, slowMoFrames, slowMoFactor);
        }

        // 確定プレイヤーを ref + state に反映
        playerRef.current = finalPlayer;
        setPlayer(finalPlayer);
      } else {
        // 死亡: 副作用（handleDeath 呼び出しなど）を実行
        for (const fn of audioEventsFromCollision) {
          fn();
        }
      }

      // --- カメラ更新 ---
      // プレイヤーの確定位置を使って camY を lerp する
      const targetPlayer = collisionDied ? currentPlayer : finalPlayer;
      const nextCamY = MathUtils.lerp(currentCamY, targetPlayer.ramp * RAMP_H - H / Config.camera.offsetDivisor, Config.camera.followRate);
      camYRef.current = nextCamY;
      setCamY(nextCamY);
    }, 1000 / 60);
    return () => window.clearInterval(loop);
  }, [state, W, H, MIN_SPD, RAMP_H, addParticles, addScorePopup, handleDeath, handleClear]);

  // クリーンアップ
  useEffect(() => () => Audio.cleanup(), []);

  // --- GameWorld / UIState を組み立てて返す ---
  const world: GameWorld = useMemo(() => ({
    player,
    ramps,
    speed,
    camY,
    score,
    speedBonus,
    combo: { count: combo, timer: comboTimer },
    effect,
    lastRamp,
    nearMissCount,
    dangerLevel,
  }), [player, ramps, speed, camY, score, speedBonus, combo, comboTimer, effect, lastRamp, nearMissCount, dangerLevel]);

  const ui: UIState = useMemo(() => ({
    particles,
    jetParticles,
    scorePopups,
    nearMissEffects,
    clouds,
    shake,
    transitionEffect,
  }), [particles, jetParticles, scorePopups, nearMissEffects, clouds, shake, transitionEffect]);

  return {
    gameState: state,
    world,
    ui,
    hiScore,
    isNewHighScore,
    clearAnim,
    death,
    countdown,
    ramps,
    godMode,
    isMobile,
    buildings,
    player,
    speed,
    camY,
    score,
    effect,
    speedBonus,
    combo,
    comboTimer,
    nearMissCount,
    dangerLevel,
    particles,
    jetParticles,
    scorePopups,
    nearMissEffects,
    shake,
    transitionEffect,
    clouds,
    frameRef,
    startCountdown,
    goToTitle,
    touchKeys,
    handleTouch,
    handleTap,
    speedLines,
    playerTrail,
    reducedMotion,
  };
};
