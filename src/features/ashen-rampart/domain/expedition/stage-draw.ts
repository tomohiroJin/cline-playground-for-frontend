/**
 * 灰燼の城壁 - ステージ抽選（反復6・設計書 §5.2）
 *
 * 各層から1つずつ選ぶので 2×2×2 = 8通りの遠征が成立する。
 * **層で難度を保証しているため、抽選が難度カーブを壊さない。**
 *
 * rng は**層ごとにちょうど1回**引く。消費数が固定であることは
 * 再生可能性の前提である（設計書 §4.4）。
 */
import type { RandomFn } from '../shared/random';
import type { StageDefinition, StageTier } from './stage-definition';
import { stagesOfTier } from './stage-pool';

const TIERS: readonly StageTier[] = [1, 2, 3];

/** 層1→2→3 の順に1つずつ選ぶ */
export const drawStages = (rng: RandomFn): readonly StageDefinition[] =>
  TIERS.map((tier) => {
    const candidates = stagesOfTier(tier);
    const index = Math.min(candidates.length - 1, Math.floor(rng() * candidates.length));
    const stage = candidates[index];
    if (!stage) {
      throw new Error(`層${tier}のステージが定義されていません`);
    }
    return stage;
  });
