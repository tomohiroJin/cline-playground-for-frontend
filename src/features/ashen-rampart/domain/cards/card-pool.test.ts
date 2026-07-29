/**
 * カードプールのテスト
 *
 * 設計書の数値がそのままデータになっていること、プリセットデッキが
 * デッキ規則（20枚・同名3枚まで）を満たすことを検証する。
 */
import {
  getCardDefinition,
  CARD_IDS,
  PRESET_DECKS,
  DECK_SIZE,
  MAX_COPIES,
} from './card-pool';
import { placementKindOf } from './card-definition';

describe('カードプール', () => {
  it('カードは8種ある', () => {
    expect(CARD_IDS).toHaveLength(8);
  });

  it('弓兵の塔は地上のみで DPS 0.75 になる数値を持つ', () => {
    const card = getCardDefinition('arrow-tower');
    expect(card.cost).toBe(2);
    expect(card.tower?.damage).toBe(6);
    expect(card.tower?.cooldownTicks).toBe(8);
    expect(card.tower?.hitsFlying).toBe(false);
  });

  it('弩砲だけが飛行に当たる', () => {
    const flying = CARD_IDS.filter((id) => getCardDefinition(id).tower?.hitsFlying === true);
    expect(flying).toEqual(['ballista']);
  });

  it('魔力炉はコスト0で60tickごとに1マナ生む', () => {
    const card = getCardDefinition('reactor');
    expect(card.cost).toBe(0);
    expect(card.reactor?.intervalTicks).toBe(60);
    expect(card.reactor?.manaPerTick).toBe(1);
  });

  it('業火は半径2・8ダメージ・再起動300tick', () => {
    const card = getCardDefinition('ember-blast');
    expect(card.ember).toEqual({ radius: 2, damage: 8, cooldownTicks: 300 });
  });

  it('未知のカードIDは契約違反として例外', () => {
    expect(() => getCardDefinition('unknown')).toThrow('未知のカードIDです: unknown');
  });

  it('配置先の種別はカード種別から決まる', () => {
    expect(placementKindOf(getCardDefinition('arrow-tower'))).toBe('slot');
    expect(placementKindOf(getCardDefinition('reactor'))).toBe('slot');
    expect(placementKindOf(getCardDefinition('ember-blast'))).toBe('slot');
    expect(placementKindOf(getCardDefinition('spike-trap'))).toBe('path');
    expect(placementKindOf(getCardDefinition('mud-time'))).toBe('none');
  });
});

describe('プリセットデッキ', () => {
  it('2種類ある', () => {
    expect(Object.keys(PRESET_DECKS)).toEqual(['swift', 'heavy']);
  });

  it.each(Object.entries(PRESET_DECKS))('%s は20枚ちょうど', (_id, deck) => {
    expect(deck.cards).toHaveLength(DECK_SIZE);
  });

  it.each(Object.entries(PRESET_DECKS))('%s は同名3枚以内', (_id, deck) => {
    const counts = new Map<string, number>();
    deck.cards.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
    counts.forEach((count) => expect(count).toBeLessThanOrEqual(MAX_COPIES));
  });

  it.each(Object.entries(PRESET_DECKS))('%s は既知のカードだけで構成される', (_id, deck) => {
    deck.cards.forEach((id) => expect(() => getCardDefinition(id)).not.toThrow());
  });
});
