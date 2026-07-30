/**
 * デッキ構築の検証のテスト
 *
 * 検証をドメインに置く理由: UI 側でだけ検証すると、テストが通るのに
 * UI で組めないデッキ（またはその逆）が生まれる。唯一の真実をここに置く。
 */
import { validateDeck, countByCard, costCurve } from './deck-builder';
import { DECK_SIZE, MAX_COPIES } from './card-pool';

const repeat = (id: string, n: number): string[] => Array.from({ length: n }, () => id);

/** 20枚ちょうど・同名3枚以内の妥当なデッキ */
const validCards = [
  ...repeat('reactor', 3),
  ...repeat('arrow-tower', 3),
  ...repeat('ballista', 3),
  ...repeat('cannon-tower', 3),
  ...repeat('spike-trap', 3),
  ...repeat('mud-time', 3),
  ...repeat('beacon', 2),
];

describe('validateDeck', () => {
  it('20枚ちょうど・同名3枚以内なら妥当', () => {
    expect(validCards).toHaveLength(DECK_SIZE);
    const result = validateDeck(validCards);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('枚数が足りないと不正で、必要枚数がエラーに出る', () => {
    const result = validateDeck(validCards.slice(0, 19));
    expect(result.isValid).toBe(false);
    expect(result.errors.join()).toContain('20');
  });

  it('枚数が多いと不正', () => {
    const result = validateDeck([...validCards, 'beacon']);
    expect(result.isValid).toBe(false);
  });

  it('同名が上限を超えると不正で、カード名がエラーに出る', () => {
    const tooMany = [...repeat('arrow-tower', MAX_COPIES + 1), ...repeat('reactor', 3), ...repeat('ballista', 3), ...repeat('cannon-tower', 3), ...repeat('spike-trap', 3), ...repeat('mud-time', 3), 'beacon'];
    expect(tooMany).toHaveLength(DECK_SIZE);
    const result = validateDeck(tooMany);
    expect(result.isValid).toBe(false);
    expect(result.errors.join()).toContain('弓兵の塔');
  });

  it('未知のカードIDが含まれると不正', () => {
    const result = validateDeck([...validCards.slice(0, 19), 'unknown-card']);
    expect(result.isValid).toBe(false);
    expect(result.errors.join()).toContain('unknown-card');
  });

  it('空のデッキは不正', () => {
    const result = validateDeck([]);
    expect(result.isValid).toBe(false);
  });

  it('複数の違反があればすべて報告する', () => {
    const result = validateDeck(repeat('arrow-tower', 25));
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe('countByCard', () => {
  it('カードごとの枚数を数える', () => {
    const counts = countByCard(['a', 'b', 'a']);
    expect(counts.get('a')).toBe(2);
    expect(counts.get('b')).toBe(1);
  });

  it('空配列なら空のマップ', () => {
    expect(countByCard([]).size).toBe(0);
  });
});

describe('costCurve', () => {
  it('コストごとの枚数を数える', () => {
    // reactor=0, arrow-tower=2, ballista=3
    const curve = costCurve(['reactor', 'arrow-tower', 'arrow-tower', 'ballista']);
    expect(curve.get(0)).toBe(1);
    expect(curve.get(2)).toBe(2);
    expect(curve.get(3)).toBe(1);
  });

  it('未知のカードは無視する（検証は validateDeck の責務）', () => {
    expect(costCurve(['unknown']).size).toBe(0);
  });
});
