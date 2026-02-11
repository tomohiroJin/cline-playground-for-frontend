import { SCORE_TABLE } from '../constants';

/**
 * ループ倍率を考慮したスコアを返す。
 */
export function applyLoopScore(base: number, loop: number): number {
  const safeLoop = Math.max(1, Math.floor(loop));
  return Math.floor(base * safeLoop);
}

/**
 * 元実装の主要イベントに対応するスコア計算を提供する。
 */
export function scoreForEvent(
  event:
    | 'cave-key'
    | 'cave-set'
    | 'cave-clear'
    | 'grass-kill'
    | 'grass-slash'
    | 'grass-combo'
    | 'grass-clear'
    | 'boss-gem'
    | 'boss-counter'
    | 'boss-shield'
    | 'boss-clear',
  loop: number
): number {
  switch (event) {
    case 'cave-key':
      return applyLoopScore(SCORE_TABLE.CAVE_KEY, loop);
    case 'cave-set':
      return applyLoopScore(SCORE_TABLE.CAVE_SET, loop);
    case 'cave-clear':
      return applyLoopScore(SCORE_TABLE.CAVE_CLEAR, loop);
    case 'grass-kill':
      return applyLoopScore(SCORE_TABLE.GRASS_KILL, loop);
    case 'grass-slash':
      return applyLoopScore(SCORE_TABLE.GRASS_SLASH, loop);
    case 'grass-combo':
      return applyLoopScore(SCORE_TABLE.GRASS_COMBO, loop);
    case 'grass-clear':
      return applyLoopScore(SCORE_TABLE.GRASS_CLEAR, loop);
    case 'boss-gem':
      return applyLoopScore(SCORE_TABLE.BOSS_GEM, loop);
    case 'boss-counter':
      return applyLoopScore(SCORE_TABLE.BOSS_COUNTER, loop);
    case 'boss-shield':
      return applyLoopScore(SCORE_TABLE.BOSS_SHIELD, loop);
    case 'boss-clear':
      return applyLoopScore(SCORE_TABLE.BOSS_CLEAR, loop);
    default:
      return 0;
  }
}

/**
 * ノーダメージボーナスを返す。
 */
export function scoreNoDamageBonus(loop: number, enabled: boolean): number {
  if (!enabled) {
    return 0;
  }
  return applyLoopScore(SCORE_TABLE.NO_DAMAGE_BONUS, loop);
}
