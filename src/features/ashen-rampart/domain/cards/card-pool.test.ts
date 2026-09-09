/**
 * カードプールのテスト
 *
 * 設計書の数値がそのままデータになっていること、プリセットデッキが
 * デッキ規則（DECK_SIZE=12・同名上限はカードごとに MAX_COPIES。反復6 で
 * 魔力炉の例外を外したため、現在は例外を持つカードは無い）を満たすことを検証する。
 */
import {
  getCardDefinition,
  CARD_IDS,
  PRESET_DECKS,
  DECK_SIZE,
  maxCopiesOf,
  availabilityOf,
  BUILDABLE_CARD_IDS,
  ACQUIRABLE_CARD_IDS,
  KNOCKOUT_CARD_IDS,
  KNOCKOUT_DERIVATION_FAILURES,
} from './card-pool';
import { placementKindOf } from './card-definition';
import { validateDeck } from './deck-builder';
import { KNOCKOUT_ID_PREFIX } from './knockout-cards';

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

  it('同名上限に例外を持つカードは無い', () => {
    const unlimited = CARD_IDS.filter((id) => (getCardDefinition(id).maxCopies ?? 3) > 3);
    expect(unlimited).toEqual([]);
  });
});

describe('プリセットデッキ', () => {
  it('2種類ある', () => {
    expect(Object.keys(PRESET_DECKS)).toEqual(['swift', 'heavy']);
  });

  it.each(Object.entries(PRESET_DECKS))('%s は DECK_SIZE 枚ちょうど', (_id, deck) => {
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
  it('どのプリセットもコスト4以上を1枚以上持つ', () => {
    // 速攻型は最大コスト3 で、選んだ人に重い札の判断が発生しなかった（設計書 §2.4）。
    //
    // **反復6 で12枚デッキに縮めたことで、この較正ガードの閾値を 2枚以上 → 1枚以上
    // へ緩めた。** ブリーフ指定の12枚版プリセット構成が原因で不可避（swift は
    // 徹甲弩1枚のみでコスト4以上を満たす）。
    //
    // **⚠️ swift は緩めた閾値ちょうどに張り付いている（コスト4以上は徹甲弩1枚の
    // み。heavy は3枚で余裕がある）。これ以上は緩められない。** 1枚未満に緩める
    // 選択肢は無く、緩めればこのガードが「重い判断が一度も発生しない」という
    // 反復5 の欠陥を検出できなくなる。
    //
    // 12枚版の正確な閾値較正は段階D で行う（card-pool.ts の PRESET_DECKS docstring
    // 参照）。**段階D でプリセットを組み直す際は、このガード（境界値に張り付いて
    // いること）を必ず再検討すること。** ここでは「重い判断が一度も発生しない」
    // という反復5 の欠陥へ逆戻りしていないことだけを確かめる。
    Object.values(PRESET_DECKS).forEach((preset) => {
      const heavy = preset.cards.filter((id) => getCardDefinition(id).cost >= 4);
      expect(heavy.length).toBeGreaterThanOrEqual(1);
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

describe('カードの入手経路（反復6）', () => {
  it('既定は buildable', () => {
    expect(availabilityOf('arrow-tower')).toBe('buildable');
  });

  it('BUILDABLE_CARD_IDS は buildable のみを含む', () => {
    BUILDABLE_CARD_IDS.forEach((id) => {
      expect(availabilityOf(id)).toBe('buildable');
    });
  });

  it('ACQUIRABLE_CARD_IDS は retired を含まず、buildable をすべて含む', () => {
    ACQUIRABLE_CARD_IDS.forEach((id) => {
      expect(availabilityOf(id)).not.toBe('retired');
    });
    BUILDABLE_CARD_IDS.forEach((id) => {
      expect(ACQUIRABLE_CARD_IDS).toContain(id);
    });
  });

  it('未知のカードIDは例外', () => {
    expect(() => availabilityOf('no-such-card')).toThrow('未知のカードIDです');
  });

  it('徴発は構築にも獲得にも出ないが、定義は残っている（反復6 §4.6）', () => {
    expect(availabilityOf('levy')).toBe('retired');
    expect(BUILDABLE_CARD_IDS).not.toContain('levy');
    expect(ACQUIRABLE_CARD_IDS).not.toContain('levy');
    expect(CARD_IDS).toContain('levy');
  });
});

describe('ノックアウト変種は監査からしか触れない（設計書 §8.2.15(m)）', () => {
  it('変種が1枚以上導出されている', () => {
    expect(KNOCKOUT_CARD_IDS.length).toBeGreaterThan(0);
  });

  it('ノックアウト変種の導出に失敗した札が無い（最終レビュー I3）', () => {
    // ここに1件でも載ると、knockoutDeck（axis-knockout.ts）が該当の
    // (カードID, 軸) を要求された瞬間に自己検査で例外を投げる（最終レビュー I2）。
    // 空であることをここで固定し、赤くなる場所をこの1本に絞る。
    expect(KNOCKOUT_DERIVATION_FAILURES).toEqual([]);
  });

  it('基礎札の ID は接頭辞を持たない（衝突が構文的に起こりえない）', () => {
    CARD_IDS.forEach((id) => {
      expect(id.startsWith(KNOCKOUT_ID_PREFIX)).toBe(false);
    });
  });

  it('変種は CARD_IDS に含まれない', () => {
    KNOCKOUT_CARD_IDS.forEach((id) => {
      expect(CARD_IDS).not.toContain(id);
    });
  });

  it('変種は構築にも獲得にも出ない', () => {
    KNOCKOUT_CARD_IDS.forEach((id) => {
      expect(BUILDABLE_CARD_IDS).not.toContain(id);
      expect(ACQUIRABLE_CARD_IDS).not.toContain(id);
    });
  });

  it('変種は getCardDefinition から引ける（監査はこの経路だけを使う）', () => {
    KNOCKOUT_CARD_IDS.forEach((id) => {
      expect(getCardDefinition(id).id).toBe(id);
    });
  });

  it('基礎札の定義が変種に上書きされていない', () => {
    // Map は後勝ちなので、合流順を誤ると本番の札が静かに置き換わる
    expect(getCardDefinition('stone-wall').tower?.hp).toBe(60);
    expect(getCardDefinition('cannon-tower').tower?.damage).toBe(12);
    expect(getCardDefinition('snare-net').trap?.groundedTicks).toBe(120);
  });

  it('CARD_IDS の枚数は変種を足しても14のまま', () => {
    expect(CARD_IDS).toHaveLength(14);
  });
});

describe('ノックアウト変種は構築規則を通らない', () => {
  it('validateDeck は変種を未知のカードとして弾く', () => {
    const koId = KNOCKOUT_CARD_IDS[0];
    expect(koId).toBeDefined();
    const deck = Array.from({ length: DECK_SIZE }, () => koId as string);
    const result = validateDeck(deck);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('未知のカード'))).toBe(true);
  });
});
