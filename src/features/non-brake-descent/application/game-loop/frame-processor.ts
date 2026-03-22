/**
 * フレーム処理の純粋関数
 *
 * NonBrakeDescentGame.tsx のゲームループ（setInterval内）のロジックを
 * 副作用なしの純粋関数として抽出する。
 * Audio 再生や setState は GameEvent 配列で返却し、呼び出し側で処理する。
 */
import { Config } from '../../config';
import { EffectType } from '../../constants';
import { createJetParticle } from '../../domain/entities';
import { GameEvent } from '../../domain/events/game-events';
import { MathUtils } from '../../domain/math-utils';

import { ComboDomain } from '../../domain/services/combo-service';
import { DangerDomain } from '../../domain/services/danger-service';
import { GeometryDomain } from '../../domain/services/geometry-service';
import { Physics } from '../../domain/services/physics-service';
import { ScoringDomain } from '../../domain/services/scoring-service';
import { SpeedDomain } from '../../domain/services/speed-service';

import { ParticleSys } from '../../particles';
import type { EffectState, InputState, Ramp } from '../../types';
import { processCollisions } from '../collision/collision-processor';
import type { ComboState, GameWorld, UIState } from './game-state';

/** フレーム処理の結果 */
export interface FrameResult {
  readonly world: GameWorld;
  readonly ui: UIState;
  readonly events: readonly GameEvent[];
  readonly transition: 'none' | 'died' | 'cleared';
}

/** フレーム処理に必要な入力コンテキスト */
export interface FrameContext {
  readonly input: InputState;
  readonly frameCount: number;
  readonly passedObstacles: ReadonlySet<string>;
  readonly isGodMode: boolean;
  readonly screenWidth: number;
  readonly screenHeight: number;
  readonly rampHeight: number;
}

/** エフェクトを考慮した入力状態を生成する */
const resolveInput = (
  keyLeft: boolean,
  keyRight: boolean,
  accel: boolean,
  jump: boolean,
  effectType: EffectState['type']
): InputState => {
  const isReversed = effectType === EffectType.REVERSE;
  return {
    left: isReversed ? keyRight : keyLeft,
    right: isReversed ? keyLeft : keyRight,
    accel,
    jump,
  };
};

/** エフェクトタイマーを更新する */
const updateEffect = (effect: EffectState): EffectState =>
  effect.timer <= 0
    ? { type: undefined, timer: 0 }
    : { ...effect, timer: effect.timer - 1 };

/** コンボ状態を更新する */
const updateCombo = (combo: ComboState): ComboState => ({
  ...combo,
  timer: ComboDomain.tick(combo.timer),
});

/** UI パーティクル群を更新する */
const updateUIParticles = (
  ui: UIState,
  world: GameWorld,
  ctx: FrameContext
): UIState => {
  const particles = ParticleSys.updateAndFilter(
    [...ui.particles],
    ParticleSys.updateParticle
  );
  const scorePopups = ParticleSys.updateAndFilter(
    [...ui.scorePopups],
    ParticleSys.updatePopup
  );
  const nearMissEffects = ParticleSys.updateAndFilter(
    [...ui.nearMissEffects],
    ParticleSys.updateNearMiss
  );
  const clouds = ParticleSys.updateClouds([...ui.clouds], world.speed);
  const transitionEffect = Math.max(0, ui.transitionEffect - 0.1);

  // ジェットパーティクルの更新
  let jetParticles = ParticleSys.updateAndFilter(
    [...ui.jetParticles],
    ParticleSys.updateParticle
  );
  if (
    world.speed > Config.particle.jetSpeedThreshold &&
    ctx.frameCount % 2 === 0
  ) {
    const ramp = world.ramps[world.player.ramp] as Ramp | undefined;
    if (ramp) {
      const geo = GeometryDomain.getRampGeometry(ramp, ctx.screenWidth, ctx.rampHeight);
      const slopeY = GeometryDomain.getSlopeY(world.player.x, geo, ramp.type);
      jetParticles = [
        ...jetParticles,
        createJetParticle(
          world.player.x,
          world.player.ramp * ctx.rampHeight - world.camY + slopeY,
          ramp.dir
        ),
      ];
    }
  }

  return {
    particles,
    jetParticles,
    scorePopups,
    nearMissEffects,
    clouds,
    shake: ui.shake,
    transitionEffect,
  };
};

/** ランプ遷移時のスコア・コンボ処理 */
const processRampTransition = (
  world: GameWorld,
  newRampIndex: number
): {
  score: number;
  speedBonus: number;
  combo: ComboState;
  events: readonly GameEvent[];
} => {
  const events: GameEvent[] = [];
  let { score, speedBonus, combo } = world;

  if (newRampIndex > world.lastRamp) {
    const scoreResult = ScoringDomain.calcRampScore(
      world.speed,
      combo.timer > 0 ? combo.count : 0
    );

    if (ComboDomain.shouldActivate(world.speed)) {
      const comboResult = ComboDomain.increment(combo.count, combo.timer);
      combo = { count: comboResult.combo, timer: comboResult.timer };

      if (comboResult.combo > 1) {
        const comboScore = ScoringDomain.calcRampScore(world.speed, comboResult.combo);
        score += comboScore.base + comboScore.bonus;
        events.push({
          type: 'AUDIO',
          sound: `combo_${comboResult.combo}`,
        });
        events.push({
          type: 'SCORE_POPUP',
          x: Config.screen.width / 2,
          y: 120,
          text: `+${comboScore.base + comboScore.bonus} (${comboResult.combo}x)`,
          color: '#ffaa00',
        });
      } else {
        score += scoreResult.base;
      }
    } else {
      const reset = ComboDomain.reset();
      combo = { count: reset.combo, timer: reset.timer };
      score += scoreResult.base;
    }

    speedBonus += SpeedDomain.getBonus(world.speed);
    events.push({
      type: 'RAMP_CLEARED',
      rampIndex: newRampIndex,
      score,
      combo: combo.count,
    });
  }

  return { score, speedBonus, combo, events };
};

