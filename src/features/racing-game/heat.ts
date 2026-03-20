// HEAT（ニアミスボーナス）計算モジュール
// 移行期間中: domain/player/heat.ts へ委譲

import type { HeatState } from './types';
import { Config, HEAT as HEAT_CONST } from './constants';
import {
  createHeatState,
  updateHeat as updateHeatPure,
  getHeatBoost,
} from './domain/player/heat';

// 旧名での re-export（後方互換）
export const initHeatState = createHeatState;
export { getHeatBoost };

/** HEAT ゲージのフレーム更新（旧インターフェース: Config 依存を内部で解決） */
export const updateHeat = (
  state: HeatState,
  wallDist: number,
  carDist: number,
  dt: number,
  heatGainMultiplier = 1,
): HeatState => {
  return updateHeatPure(
    state,
    wallDist,
    carDist,
    dt,
    heatGainMultiplier,
    Config.game.trackWidth,
    Config.game.collisionDist,
  );
};

/** ブースト発動 */
export const activateBoost = (_state: HeatState): HeatState => ({
  gauge: 0,
  boostRemaining: HEAT_CONST.BOOST_DURATION,
  boostPower: HEAT_CONST.BOOST_POWER,
  cooldown: HEAT_CONST.COOLDOWN,
});

export const Heat = {
  initState: initHeatState,
  update: updateHeat,
  activate: activateBoost,
  getBoost: getHeatBoost,
};
