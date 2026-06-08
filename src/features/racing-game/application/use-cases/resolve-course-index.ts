// 分岐ステージのコース index を解決する純粋関数
//
// start-campaign-stage から分離（CLAUDE.md「ユースケースは1ファイル1関数の単一責任」）。
// テスト容易性のため独立した関数として公開する。

import type { Stage } from '../../domain/race/stage';

/**
 * 分岐ステージで使うコース index を解決する純粋関数。
 *
 * 優先順位:
 * 1. `stage.courseIndex` が定義されていればそれを使う（通常ステージ）
 * 2. `stage.branch` があれば `chosenBranch` 側のコース（既定 'a'）
 * 3. どちらも無いケースは assertValidStage で弾かれる仕様だが、防御として 0
 *
 * F1 対応: 旧実装の `stage.courseIndex ?? 0` だと分岐ステージで Forest に
 * フォールバックしていたため、Stage 3/5/8 が Stage 1 と見た目が同じになっていた。
 */
export const resolveCourseIndex = (
  stage: Stage,
  chosenBranch: 'a' | 'b' = 'a',
): number => {
  if (stage.courseIndex !== undefined) return stage.courseIndex;
  if (stage.branch) return stage.branch[chosenBranch].courseIndex;
  return 0;
};
