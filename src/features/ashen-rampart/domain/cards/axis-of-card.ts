/**
 * 灰燼の城壁 - カード定義から要求軸を判定する（純粋・葉モジュール）
 *
 * **ここが「どの札がどの軸を持つか」の唯一の場所である。**
 * `stage-definition.ts` の `axesOf`（ID 受け取り）も、`knockout-cards.ts` の
 * 変種導出も、この関数を通す。判定述語を2箇所に書くと必ずずれる。
 *
 * **`card-pool` を import してはならない。** import すると
 * `card-pool → knockout-cards → axis-of-card → card-pool` の循環ができ、
 * `CARD_MAP` がトップレベルで評価される都合で、入り口順によっては
 * 本番バンドルだけが起動不能になる（設計書 §8.2.15(m)）。
 *
 * **`anti-air` と `mass-answer` は「フィールドの有無」ではなく「値が正か」で判定する。**
 * ノックアウトは能力を消すのにフィールドを削除せず 0 を書き込むためである
 * （落網の `groundedTicks` を削除すると `applyTraps` の対象極性が反転する。§8.2.15(a)1）。
 * 現行プールでは挙動が変わらない（落網 120 > 0、業火 2 > 0）。
 */
import type { CardDefinition } from './card-definition';

/**
 * ステージが要求する軸
 *
 * **デッキ述語で表せるものだけを列挙する。** 「摩耗」「優先撃破」「配分」「持久」は
 * 較正ハーネスで測れない（設計書 §7.1）ので、ここには入れない。
 * とくに優先撃破は**プレイヤーに標的を選ぶ操作が存在しない**ため要求できない。
 */
export type DemandAxis = 'block' | 'anti-air' | 'mass-answer' | 'heavy-hit';

/** 全軸。監査と導出が同じ順序で回すための単一の定義 */
export const DEMAND_AXES: readonly DemandAxis[] = ['block', 'anti-air', 'mass-answer', 'heavy-hit'];

/** block とみなす守り手のHP下限。石壁(60)だけが通り、弓兵(8)などは通らない */
export const BLOCK_HP_THRESHOLD = 40;

/** heavy-hit とみなす1発のダメージ下限。火砲台(12)がちょうど通り、弩砲(9)は通らない */
export const HEAVY_HIT_DAMAGE_THRESHOLD = 12;

/** そのカードが満たす要求軸 */
export const axesOfCard = (card: CardDefinition): readonly DemandAxis[] => {
  const tower = card.tower;
  const axes: DemandAxis[] = [];

  if (tower && tower.hp >= BLOCK_HP_THRESHOLD) axes.push('block');
  if ((tower?.hitsFlying ?? false) || (card.trap?.groundedTicks ?? 0) > 0) axes.push('anti-air');
  if (
    (tower && (tower.splashRadius > 0 || tower.piercing === true)) ||
    (card.ember?.radius ?? 0) > 0
  ) {
    axes.push('mass-answer');
  }
  if (tower && tower.damage >= HEAVY_HIT_DAMAGE_THRESHOLD) axes.push('heavy-hit');

  return axes;
};
