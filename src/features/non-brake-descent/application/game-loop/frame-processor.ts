/**
 * 1フレーム分のゲームシミュレーション処理（純粋関数）
 *
 * B2-S2: use-game-engine.ts のゲームループ本体をここに抽出する。
 * Audio / React / DOM / setState を一切呼ばない。
 * 副作用は events 配列と FrameResult のフラグ群で表現する。
 *
 * 純粋性の妥協点（挙動保存を優先）:
 *   - 衝突ハンドラ内の obstacle.t in-place 書き換えは旧挙動の一部であり、
 *     collision-processor.ts とは別実装（フックの createCollisionHandlers 相当）を用いる。
 *     完全な不変化は S3/S4 以降の課題とする。
 */

import { Config } from '../../config';
import { EffectType, ObstacleType, SpeedRank } from '../../constants';
import { CollisionDomain } from '../../domain/services/collision-service';
import { ComboDomain } from '../../domain/services/combo-service';
import { DangerDomain } from '../../domain/services/danger-service';
import { GeometryDomain } from '../../domain/services/geometry-service';
import { Physics } from '../../domain/services/physics-service';
import { ScoringDomain } from '../../domain/services/scoring-service';
import { createDust } from '../../domain/services/dust-service';
import { spawnSpeedLines, updateSpeedLines } from '../../domain/services/speed-line-service';
import { SpeedDomain } from '../../domain/services/speed-service';
import { sampleTrail } from '../../domain/services/trail-service';
import { EntityFactory } from '../../entities';
import { MathUtils } from '../../domain/math-utils';
import { ParticleSys } from '../../particles';
import { scaleFrames } from './motion-scale';
import type { GameWorld, UIState } from './game-state';
import type { GameEvent } from '../../domain/events/game-events';
import type { DeathState, EffectState, InputState, Ramp } from '../../types';

// --- 定数 ---

/** 残像トレイルの最大サンプル保持数 */
const MAX_TRAIL_SAMPLES = 10;

/** 着地時の土煙パーティクル数（通常着地） */
const DUST_PARTICLE_COUNT = 6;

// --- 公開インターフェース ---

/**
 * processFrame に渡す「フレーム外コンテキスト」
 * フックの ref 群から組み立てて渡す。純粋関数側から書き換えない。
 */
export interface FrameContext {
  /** 画面幅（ピクセル） */
  readonly screenWidth: number;
  /** 画面高さ（ピクセル） */
  readonly screenHeight: number;
  /** ランプの高さ（ピクセル） */
  readonly rampHeight: number;
  /** 速度の最小値（下限クランプ用） */
  readonly minSpeed: number;
  /** ゴッドモード（衝突死亡・バウンス無効） */
  readonly isGodMode: boolean;
  /** reduced-motion 係数（0: モーション無効 / 1: 通常） */
  readonly motionScale: number;
  /** 現フレームのインデックス（偶数フレームにのみジェット生成等の判定に使用） */
  readonly frameIndex: number;
  /** 前フレームの接地状態（着地検出: false→true で land イベント発火） */
  readonly wasOnGround: boolean;
  /** 前フレームの速度ランク（ランク変化検出で BGM 切替に使用） */
  readonly prevRank: number;
  /** 最後に到達したランプインデックス（lastRamp ref 相当） */
  readonly lastRamp: number;
  /** 既にニアミス通過済みの障害物 ID セット（重複判定用） */
  readonly passedObstacles: ReadonlySet<string>;
}

/**
 * processFrame の戻り値
 * フックはこれを受け取り各 state/ref に展開する。
 */
export interface FrameResult {
  /** 更新後のゲームワールド（score/combo/camera 等すべて反映済み） */
  readonly world: GameWorld;
  /**
   * 更新後の UI 状態（particles/popups/speedLines/trail/dust 等反映済み）
   * ただし shake は hitstopFrames/slowMoFrames の適用前の値である。
   * フック側で hitstopFrames を clockRef に適用し shake は別途管理する。
   */
  readonly ui: UIState;
  /** Audio 再生・死亡・クリア・ランク変化等の副作用イベント */
  readonly events: readonly GameEvent[];
  /** このフレームでゴールに到達したか */
  readonly isGoal: boolean;
  /** このフレームで死亡したか */
  readonly isDead: boolean;
  /** 死亡タイプ（isDead=true の場合のみ意味を持つ） */
  readonly deathType?: DeathState['type'];
  /** 今フレームで新たにニアミス通過とみなした障害物 ID */
  readonly newPassedObstacles: readonly string[];
  /**
   * 衝突で発生したヒットストップフレーム数（0 = なし）
   * フック側で clockRef.current = triggerHitstop(clockRef.current, hitstopFrames) を呼ぶ。
   */
  readonly hitstopFrames: number;
  /** スローモーフレーム数（0 = なし） */
  readonly slowMoFrames: number;
  /** スローモー間引き係数 */
  readonly slowMoFactor: number;
  /** 更新後の速度ランク（prevRank と異なれば BGM 切替 SPEED_RANK_CHANGED を events に含む） */
  readonly newRank: number;
}

