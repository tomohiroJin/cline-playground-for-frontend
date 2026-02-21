import { initHeatState, updateHeat, activateBoost, getHeatBoost } from '../heat';
import { Config, HEAT } from '../constants';

describe('Heat システム', () => {
  describe('initHeatState', () => {
    test('全フィールドが0で初期化される', () => {
      const state = initHeatState();
      expect(state).toEqual({ gauge: 0, boostRemaining: 0, boostPower: 0, cooldown: 0 });
    });
  });

  describe('updateHeat', () => {
    const dt = 1 / 60;
    // 安全な距離（壁・車どちらのニアミスにも該当しない）
    const safeDist = 0;
    const farCarDist = 999;

    test('クールダウン中はゲージが蓄積されない', () => {
      const state = { gauge: 0.5, boostRemaining: 0, boostPower: 0, cooldown: 0.5 };
      const next = updateHeat(state, safeDist, farCarDist, dt);
      expect(next.gauge).toBe(0.5);
      expect(next.cooldown).toBeLessThan(0.5);
    });

    test('ブースト残り時間が減衰する', () => {
      const state = { gauge: 0, boostRemaining: 0.5, boostPower: HEAT.BOOST_POWER, cooldown: 0 };
      const next = updateHeat(state, safeDist, farCarDist, dt);
      expect(next.boostRemaining).toBeLessThan(0.5);
    });

    test('壁ニアミスでゲージが増加する', () => {
      // trackWidth(55) に近い距離 → ニアミス判定
      const wallDist = Config.game.trackWidth - 5;
      const state = initHeatState();
      const next = updateHeat(state, wallDist, farCarDist, dt);
      expect(next.gauge).toBeGreaterThan(0);
    });

    test('対戦車ニアミスでゲージが増加する', () => {
      // collisionDist(25) より少し大きい距離 → ニアミス判定
      const carDist = Config.game.collisionDist + 5;
      const state = initHeatState();
      const next = updateHeat(state, safeDist, carDist, dt);
      expect(next.gauge).toBeGreaterThan(0);
    });

    test('ニアミスがない場合は自然減衰する', () => {
      const state = { gauge: 0.5, boostRemaining: 0, boostPower: 0, cooldown: 0 };
      const next = updateHeat(state, safeDist, farCarDist, dt);
      expect(next.gauge).toBeLessThan(0.5);
    });

    test('ゲージが最大値に達するとブーストが発動する', () => {
      const state = { gauge: 1.0, boostRemaining: 0, boostPower: 0, cooldown: 0 };
      // 壁ニアミスで加算して1.0を維持/超過させる
      const wallDist = Config.game.trackWidth - 1;
      const next = updateHeat(state, wallDist, farCarDist, dt);
      // ブースト発動後: gauge=0, boostRemaining > 0, cooldown > 0
      expect(next.gauge).toBe(0);
      expect(next.boostRemaining).toBe(HEAT.BOOST_DURATION);
      expect(next.cooldown).toBe(HEAT.COOLDOWN);
    });

    test('heatGainMultiplier がゲージ蓄積に反映される', () => {
      const wallDist = Config.game.trackWidth - 5;
      const state = initHeatState();
      const normal = updateHeat(state, wallDist, farCarDist, dt, 1);
      const doubled = updateHeat(state, wallDist, farCarDist, dt, 2);
      // 減衰は同じなので、倍率2のほうがゲージが大きい
      expect(doubled.gauge).toBeGreaterThan(normal.gauge);
    });
  });

  describe('activateBoost', () => {
    test('ゲージが0になりブーストとクールダウンが設定される', () => {
      const state = { gauge: 1.0, boostRemaining: 0, boostPower: 0, cooldown: 0 };
      const next = activateBoost(state);
      expect(next.gauge).toBe(0);
      expect(next.boostRemaining).toBe(HEAT.BOOST_DURATION);
      expect(next.boostPower).toBe(HEAT.BOOST_POWER);
      expect(next.cooldown).toBe(HEAT.COOLDOWN);
    });
  });

  describe('getHeatBoost', () => {
    test('boostRemaining が 0 以下の場合は 0 を返す', () => {
      expect(getHeatBoost({ gauge: 0, boostRemaining: 0, boostPower: 0.25, cooldown: 0 })).toBe(0);
    });

    test('ブースト中は boostPower * ratio を返す', () => {
      const remaining = HEAT.BOOST_DURATION / 2;
      const state = { gauge: 0, boostRemaining: remaining, boostPower: HEAT.BOOST_POWER, cooldown: 0 };
      const expected = HEAT.BOOST_POWER * (remaining / HEAT.BOOST_DURATION);
      expect(getHeatBoost(state)).toBeCloseTo(expected, 5);
    });
  });
});
