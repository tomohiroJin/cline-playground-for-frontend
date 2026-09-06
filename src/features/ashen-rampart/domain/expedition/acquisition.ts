/**
 * 灰燼の城壁 - 獲得（反復6・設計書 §4.1 / §5.5）
 *
 * ステージ間に3択から1枚を選ぶ。デッキは 12 → 13 → 14 と育つ。
 *
 * **選ばなかった2枚は `card_acquired` に記録する**（設計書 §9.1）。
 * 選択の情報量は「何を取ったか」ではなく **「何を捨てたか」** の側にあり、
 * 判定項目2b（獲得が判断だったか）はその情報を使う。
 */
import type { RandomFn } from '../shared/random';
import { ACQUIRABLE_CARD_IDS, maxCopiesOf } from '../cards/card-pool';

/** 獲得の選択肢の枚数 */
export const OFFER_SIZE = 3;

/**
 * 獲得の3択を作る
 *
 * 同名上限まで持っている札は候補から外す。
 * 候補が `OFFER_SIZE` に満たない場合はあるだけ返す（例外にしない）——
 * デッキを上限まで埋め尽くすのは正当なプレイであり、
 * そこで遠征が止まるべきではない。
 *
 * rng は**候補を1枚選ぶごとに1回**引く。
 */
export const buildOffer = (deckCards: readonly string[], rng: RandomFn): string[] => {
  const owned = new Map<string, number>();
  deckCards.forEach((id) => owned.set(id, (owned.get(id) ?? 0) + 1));

  const candidates = ACQUIRABLE_CARD_IDS.filter(
    (id) => (owned.get(id) ?? 0) < maxCopiesOf(id)
  );

  const remaining = [...candidates];
  const offer: string[] = [];
  while (offer.length < OFFER_SIZE && remaining.length > 0) {
    const index = Math.min(remaining.length - 1, Math.floor(rng() * remaining.length));
    const [picked] = remaining.splice(index, 1);
    if (picked !== undefined) offer.push(picked);
  }
  return offer;
};

/** 3択から1枚を選んでデッキに加える。提示に無い札は契約違反 */
export const applyAcquisition = (
  deckCards: readonly string[],
  offer: readonly string[],
  cardId: string
): string[] => {
  if (!offer.includes(cardId)) {
    throw new Error(`提示されていないカードです: ${cardId}`);
  }
  return [...deckCards, cardId];
};
