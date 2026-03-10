/**
 * ヒットエフェクトスケーリングテスト
 */

import {
  calculatePowerLevel,
  getHitEffectConfig,
  HIT_EFFECT_SCALES,
} from './hitEffectScaling';
import { Player, PlayerClass, Direction } from '../../types';

/** テスト用プレイヤー生成ヘルパー */
function createTestPlayer(level: number): Player {
  return {
    x: 5, y: 5,
    hp: 20, maxHp: 20,
    direction: Direction.DOWN,
    isInvincible: false,
    invincibleUntil: 0,
    attackCooldownUntil: 0,
    playerClass: PlayerClass.WARRIOR,
    level,
    killCount: 0,
    stats: { attackPower: 2, attackRange: 1, moveSpeed: 4, attackSpeed: 1, healBonus: 0 },
    slowedUntil: 0,
    hasKey: false,
    lastRegenAt: 0,
  };
}

describe('calculatePowerLevel', () => {
  it('Lv1-4はパワーレベル0', () => {
    expect(calculatePowerLevel(createTestPlayer(1))).toBe(0);
    expect(calculatePowerLevel(createTestPlayer(4))).toBe(0);
  });

  it('Lv5-9はパワーレベル1', () => {
    expect(calculatePowerLevel(createTestPlayer(5))).toBe(1);
    expect(calculatePowerLevel(createTestPlayer(9))).toBe(1);
  });

  it('Lv10-14はパワーレベル2', () => {
    expect(calculatePowerLevel(createTestPlayer(10))).toBe(2);
    expect(calculatePowerLevel(createTestPlayer(14))).toBe(2);
  });

  it('Lv15-19はパワーレベル3', () => {
    expect(calculatePowerLevel(createTestPlayer(15))).toBe(3);
    expect(calculatePowerLevel(createTestPlayer(19))).toBe(3);
  });

  it('Lv20以上はパワーレベル4', () => {
    expect(calculatePowerLevel(createTestPlayer(20))).toBe(4);
    expect(calculatePowerLevel(createTestPlayer(25))).toBe(4);
  });
});

describe('getHitEffectConfig', () => {
  it('パワーレベル0はパーティクル4個', () => {
    const config = getHitEffectConfig(0);
    expect(config.particleCount).toBe(4);
    expect(config.hasShockwave).toBe(false);
    expect(config.hasFlash).toBe(false);
    expect(config.hasShake).toBe(false);
  });

  it('パワーレベル1はパーティクル8個', () => {
    const config = getHitEffectConfig(1);
    expect(config.particleCount).toBe(8);
    expect(config.hasShockwave).toBe(false);
  });

  it('パワーレベル2はパーティクル12個+衝撃波', () => {
    const config = getHitEffectConfig(2);
    expect(config.particleCount).toBe(12);
    expect(config.hasShockwave).toBe(true);
    expect(config.hasFlash).toBe(false);
  });

  it('パワーレベル3はパーティクル16個+衝撃波+フラッシュ', () => {
    const config = getHitEffectConfig(3);
    expect(config.particleCount).toBe(16);
    expect(config.hasShockwave).toBe(true);
    expect(config.hasFlash).toBe(true);
    expect(config.hasShake).toBe(false);
  });

  it('パワーレベル4はパーティクル24個+衝撃波+フラッシュ+シェイク', () => {
    const config = getHitEffectConfig(4);
    expect(config.particleCount).toBe(24);
    expect(config.hasShockwave).toBe(true);
    expect(config.hasFlash).toBe(true);
    expect(config.hasShake).toBe(true);
  });

  it('範囲外のパワーレベルはクランプされる', () => {
    const configNeg = getHitEffectConfig(-1);
    expect(configNeg.particleCount).toBe(4);

    const configOver = getHitEffectConfig(10);
    expect(configOver.particleCount).toBe(24);
  });
});

describe('HIT_EFFECT_SCALES', () => {
  it('5段階のスケーリング設定が定義されている', () => {
    expect(HIT_EFFECT_SCALES).toHaveLength(5);
  });

  it('パワーレベルが上がるほどサイズ倍率が増加する', () => {
    for (let i = 1; i < HIT_EFFECT_SCALES.length; i++) {
      expect(HIT_EFFECT_SCALES[i].sizeMultiplier).toBeGreaterThan(
        HIT_EFFECT_SCALES[i - 1].sizeMultiplier
      );
    }
  });
});
