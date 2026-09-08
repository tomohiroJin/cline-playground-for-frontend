/**
 * 灰燼の城壁 - 軸ノックアウトの監査で使う道具（設計書 §8.2.15）
 *
 * `knockout-cards.ts` が「変種を作る」責務、ここが「デッキへ当てる」責務。
 * 分けてあるのは、前者が `card-pool` を import できない葉である必要があるため。
 */
import { KNOCKOUT_CARD_IDS } from '../cards/card-pool';
import { knockoutIdOf } from '../cards/knockout-cards';
import type { DemandAxis } from './stage-definition';

const KNOCKOUT_ID_SET: ReadonlySet<string> = new Set(KNOCKOUT_CARD_IDS);

/**
 * その軸を持つ札を、同じ位置で変種へ差し替える
 *
 * **位置を保つことが要点である。** `createDeck` のシャッフル（Fisher-Yates）は
 * 配列の長さぶんだけ乱数を引き、中身に依存しない。したがって位置を保てば、
 * 同じシードで基準腕とノックアウト腕のシャッフル結果が1対1に対応する。
 * **フィルタして末尾に足す実装にしてはならない**（対応が壊れて陰性対照が成立しなくなる）。
 */
export const knockoutDeck = (cards: readonly string[], axis: DemandAxis): string[] =>
  cards.map((id) => {
    const variantId = knockoutIdOf(axis, id);
    return KNOCKOUT_ID_SET.has(variantId) ? variantId : id;
  });

/**
 * 監査の主要デッキ（全軸充足12枚・設計書 §8.2.15(e)）
 *
 * | 軸 | 提供する札 |
 * |---|---|
 * | block | 石壁×2 |
 * | anti-air | 弩砲×2, 落網×1 |
 * | mass-answer | 火砲台×2 |
 * | heavy-hit | 火砲台×2 |
 *
 * **業火を入れない。** 再点火が `getCardDefinition('ember-blast')` を ID 直書きで
 * 引くため、変種を置いても2回目以降は基礎の半径2・8ダメージに戻る（§8.2.15(a)2）。
 * **徹甲弩を入れない。** `applyPiercingDamage` が飛行を絞らないため、
 * `hitsFlying → false` にしても対空が消えない（§8.2.15(a)5）。
 *
 * 軸を1つも持たない札は 魔力炉×3・棘罠×1・弓兵×1 の計5枚。処置が掛かるのは残り7枚である。
 */
export const AUDIT_FULL_DECK: readonly string[] = [
  'reactor',
  'reactor',
  'reactor',
  'stone-wall',
  'stone-wall',
  'ballista',
  'ballista',
  'cannon-tower',
  'cannon-tower',
  'snare-net',
  'spike-trap',
  'arrow-tower',
];
