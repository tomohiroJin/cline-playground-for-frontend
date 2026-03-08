/**
 * チャレンジモードの型定義
 */

/** チャレンジモード固有の状態 */
export interface ChallengeState {
  /** チャレンジID */
  challengeId?: string;
  /** 敵ATK倍率（undefinedなら1.0） */
  enemyAtkMul?: number;
  /** 回復禁止フラグ */
  noHealing?: boolean;
  /** 制限時間（秒、undefinedなら無制限） */
  timeLimit?: number;
  /** タイマー開始時刻（Date.now()、undefinedなら未使用） */
  timerStart?: number;
}

/** チャレンジ修飾子 */
export type ChallengeModifier =
  | { type: 'hp_multiplier'; value: number }
  | { type: 'max_evolutions'; count: number }
  | { type: 'speed_limit'; maxSeconds: number }
  | { type: 'no_healing' }
  | { type: 'enemy_multiplier'; stat: 'atk' | 'hp'; value: number }
  | { type: 'endless' };

/** チャレンジ定義 */
export interface ChallengeDef {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly modifiers: readonly ChallengeModifier[];
}
