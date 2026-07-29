/**
 * ラン開始のテスト
 *
 * 乱数はここでのシャッフル1回だけに閉じ込める。同じシードからは
 * 同じドロー順になり、事故と判断を事後に切り分けられる（設計書 §12.4）。
 */
import { startRun } from './start-run';
import { SeededRandom } from '../../infrastructure/random/seeded-random';
import { DECK_SIZE } from '../../domain/cards/card-pool';
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
    expect(countReactor(all(swift))).toBe(2);
    expect(countReactor(all(heavy))).toBe(3);
  });

  it('未知のプリセットIDは契約違反として例外', () => {
    expect(() => startRun('unknown', new SeededRandom(1))).toThrow(
      '未知のプリセットデッキです: unknown'
    );
  });
});
