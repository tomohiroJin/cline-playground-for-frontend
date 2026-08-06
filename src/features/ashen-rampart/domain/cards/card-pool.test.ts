/**
 * カードプールのテスト
 *
 * 設計書の数値がそのままデータになっていること、プリセットデッキが
 * デッキ規則（20枚・同名上限はカードごと。魔力炉のみ無制限）を満たすことを検証する。
 */
import {
  getCardDefinition,
  CARD_IDS,
  PRESET_DECKS,
  DECK_SIZE,
  maxCopiesOf,
} from './card-pool';
import { placementKindOf } from './card-definition';
import { validateDeck } from './deck-builder';

describe('カードプール', () => {
  it('カードは14種ある', () => {
    expect(CARD_IDS).toHaveLength(14);
  });

  it('弓兵は地上のみで DPS 0.5 になる数値を持つ', () => {
    const card = getCardDefinition('arrow-tower');
    expect(card.cost).toBe(1);
    expect(card.tower?.damage).toBe(4);
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
    // 反復3 Task 8: 設置マスの規則を廃止し、配置先種別を4種に分けた。
    // 業火（ember）は経路に範囲ダメージを落とすカードのため path、魔力炉は
    // コスト0・上限なしで経路に置けると無限の壁になるため reactor（経路外専用）に分離した。
    expect(placementKindOf(getCardDefinition('arrow-tower'))).toBe('unit');
    expect(placementKindOf(getCardDefinition('reactor'))).toBe('reactor');
    expect(placementKindOf(getCardDefinition('ember-blast'))).toBe('path');
    expect(placementKindOf(getCardDefinition('spike-trap'))).toBe('path');
    expect(placementKindOf(getCardDefinition('mud-time'))).toBe('none');
  });
});

describe('反復1で追加したカード', () => {
  it('落網は飛行を地上化する罠（ダメージなし）', () => {
    const card = getCardDefinition('snare-net');
    expect(card.cost).toBe(2);
    expect(card.type).toBe('trap');
    expect(card.trap?.damage).toBe(0);
    expect(card.trap?.uses).toBe(3);
    expect(card.trap?.groundedTicks).toBe(120);
  });

  it('石壁は攻撃しないHP60の守り手', () => {
    const card = getCardDefinition('stone-wall');
    expect(card.cost).toBe(1);
    expect(card.type).toBe('tower');
    expect(card.tower?.hp).toBe(60);
    expect(card.tower?.damage).toBe(0);
    expect(card.trap).toBeUndefined();
  });

  it('投石機は射程3.0の範囲2で、地上のみ', () => {
    const card = getCardDefinition('catapult');
    expect(card.cost).toBe(5);
    expect(card.tower).toMatchObject({
      range: 3.0,
      damage: 18,
      cooldownTicks: 30,
      splashRadius: 2,
      hitsFlying: false,
    });
  });

  it('徹甲弩は飛行可で、貫通する', () => {
    const card = getCardDefinition('piercer');
    expect(card.cost).toBe(4);
    expect(card.tower).toMatchObject({
      range: 1.8,
      damage: 14,
      cooldownTicks: 12,
      splashRadius: 0,
      hitsFlying: true,
      piercing: true,
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
      expect(['unit', 'reactor', 'path', 'none']).toContain(placementKindOf(getCardDefinition(id)));
    });
  });
});

