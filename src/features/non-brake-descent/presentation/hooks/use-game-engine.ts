/**
 * ゲームエンジンフック
 *
 * NonBrakeDescentGame.tsx から状態管理・ゲームループロジックを抽出する。
 * 元のコードの動作を忠実に再現しつつ、プレゼンテーション層から分離する。
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

  const isMobile = useIsMobile();
  const handleCheat = useCheatCode('jinjinjin', () => {
    setGodMode(current => {
      Audio.init();
      Audio.play(!current ? 'score' : 'death');
      return !current;
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
    setPlayer(EntityFactory.createPlayer());
    setSpeed(MIN_SPD);
    setCamY(0);
    setScore(0);
    setLastRamp(0);
    setSpeedBonus(0);
    setStartTime(Date.now());
    setEffect({ type: undefined, timer: 0 });
    setDeath(undefined);
    setParticles([]);
    setJetParticles([]);
    setScorePopups([]);
    setNearMissEffects([]);
    setNearMissCount(0);
    setClearAnim({ phase: 0, frame: 0 });
    setIsNewHighScore(false);
    setCombo(0);
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
    setRamps(RampGen.generate(TOTAL));
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
      const rank = SpeedDomain.getRank(speed);
      const finalScore = ScoringDomain.calcFinal(score, speedBonus);
      commitScore(finalScore);
      setDeath({ type, frame: 0, fast: rank === SpeedRank.HIGH });
      setShake(rank === SpeedRank.HIGH ? 18 : 6);
      addParticles(player.x, player.ramp * RAMP_H - camY + 30, '#ff4444', rank === SpeedRank.HIGH ? 15 : 8);
      clockRef.current = triggerHitstop(clockRef.current, scaleFrames(Config.juice.hitstop.death, motionScaleRef.current));
      setState(GameState.DYING);
    },
    [speed, score, speedBonus, player, camY, RAMP_H, addParticles, commitScore]
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
      const reverse = effect.type === EffectType.REVERSE;
      const input: InputState = {
        left: reverse ? keyState.ArrowRight || touchState.right : keyState.ArrowLeft || touchState.left,
        right: reverse ? keyState.ArrowLeft || touchState.left : keyState.ArrowRight || touchState.right,
        accel: keyState.KeyZ || touchState.accel,
        jump: keyState.KeyX || touchState.jump,
      };
      setEffect(current =>
        current.timer <= 0 ? { type: undefined, timer: 0 } : { ...current, timer: current.timer - 1 }
      );
      setSpeed(current => SpeedDomain.accelerate(current, input.accel));
      setParticles(current => ParticleSys.updateAndFilter(current, ParticleSys.updateParticle));
      setScorePopups(current => ParticleSys.updateAndFilter(current, ParticleSys.updatePopup));
      setNearMissEffects(current => ParticleSys.updateAndFilter(current, ParticleSys.updateNearMiss));
      setComboTimer(ComboDomain.tick);
      setTransitionEffect(current => Math.max(0, current - 0.1));
      setClouds(current => ParticleSys.updateClouds(current, speed));
      setJetParticles(prev => {
        let updated = ParticleSys.updateAndFilter(prev, ParticleSys.updateParticle);
        if (speed > Config.particle.jetSpeedThreshold && frameRef.current % 2 === 0) {
          const ramp = ramps[player.ramp];
          if (ramp) {
            const geo = GeometryDomain.getRampGeometry(ramp, W, RAMP_H);
            const slopeY = GeometryDomain.getSlopeY(player.x, geo, ramp.type);
            updated = [...updated, EntityFactory.createJetParticle(player.x, player.ramp * RAMP_H - camY + slopeY, ramp.dir)];
          }
        }
        return updated;
      });
      // 速度線の更新・生成（HIGH ランク時のみ生成）
      const currentRank = SpeedDomain.getRank(speed);
      setSpeedLines(prev => {
        const updated = updateSpeedLines(prev);
        return motionScaleRef.current > 0
          ? spawnSpeedLines(updated, currentRank, W, H)
          : updated;
      });

      // プレイヤー残像トレイルの更新（高速時かつ reduced-motion 無効時のみサンプル追加）
      // 注: jetParticles と同様、当該 tick の setPlayer 更新前のプレイヤー位置（前フレーム相当）でサンプリングする。残像演出としては許容範囲。
      const trailRamp = ramps[player.ramp];
      if (trailRamp) {
        const trailGeo = GeometryDomain.getRampGeometry(trailRamp, W, RAMP_H);
        const trailSlopeY = GeometryDomain.getSlopeY(player.x, trailGeo, trailRamp.type);
        const trailY = player.ramp * RAMP_H - camY + trailSlopeY;
        const isHighSpeed = speed > Config.particle.jetSpeedThreshold;
        const enableTrail = motionScaleRef.current > 0 && isHighSpeed;
        setPlayerTrail(prev =>
          sampleTrail(prev, player.x, trailY, enableTrail ? MAX_TRAIL_SAMPLES : 0)
        );
      }

      // 速度ランク変化の検出（BGM プロファイル切替）
      if (currentRank !== prevRankRef.current) {
        prevRankRef.current = currentRank;
        Audio.setSpeedRank(currentRank);
      }

      const currentRampInLoop = ramps[player.ramp];
      if (currentRampInLoop) {
        setDangerLevel(DangerDomain.calcLevel(currentRampInLoop.obs, player.x, currentRampInLoop.dir, speed, W));
      }
      setPlayer(prev => {
        const ramp = ramps[prev.ramp];
        if (!ramp) return prev;
        let updated = Physics.applyMovement(prev, input, speed, ramp.dir);
        const jumpResult = Physics.applyJump(updated, input, effect.type, effect.timer);
        updated = jumpResult.player;
        if (jumpResult.didJump) Audio.play('jump');

        // 先にゴール／ランプ遷移を解決し、最終的に確定するプレイヤーを求める。
        // 着地検出はこの確定プレイヤーで行うことで、遷移時に prevOnGroundRef が
        // 実際に返すプレイヤーと食い違って誤発火するのを防ぐ。
        const transition = Physics.checkTransition(updated, ramps, W);
        if (transition.isGoal) {
          handleClear();
          return prev;
        }

        let finalPlayer = updated;
        let finalRamp = ramp;
        if (transition.transitioned) {
          Audio.play('rampChange');
          if (transition.player.ramp > lastRamp) {
            setLastRamp(transition.player.ramp);
            const scoreResult = ScoringDomain.calcRampScore(speed, comboTimer > 0 ? combo : 0);
            if (ComboDomain.shouldActivate(speed)) {
              const comboResult = ComboDomain.increment(combo, comboTimer);
              setCombo(comboResult.combo);
              setComboTimer(comboResult.timer);
              if (comboResult.combo > 1) {
                const comboScore = ScoringDomain.calcRampScore(speed, comboResult.combo);
                setScore(current => current + comboScore.base + comboScore.bonus);
                Audio.playCombo(comboResult.combo);
                addScorePopup(W / 2, 120, `+${comboScore.base + comboScore.bonus} (${comboResult.combo}x)`, '#ffaa00');
              } else {
                setScore(current => current + scoreResult.base);
              }
            } else {
              const reset = ComboDomain.reset();
              setCombo(reset.combo);
              setComboTimer(reset.timer);
              setScore(current => current + scoreResult.base);
            }
            setSpeedBonus(current => current + SpeedDomain.getBonus(speed));
            setTransitionEffect(1);
          }
          finalPlayer = transition.player;
          finalRamp = ramps[transition.player.ramp] ?? ramp;
        }

        // 着地検出: 前フレームが空中で確定プレイヤーが接地に変化したとき
        const wasOnGround = prevOnGroundRef.current;
        if (!wasOnGround && finalPlayer.onGround) {
          Audio.play('land');
          if (motionScaleRef.current > 0) {
            // 着地点の画面 Y 座標を計算して土煙を生成。
            // camY は jetParticles/トレイルと同様に前フレーム相当だが、土煙は短命バーストのため許容範囲。
            const dustGeo = GeometryDomain.getRampGeometry(finalRamp, W, RAMP_H);
            const dustSlopeY = GeometryDomain.getSlopeY(finalPlayer.x, dustGeo, finalRamp.type);
            const dustScreenY = finalPlayer.ramp * RAMP_H - camY + dustSlopeY;
            setParticles(prevParticles => [
              ...prevParticles,
              ...createDust(finalPlayer.x, dustScreenY, DUST_PARTICLE_COUNT),
            ]);
          }
        }
        prevOnGroundRef.current = finalPlayer.onGround;

        return finalPlayer;
      });
      setPlayer(prev => {
        const ramp = ramps[prev.ramp];
        if (!ramp) return prev;
        const handlers = createCollisionHandlers(
          SpeedDomain.getRank(speed),
          {
            onDie: handleDeath,
            onScore: ox => {
              Audio.play('score');
              setScore(current => current + Config.score.item);
              addParticles(ox, prev.ramp * RAMP_H - camY + 25, '#ffdd00', 6);
              addScorePopup(ox, prev.ramp * RAMP_H - camY, `+${Config.score.item}`, '#ffdd00');
              clockRef.current = triggerHitstop(clockRef.current, scaleFrames(Config.juice.hitstop.item, motionScaleRef.current));
            },
            onEffect: type => {
              if (!type) return;
              Audio.play('hit');
              setEffect({ type, timer: Config.effect.duration });
            },
            onEnemyKill: ox => {
              Audio.play('enemyKill');
              setScore(current => current + Config.score.enemy);
              setSpeed(current => Math.max(MIN_SPD, current - Config.combat.enemyKillSlowdown));
              addParticles(ox, prev.ramp * RAMP_H - camY + 25, '#ff8800', 10);
              addScorePopup(ox, prev.ramp * RAMP_H - camY, `+${Config.score.enemy}`, '#ff8800');
              clockRef.current = triggerHitstop(clockRef.current, scaleFrames(Config.juice.hitstop.enemyKill, motionScaleRef.current));
            },
            onBounce: vx => {
              Audio.play('hit');
              setPlayer(current => ({ ...current, vx }));
            },
          },
          godMode
        );
        for (const obstacle of ramp.obs) {
          if (!CollisionDomain.isActive(obstacle)) continue;
          const ox = GeometryDomain.getObstacleX(obstacle, ramp, W);
          const col = CollisionDomain.check(prev.x, ox, prev.jumping, prev.y);
          const obsId = `${prev.ramp}-${obstacle.pos}`;
          if (CollisionDomain.isDangerous(obstacle.t) && col.nearMiss && !passedObs.current.has(obsId)) {
            passedObs.current.add(obsId);
            Audio.play('nearMiss');
            setNearMissCount(current => current + 1);
            setScore(current => current + Config.score.nearMiss);
            setNearMissEffects(current => [
              ...current,
              EntityFactory.createNearMissEffect(ox, prev.ramp * RAMP_H - camY + 25),
            ]);
            addScorePopup(ox, prev.ramp * RAMP_H - camY - 20, `NEAR MISS +${Config.score.nearMiss}`, '#44ffaa');
            clockRef.current = triggerSlowMo(
              clockRef.current,
              scaleFrames(Config.juice.slowMo.nearMissFrames, motionScaleRef.current),
              Config.juice.slowMo.nearMissFactor,
            );
          }
          const handler = handlers[obstacle.t];
          if (handler) {
            const result = handler(col, obstacle, ox, prev.x);
            if (result === true) return prev;
            if (result === 'slow') return { ...prev, vx: -prev.vx * Config.combat.bounceMultiplier };
          }
        }
        return prev;
      });
      setCamY(current => MathUtils.lerp(current, player.ramp * RAMP_H - H / Config.camera.offsetDivisor, Config.camera.followRate));
    }, 1000 / 60);
    return () => window.clearInterval(loop);
  }, [state, W, H, MIN_SPD, RAMP_H, addParticles, addScorePopup,
      speed, player, ramps, camY, effect, combo, comboTimer,
      lastRamp, godMode, handleDeath, handleClear]);

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
