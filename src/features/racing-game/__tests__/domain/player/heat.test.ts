// HEAT（ニアミスボーナス）システムのテスト

import { createHeatState, updateHeat, getHeatBoost } from '../../../domain/player/heat';
import { HEAT } from '../../../domain/player/constants';

describe('heat', () => {
  const dt = 1 / 60;
  // 壁・車どちらのニアミスにも該当しない安全な距離
  const safeDist = 0;
  const farCarDist = 999;
  // テスト用のトラック幅と衝突距離
  const trackWidth = 55;
  const collisionDist = 25;

  describe('createHeatState', () => {
    it('全フィールドが 0 で初期化される', () => {
      const state = createHeatState();
      expect(state).toEqual({ gauge: 0, boostRemaining: 0, boostPower: 0, cooldown: 0 });
    });
  });

  describe('updateHeat', () => {
    it('クールダウン中はゲージが蓄積されない', () => {
      // Arrange
      const state = { gauge: 0.5, boostRemaining: 0, boostPower: 0, cooldown: 0.5 };

      // Act
      const next = updateHeat(state, safeDist, farCarDist, dt, 1, trackWidth, collisionDist);

      // Assert
      expect(next.gauge).toBe(0.5);
      expect(next.cooldown).toBeLessThan(0.5);
    });

    it('ブースト残り時間が減衰する', () => {
      // Arrange
      const state = { gauge: 0, boostRemaining: 0.5, boostPower: HEAT.BOOST_POWER, cooldown: 0 };

      // Act
      const next = updateHeat(state, safeDist, farCarDist, dt, 1, trackWidth, collisionDist);

      // Assert
      expect(next.boostRemaining).toBeLessThan(0.5);
    });

    it('壁ニアミスでゲージが増加する', () => {
      // Arrange
      const wallDist = trackWidth - 5;
      const state = createHeatState();

      // Act
      const next = updateHeat(state, wallDist, farCarDist, dt, 1, trackWidth, collisionDist);

      // Assert
      expect(next.gauge).toBeGreaterThan(0);
    });

    it('対戦車ニアミスでゲージが増加する', () => {
      // Arrange
      const carDist = collisionDist + 5;
      const state = createHeatState();

      // Act
      const next = updateHeat(state, safeDist, carDist, dt, 1, trackWidth, collisionDist);

      // Assert
      expect(next.gauge).toBeGreaterThan(0);
    });

    it('ニアミスがない場合は自然減衰する', () => {
      // Arrange
      const state = { gauge: 0.5, boostRemaining: 0, boostPower: 0, cooldown: 0 };

      // Act
      const next = updateHeat(state, safeDist, farCarDist, dt, 1, trackWidth, collisionDist);

      // Assert
      expect(next.gauge).toBeLessThan(0.5);
    });

    it('ゲージが最大値に達するとブーストが発動する', () => {
      // Arrange
      const state = { gauge: 1.0, boostRemaining: 0, boostPower: 0, cooldown: 0 };
      const wallDist = trackWidth - 1;

      // Act
      const next = updateHeat(state, wallDist, farCarDist, dt, 1, trackWidth, collisionDist);

      // Assert
      expect(next.gauge).toBe(0);
      expect(next.boostRemaining).toBe(HEAT.BOOST_DURATION);
      expect(next.cooldown).toBe(HEAT.COOLDOWN);
    });

    it('heatGainMultiplier がゲージ蓄積に反映される', () => {
      // Arrange
      const wallDist = trackWidth - 5;
      const state = createHeatState();

      // Act
      const normal = updateHeat(state, wallDist, farCarDist, dt, 1, trackWidth, collisionDist);
      const doubled = updateHeat(state, wallDist, farCarDist, dt, 2, trackWidth, collisionDist);

      // Assert
      expect(doubled.gauge).toBeGreaterThan(normal.gauge);
    });

    it('ゲージは [0, 1] の範囲内にクランプされる', () => {
      // Arrange
      const state = { gauge: 0.01, boostRemaining: 0, boostPower: 0, cooldown: 0 };

      // Act: 大量の自然減衰
      const next = updateHeat(state, safeDist, farCarDist, 10, 1, trackWidth, collisionDist);

      // Assert
      expect(next.gauge).toBeGreaterThanOrEqual(0);
    });

    it('dt が 0 以下の場合はアサーションエラーになる', () => {
      const state = createHeatState();
      expect(() => updateHeat(state, 0, 999, 0, 1, trackWidth, collisionDist)).toThrow();
    });
  });

  describe('getHeatBoost', () => {
    it('boostRemaining が 0 以下の場合は 0 を返す', () => {
      expect(getHeatBoost({ gauge: 0, boostRemaining: 0, boostPower: 0.25, cooldown: 0 })).toBe(0);
    });

    it('ブースト中は boostPower * ratio を返す', () => {
      // Arrange
      const remaining = HEAT.BOOST_DURATION / 2;
      const state = { gauge: 0, boostRemaining: remaining, boostPower: HEAT.BOOST_POWER, cooldown: 0 };

      // Act
      const result = getHeatBoost(state);

      // Assert
      const expected = HEAT.BOOST_POWER * (remaining / HEAT.BOOST_DURATION);
      expect(result).toBeCloseTo(expected, 5);
    });

    it('結果は常に 0 以上', () => {
      const state = { gauge: 0, boostRemaining: 0.001, boostPower: 0.1, cooldown: 0 };
      expect(getHeatBoost(state)).toBeGreaterThanOrEqual(0);
    });
  });
});
