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
import { validateDeck } from './deck-builder';

describe('カードプール', () => {
  it('カードは14種ある', () => {
    expect(CARD_IDS).toHaveLength(14);
  });

  it('弓兵の塔は地上のみで DPS 0.75 になる数値を持つ', () => {
    const card = getCardDefinition('arrow-tower');
    expect(card.cost).toBe(2);
    expect(card.tower?.damage).toBe(6);
    expect(card.tower?.cooldownTicks).toBe(8);
    expect(card.tower?.hitsFlying).toBe(false);
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

describe('反復1で追加したカード', () => {
  it('カードは14種ある', () => {
    expect(CARD_IDS).toHaveLength(14);
  });

  it('落網は飛行を地上化する罠（ダメージなし）', () => {
    const card = getCardDefinition('snare-net');
    expect(card.cost).toBe(2);
    expect(card.type).toBe('trap');
    expect(card.trap?.damage).toBe(0);
    expect(card.trap?.uses).toBe(3);
    expect(card.trap?.groundedTicks).toBe(120);
    expect(card.trap?.stunTicks).toBeUndefined();
  });

  it('石壁は地上を足止めする罠（ダメージなし）', () => {
    const card = getCardDefinition('stone-wall');
    expect(card.cost).toBe(1);
    expect(card.trap?.damage).toBe(0);
    expect(card.trap?.uses).toBe(3);
    expect(card.trap?.stunTicks).toBe(40);
    expect(card.trap?.groundedTicks).toBeUndefined();
  });

  it('投石機は射程3.0の範囲2で、地上のみ', () => {
    const card = getCardDefinition('catapult');
    expect(card.cost).toBe(3);
    expect(card.tower).toMatchObject({
      range: 3.0,
      damage: 8,
      cooldownTicks: 24,
      splashRadius: 2,
      hitsFlying: false,
    });
  });

  it('徹甲弩は飛行可で、HP40以上に2倍', () => {
    const card = getCardDefinition('piercer');
    expect(card.cost).toBe(3);
    expect(card.tower).toMatchObject({
      range: 1.8,
      damage: 7,
      cooldownTicks: 10,
      splashRadius: 0,
      hitsFlying: true,
      heavyBonusThreshold: 40,
      heavyBonusMultiplier: 2,
    });
  });

  it('徴発は山札の上から3枚を見る即時カード', () => {
    const card = getCardDefinition('levy');
    expect(card.cost).toBe(1);
    expect(card.type).toBe('levy');
    expect(card.levy?.peekCount).toBe(3);
  });

  it('飛行に当たる塔は弩砲と徹甲弩の2種になった（必須枠の解消）', () => {
    const flying = CARD_IDS.filter((id) => getCardDefinition(id).tower?.hitsFlying === true);
    expect(flying.sort()).toEqual(['ballista', 'piercer']);
  });

  it('範囲攻撃を持つ塔は火砲台と投石機の2種になった', () => {
    const splash = CARD_IDS.filter((id) => (getCardDefinition(id).tower?.splashRadius ?? 0) > 0);
    expect(splash.sort()).toEqual(['catapult', 'cannon-tower'].sort());
  });

  it('全14種が既知の配置先種別を持つ', () => {
    CARD_IDS.forEach((id) => {
      expect(['slot', 'path', 'none']).toContain(placementKindOf(getCardDefinition(id)));
    });
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

  it.each(Object.entries(PRESET_DECKS))('%s は構築規則を満たす', (_id, deck) => {
    expect(validateDeck(deck.cards).errors).toEqual([]);
  });
});