// --- 内部ヘルパー ---

/** 衝突コールバック群（副作用を収集するためのインターフェース） */
type CollisionSideEffects = {
  collisionDied: boolean;
  deathType: DeathState['type'] | undefined;
  collisionSlowed: boolean;
  newVxFromBounce: number | undefined;
  audioEventsFromCollision: Array<{ sound: string }>;
  scoreDeltaFromCollision: number;
  speedDeltaFromCollision: number;
  particlesFromCollision: Array<{ x: number; y: number; color: string; count: number }>;
  popupsFromCollision: Array<{ x: number; y: number; text: string; color: string }>;
  nearMissFromCollision: Array<{ x: number; y: number }>;
  nearMissDeltaCount: number;
  nearMissScoreDelta: number;
  nearMissPopupsFromCollision: Array<{ x: number; y: number; text: string; color: string }>;
  newEffectFromCollision: EffectState | undefined;
  hitstopFrames: number;
  slowMoFrames: number;
  slowMoFactor: number;
  newPassedObstacles: string[];
};

/** CollisionSideEffects の初期値 */
const createEmptyCollisionSideEffects = (): CollisionSideEffects => ({
  collisionDied: false,
  deathType: undefined,
  collisionSlowed: false,
  newVxFromBounce: undefined,
  audioEventsFromCollision: [],
  scoreDeltaFromCollision: 0,
  speedDeltaFromCollision: 0,
  particlesFromCollision: [],
  popupsFromCollision: [],
  nearMissFromCollision: [],
  nearMissDeltaCount: 0,
  nearMissScoreDelta: 0,
  nearMissPopupsFromCollision: [],
  newEffectFromCollision: undefined,
  hitstopFrames: 0,
  slowMoFrames: 0,
  slowMoFactor: 1,
  newPassedObstacles: [],
});

/**
 * 衝突処理を実行し副作用を収集する
 *
 * 注意: この関数はフックの createCollisionHandlers 相当の実装であり、
 * collision-processor.ts の processCollisions とは別物。
 * obstacle.t の in-place 書き換えが現状動作の一部のため、挙動保存を優先してそのまま残す。
 * （不変化は S3/S4 以降の課題）
 */
