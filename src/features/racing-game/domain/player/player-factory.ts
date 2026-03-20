// プレイヤー生成ファクトリ（純粋関数・副作用なし）

import type { Player } from './types';
import type { Point } from '../shared/types';
import { createDriftState } from './drift';
import { createHeatState } from './heat';

/** プレイヤー生成パラメータ */
export interface CreatePlayerConfig {
  readonly x: number;
  readonly y: number;
  readonly angle: number;
  readonly color: string;
  readonly name: string;
  readonly isCpu: boolean;
}

/** 単一プレイヤーの生成 */
export const createPlayer = (config: CreatePlayerConfig): Player => ({
  x: config.x,
  y: config.y,
  angle: config.angle,
  color: config.color,
  name: config.name,
  isCpu: config.isCpu,
  lap: 1,
  checkpointFlags: 0,
  lapTimes: [],
  lapStart: 0,
  speed: 1,
  wallStuck: 0,
  progress: 0,
  lastSeg: -1,
  drift: createDriftState(),
  heat: createHeatState(),
  activeCards: [],
  shieldCount: 0,
});

/** 横並びオフセット距離 */
const SIDE_OFFSET = 18;
/** スタート位置の前方オフセット */
const FORWARD_OFFSET = 30;

/** ゲームモードに応じたプレイヤー群の生成 */
export const createPlayers = (
  mode: 'solo' | '2p' | 'cpu',
  startPoint: Point,
  startAngle: number,
  colors: readonly [string, string],
  names: readonly [string, string],
): Player[] => {
  // 横方向（スタートラインに垂直）の角度
  const perpAngle = startAngle + Math.PI / 2;

  if (mode === 'solo') {
    return [
      createPlayer({
        x: startPoint.x,
        y: startPoint.y - FORWARD_OFFSET,
        angle: startAngle,
        color: colors[0],
        name: names[0],
        isCpu: false,
      }),
    ];
  }

  return [
    createPlayer({
      x: startPoint.x + Math.cos(perpAngle) * SIDE_OFFSET,
      y: startPoint.y + Math.sin(perpAngle) * SIDE_OFFSET - FORWARD_OFFSET,
      angle: startAngle,
      color: colors[0],
      name: names[0],
      isCpu: false,
    }),
    createPlayer({
      x: startPoint.x - Math.cos(perpAngle) * SIDE_OFFSET,
      y: startPoint.y - Math.sin(perpAngle) * SIDE_OFFSET - FORWARD_OFFSET,
      angle: startAngle,
      color: colors[1],
      name: names[1],
      isCpu: mode === 'cpu',
    }),
  ];
};
