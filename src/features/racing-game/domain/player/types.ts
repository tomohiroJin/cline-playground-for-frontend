// Player ドメイン型定義

import type { CardEffect } from '../card/types';

/** ドリフト状態 */
export interface DriftState {
  active: boolean;
  duration: number;
  slipAngle: number;
  boostRemaining: number;
  boostPower: number;
}

/** HEAT 状態 */
export interface HeatState {
  gauge: number;
  boostRemaining: number;
  boostPower: number;
  cooldown: number;
}

/** プレイヤーの不変な識別情報 */
export interface PlayerIdentity {
  readonly name: string;
  readonly color: string;
  readonly isCpu: boolean;
}

/** プレイヤーの可変な状態（移行期間中は mutable を維持） */
export interface PlayerState {
  x: number;
  y: number;
  angle: number;
  speed: number;
  wallStuck: number;
  lap: number;
  checkpointFlags: number;
  lapTimes: number[];
  lapStart: number;
  progress: number;
  lastSeg: number;
  drift: DriftState;
  heat: HeatState;
  activeCards: CardEffect[];
  shieldCount: number;
}

/** Player = Identity + State */
export type Player = PlayerIdentity & PlayerState;
