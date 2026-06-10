/**
 * ゲームエンジンフック
 *
 * NonBrakeDescentGame.tsx から状態管理・ゲームループロジックを抽出する。
 * 元のコードの動作を忠実に再現しつつ、プレゼンテーション層から分離する。
 *
 * B2-S1: setState updater 内の副作用をループ外へ分離。
 * 動的値（player/speed/ramps/camY/effect/combo/comboTimer/lastRamp/godMode）を
 * ref に昇格させ、ゲームループの依存配列を [state] のみに縮小した。
 *
 * B2-S2: ゲームループ本体を processFrame 純粋関数に抽出。
 * フックはその結果を各 state/ref に展開するのみ。
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Audio } from '../../audio';
import { Config } from '../../config';
import { GameState, SpeedRank } from '../../constants';
import { SpeedDomain } from '../../domains/speed-domain';
import { ScoringDomain } from '../../domains/scoring-domain';
import { EntityFactory } from '../../entities';
import { BackgroundGen, RampGen } from '../../generators';
import { useCheatCode } from '../../hooks';
import { ParticleSys } from '../../particles';
import type {
  ClearAnim,
  DeathState,
  EffectState,
  GameStateValue,
  NearMissEffect,
  Particle,
  Player,
  Ramp,
  ScorePopup,
  TouchKeys,
} from '../../types';
import type { GameWorld, UIState } from '../../application/game-loop/game-state';
import { advanceClock, createGameClock, triggerHitstop, triggerSlowMo } from '../../application/game-loop/game-clock';
import { processFrame } from '../../application/game-loop/frame-processor';
import type { FrameContext } from '../../application/game-loop/frame-processor';
import { resolveMotionScale, scaleFrames } from '../../application/game-loop/motion-scale';
import { useReducedMotion } from './use-reduced-motion';
import { useIsMobile } from './use-mobile';
import { getHighScore, saveScore } from '../../../../utils/score-storage';
import type { SpeedLine } from '../../domain/services/speed-line-service';
import type { TrailSample } from '../../domain/services/trail-service';

const SCORE_KEY = 'non_brake_descent';

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

  // --- B2-S1/S2: stale closure 回避のための ref 群 ---
  // ゲームループ useEffect の依存配列から動的 state を除外するため、
  // 各 setter 呼び出し時に同期更新する。
  const playerRef = useRef<Player>(EntityFactory.createPlayer());
  const speedRef = useRef<number>(MIN_SPD);
  const rampsRef = useRef<Ramp[]>([]);
  const camYRef = useRef<number>(0);
  const effectRef = useRef<EffectState>({ type: undefined, timer: 0 });
  const comboRef = useRef<number>(0);
  const comboTimerRef = useRef<number>(0);
  const lastRampRef = useRef<number>(0);
  const godModeRef = useRef<boolean>(false);
  /** 速度線の ref（processFrame に渡すための最新値を保持） */
  const speedLinesRef = useRef<SpeedLine[]>([]);
  /** プレイヤー残像トレイルの ref（processFrame に渡すための最新値を保持） */
  const playerTrailRef = useRef<TrailSample[]>([]);
  /**
   * transitionEffect の ref（processFrame に渡すための最新値を保持）
   * 旧挙動: 毎フレーム 0.1 ずつ減衰 → ランプ通過時に 1 をセット → 約10フレームで減衰。
   * processFrame に最新値を渡すことで、減衰の持続が旧と一致する。
   */
  const transitionEffectRef = useRef<number>(0);

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
    transitionEffectRef.current = 0;
    setTransitionEffect(0);
    setDangerLevel(0);
    speedLinesRef.current = [];
    setSpeedLines([]);
    playerTrailRef.current = [];
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
    rampsRef.current = generated;
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
  // B2-S2: ループ本体を processFrame 純粋関数呼び出しに置換。
  // 依存配列は [state] のみ（動的値はすべて ref 経由）。
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
      const currentPlayer = playerRef.current;
      const currentRamps = rampsRef.current;
      const currentCamY = camYRef.current;

      // reverse エフェクト中は左右を入れ替える
      const reverse = currentEffect.type === 'reverse';
      const input = {
        left: reverse ? keyState.ArrowRight || touchState.right : keyState.ArrowLeft || touchState.left,
        right: reverse ? keyState.ArrowLeft || touchState.left : keyState.ArrowRight || touchState.right,
        accel: keyState.KeyZ || touchState.accel,
        jump: keyState.KeyX || touchState.jump,
      };

      // --- processFrame 用の world/ui を現在の各 state から組み立てる ---
      const currentWorld: GameWorld = {
        player: currentPlayer,
        ramps: currentRamps,
        speed: speedRef.current,
        camY: currentCamY,
        score: 0, // processFrame 内でスコア差分を計算するため、フック側の score state を直接使いたい
        // → ただし純粋関数への score 渡しが必要なため、score は state の値をそのまま使う
        // ここでは scoreRef が無いため、下記で別途扱う
        speedBonus: 0,
        combo: { count: comboRef.current, timer: comboTimerRef.current },
        effect: currentEffect,
        lastRamp: lastRampRef.current,
        nearMissCount: 0,
        dangerLevel: 0,
      };

      // NOTE: score/speedBonus/nearMissCount/dangerLevel は useState で管理されており
      // processFrame に渡すためには現在の最新値が必要。
      // B2-S2 では世界状態をまだ ref に統合していないため（S3 の課題）、
      // processFrame の world.score は差分加算の起点として使う。
      // フックではその差分を processFrame の結果から取り出して setScore に適用する形になる。
      // → 実際の score/speedBonus/nearMissCount は scoreRef が無いため、
      //    processFrame は world.score=0 を受け取り「このフレームの差分」として返す設計とする。
      // → この問題は processFrame 内でも score/speedBonus を初期値ゼロから加算する設計で対応可能だが
      //    dangerLevel/nearMissCount については「現在値」が必要。
      //
      // 以上の理由から、B2-S2 ではスコア・パーティクル等の「差分」は processFrame の結果に入れ、
      // フック側で useState の setXxx を通じて適用する（S3 以降で useReducer に一元化する）。

      // --- processFrame 用のコンテキストを組み立てる ---
      const ctx: FrameContext = {
        screenWidth: W,
        screenHeight: H,
        rampHeight: RAMP_H,
        minSpeed: MIN_SPD,
        isGodMode: godModeRef.current,
        motionScale: motionScaleRef.current,
        frameIndex: frameRef.current,
        wasOnGround: prevOnGroundRef.current,
        prevRank: prevRankRef.current,
        lastRamp: lastRampRef.current,
        passedObstacles: passedObs.current,
      };

      // processFrame には score/speedBonus/nearMissCount/dangerLevel を
      // 現在の state 値として渡せないため（useState の値が stale になるリスク）、
      // これらは processFrame から「差分」として返してもらい、フック側で適用する。
      // 暫定的に world に 0 を渡し、結果の world から差分を計算して適用する。
      // (S3 以降では useReducer で world 全体を ref で持つことでこの問題を解消する)
      const inputWorld: GameWorld = {
        ...currentWorld,
        // score/speedBonus/nearMissCount/dangerLevel は「差分起点=0」として渡す
        score: 0,
        speedBonus: 0,
        nearMissCount: 0,
        dangerLevel: 0,
      };

      // 速度線・トレイル等の UI state も ref がないため現在の state を直接参照できないが、
      // 各フレームで完全に再計算するため問題なし（updateSpeedLines, sampleTrail 等は前の状態から計算する）。
      // B2-S2 暫定: UI の速度線・トレイルは processFrame に委任する。
      // 既存の particles/scorePopups/nearMissEffects/clouds は processFrame が更新する。
      // フック側の state は使わず、processFrame 結果を直接 setXxx で適用する。
      const inputUI: UIState = {
        particles: [], // processFrame は nextParticles（既存更新済み）を使うため、空からスタートではなく
        // 現在の particles state が必要。しかし stale closure 問題がある。
        // B2-S2 の暫定措置: processFrame は空配列を受け取り、
        // dust/ニアミスエフェクト等の「新規生成」分のみ返す。
        // 既存の更新（updateAndFilter）はフック側で継続する。
        jetParticles: [],
        scorePopups: [],
        nearMissEffects: [],
        clouds: [],
        shake: 0,
        // 修正1: transitionEffectRef.current を渡すことで減衰の持続が旧挙動と一致する。
        // 旧挙動: 毎フレーム Math.max(0, current - 0.1) で減衰し、ランプ通過時に 1 をセット。
        transitionEffect: transitionEffectRef.current,
        speedLines: speedLinesRef.current,
        playerTrail: playerTrailRef.current,
      };

      // B2-S2 実装上の限界:
      // particles/scorePopups/nearMissEffects/clouds は useState で管理されており
      // processFrame に「現在の最新値」を渡せない（stale closure 問題）。
      // S3/S4 で useReducer に移行するまでの暫定として、
      // processFrame は「新規生成・追記分のみ」を返し、
      // 既存のパーティクル更新はフック側の setXxx(prev => ...) で継続する。

      // --- パーティクル系の既存更新（純粋変換・processFrame 外で継続） ---
      // 修正3: particles/scorePopups/nearMissEffects は毎フレーム更新する（旧挙動と一致）。
      // 修正4: 雲の更新は processFrame 後に result.world.speed を使って行う（後述）。
      setParticles(current => ParticleSys.updateAndFilter(current, ParticleSys.updateParticle));
      setScorePopups(current => ParticleSys.updateAndFilter(current, ParticleSys.updatePopup));
      setNearMissEffects(current => ParticleSys.updateAndFilter(current, ParticleSys.updateNearMiss));

      // --- processFrame を呼び出す ---
      const result = processFrame(inputWorld, inputUI, input, ctx);

      // --- 前フレーム ref の更新 ---
      prevOnGroundRef.current = result.world.player.onGround;
      prevRankRef.current = result.newRank;

      // --- 新規 passedObstacles を追加 ---
      for (const obsId of result.newPassedObstacles) {
        passedObs.current.add(obsId);
      }

      // --- events を処理 ---
      for (const event of result.events) {
        switch (event.type) {
          case 'AUDIO':
            // コンボ音は 'combo:N' 形式
            if (event.sound.startsWith('combo:')) {
              const comboCount = parseInt(event.sound.slice(6), 10);
              Audio.playCombo(comboCount);
            } else {
              Audio.play(event.sound);
            }
            break;
          case 'SPEED_RANK_CHANGED':
            Audio.setSpeedRank(event.rank);
            break;
          case 'GOAL_REACHED':
            handleClear();
            break;
          case 'PLAYER_DIED':
            handleDeath(event.deathType);
            break;
          default:
            break;
        }
      }

      // ゴール時はここで終了
      if (result.isGoal) {
        return;
      }

      // --- state/ref の更新 ---
      const w = result.world;

      // 死亡フレームではニアミス副作用・スコア差分・カメラのみを適用し、
      // プレイヤー位置・速度・コンボ・エフェクト等の world コミットは行わない。
      // 旧挙動（a9ea5b9）: 衝突死亡時は !collisionDied ブロックをスキップし、
      // nearMiss 副作用（スコア・カウント・エフェクト・ポップアップ・slowMo）と
      // カメラ更新だけが実行されていた。
      if (result.isDead) {
        // ニアミス由来スローモー（旧: slowMoFrames > 0 のとき triggerSlowMo 呼び出し）
        if (result.slowMoFrames > 0) {
          clockRef.current = triggerSlowMo(clockRef.current, result.slowMoFrames, result.slowMoFactor);
        }

        // スコア差分（nearMiss 由来 + ランプ遷移由来）
        if (w.score !== 0) {
          setScore(prev => prev + w.score);
        }

        // ニアミスカウント
        if (w.nearMissCount !== 0) {
          setNearMissCount(prev => prev + w.nearMissCount);
        }

        // ニアミスエフェクト追記（nearMiss 由来の新規生成分）
        if (result.ui.nearMissEffects.length > 0) {
          setNearMissEffects(prev => [...prev, ...result.ui.nearMissEffects as typeof prev]);
        }

        // スコアポップアップ追記（nearMiss 由来の新規生成分）
        if (result.ui.scorePopups.length > 0) {
          setScorePopups(prev => [...prev, ...result.ui.scorePopups as typeof prev]);
        }

        // パーティクル追記（着地由来・nearMiss 由来の新規生成分）
        if (result.ui.particles.length > 0) {
          setParticles(prev => [...prev, ...result.ui.particles as typeof prev]);
        }

        // カメラ更新（旧挙動: 衝突死亡後も else ブロック外でカメラ更新が実行されていた）
        camYRef.current = w.camY;
        setCamY(w.camY);
        return;
      }

      // --- clockRef 更新（生存時のみ） ---
      if (result.hitstopFrames > 0) {
        clockRef.current = triggerHitstop(clockRef.current, result.hitstopFrames);
      }
      if (result.slowMoFrames > 0) {
        clockRef.current = triggerSlowMo(clockRef.current, result.slowMoFrames, result.slowMoFactor);
      }

      // 速度
      speedRef.current = w.speed;
      setSpeed(w.speed);

      // エフェクト
      effectRef.current = w.effect;
      setEffect(w.effect);

      // コンボ
      comboRef.current = w.combo.count;
      setCombo(w.combo.count);
      comboTimerRef.current = w.combo.timer;
      setComboTimer(w.combo.timer);

      // lastRamp（変化した場合のみ）
      if (w.lastRamp !== lastRampRef.current) {
        lastRampRef.current = w.lastRamp;
        setLastRamp(w.lastRamp);
      }

      // プレイヤー
      playerRef.current = w.player;
      setPlayer(w.player);

      // カメラ
      camYRef.current = w.camY;
      setCamY(w.camY);

      // スコア差分を適用（processFrame は score=0 起点で計算した差分を返す）
      if (w.score !== 0) {
        setScore(prev => prev + w.score);
      }
      if (w.speedBonus !== 0) {
        setSpeedBonus(prev => prev + w.speedBonus);
      }
      if (w.nearMissCount !== 0) {
        setNearMissCount(prev => prev + w.nearMissCount);
      }

      // 危険レベル
      setDangerLevel(w.dangerLevel);

      // transitionEffect（processFrame が計算した値で上書き）
      // ref も同期して次フレームの processFrame に最新値を渡す。
      transitionEffectRef.current = result.ui.transitionEffect;
      setTransitionEffect(result.ui.transitionEffect);

      // ジェットパーティクル（processFrame が完全に管理）
      // 生成のないフレームでも既存粒子を更新する（length > 0 ガード撤廃）。
      // 旧挙動: 毎フレーム updateAndFilter を実行してから新規粒子を追加していた。
      setJetParticles(prev => [
        ...ParticleSys.updateAndFilter(prev, ParticleSys.updateParticle),
        ...result.ui.jetParticles,
      ]);

      // 雲の更新（result.world.speed を使う）
      // 旧挙動: setClouds(current => ParticleSys.updateClouds(current, nextSpeed)) で加速後速度を使用。
      // processFrame 後の result.world.speed を使うことで旧と同値になる。
      setClouds(current => ParticleSys.updateClouds(current, result.world.speed));

      // 速度線（processFrame が管理）
      speedLinesRef.current = result.ui.speedLines as SpeedLine[];
      setSpeedLines(result.ui.speedLines as SpeedLine[]);

      // プレイヤー残像トレイル（processFrame が管理）
      playerTrailRef.current = result.ui.playerTrail as TrailSample[];
      setPlayerTrail(result.ui.playerTrail as TrailSample[]);

      // ニアミスエフェクト追記（processFrame から返ってきた新規生成分）
      if (result.ui.nearMissEffects.length > 0) {
        setNearMissEffects(prev => [...prev, ...result.ui.nearMissEffects as typeof prev]);
      }

      // スコアポップアップ追記（processFrame から返ってきた新規生成分）
      if (result.ui.scorePopups.length > 0) {
        setScorePopups(prev => [...prev, ...result.ui.scorePopups as typeof prev]);
      }

      // パーティクル追記（processFrame から返ってきた新規生成分: dust 等）
      if (result.ui.particles.length > 0) {
        setParticles(prev => [...prev, ...result.ui.particles as typeof prev]);
      }
    }, 1000 / 60);
    return () => window.clearInterval(loop);
  }, [state, W, H, MIN_SPD, RAMP_H, handleDeath, handleClear]);

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
    speedLines,
    playerTrail,
  }), [particles, jetParticles, scorePopups, nearMissEffects, clouds, shake, transitionEffect, speedLines, playerTrail]);

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
