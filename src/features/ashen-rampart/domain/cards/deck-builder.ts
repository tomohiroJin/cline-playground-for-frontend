/**
 * 灰燼の城壁 - デッキ構築の検証（純粋）
 *
 * UI（構築画面）と CI（バランステスト）の両方がここを使う。
 * UI 側でだけ検証すると「テストは通るが UI で組めないデッキ」が生まれる。
 */
import { CARD_IDS, DECK_SIZE, maxCopiesOf, getCardDefinition, availabilityOf } from './card-pool';

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

/**
 * 未知のカードが含まれていれば errors に追加する（非公開ヘルパ）
 *
 * validateDeck と validateRuntimeDeck で共有。
 */
const pushUnknownCardErrors = (cards: readonly string[], errors: string[]): void => {
  const unknown = cards.filter((id) => !CARD_IDS.includes(id));
  [...new Set(unknown)].forEach((id) => {
    errors.push(`未知のカードが含まれています: ${id}`);
  });
};

/**
 * 同名上限を超えたカードがあれば errors に追加する（非公開ヘルパ）
 *
 * validateDeck と validateRuntimeDeck で共有。
 * エラー文言は呼び出し側が異なるため、formatError で指定させる。
 */
const pushCopyLimitErrors = (
  cards: readonly string[],
  errors: string[],
  formatError: (name: string, count: number, limit: number) => string
): void => {
  countByCard(cards).forEach((count, id) => {
    if (!CARD_IDS.includes(id)) return;
    const limit = maxCopiesOf(id);
    if (count <= limit) return;
    const name = getCardDefinition(id).name;
    errors.push(formatError(name, count, limit));
  });
};

/** デッキが構築規則を満たすか。満たさない場合は理由をすべて返す */
export const validateDeck = (cards: readonly string[]): DeckValidation => {
  const errors: string[] = [];

  if (cards.length !== DECK_SIZE) {
    errors.push(`デッキは${DECK_SIZE}枚ちょうどにしてください（現在${cards.length}枚）`);
  }

  pushUnknownCardErrors(cards, errors);
  pushCopyLimitErrors(
    cards,
    errors,
    (name, count, limit) => `${name}が${count}枚あります（同名は${limit}枚まで）`
  );

  // 構築で選べない札が混ざっていないか（反復6・設計書 §5.5）
  //
  // UI で隠すだけでは startRunWithDeck に獲得専用札のデッキを渡せてしまう。
  // 「テストは通るが UI で組めないデッキ」を作らないため、ここで弾く。
  [...new Set(cards)].forEach((id) => {
    if (!CARD_IDS.includes(id)) return;
    const availability = availabilityOf(id);
    if (availability === 'buildable') return;
    const name = getCardDefinition(id).name;
    errors.push(
      availability === 'acquire-only'
        ? `${name}は遠征中の獲得でしか手に入りません`
        : `${name}は現在デッキに入れられません`
    );
  });

  return { isValid: errors.length === 0, errors };
};

/**
 * 遠征中に許されるデッキの最大枚数（反復6・設計書 §4.3）
 *
 * 獲得は2回なので DECK_SIZE + 2 が上限。
 */
export const RUNTIME_DECK_MAX = DECK_SIZE + 2;

/**
 * ステージ開始時のデッキ検証（反復6・設計書 §4.3）
 *
 * `validateDeck` は**構築時**の規則で、枚数が `DECK_SIZE` ちょうどであることを要求する。
 * 遠征では獲得でデッキが 12 → 13 → 14 と育つため、
 * **ステージ開始でこれを呼ぶと層2 で必ず例外になる**（初版の設計はここで落ちた）。
 *
 * 実行時に守るべきなのは「既知の札」「同名上限」「枚数が範囲内」だけである。
 * **入手経路は検査しない**——獲得専用の札は正当にデッキへ入るため。
 */
export const validateRuntimeDeck = (cards: readonly string[]): DeckValidation => {
  const errors: string[] = [];

  if (cards.length < DECK_SIZE || cards.length > RUNTIME_DECK_MAX) {
    errors.push(
      `遠征中のデッキは${DECK_SIZE}〜${RUNTIME_DECK_MAX}枚です（現在${cards.length}枚）`
    );
  }

  pushUnknownCardErrors(cards, errors);
  pushCopyLimitErrors(
    cards,
    errors,
    (name, count, limit) => `${name}は${limit}枚までです（現在${count}枚）`
  );

  return { isValid: errors.length === 0, errors };
};