describe('カードの軸（設計書 §7）', () => {
  const towerOf = (id: string) => getCardDefinition(id).tower;

  it('コスト帯が 0〜5 に広がっている', () => {
    const costs = new Set(CARD_IDS.map((id) => getCardDefinition(id).cost));
    [0, 1, 2, 3, 4, 5].forEach((c) => expect(costs.has(c)).toBe(true));
  });

  it('攻撃する守り手が同じコストに4種以上固まっていない', () => {
    const attackers = CARD_IDS
      .map((id) => getCardDefinition(id))
      .filter((c) => c.tower && c.tower.damage > 0);
    const byCost = new Map<number, number>();
    attackers.forEach((c) => byCost.set(c.cost, (byCost.get(c.cost) ?? 0) + 1));
    byCost.forEach((count) => expect(count).toBeLessThan(4));
  });

  it('HPと攻撃力が逆相関している（硬いものほど攻撃力が低い）', () => {
    const units = CARD_IDS
      .map((id) => getCardDefinition(id))
      .filter((c) => c.tower !== undefined && c.type === 'tower');
    const hardest = units.reduce((a, b) => (a.tower!.hp >= b.tower!.hp ? a : b));
    const strongest = units.reduce((a, b) => (a.tower!.damage >= b.tower!.damage ? a : b));
    // 最も硬い守り手（石壁 HP60）は攻撃しない
    expect(hardest.tower!.damage).toBe(0);
    // 最も火力の高い守り手（投石機）は最も硬い守り手より脆い
    expect(strongest.tower!.hp).toBeLessThan(hardest.tower!.hp);
  });

  it('対空の税は1マナである（同型の単体守り手で対空の有無だけが違う）', () => {
    const ground = getCardDefinition('arrow-tower');
    const air = getCardDefinition('ballista');
    expect(ground.tower!.hitsFlying).toBe(false);
    expect(air.tower!.hitsFlying).toBe(true);
    expect(air.cost - ground.cost).toBe(1);
  });

  it('すべての守り手がHPを持つ', () => {
    CARD_IDS.forEach((id) => {
      const spec = towerOf(id);
      if (!spec) return;
      expect(spec.hp).toBeGreaterThan(0);
    });
  });

  it('石壁の同名上限は3枚のまま（壁の希少性が本反復の中核）', () => {
    expect(getCardDefinition('stone-wall').maxCopies ?? 3).toBe(3);
  });

  it('魔力炉だけが同名上限を持たない', () => {
    const unlimited = CARD_IDS.filter((id) => (getCardDefinition(id).maxCopies ?? 3) > 3);
    expect(unlimited).toEqual(['reactor']);
  });
});

describe('プリセットデッキ', () => {
  it('2種類ある', () => {
    expect(Object.keys(PRESET_DECKS)).toEqual(['swift', 'heavy']);
  });

  it.each(Object.entries(PRESET_DECKS))('%s は20枚ちょうど', (_id, deck) => {
    expect(deck.cards).toHaveLength(DECK_SIZE);
  });

  // 反復2: 魔力炉だけ上限が別（maxCopiesOf）になったため、MAX_COPIES 直参照から
  // カード別の上限参照へ改めた。緩めたのではなく、上限の定義元が変わったことへの追随
  it.each(Object.entries(PRESET_DECKS))('%s はカードごとの同名上限を超えない', (_id, deck) => {
    const counts = new Map<string, number>();
    deck.cards.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
    counts.forEach((count, id) => expect(count).toBeLessThanOrEqual(maxCopiesOf(id)));
  });

  it.each(Object.entries(PRESET_DECKS))('%s は既知のカードだけで構成される', (_id, deck) => {
    deck.cards.forEach((id) => expect(() => getCardDefinition(id)).not.toThrow());
  });

  it.each(Object.entries(PRESET_DECKS))('%s は構築規則を満たす', (_id, deck) => {
    expect(validateDeck(deck.cards).errors).toEqual([]);
  });
});

describe('プリセットの重コスト帯（反復5）', () => {
  it('どのプリセットもコスト4以上を2枚以上持つ', () => {
    // 速攻型は最大コスト3 で、選んだ人に重い札の判断が発生しなかった（設計書 §2.4）
    Object.values(PRESET_DECKS).forEach((preset) => {
      const heavy = preset.cards.filter((id) => getCardDefinition(id).cost >= 4);
      expect(heavy.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('プリセットは構築規則を満たしたまま', () => {
    Object.values(PRESET_DECKS).forEach((preset) => {
      expect(validateDeck(preset.cards)).toEqual({ isValid: true, errors: [] });
    });
  });

  it('速攻型と重厚型の性格の違いが残っている（平均コストで重厚型が上）', () => {
    const averageCost = (cards: readonly string[]): number =>
      cards.reduce((sum, id) => sum + getCardDefinition(id).cost, 0) / cards.length;
    const swift = PRESET_DECKS.swift;
    const heavy = PRESET_DECKS.heavy;
    if (!swift || !heavy) throw new Error('プリセットが見つかりません');
    expect(averageCost(heavy.cards)).toBeGreaterThan(averageCost(swift.cards));
  });
});
