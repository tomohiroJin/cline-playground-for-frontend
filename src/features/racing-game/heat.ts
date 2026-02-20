// HEAT（ニアミスボーナス）計算モジュール

import type { HeatState } from './types';
import { Config, HEAT } from './constants';
import { Utils } from './utils';

/** HEAT状態の初期値を生成 */
export const initHeatState = (): HeatState => ({
  gauge: 0,
  boostRemaining: 0,
  boostPower: 0,
  cooldown: 0,
});

/** HEATゲージのフレーム更新 */
export const updateHeat = (
  state: HeatState,
  wallDist: number,
  carDist: number,
  dt: number,
  heatGainMultiplier = 1
): HeatState => {
  let { gauge, boostRemaining, boostPower, cooldown } = state;

  // ブースト残り時間の減衰
  if (boostRemaining > 0) {
    boostRemaining = Math.max(0, boostRemaining - dt);
    if (boostRemaining <= 0) {
      boostPower = 0;
    }
  }

  // クールダウン中はゲージ蓄積なし
  if (cooldown > 0) {
    cooldown = Math.max(0, cooldown - dt);
    return { gauge, boostRemaining, boostPower, cooldown };
  }

  // 壁ニアミス蓄積
  const wallThreshold = Config.game.trackWidth - HEAT.WALL_THRESHOLD;
  if (wallDist > wallThreshold && wallDist < Config.game.trackWidth) {
    const proximity = 1 - (Config.game.trackWidth - wallDist) / HEAT.WALL_THRESHOLD;
    gauge += proximity * HEAT.GAIN_RATE * heatGainMultiplier * dt;
  }

  // 対戦車ニアミス蓄積
  if (carDist < HEAT.CAR_THRESHOLD && carDist > Config.game.collisionDist) {
    const proximity = 1 - (carDist - Config.game.collisionDist) / (HEAT.CAR_THRESHOLD - Config.game.collisionDist);
    gauge += proximity * HEAT.GAIN_RATE * heatGainMultiplier * dt;
  }

  // 自然減衰
  gauge -= HEAT.DECAY_RATE * dt;

  // クランプ
  gauge = Utils.clamp(gauge, 0, 1);

  // ゲージMAXでブースト発動
  if (gauge >= 1.0) {
    return activateBoost({ gauge, boostRemaining, boostPower, cooldown });
  }

  return { gauge, boostRemaining, boostPower, cooldown };
};

/** ブースト発動 */
export const activateBoost = (state: HeatState): HeatState => ({
  gauge: 0,
  boostRemaining: HEAT.BOOST_DURATION,
  boostPower: HEAT.BOOST_POWER,
  cooldown: HEAT.COOLDOWN,
});

/** 現在のブースト値取得 */
export const getHeatBoost = (state: HeatState): number => {
  if (state.boostRemaining <= 0) return 0;
  // ブースト時間に比例して線形減衰
  const ratio = state.boostRemaining / HEAT.BOOST_DURATION;
  return state.boostPower * ratio;
};

export const Heat = {
  initState: initHeatState,
  update: updateHeat,
  activate: activateBoost,
  getBoost: getHeatBoost,
};
