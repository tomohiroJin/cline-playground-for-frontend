/**
 * エフェクト生成ファクトリー
 *
 * EffectType ごとに GameEffect を構築する純粋関数群と、その registry を提供する。
 * EffectManager.addEffect はこの registry を引いてエフェクトを生成する。
 * パーティクル生成は particleSystem の共有関数へ委譲する（this に依存しない）。
 */
import { EffectType, EffectTypeValue, EffectOptions, GameEffect } from './effectTypes';
import {
  createRadialParticles,
  createRisingParticles,
  createSpiralParticles,
  createPulseParticles,
  createTrailParticles,
} from './particleSystem';
import { getHitEffectConfig } from './hitEffectScaling';
import { getEnemyDeathParticleConfig } from './enemyDeath';
import { getItemPickupEffectConfig } from './itemFeedback';

/** ファクトリーに渡す生成コンテキスト */
export interface EffectFactoryContext {
  id: string;
  x: number;
  y: number;
  now: number;
  options?: EffectOptions;
}

/** 追従エフェクト（合成）の記述子 */
export interface FollowUpEffect {
  type: EffectTypeValue;
  x: number;
  y: number;
  options?: EffectOptions;
}

/** ファクトリーの生成結果。effect は optional（ENEMY_DEATH の enemyType 未指定時は生成しない） */
export interface EffectBuildResult {
  effect?: GameEffect;
  followUps?: FollowUpEffect[];
}

/** エフェクト生成ファクトリー（純粋関数。this に依存しない） */
export type EffectFactory = (ctx: EffectFactoryContext) => EffectBuildResult;

const createAttackHitEffect: EffectFactory = ({ id, x, y, now, options }) => {
  const pl = options?.powerLevel ?? 1;
  const combo = options?.comboMultiplier ?? 1.0;
  const hitConfig = getHitEffectConfig(pl);
  const count = Math.round(hitConfig.particleCount * combo);
  const sizeMin = 2 * hitConfig.sizeMultiplier;
  const sizeMax = 4 * hitConfig.sizeMultiplier;
  const speedMin = 60 * hitConfig.speedMultiplier;
  const speedMax = 150 * hitConfig.speedMultiplier;

  const effect: GameEffect = {
    id,
    type: EffectType.ATTACK_HIT,
    x,
    y,
    startTime: now,
    duration: 300,
    particles: createRadialParticles(
      count, x, y,
      ['#ffffff', '#ffffcc', '#ffff99'],
      speedMin, speedMax,
      sizeMin, sizeMax,
      3.0
    ),
    ringRadius: hitConfig.hasShockwave ? 0 : undefined,
    ringMaxRadius: hitConfig.hasShockwave ? (8 + pl * 4) : undefined,
    flashAlpha: hitConfig.hasFlash ? 0.4 : undefined,
  };

  const followUps = hitConfig.hasShake
    ? [{ type: EffectType.SCREEN_SHAKE, x: 0, y: 0, options: { damage: 3 } }]
    : undefined;

  return { effect, followUps };
};

const createDamageEffect: EffectFactory = ({ id, x, y, now }) => ({
  effect: {
    id,
    type: EffectType.DAMAGE,
    x,
    y,
    startTime: now,
    duration: 400,
    particles: createRisingParticles(6, x, y, ['#ef4444', '#dc2626', '#ff6b6b'], 2, 4, 2.5),
  },
});

const createTrapDamageEffect: EffectFactory = ({ id, x, y, now }) => ({
  effect: {
    id,
    type: EffectType.TRAP_DAMAGE,
    x,
    y,
    startTime: now,
    duration: 350,
    particles: createRisingParticles(6, x, y, ['#dc2626', '#ef4444', '#f87171'], 2, 3, 2.8),
  },
});

const createTrapSlowEffect: EffectFactory = ({ id, x, y, now }) => ({
  effect: {
    id,
    type: EffectType.TRAP_SLOW,
    x,
    y,
    startTime: now,
    duration: 500,
    particles: createRadialParticles(8, x, y, ['#3b82f6', '#60a5fa', '#93c5fd'], 15, 40, 3, 5, 2.0),
  },
});

const createTrapTeleportEffect: EffectFactory = ({ id, x, y, now }) => ({
  effect: {
    id,
    type: EffectType.TRAP_TELEPORT,
    x,
    y,
    startTime: now,
    duration: 400,
    particles: createRadialParticles(10, x, y, ['#7c3aed', '#a78bfa', '#c4b5fd'], 30, 80, 2, 4, 2.5),
    ringRadius: 0,
    ringMaxRadius: 30,
  },
});

const createItemPickupEffect: EffectFactory = ({ id, x, y, now, options }) => {
  const itemType = options?.itemType;
  const itemConfig = itemType ? getItemPickupEffectConfig(itemType) : undefined;
  const pCount = itemConfig?.particleCount ?? 6;
  const pColors = itemConfig?.colors ?? ['#fbbf24', '#fcd34d', '#fef08a'];
  const pPattern = itemConfig?.pattern ?? 'rising';

  const particles =
    pPattern === 'spiral'
      ? createSpiralParticles(pCount, x, y, pColors, 80, 1.5)
      : pPattern === 'radial'
      ? createRadialParticles(pCount, x, y, pColors, 40, 100, 2, 4, 2.0)
      : createRisingParticles(pCount, x, y, pColors, 2, 3, 2.0);

  return {
    effect: {
      id,
      type: EffectType.ITEM_PICKUP,
      x,
      y,
      startTime: now,
      duration: 500,
      particles,
    },
  };
};

