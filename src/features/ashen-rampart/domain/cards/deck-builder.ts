/**
 * 灰燼の城壁 - デッキ構築の検証（純粋）
 *
 * UI（構築画面）と CI（バランステスト）の両方がここを使う。
 * UI 側でだけ検証すると「テストは通るが UI で組めないデッキ」が生まれる。
 */
import { CARD_IDS, DECK_SIZE, MAX_COPIES, getCardDefinition } from './card-pool';

export interface DeckValidation {
  isValid: boolean;
  /** 違反の内容（複数ある場合はすべて列挙する） */
  errors: string[];
}

/** カードごとの枚数 */
export const countByCard = (cards: readonly string[]): Map<string, number> => {
  const counts = new Map<string, number>();
  cards.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
  return counts;
};

/** コストごとの枚数。未知のカードは無視する（検証は validateDeck の責務） */
export const costCurve = (cards: readonly string[]): Map<number, number> => {
  const curve = new Map<number, number>();
  cards.forEach((id) => {
    if (!CARD_IDS.includes(id)) return;
    const cost = getCardDefinition(id).cost;
    curve.set(cost, (curve.get(cost) ?? 0) + 1);
  });
  return curve;
};

/** デッキが構築規則を満たすか。満たさない場合は理由をすべて返す */
export const validateDeck = (cards: readonly string[]): DeckValidation => {
  const errors: string[] = [];

  if (cards.length !== DECK_SIZE) {
    errors.push(`デッキは${DECK_SIZE}枚ちょうどにしてください（現在${cards.length}枚）`);
  }

  const unknown = cards.filter((id) => !CARD_IDS.includes(id));
  [...new Set(unknown)].forEach((id) => {
    errors.push(`未知のカードが含まれています: ${id}`);
  });

  countByCard(cards).forEach((count, id) => {
    if (count <= MAX_COPIES) return;
    const name = CARD_IDS.includes(id) ? getCardDefinition(id).name : id;
    errors.push(`${name}が${count}枚あります（同名は${MAX_COPIES}枚まで）`);
  });

  return { isValid: errors.length === 0, errors };
};