const processCollisionLoop = (
  ramp: Ramp,
  afterTransitionPlayer: { x: number; y: number; ramp: number; jumping: boolean; onGround: boolean; vx: number; vy: number; jumpCD: boolean | number },
  nextSpeed: number,
  camY: number,
  ctx: FrameContext,
  fx: CollisionSideEffects
): void => {
  const rank = SpeedDomain.getRank(nextSpeed);
  const W = ctx.screenWidth;
  const RAMP_H = ctx.rampHeight;
  const godMode = ctx.isGodMode;
  const motionScale = ctx.motionScale;

  const die = godMode
    ? (_type: DeathState['type']) => { /* ゴッドモード時は die を無視する（collisionDied を設定しない） */ }
    : (type: DeathState['type']) => {
        fx.collisionDied = true;
        fx.deathType = type;
      };

  const bounce = godMode
    ? (_vx: number) => { /* ゴッドモード時はバウンスしない */ }
    : (vx: number) => {
        fx.audioEventsFromCollision.push({ sound: 'hit' });
        fx.newVxFromBounce = vx;
      };

  const handleEnemy = (
    col: ReturnType<typeof CollisionDomain.check>,
    obs: Ramp['obs'][number],
    ox: number,
    px: number
  ): boolean | 'slow' => {
    if (!col.hit) return false;
    if (rank === SpeedRank.HIGH) {
      die('enemy');
      return true;
    }
    if (rank === SpeedRank.MID) {
      // 注意: in-place 書き換え（挙動保存のため意図的に残す）
      obs.t = ObstacleType.DEAD;
      fx.audioEventsFromCollision.push({ sound: 'enemyKill' });
      fx.scoreDeltaFromCollision += Config.score.enemy;
      fx.speedDeltaFromCollision -= Config.combat.enemyKillSlowdown;
      fx.particlesFromCollision.push({ x: ox, y: afterTransitionPlayer.ramp * RAMP_H - camY + 25, color: '#ff8800', count: 10 });
      fx.popupsFromCollision.push({ x: ox, y: afterTransitionPlayer.ramp * RAMP_H - camY, text: `+${Config.score.enemy}`, color: '#ff8800' });
      fx.hitstopFrames = Math.max(fx.hitstopFrames, scaleFrames(Config.juice.hitstop.enemyKill, motionScale));
      return 'slow';
    }
    bounce(px < ox ? -Config.combat.bounceSpeed : Config.combat.bounceSpeed);
    return false;
  };

  for (const obstacle of ramp.obs) {
    if (!CollisionDomain.isActive(obstacle)) continue;

    const ox = GeometryDomain.getObstacleX(obstacle, ramp, W);
    const col = CollisionDomain.check(afterTransitionPlayer.x, ox, afterTransitionPlayer.jumping, afterTransitionPlayer.y);
    const obsId = `${afterTransitionPlayer.ramp}-${obstacle.pos}`;

    // ニアミス判定
    if (CollisionDomain.isDangerous(obstacle.t) && col.nearMiss && !ctx.passedObstacles.has(obsId) && !fx.newPassedObstacles.includes(obsId)) {
      fx.newPassedObstacles.push(obsId);
      fx.nearMissDeltaCount += 1;
      fx.nearMissScoreDelta += Config.score.nearMiss;
      fx.nearMissFromCollision.push({ x: ox, y: afterTransitionPlayer.ramp * RAMP_H - camY + 25 });
      fx.nearMissPopupsFromCollision.push({ x: ox, y: afterTransitionPlayer.ramp * RAMP_H - camY - 20, text: `NEAR MISS +${Config.score.nearMiss}`, color: '#44ffaa' });
      fx.slowMoFrames = Math.max(fx.slowMoFrames, scaleFrames(Config.juice.slowMo.nearMissFrames, motionScale));
      fx.slowMoFactor = Config.juice.slowMo.nearMissFactor;
    }

    // 衝突ハンドラ
    let result: boolean | 'slow' = false;
    switch (obstacle.t) {
      case ObstacleType.HOLE_S:
        result = col.ground && rank === SpeedRank.LOW ? (die('fall'), true) : false;
        break;
      case ObstacleType.HOLE_L:
        result = col.ground ? (die('fall'), true) : false;
        break;
      case ObstacleType.ROCK:
        result = col.hit ? (die('rock'), true) : false;
        break;
      case ObstacleType.ENEMY:
      case ObstacleType.ENEMY_V:
        result = handleEnemy(col, obstacle, ox, afterTransitionPlayer.x);
        break;
      case ObstacleType.SCORE:
        if (col.hit) {
          // 注意: in-place 書き換え（挙動保存のため意図的に残す）
          obstacle.t = ObstacleType.TAKEN;
          fx.audioEventsFromCollision.push({ sound: 'score' });
          fx.scoreDeltaFromCollision += Config.score.item;
          fx.particlesFromCollision.push({ x: ox, y: afterTransitionPlayer.ramp * RAMP_H - camY + 25, color: '#ffdd00', count: 6 });
          fx.popupsFromCollision.push({ x: ox, y: afterTransitionPlayer.ramp * RAMP_H - camY, text: `+${Config.score.item}`, color: '#ffdd00' });
          fx.hitstopFrames = Math.max(fx.hitstopFrames, scaleFrames(Config.juice.hitstop.item, motionScale));
        }
        break;
      case ObstacleType.REVERSE:
        if (col.hit) {
          // 注意: in-place 書き換え（挙動保存のため意図的に残す）
          obstacle.t = ObstacleType.TAKEN;
          fx.audioEventsFromCollision.push({ sound: 'hit' });
          fx.newEffectFromCollision = { type: EffectType.REVERSE, timer: Config.effect.duration };
        }
        break;
      case ObstacleType.FORCE_JUMP:
        if (col.hit) {
          // 注意: in-place 書き換え（挙動保存のため意図的に残す）
          obstacle.t = ObstacleType.TAKEN;
          fx.audioEventsFromCollision.push({ sound: 'hit' });
          fx.newEffectFromCollision = { type: EffectType.FORCE_JUMP, timer: Config.effect.duration };
        }
        break;
      default:
        break;
    }

    if (result === true) {
      // 旧挙動の再現: die が実際に collisionDied をセットした場合のみ break する。
      // ゴッドモード時は die が no-op なので collisionDied = false のまま break する。
      // (die を呼んだ後の result=true は「衝突ループを抜けよ」のシグナルのみ)
      if (fx.collisionDied) break;
      // ゴッドモード時: break しない（障害物の当たり判定を無視して進む）
    }
    if (result === 'slow') {
      fx.collisionSlowed = true;
      break;
    }
  }
};

