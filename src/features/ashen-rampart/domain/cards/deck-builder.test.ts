/**
 * デッキ構築の検証のテスト
 *
 * 検証をドメインに置く理由: UI 側でだけ検証すると、テストが通るのに
 * UI で組めないデッキ（またはその逆）が生まれる。唯一の真実をここに置く。
 */
import { validateDeck, countByCard, costCurve, validateRuntimeDeck, RUNTIME_DECK_MAX } from './deck-builder';
import { DECK_SIZE, MAX_COPIES, maxCopiesOf } from './card-pool';

const repeat = (id: string, n: number): string[] => Array.from({ length: n }, () => id);

/** DECK_SIZE 枚ちょうど・同名3枚以内の妥当なデッキ */
const validCards = [
  ...repeat('reactor', 3),
  ...repeat('arrow-tower', 3),
  ...repeat('ballista', 3),
  ...repeat('cannon-tower', 3),
];

describe('validateDeck', () => {
  it('DECK_SIZE 枚ちょうど・同名3枚以内なら妥当', () => {
    expect(validCards).toHaveLength(DECK_SIZE);
    const result = validateDeck(validCards);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('枚数が足りないと不正で、必要枚数がエラーに出る', () => {
    const result = validateDeck(validCards.slice(0, DECK_SIZE - 1));
    expect(result.isValid).toBe(false);
    expect(result.errors.join()).toContain(String(DECK_SIZE));
  });

  it('枚数が多いと不正', () => {
    const result = validateDeck([...validCards, 'beacon']);
    expect(result.isValid).toBe(false);
  });

  it('同名が上限を超えると不正で、カード名がエラーに出る', () => {
    const tooMany = [
      ...repeat('arrow-tower', MAX_COPIES + 1),
      ...repeat('reactor', 3),
      ...repeat('ballista', 3),
      ...repeat('cannon-tower', 2),
    ];
    expect(tooMany).toHaveLength(DECK_SIZE);
    const result = validateDeck(tooMany);
    expect(result.isValid).toBe(false);
    expect(result.errors.join()).toContain('弓兵');
  });

  it('未知のカードIDが含まれると不正', () => {
    const result = validateDeck([...validCards.slice(0, DECK_SIZE - 1), 'unknown-card']);
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
    // reactor=0, arrow-tower=1, ballista=2
    const curve = costCurve(['reactor', 'arrow-tower', 'arrow-tower', 'ballista']);
    expect(curve.get(0)).toBe(1);
    expect(curve.get(1)).toBe(2);
    expect(curve.get(2)).toBe(1);
  });

  it('未知のカードは無視する（検証は validateDeck の責務）', () => {
    expect(costCurve(['unknown']).size).toBe(0);
  });
});

describe('カード別の同名上限', () => {
  // 反復6 で魔力炉の同名上限の例外を外した（card-pool.test.ts の
  // 「同名上限に例外を持つカードは無い」も参照）。以下の2本はそれぞれの
  // 向きを個別に検査する: 魔力炉自身が上限を超えると不正になること、
  // 魔力炉以外は従来どおり上限に縛られること。
  it('魔力炉も MAX_COPIES を超えると不正になる（反復6 で例外を外した）', () => {
    const cards = [
      ...repeat('reactor', MAX_COPIES + 1),
      ...repeat('arrow-tower', 3),
      ...repeat('cannon-tower', 3),
      ...repeat('spike-trap', 2),
    ];
    expect(cards).toHaveLength(DECK_SIZE);
    const result = validateDeck(cards);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('魔力炉'))).toBe(true);
  });

  it('魔力炉以外は従来どおり3枚までに制限される', () => {
    const cards = [
      ...repeat('arrow-tower', 4),
      ...repeat('reactor', 3),
      ...repeat('cannon-tower', 3),
      ...repeat('spike-trap', 2),
    ];
    expect(cards).toHaveLength(DECK_SIZE);
    const result = validateDeck(cards);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('弓兵'))).toBe(true);
  });

  it('maxCopiesOf はどのカードも MAX_COPIES を返す（反復6 で魔力炉の例外を外した）', () => {
    expect(maxCopiesOf('reactor')).toBe(MAX_COPIES);
    expect(maxCopiesOf('arrow-tower')).toBe(MAX_COPIES);
  });
});

describe('入手経路の検査（反復6・設計書 §5.5）', () => {
  it('retired なカード（徴発）が混ざると不正で、理由がエラーに出る', () => {
    const cards = [
      'levy',
      ...repeat('reactor', 3),
      ...repeat('arrow-tower', 3),
      ...repeat('ballista', 3),
      ...repeat('cannon-tower', 2),
    ];
    expect(cards).toHaveLength(DECK_SIZE);
    const result = validateDeck(cards);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('徴発') && e.includes('入れられません'))).toBe(
      true
    );
  });

  it('buildable なカードだけのデッキは入手経路のエラーを出さない', () => {
    expect(validateDeck(validCards).errors).toEqual([]);
  });
});

describe('validateRuntimeDeck（反復6・遠征中のデッキ）', () => {
  /** 同名上限を守りながら n 枚のデッキを作る */
  const base = (n: number): string[] => {
    const pool = ['reactor', 'arrow-tower', 'ballista', 'stone-wall', 'cannon-tower', 'beacon'];
    const cards: string[] = [];
    pool.forEach((id) => {
      while (cards.length < n && cards.filter((c) => c === id).length < maxCopiesOf(id)) {
        cards.push(id);
      }
    });
    return cards;
  };

  it('組み立てヘルパが要求どおりの枚数を返す（テスト自身の前提）', () => {
    expect(base(DECK_SIZE)).toHaveLength(DECK_SIZE);
    expect(base(RUNTIME_DECK_MAX + 1)).toHaveLength(RUNTIME_DECK_MAX + 1);
  });

  it('DECK_SIZE ちょうどは通る', () => {
    expect(validateRuntimeDeck(base(DECK_SIZE)).isValid).toBe(true);
  });

  it('獲得で増えた DECK_SIZE + 1 と RUNTIME_DECK_MAX も通る', () => {
    expect(validateRuntimeDeck(base(DECK_SIZE + 1)).isValid).toBe(true);
    expect(validateRuntimeDeck(base(RUNTIME_DECK_MAX)).isValid).toBe(true);
  });

  it('RUNTIME_DECK_MAX を1枚超えたら弾く（境界）', () => {
    expect(validateRuntimeDeck(base(RUNTIME_DECK_MAX + 1)).isValid).toBe(false);
  });

  it('DECK_SIZE を1枚下回ったら弾く（境界）', () => {
    expect(validateRuntimeDeck(base(DECK_SIZE - 1)).isValid).toBe(false);
  });

  it('同名上限は実行時も守る', () => {
    const over = [...base(DECK_SIZE), 'arrow-tower'];
    expect(over.filter((c) => c === 'arrow-tower').length).toBeGreaterThan(
      maxCopiesOf('arrow-tower')
    );
    expect(validateRuntimeDeck(over).isValid).toBe(false);
  });

  it('未知のカードは弾く', () => {
    expect(validateRuntimeDeck([...base(DECK_SIZE - 1), 'no-such-card']).isValid).toBe(false);
  });

  it('RUNTIME_DECK_MAX は DECK_SIZE + 2（獲得2回ぶん）', () => {
    expect(RUNTIME_DECK_MAX).toBe(DECK_SIZE + 2);
  });
});
