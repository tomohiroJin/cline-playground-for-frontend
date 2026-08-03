/**
 * ラン開始のテスト
 *
 * 乱数はここでのシャッフル1回だけに閉じ込める。同じシードからは
 * 同じドロー順になり、事故と判断を事後に切り分けられる（設計書 §12.4）。
 */
import { startRun, startRunWithDeck, createSeed } from './start-run';
import { SeededRandom } from '../../infrastructure/random/seeded-random';
import { DECK_SIZE, PRESET_DECKS } from '../../domain/cards/card-pool';
import { INITIAL_HAND_SIZE } from '../../domain/cards/deck';
import { LIFE_INITIAL, MANA_INITIAL } from '../../domain/combat/combat-state';

describe('startRun', () => {
  it('初期手札3枚と残り山札で開始する', () => {
    const state = startRun('swift', new SeededRandom(1));
    expect(state.deck.hand).toHaveLength(INITIAL_HAND_SIZE);
    expect(state.deck.drawPile).toHaveLength(DECK_SIZE - INITIAL_HAND_SIZE);
    expect(state.deck.graveyard).toEqual([]);
  });

  it('ライフとマナが初期値になる', () => {
    const state = startRun('swift', new SeededRandom(1));
    expect(state.life).toBe(LIFE_INITIAL);
    expect(state.mana).toBe(MANA_INITIAL);
    expect(state.tick).toBe(0);
    expect(state.outcome).toBe('playing');
  });

  it('同じシードからは同じ手札になる（決定性）', () => {
    const a = startRun('swift', new SeededRandom(42));
    const b = startRun('swift', new SeededRandom(42));
    expect(a.deck.hand).toEqual(b.deck.hand);
    expect(a.deck.drawPile).toEqual(b.deck.drawPile);
  });

  it('異なるシードでは並びが変わる', () => {
    const a = startRun('swift', new SeededRandom(1));
    const b = startRun('swift', new SeededRandom(2));
    expect(a.deck.drawPile).not.toEqual(b.deck.drawPile);
  });

  it('プリセットごとに構成が変わる', () => {
    const swift = startRun('swift', new SeededRandom(1));
    const heavy = startRun('heavy', new SeededRandom(1));
    const countReactor = (cards: string[]) => cards.filter((c) => c === 'reactor').length;
    const all = (s: typeof swift) => [...s.deck.hand, ...s.deck.drawPile];
    // Task 13 再較正: 魔力炉のデッキ内上限を撤廃し、両プリセットとも 3→8枚（20枚中40%）へ。
    // MTG の土地比率（42.5%）に寄せた「確実に引くための」マナ基盤である
    expect(countReactor(all(swift))).toBe(8);
    expect(countReactor(all(heavy))).toBe(8);
  });

  it('未知のプリセットIDは契約違反として例外', () => {
    expect(() => startRun('unknown', new SeededRandom(1))).toThrow(
      '未知のプリセットデッキです: unknown'
    );
  });
});

describe('startRunWithDeck', () => {
  const cards = [...PRESET_DECKS.swift!.cards];

  it('任意のカード配列からランを開始できる', () => {
    const state = startRunWithDeck(cards, new SeededRandom(1));
    expect(state.deck.hand).toHaveLength(INITIAL_HAND_SIZE);
    expect(state.deck.drawPile).toHaveLength(cards.length - INITIAL_HAND_SIZE);
  });

  it('同じシードからは同じ手札になる', () => {
    const a = startRunWithDeck(cards, new SeededRandom(7));
    const b = startRunWithDeck(cards, new SeededRandom(7));
    expect(a.deck.hand).toEqual(b.deck.hand);
    expect(a.deck.drawPile).toEqual(b.deck.drawPile);
  });

  it('構築規則を満たさないデッキは契約違反として例外', () => {
    expect(() => startRunWithDeck(cards.slice(0, 19), new SeededRandom(1))).toThrow(
      'デッキが構築規則を満たしていません'
    );
  });

  it('例外メッセージに違反理由が含まれる', () => {
    expect(() => startRunWithDeck(cards.slice(0, 19), new SeededRandom(1))).toThrow(/20/);
  });
});

describe('startRun（既存署名の維持）', () => {
  it('プリセットIDから開始でき、startRunWithDeck と同じ結果になる', () => {
    const viaPreset = startRun('swift', new SeededRandom(3));
    const viaCards = startRunWithDeck([...PRESET_DECKS.swift!.cards], new SeededRandom(3));
    expect(viaPreset.deck.hand).toEqual(viaCards.deck.hand);
  });
});

describe('createSeed', () => {
  it('連続で呼んでも必ず異なる値を返す（同一ミリ秒でも衝突しない）', () => {
    const seeds = Array.from({ length: 50 }, () => createSeed());
    expect(new Set(seeds).size).toBe(50);
  });

  it('正の整数を返す（SeededRandom に渡せる形）', () => {
    const seed = createSeed();
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThan(0);
  });
});
