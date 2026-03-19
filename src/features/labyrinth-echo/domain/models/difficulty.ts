/**
 * 迷宮の残響 - Difficulty 値オブジェクト
 *
 * 難易度定義を表現するイミュータブルな値オブジェクト。
 */

/** 難易度ID */
export type DifficultyId = 'easy' | 'normal' | 'hard' | 'abyss';

/** 難易度による修正値 */
export interface DifficultyModifiers {
  readonly hpMod: number;
  readonly mnMod: number;
  readonly drainMod: number;
  readonly dmgMult: number;
}

/** 難易度によるKP報酬 */
export interface DifficultyRewards {
  readonly kpOnDeath: number;
  readonly kpOnWin: number;
}

/** 難易度定義（イミュータブル） */
export interface DifficultyDef {
  readonly id: DifficultyId;
  readonly name: string;
  readonly subtitle: string;
  readonly color: string;
  readonly icon: string;
  readonly description: string;
  readonly modifiers: DifficultyModifiers;
  readonly rewards: DifficultyRewards;
}