// --- 公開関数 ---

/**
 * 1フレーム分のゲームシミュレーションを実行する純粋関数
 *
 * Audio / React / DOM への依存は一切持たない。
 * フック側でこの関数を呼び出し、返却された events を処理する。
 *
 * @param world - 現フレーム開始時のゲームワールド
 * @param ui - 現フレーム開始時の UI 状態
 * @param input - このフレームの入力状態
 * @param ctx - フレーム外コンテキスト（ref 群から組み立てる）
 * @returns 更新後の状態と副作用イベント群
 */
export const processFrame = (
  world: GameWorld,
  ui: UIState,
  input: InputState,
  ctx: FrameContext
): FrameResult => {
  const W = ctx.screenWidth;
  const H = ctx.screenHeight;
  const RAMP_H = ctx.rampHeight;
  const MIN_SPD = ctx.minSpeed;

  const currentEffect = world.effect;
  const currentSpeed = world.speed;
  const currentPlayer = world.player;
  const currentRamps = world.ramps as Ramp[];
  const currentCamY = world.camY;
  const currentCombo = world.combo.count;
  const currentComboTimer = world.combo.timer;
  const currentLastRamp = ctx.lastRamp;

  const events: GameEvent[] = [];

  // --- エフェクトタイマー更新 ---
  const nextEffect: EffectState = currentEffect.timer <= 0
    ? { type: undefined, timer: 0 }
    : { ...currentEffect, timer: currentEffect.timer - 1 };

  // --- 速度更新 ---
  const nextSpeed = SpeedDomain.accelerate(currentSpeed, input.accel);

  // --- パーティクル系更新（純粋変換） ---
  // readonly 配列はスプレッドでコピーしてから渡す（ParticleSys は mutable 配列を受け取る）
  const nextParticles = ParticleSys.updateAndFilter(
    [...ui.particles],
    ParticleSys.updateParticle
  );
  const nextScorePopups = ParticleSys.updateAndFilter(
    [...ui.scorePopups],
    ParticleSys.updatePopup
  );
  const nextNearMissEffects = ParticleSys.updateAndFilter(
    [...ui.nearMissEffects],
    ParticleSys.updateNearMiss
  );

  // --- コンボタイマー更新 ---
  const nextComboTimer = ComboDomain.tick(currentComboTimer);

  // transitionEffect を減衰
  const nextTransitionEffect = Math.max(0, ui.transitionEffect - 0.1);

  // 雲の更新
  const nextClouds = ParticleSys.updateClouds([...ui.clouds], nextSpeed);

  // --- ジェットパーティクル更新 ---
  let nextJetParticles = ParticleSys.updateAndFilter(
    [...ui.jetParticles],
    ParticleSys.updateParticle
  );
  if (nextSpeed > Config.particle.jetSpeedThreshold && ctx.frameIndex % 2 === 0) {
    const ramp = currentRamps[currentPlayer.ramp];
    if (ramp) {
      const geo = GeometryDomain.getRampGeometry(ramp, W, RAMP_H);
      const slopeY = GeometryDomain.getSlopeY(currentPlayer.x, geo, ramp.type);
      nextJetParticles = [
        ...nextJetParticles,
        EntityFactory.createJetParticle(
          currentPlayer.x,
          currentPlayer.ramp * RAMP_H - currentCamY + slopeY,
          ramp.dir
        ),
      ];
    }
  }

  // --- 速度線の更新・生成（HIGH ランク時のみ生成） ---
  const currentRank = SpeedDomain.getRank(nextSpeed);
  let nextSpeedLines = updateSpeedLines(ui.speedLines);
  if (ctx.motionScale > 0) {
    nextSpeedLines = spawnSpeedLines(nextSpeedLines, currentRank, W, H);
  }

  // --- プレイヤー残像トレイルの更新 ---
  const trailRamp = currentRamps[currentPlayer.ramp];
  let nextPlayerTrail = ui.playerTrail as ReturnType<typeof sampleTrail>;
  if (trailRamp) {
    const trailGeo = GeometryDomain.getRampGeometry(trailRamp, W, RAMP_H);
    const trailSlopeY = GeometryDomain.getSlopeY(currentPlayer.x, trailGeo, trailRamp.type);
    const trailY = currentPlayer.ramp * RAMP_H - currentCamY + trailSlopeY;
    const isHighSpeed = nextSpeed > Config.particle.jetSpeedThreshold;
    const enableTrail = ctx.motionScale > 0 && isHighSpeed;
    nextPlayerTrail = sampleTrail(
      ui.playerTrail,
      currentPlayer.x,
      trailY,
      enableTrail ? MAX_TRAIL_SAMPLES : 0
    );
  }

  // --- 速度ランク変化の検出 ---
  const newRank = currentRank;
  if (newRank !== ctx.prevRank) {
    events.push({ type: 'SPEED_RANK_CHANGED', rank: newRank });
  }

  // --- 危険レベル計算 ---
  const currentRampForDanger = currentRamps[currentPlayer.ramp];
  const nextDangerLevel = currentRampForDanger
    ? DangerDomain.calcLevel(currentRampForDanger.obs, currentPlayer.x, currentRampForDanger.dir, nextSpeed, W)
    : world.dangerLevel;

  // --- フェーズ1: 移動・ジャンプ・ランプ遷移 ---
  const rampForMove = currentRamps[currentPlayer.ramp];
  if (!rampForMove) {
    // ramp が取れない場合はカメラのみ更新して終了
    const nextCamY = MathUtils.lerp(
      currentCamY,
      currentPlayer.ramp * RAMP_H - H / Config.camera.offsetDivisor,
      Config.camera.followRate
    );
    const nextWorld: GameWorld = {
      ...world,
      effect: nextEffect,
      speed: nextSpeed,
      combo: { count: currentCombo, timer: nextComboTimer },
      camY: nextCamY,
      dangerLevel: nextDangerLevel,
    };
    const nextUI: UIState = {
      ...ui,
      particles: nextParticles,
      jetParticles: nextJetParticles,
      scorePopups: nextScorePopups,
      nearMissEffects: nextNearMissEffects,
      clouds: nextClouds,
      transitionEffect: nextTransitionEffect,
      speedLines: nextSpeedLines,
      playerTrail: nextPlayerTrail,
    };
    return {
      world: nextWorld,
      ui: nextUI,
      events,
      isGoal: false,
      isDead: false,
      newPassedObstacles: [],
      hitstopFrames: 0,
      slowMoFrames: 0,
      slowMoFactor: 1,
      newRank,
    };
  }

  let movedPlayer = Physics.applyMovement(currentPlayer, input, nextSpeed, rampForMove.dir);
  const jumpResult = Physics.applyJump(movedPlayer, input, nextEffect.type, nextEffect.timer);
  movedPlayer = jumpResult.player;
  const didJump = jumpResult.didJump;

  // ゴール／ランプ遷移を解決
  const transition = Physics.checkTransition(movedPlayer, currentRamps, W);

  // ゴール時は isGoal=true で即返す
  if (transition.isGoal) {
    // ゴールイベント
    events.push({ type: 'GOAL_REACHED' });
    // ジャンプ音（ゴール直前のジャンプはゴール処理前に発火）
    if (didJump) {
      events.push({ type: 'AUDIO', sound: 'jump' });
    }
    // カメラ更新
    const nextCamY = MathUtils.lerp(
      currentCamY,
      currentPlayer.ramp * RAMP_H - H / Config.camera.offsetDivisor,
      Config.camera.followRate
    );
    const nextWorld: GameWorld = {
      ...world,
      player: movedPlayer,
      effect: nextEffect,
      speed: nextSpeed,
      combo: { count: currentCombo, timer: nextComboTimer },
      camY: nextCamY,
      dangerLevel: nextDangerLevel,
    };
    const nextUI: UIState = {
      ...ui,
      particles: nextParticles,
      jetParticles: nextJetParticles,
      scorePopups: nextScorePopups,
      nearMissEffects: nextNearMissEffects,
      clouds: nextClouds,
      transitionEffect: nextTransitionEffect,
      speedLines: nextSpeedLines,
      playerTrail: nextPlayerTrail,
    };
    return {
      world: nextWorld,
      ui: nextUI,
      events,
      isGoal: true,
      isDead: false,
      newPassedObstacles: [],
      hitstopFrames: 0,
      slowMoFrames: 0,
      slowMoFactor: 1,
      newRank,
    };
  }

  // 遷移後の副作用収集
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
      // コンボ有効判定は tick 適用前の comboTimer 値を参照する（旧挙動と一致）
      const scoreResult = ScoringDomain.calcRampScore(nextSpeed, currentComboTimer > 0 ? currentCombo : 0);

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

  // --- 着地検出 ---
  const justLanded = !ctx.wasOnGround && afterTransitionPlayer.onGround;

  // --- フェーズ2: 衝突処理 ---
  const fx = createEmptyCollisionSideEffects();
  const collisionRamp = currentRamps[afterTransitionPlayer.ramp];
  if (collisionRamp) {
    processCollisionLoop(
      collisionRamp,
      afterTransitionPlayer,
      nextSpeed,
      currentCamY,
      ctx,
      fx
    );
  }

  // 衝突結果をプレイヤーに反映
  let finalPlayer = afterTransitionPlayer;
  if (fx.collisionSlowed) {
    finalPlayer = { ...afterTransitionPlayer, vx: -afterTransitionPlayer.vx * Config.combat.bounceMultiplier };
  } else if (fx.newVxFromBounce !== undefined) {
    finalPlayer = { ...afterTransitionPlayer, vx: fx.newVxFromBounce };
  }

  // --- 副作用の収集（events・状態に反映） ---

  // ジャンプ音
  if (didJump) {
    events.push({ type: 'AUDIO', sound: 'jump' });
  }

  // 現時点のスコア・コンボ・speedBonus（更新を積み上げる用）
  let nextScore = world.score;
  let nextSpeedBonus = world.speedBonus;
  let nextComboFinal = currentCombo;
  let nextComboTimerFinal = nextComboTimer;
  let nextLastRamp = currentLastRamp;
  let finalTransitionEffect = nextTransitionEffect;
  let mutableParticles = [...nextParticles];
  let mutableScorePopups = [...nextScorePopups];
  let mutableNearMissEffects = [...nextNearMissEffects];

  // ランプ遷移の副作用
  if (didRampChange && transition.transitioned && transition.player.ramp > currentLastRamp) {
    nextLastRamp = newLastRamp;
    nextComboFinal = newCombo;
    nextComboTimerFinal = newComboTimer2;
    nextScore += scoreDeltaFromRamp;
    nextSpeedBonus += newSpeedBonusDelta;
    finalTransitionEffect = 1;
    if (shouldPlayCombo) {
      // コンボ音: フック側で Audio.playCombo(comboCountForAudio) を呼ぶ
      events.push({ type: 'AUDIO', sound: `combo:${comboCountForAudio}` });
      mutableScorePopups = [
        ...mutableScorePopups,
        EntityFactory.createScorePopup(W / 2, 120, comboPopupText, '#ffaa00'),
      ];
    }
    events.push({ type: 'AUDIO', sound: 'rampChange' });
  }

  // 着地の副作用
  if (justLanded) {
    events.push({ type: 'AUDIO', sound: 'land' });
    if (ctx.motionScale > 0) {
      const dustGeo = GeometryDomain.getRampGeometry(afterTransitionRamp, W, RAMP_H);
      const dustSlopeY = GeometryDomain.getSlopeY(afterTransitionPlayer.x, dustGeo, afterTransitionRamp.type);
      const dustScreenY = afterTransitionPlayer.ramp * RAMP_H - currentCamY + dustSlopeY;
      const dustParticles = createDust(afterTransitionPlayer.x, dustScreenY, DUST_PARTICLE_COUNT);
      mutableParticles = [...mutableParticles, ...dustParticles];
    }
  }

  // ニアミス副作用（死亡フラグに関わらず適用: 旧挙動と一致）
  if (fx.nearMissScoreDelta !== 0) {
    nextScore += fx.nearMissScoreDelta;
    // nearMissCount は world へ反映
    for (const nm of fx.nearMissFromCollision) {
      mutableNearMissEffects = [
        ...mutableNearMissEffects,
        EntityFactory.createNearMissEffect(nm.x, nm.y),
      ];
    }
    for (const popup of fx.nearMissPopupsFromCollision) {
      mutableScorePopups = [
        ...mutableScorePopups,
        EntityFactory.createScorePopup(popup.x, popup.y, popup.text, popup.color),
      ];
    }
    // ニアミス音はフック側で Audio.play('nearMiss') を呼ぶ（旧挙動と一致: 死亡判定前に発火）
    for (let i = 0; i < fx.nearMissDeltaCount; i++) {
      events.push({ type: 'AUDIO', sound: 'nearMiss' });
    }
  }

  // スローモー（ニアミス由来）をフレーム結果に含める
  // フック側で clockRef.current = triggerSlowMo(...) を呼ぶ

  let finalSpeed = nextSpeed;
  let finalEffect = nextEffect;

  if (!fx.collisionDied) {
    // 生存時: スコア・エフェクト・パーティクルを適用
    if (fx.scoreDeltaFromCollision !== 0) {
      nextScore += fx.scoreDeltaFromCollision;
    }
    if (fx.speedDeltaFromCollision !== 0) {
      finalSpeed = Math.max(MIN_SPD, nextSpeed + fx.speedDeltaFromCollision);
    }
    for (const p of fx.particlesFromCollision) {
      mutableParticles = [
        ...mutableParticles,
        ...EntityFactory.createParticles(p.x, p.y, p.color, p.count),
      ];
    }
    for (const popup of fx.popupsFromCollision) {
      mutableScorePopups = [
        ...mutableScorePopups,
        EntityFactory.createScorePopup(popup.x, popup.y, popup.text, popup.color),
      ];
    }
    if (fx.newEffectFromCollision) {
      finalEffect = fx.newEffectFromCollision;
    }
    // hitstopFrames（アイテム取得・敵撃破由来）はフック側で clockRef に適用する
  } else {
    // 死亡: 衝突の audio イベントをフック側に渡す（handleDeath 呼び出しなど）
    for (const ae of fx.audioEventsFromCollision) {
      events.push({ type: 'AUDIO', sound: ae.sound });
    }
    // 死亡イベント（フック側で handleDeath を呼ぶ）
    events.push({ type: 'PLAYER_DIED', deathType: fx.deathType ?? 'rock' });
  }

  // --- カメラ更新 ---
  // 修正3: カメラ目標は常に前フレームのプレイヤー ramp を使う（旧挙動と一致）
  const nextCamY = MathUtils.lerp(
    currentCamY,
    currentPlayer.ramp * RAMP_H - H / Config.camera.offsetDivisor,
    Config.camera.followRate
  );

  // --- world/ui の組み立て ---
  const nextNearMissCount = world.nearMissCount + fx.nearMissDeltaCount;

  const resultWorld: GameWorld = {
    ...world,
    player: fx.collisionDied ? afterTransitionPlayer : finalPlayer,
    ramps: currentRamps,
    speed: finalSpeed,
    camY: nextCamY,
    score: nextScore,
    speedBonus: nextSpeedBonus,
    combo: { count: nextComboFinal, timer: nextComboTimerFinal },
    effect: finalEffect,
    lastRamp: nextLastRamp,
    nearMissCount: nextNearMissCount,
    dangerLevel: nextDangerLevel,
  };

  const resultUI: UIState = {
    ...ui,
    particles: mutableParticles,
    jetParticles: nextJetParticles,
    scorePopups: mutableScorePopups,
    nearMissEffects: mutableNearMissEffects,
    clouds: nextClouds,
    transitionEffect: finalTransitionEffect,
    speedLines: nextSpeedLines,
    playerTrail: nextPlayerTrail,
    // shake はフックが hitstopFrames 由来の処理と一体で管理するため変更しない
  };

  return {
    world: resultWorld,
    ui: resultUI,
    events,
    isGoal: false,
    isDead: fx.collisionDied,
    deathType: fx.deathType,
    newPassedObstacles: fx.newPassedObstacles,
    hitstopFrames: fx.hitstopFrames,
    slowMoFrames: fx.slowMoFrames,
    slowMoFactor: fx.slowMoFactor,
    newRank,
  };
};
