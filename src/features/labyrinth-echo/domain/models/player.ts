/**
 * 迷宮の残響 - Player 値オブジェクト
 *
 * プレイヤーの状態を表現するイミュータブルな値オブジェクト。
 */
import { invariant } from '../contracts/invariants';

/** ステータス効果ID（文字列リテラル型） */
export type StatusEffectId = '負傷' | '混乱' | '出血' | '恐怖' | '呪い';

/** プレイヤーのステータス値 */
export interface PlayerStats {
  readonly hp: number;
  readonly maxHp: number;
  readonly mn: number;
  readonly maxMn: number;
  readonly inf: number;
}

/** プレイヤー値オブジェクト（イミュータブル） */
export interface Player extends PlayerStats {
  readonly statuses: readonly StatusEffectId[];
}

/** Player生成時の入力パラメータ */
interface CreatePlayerParams extends PlayerStats {
  readonly statuses?: readonly StatusEffectId[];
}

/**
 * Player値オブジェクトを生成する。
 * @pre hp >= 0 && hp <= maxHp
 * @pre mn >= 0 && mn <= maxMn
 * @pre inf >= 0
 * @pre maxHp > 0 && maxMn > 0
 */
export const createPlayer = (params: CreatePlayerParams): Player => {
  invariant(params.maxHp > 0, 'createPlayer', 'maxHp must be positive');
  invariant(params.maxMn > 0, 'createPlayer', 'maxMn must be positive');
  invariant(params.hp >= 0 && params.hp <= params.maxHp, 'createPlayer', `hp must be 0..maxHp (got ${params.hp})`);
  invariant(params.mn >= 0 && params.mn <= params.maxMn, 'createPlayer', `mn must be 0..maxMn (got ${params.mn})`);
  invariant(params.inf >= 0, 'createPlayer', `inf must be >= 0 (got ${params.inf})`);

  return {
    hp: params.hp,
    maxHp: params.maxHp,
    mn: params.mn,
    maxMn: params.maxMn,
    inf: params.inf,
    statuses: params.statuses ?? [],
  };
};
