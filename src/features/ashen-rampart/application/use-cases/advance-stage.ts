/**
 * 灰燼の城壁 - ステージの決着を遠征へ反映する（反復6）
 *
 * 勝って次のステージがあるときだけ、獲得の3択を抽選して載せる。
 *
 * **抽選の派生シードの添字は「これまでに提示した回数」であって
 * 「獲得した枚数」ではない。** 以前は獲得回数を添字にしていたが、
 * それだと獲得しない腕（較正の `noAcquire`）は添字が 0 のまま進まず、
 * 1回目と2回目にまったく同じ3択が再提示されてしまう。腕によって
 * 提示の中身そのものが変わると、「同じ提示に対して選び方を変えたら
 * 結果が変わるか」を問う `G1`（設計書 §8.2）の比較が成立しない
 * （Task 15 の完全再生テストが実測で発見した交絡）。
 * `completeStage` は勝つたびに `stageIndex` を進めるので、
 * 提示回数は `stageIndex - 1` で表せる——獲得したかどうかに依存しない。
 */
import { SeededRandom } from '../../infrastructure/random/seeded-random';
import { derivedSeed } from '../../domain/shared/derived-seed';
import { buildOffer } from '../../domain/expedition/acquisition';
import {
  completeStage, presentOffer, type ExpeditionState, type StageResult,
} from '../../domain/expedition/expedition-state';

export const advanceStage = (
  exp: ExpeditionState,
  result: StageResult
): ExpeditionState => {
  const completed = completeStage(exp, result);
  if (completed.phase !== 'offer') return completed;

  const offerIndex = completed.stageIndex - 1;
  const offerRandom = new SeededRandom(derivedSeed(completed.seed, 'offer', offerIndex));
  return presentOffer(completed, buildOffer(completed.deckCards, () => offerRandom.random()));
};
