// HEAT（ニアミスボーナス）計算（純粋関数・副作用なし）

import type { HeatState } from './types';
import { HEAT } from './constants';
import { clamp } from '../shared/math-utils';
import { assertPositive } from '../shared/assertions';

/** HEAT 状態の初期値を生成 */
export const createHeatState = (): HeatState => ({
  gauge: 0,
  boostRemaining: 0,
  boostPower: 0,
  cooldown: 0,
});

/** HEAT ゲージのフレーム更新（純粋関数: Config への依存を引数で注入） */
export const updateHeat = (
  state: HeatState,
  wallDist: number,
  carDist: number,
  dt: number,
  heatGainMultiplier: number,
  trackWidth: number,
  collisionDist: number,
): HeatState => {
  // 事前条件
  assertPositive(dt, 'dt');

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
  const wallThreshold = trackWidth - HEAT.WALL_THRESHOLD;
  if (wallDist > wallThreshold && wallDist < trackWidth) {
    const proximity = 1 - (trackWidth - wallDist) / HEAT.WALL_THRESHOLD;
    gauge += proximity * HEAT.GAIN_RATE * heatGainMultiplier * dt;
  }

  // 対戦車ニアミス蓄積
  if (carDist < HEAT.CAR_THRESHOLD && carDist > collisionDist) {
    const proximity = 1 - (carDist - collisionDist) / (HEAT.CAR_THRESHOLD - collisionDist);
    gauge += proximity * HEAT.GAIN_RATE * heatGainMultiplier * dt;
  }

  // 自然減衰
  gauge -= HEAT.DECAY_RATE * dt;

  // クランプ（事後条件: gauge ∈ [0, 1]）
  gauge = clamp(gauge, 0, 1);

  // ゲージ MAX でブースト発動
  if (gauge >= 1.0) {
    return { gauge: 0, boostRemaining: HEAT.BOOST_DURATION, boostPower: HEAT.BOOST_POWER, cooldown: HEAT.COOLDOWN };
  }

  return { gauge, boostRemaining, boostPower, cooldown };
};

/** 現在のブースト値取得 */
export const getHeatBoost = (state: HeatState): number => {
  if (state.boostRemaining <= 0) return 0;
  const ratio = state.boostRemaining / HEAT.BOOST_DURATION;
  return state.boostPower * ratio;
};