const createLevelUpEffect: EffectFactory = ({ id, x, y, now }) => ({
  effect: {
    id,
    type: EffectType.LEVEL_UP,
    x,
    y,
    startTime: now,
    duration: 1500,
    particles: createSpiralParticles(24, x, y, ['#fbbf24', '#fcd34d', '#fef08a', '#ffffff'], 100, 0.7),
    ringRadius: 0,
    ringMaxRadius: 40,
    flashAlpha: 0.4,
    flashColor: '#fbbf24',
  },
});

const createBossKillEffect: EffectFactory = ({ id, x, y, now }) => ({
  effect: {
    id,
    type: EffectType.BOSS_KILL,
    x,
    y,
    startTime: now,
    duration: 1200,
    particles: createRadialParticles(24, x, y, ['#dc2626', '#f97316', '#ffffff', '#fbbf24'], 80, 200, 3, 6, 0.8),
    flashAlpha: 1.0,
  },
});

const createEnemyAttackEffect: EffectFactory = ({ id, x, y, now, options }) => {
  const variant = options?.variant ?? 'melee';
  if (variant === 'boss') {
    return {
      effect: {
        id,
        type: EffectType.ENEMY_ATTACK,
        x,
        y,
        startTime: now,
        duration: 500,
        particles: createPulseParticles(16, x, y, ['#dc2626', '#ef4444', '#f87171', '#ffffff'], 100, 2.0),
      },
    };
  }
  if (variant === 'ranged') {
    return {
      effect: {
        id,
        type: EffectType.ENEMY_ATTACK,
        x,
        y,
        startTime: now,
        duration: 400,
        particles: createTrailParticles(8, x, y, 0, -1, ['#f97316', '#fdba74', '#fff7ed'], 120, 2.5),
      },
    };
  }
  // melee
  return {
    effect: {
      id,
      type: EffectType.ENEMY_ATTACK,
      x,
      y,
      startTime: now,
      duration: 300,
      particles: createRadialParticles(8, x, y, ['#ef4444', '#dc2626', '#ff6b6b'], 50, 120, 2, 4, 3.0),
    },
  };
};

const createScreenShakeEffect: EffectFactory = ({ id, now, options }) => {
  const intensity = Math.min(4, options?.damage ? options.damage * 0.5 : 2);
  return {
    effect: {
      id,
      type: EffectType.SCREEN_SHAKE,
      x: 0,
      y: 0,
      startTime: now,
      duration: 200,
      particles: [],
      shakeIntensity: intensity,
      shakeDecay: intensity / 0.2,
      shakeDirection: options?.shakeDirection,
    },
  };
};

const createStageClearEffect: EffectFactory = ({ id, x, y, now, options }) => {
  const stageColors = [
    ['#60a5fa', '#93c5fd', '#ffffff'],
    ['#34d399', '#6ee7b7', '#ffffff'],
    ['#fbbf24', '#fcd34d', '#ffffff'],
    ['#f472b6', '#f9a8d4', '#ffffff'],
    ['#a78bfa', '#c4b5fd', '#fbbf24', '#ffffff'],
  ];
  const stageIdx = Math.min((options?.stageNumber ?? 1) - 1, stageColors.length - 1);
  return {
    effect: {
      id,
      type: EffectType.STAGE_CLEAR,
      x,
      y,
      startTime: now,
      duration: 1500,
      particles: createSpiralParticles(32, x, y, stageColors[stageIdx], 100, 0.7),
      flashAlpha: 1.0,
    },
  };
};

const createEnemyDeathEffect: EffectFactory = ({ id, x, y, now, options }) => {
  const enemyType = options?.enemyType;
  if (!enemyType) {
    // enemyType が渡されない場合は旧 switch の `if (enemyType)` ガードと同様、
    // effect を生成せず何も追加しない（effect 省略 = push されない）
    return {};
  }
  const deathConfig = getEnemyDeathParticleConfig(enemyType);
  const combo = options?.comboMultiplier ?? 1.0;
  const count = Math.round(deathConfig.particleCount * combo);
  return {
    effect: {
      id,
      type: EffectType.ENEMY_DEATH,
      x,
      y,
      startTime: now,
      duration: deathConfig.duration,
      particles: createRadialParticles(
        count, x, y,
        deathConfig.colors,
        deathConfig.speedMin, deathConfig.speedMax,
        deathConfig.sizeMin, deathConfig.sizeMax,
        2.0
      ),
    },
  };
};

/**
 * EffectType → ファクトリーの registry。
 * LOW_HP_WARNING は元の switch に case が無く未処理のため登録しない（Partial）。
 */
export const EFFECT_FACTORIES: Partial<Record<EffectTypeValue, EffectFactory>> = {
  [EffectType.ATTACK_HIT]: createAttackHitEffect,
  [EffectType.DAMAGE]: createDamageEffect,
  [EffectType.TRAP_DAMAGE]: createTrapDamageEffect,
  [EffectType.TRAP_SLOW]: createTrapSlowEffect,
  [EffectType.TRAP_TELEPORT]: createTrapTeleportEffect,
  [EffectType.ITEM_PICKUP]: createItemPickupEffect,
  [EffectType.LEVEL_UP]: createLevelUpEffect,
  [EffectType.BOSS_KILL]: createBossKillEffect,
  [EffectType.ENEMY_ATTACK]: createEnemyAttackEffect,
  [EffectType.SCREEN_SHAKE]: createScreenShakeEffect,
  [EffectType.STAGE_CLEAR]: createStageClearEffect,
  [EffectType.ENEMY_DEATH]: createEnemyDeathEffect,
};
