// 後方互換性のため domain/ からの re-export
// 実装は domain/scoring.ts と domain/style-merge.ts に移行
export { clamp } from '../../../utils/math-utils';
export {
  computeRank,
  comboMult,
  calcEffBf,
  visLabel,
  wPick,
  computePoints,
  computeStageBonus,
  buildSummary,
  isAdjacentTo,
} from '../domain/scoring';
export { mergeStyles } from '../domain/style-merge';