/**
 * 1フレーム分のゲームロジックを処理する純粋関数
 *
 * 副作用（Audio 再生、setState）は events 配列で返却する。
 */
export const processFrame = (
  world: GameWorld,
  ui: UIState,
  ctx: FrameContext
): FrameResult => {
  const allEvents: GameEvent[] = [];
  const { screenWidth, rampHeight } = ctx;

  // 1. エフェクトタイマー更新
  const effect = updateEffect(world.effect);

  // 2. 速度更新
  const speed = SpeedDomain.accelerate(world.speed, ctx.input.accel);

  // 3. コンボタイマー tick
  const combo = updateCombo(world.combo);

  // 4. ワールドの中間状態を構築
  let intermediateWorld: GameWorld = {
    ...world,
    effect,
    speed,
    combo,
  };

  // 5. UI パーティクル更新
  const updatedUI = updateUIParticles(ui, intermediateWorld, ctx);

  // 6. 危険度計算
  const currentRamp = intermediateWorld.ramps[intermediateWorld.player.ramp] as Ramp | undefined;
  const dangerLevel = currentRamp
    ? DangerDomain.calcLevel(
        currentRamp.obs,
        intermediateWorld.player.x,
        currentRamp.dir,
        intermediateWorld.speed,
        screenWidth
      )
    : 0;

  intermediateWorld = { ...intermediateWorld, dangerLevel };

  // 7. プレイヤー移動
  const playerRamp = intermediateWorld.ramps[intermediateWorld.player.ramp] as Ramp | undefined;
  if (!playerRamp) {
    return {
      world: intermediateWorld,
      ui: updatedUI,
      events: allEvents,
      transition: 'none',
    };
  }

  let player = Physics.applyMovement(
    intermediateWorld.player,
    ctx.input,
    intermediateWorld.speed,
    playerRamp.dir
  );

  // 8. ジャンプ処理
  const jumpResult = Physics.applyJump(player, ctx.input, effect.type, effect.timer);
  player = jumpResult.player;
  if (jumpResult.didJump) {
    allEvents.push({ type: 'AUDIO', sound: 'jump' });
  }

  // 9. ランプ遷移チェック
  const transition = Physics.checkTransition(
    player,
    intermediateWorld.ramps as Ramp[],
    screenWidth
  );

  if (transition.isGoal) {
    allEvents.push({ type: 'GOAL_REACHED' });
    return {
      world: { ...intermediateWorld, player },
      ui: updatedUI,
      events: allEvents,
      transition: 'cleared',
    };
  }

  let finalWorld: GameWorld;

  if (transition.transitioned) {
    allEvents.push({ type: 'AUDIO', sound: 'rampChange' });
    player = transition.player;

    const rampResult = processRampTransition(intermediateWorld, transition.player.ramp);
    allEvents.push(...rampResult.events);

    finalWorld = {
      ...intermediateWorld,
      player,
      score: rampResult.score,
      speedBonus: rampResult.speedBonus,
      combo: rampResult.combo,
      lastRamp: Math.max(intermediateWorld.lastRamp, transition.player.ramp),
    };

    // 遷移エフェクトを追加
    return {
      world: finalWorld,
      ui: {
        ...updatedUI,
        transitionEffect: transition.player.ramp > intermediateWorld.lastRamp ? 1 : updatedUI.transitionEffect,
      },
      events: allEvents,
      transition: 'none',
    };
  }

  finalWorld = { ...intermediateWorld, player };

  // 10. 衝突処理
  const collisionResult = processCollisions(
    finalWorld,
    {
      screenWidth,
      rampHeight,
      speedRank: SpeedDomain.getRank(finalWorld.speed),
      isGodMode: ctx.isGodMode,
      passedObstacles: ctx.passedObstacles,
    }
  );

  allEvents.push(...collisionResult.events);

  if (collisionResult.dead) {
    return {
      world: collisionResult.world,
      ui: updatedUI,
      events: allEvents,
      transition: 'died',
    };
  }

  // 11. カメラ追従
  const camY = MathUtils.lerp(
    world.camY,
    collisionResult.world.player.ramp * rampHeight -
      Config.screen.height / Config.camera.offsetDivisor,
    Config.camera.followRate
  );

  return {
    world: { ...collisionResult.world, camY },
    ui: updatedUI,
    events: allEvents,
    transition: 'none',
  };
};

export { resolveInput, updateEffect, updateCombo };
