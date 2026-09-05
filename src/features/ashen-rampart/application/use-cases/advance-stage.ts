/**
 * 灰燼の城壁 - ステージの決着を遠征へ反映する（反復6）
 *
 * 勝って次のステージがあるときだけ、獲得の3択を抽選して載せる。
 * 抽選の派生シードの添字は**獲得の回数**（0 始まり）であって
 * ステージの添字ではない——踏破まで行くと獲得は2回なので、
 * 添字は 0 と 1 になる。
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

  const offerIndex = completed.acquired.length;
  const offerRandom = new SeededRandom(derivedSeed(completed.seed, 'offer', offerIndex));
  return presentOffer(completed, buildOffer(completed.deckCards, () => offerRandom.random()));
};
