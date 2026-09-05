import { startExpedition, startStage } from './start-expedition';
import { PRESET_DECKS, DECK_SIZE } from '../../domain/cards/card-pool';
import { INITIAL_HAND_SIZE } from '../../domain/cards/deck';
import { LIFE_INITIAL } from '../../domain/combat/combat-state';
import { currentStage, completeStage } from '../../domain/expedition/expedition-state';
import { ACQUIRED_INSERT_OFFSET } from './start-expedition';

const preset = PRESET_DECKS.swift.cards;

describe('startExpedition', () => {
  it('3ステージが層1→2→3 の順に決まる', () => {
    const exp = startExpedition(preset, 42);
    expect(exp.stages.map((s) => s.tier)).toEqual([1, 2, 3]);
  });

  it('同じシードからは同じ遠征（決定的）', () => {
    const a = startExpedition(preset, 42);
    const b = startExpedition(preset, 42);
    expect(a.stages.map((s) => s.id)).toEqual(b.stages.map((s) => s.id));
  });

  it('シードが違えば少なくとも一部のシードで別の並びになる', () => {
    const combos = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      combos.add(startExpedition(preset, seed).stages.map((s) => s.id).join('|'));
    }
    expect(combos.size).toBeGreaterThan(1);
  });

  it('構築規則を満たさないデッキは契約違反', () => {
    expect(() => startExpedition(['reactor'], 1)).toThrow('デッキが構築規則を満たしていません');
  });
});

describe('startStage', () => {
  it('現在のステージの台本で戦闘状態を作る', () => {
    const exp = startExpedition(preset, 42);
    const combat = startStage(exp);
    expect(combat.waves).toHaveLength(currentStage(exp)!.waves.length);
  });

  it('遠征のライフで始まる（持ち越し）', () => {
    let exp = startExpedition(preset, 42);
    exp = completeStage(exp, { won: true, lifeLeft: 5 });
    // offer フェーズだが、startStage は次ステージの戦闘を作れる
    expect(startStage(exp).life).toBe(exp.life);
    expect(exp.life).toBeLessThan(LIFE_INITIAL);
  });

  it('山札は デッキ枚数 − 初期手札 で始まる', () => {
    const combat = startStage(startExpedition(preset, 42));
    expect(combat.deck.drawPile).toHaveLength(DECK_SIZE - INITIAL_HAND_SIZE);
  });

  it('同じ遠征・同じステージなら毎回同じシャッフル（決定的）', () => {
    const exp = startExpedition(preset, 42);
    expect(startStage(exp).deck.drawPile).toEqual(startStage(exp).deck.drawPile);
  });

  it('獲得しても初期手札は変わらない（基底のシャッフルを共有する）', () => {
    const base = startExpedition(preset, 42);
    const withCard = { ...base, deckCards: [...base.deckCards, 'beacon'], acquired: ['beacon'] };
    expect(startStage(withCard).deck.hand).toEqual(startStage(base).deck.hand);
  });

  it('獲得した札は山札に入り、末尾から ACQUIRED_INSERT_OFFSET の位置にある', () => {
    const base = startExpedition(preset, 42);
    const withCard = { ...base, deckCards: [...base.deckCards, 'beacon'], acquired: ['beacon'] };
    const pile = startStage(withCard).deck.drawPile;
    expect(pile).toContain('beacon');
    expect(pile).toHaveLength(base.deckCards.length + 1 - INITIAL_HAND_SIZE);
    expect(pile[pile.length - 1 - ACQUIRED_INSERT_OFFSET]).toBe('beacon');
  });

  it('獲得札を除いた山札の並びは、獲得していない場合と一致する', () => {
    const base = startExpedition(preset, 42);
    const withCard = { ...base, deckCards: [...base.deckCards, 'beacon'], acquired: ['beacon'] };
    const withoutAcquired = startStage(withCard).deck.drawPile.filter((_, i, arr) =>
      i !== arr.length - 1 - ACQUIRED_INSERT_OFFSET
    );
    expect(withoutAcquired).toEqual(startStage(base).deck.drawPile);
  });

  it('ステージが違えばシャッフルも違う', () => {
    const exp = startExpedition(preset, 42);
    const first = startStage(exp).deck.drawPile;
    const second = startStage(completeStage(exp, { won: true, lifeLeft: 9 })).deck.drawPile;
    expect(second).not.toEqual(first);
  });

  it('終了した遠征では契約違反', () => {
    const ended = completeStage(startExpedition(preset, 42), { won: false, lifeLeft: 0 });
    expect(() => startStage(ended)).toThrow('挑むステージがありません');
  });
});
