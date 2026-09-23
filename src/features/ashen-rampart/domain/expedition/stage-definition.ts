/**
 * 灰燼の城壁 - ステージ定義（反復6・設計書 §4.3 / §5.2）
 *
 * 難度カーブを「層の易しさ」ではなく **同時に満たすべき軸の本数** で作る。
 * 段階0 の実測で、易しく作った層では経路外のみ戦略が 20/20 勝ってしまい、
 * 宣言した要求軸がどれも成立していなかった（設計書 §2.5(e)）。
 * **易しい層は「何を置いても勝てる」＝支配戦略の成立する場所になる。**
 */
import type { StageMap } from '../board/stage-map';
import type { WaveDefinition } from '../combat/waves';
import { getCardDefinition } from '../cards/card-pool';
import { axesOfCard, type DemandAxis } from '../cards/axis-of-card';

export type StageTier = 1 | 2 | 3;

/**
 * ステージが要求する軸
 *
 * **定義の実体は `domain/cards/axis-of-card.ts` にある。** ここは再エクスポートで、
 * 既存の `import { axesOf, type DemandAxis } from './stage-definition'` を壊さないため。
 * 実体を `domain/cards/` へ置いたのは、`knockout-cards.ts`（`domain/cards/`）が
 * 同じ判定述語を使う必要があり、`domain/cards/` から `domain/expedition/` を
 * 参照するとモジュール循環になるため（設計書 §8.2.15(m)）。
 */
export type { DemandAxis };
export { DEMAND_AXES, BLOCK_HP_THRESHOLD, HEAVY_HIT_DAMAGE_THRESHOLD } from '../cards/axis-of-card';

export interface StageDefinition {
  id: string;
  name: string;
  tier: StageTier;
  map: StageMap;
  waves: readonly WaveDefinition[];
  /** 層1 は1本、層2 は2本、層3 は3本 */
  demands: readonly DemandAxis[];
}

/**
 * そのカードが満たす要求軸
 *
 * カード定義から導く（ID の直書きにしない）ので、段階B で追加する
 * 新カードも自動で拾われる。
 */
export const axesOf = (cardId: string): readonly DemandAxis[] =>
  axesOfCard(getCardDefinition(cardId));
