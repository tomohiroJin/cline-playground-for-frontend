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

export type StageTier = 1 | 2 | 3;

/**
 * ステージが要求する軸
 *
 * **デッキ述語で表せるものだけを列挙する。** 「摩耗」「優先撃破」「配分」「持久」は
 * 較正ハーネスで測れない（設計書 §7.1）ので、ここには入れない。
 * とくに優先撃破は**プレイヤーに標的を選ぶ操作が存在しない**ため要求できない。
 */
export type DemandAxis = 'block' | 'anti-air' | 'mass-answer' | 'heavy-hit';

export interface StageDefinition {
  id: string;
  name: string;
  tier: StageTier;
  map: StageMap;
  waves: readonly WaveDefinition[];
  /** 層1 は1本、層2 は2本、層3 は3本 */
  demands: readonly DemandAxis[];
}

/** block とみなす守り手のHP下限。石壁(60)だけが通り、弓兵(8)などは通らない */
const BLOCK_HP_THRESHOLD = 40;
/** heavy-hit とみなす1発のダメージ下限。火砲台(12)がちょうど通り、弩砲(9)は通らない */
const HEAVY_HIT_DAMAGE_THRESHOLD = 12;

/**
 * そのカードが満たす要求軸
 *
 * カード定義から導く（ID の直書きにしない）ので、段階B で追加する
 * 新カードも自動で拾われる。
 */
export const axesOf = (cardId: string): readonly DemandAxis[] => {
  const card = getCardDefinition(cardId);
  const tower = card.tower;
  const axes: DemandAxis[] = [];

  if (tower && tower.hp >= BLOCK_HP_THRESHOLD) axes.push('block');
  if ((tower?.hitsFlying ?? false) || card.trap?.groundedTicks !== undefined) axes.push('anti-air');
  if ((tower && (tower.splashRadius > 0 || tower.piercing === true)) || card.ember !== undefined) {
    axes.push('mass-answer');
  }
  if (tower && tower.damage >= HEAVY_HIT_DAMAGE_THRESHOLD) axes.push('heavy-hit');

  return axes;
};
