/**
 * カードの「効かない相手」文言のテスト
 *
 * 全カードに文言があることが要件。1つでも欠けると構築画面で
 * 「何のために積むか」の手がかりが失われる。
 */
import { weaknessTextOf, MISSING_WEAKNESS_IDS, towerStatsTextOf, cardStatsOf, cardBadgesOf, MAX_CARD_BADGES } from './card-text';
import { CARD_IDS, getCardDefinition } from '../domain/cards/card-pool';

describe('weaknessTextOf', () => {
  it('全14種に文言がある（空文字でない）', () => {
    CARD_IDS.forEach((id) => {
      expect(weaknessTextOf(id).length).toBeGreaterThan(0);
    });
  });

  it('欠落カードが無い（開発時の取り漏れ検出）', () => {
    expect(MISSING_WEAKNESS_IDS).toEqual([]);
  });

  it('弓兵は飛行に当たらないことを示す', () => {
    expect(weaknessTextOf('arrow-tower')).toContain('飛行');
  });

  it('弩砲は効かない相手がないことと制約を示す', () => {
    expect(weaknessTextOf('ballista')).toContain('効かない相手はない');
    expect(weaknessTextOf('ballista')).toContain('コスト');
  });

  it('徹甲弩は一直線に並んでいないと恩恵がないことを示す', () => {
    expect(weaknessTextOf('piercer')).toContain('一直線');
  });

  it('篝火と鍛冶場は常に0ダメージを示す', () => {
    expect(weaknessTextOf('beacon')).toContain('0ダメージ');
    expect(weaknessTextOf('forge')).toContain('0ダメージ');
  });

  it('落網はダメージを与えないことを示す', () => {
    expect(weaknessTextOf('snare-net')).toContain('ダメージ');
  });

  it('未知のIDは契約違反として例外', () => {
    expect(() => weaknessTextOf('unknown')).toThrow('文言が未定義のカードIDです: unknown');
  });
});

describe('towerStatsTextOf', () => {
  it('守り手はHPと攻撃力を表示する（石壁60/0 → 弓兵8/4の逆相関が読める）', () => {
    expect(towerStatsTextOf('stone-wall')).toBe('HP60 / 攻撃0');
    expect(towerStatsTextOf('arrow-tower')).toBe('HP8 / 攻撃4');
  });

  it('守り手でないカード（魔力炉・罠・呪文・徴発）は undefined', () => {
    expect(towerStatsTextOf('reactor')).toBeUndefined();
    expect(towerStatsTextOf('spike-trap')).toBeUndefined();
    expect(towerStatsTextOf('mud-time')).toBeUndefined();
    expect(towerStatsTextOf('levy')).toBeUndefined();
  });

  it('全種の守り手（tower spec を持つカード）に対して値を返す', () => {
    CARD_IDS.filter((id) => getCardDefinition(id).tower !== undefined).forEach((id) => {
      expect(towerStatsTextOf(id)).toMatch(/^HP\d+ \/ 攻撃\d+$/);
    });
  });
});

describe('cardStatsOf', () => {
  it('塔はHPと攻撃力を出す', () => {
    expect(cardStatsOf('arrow-tower')).toEqual(['HP8', '攻撃4']);
  });

  it('罠はダメージと回数を出す', () => {
    expect(cardStatsOf('spike-trap')).toEqual(['ダメージ5', '3回']);
  });

  it('徴発は数値が1つだけ', () => {
    expect(cardStatsOf('levy')).toHaveLength(1);
  });

  it('魔力炉はマナ生成量と間隔秒を出す（tick→秒の丸め: Math.ceil(60/10)=6）', () => {
    expect(cardStatsOf('reactor')).toEqual(['マナ+1', '6秒']);
  });

  it('燠火はダメージと効果半径を出す', () => {
    expect(cardStatsOf('ember-blast')).toEqual(['ダメージ8', '半径2']);
  });

  it('呪文は速度倍率と持続秒を出す（tick→秒の丸め: Math.ceil(200/10)=20）', () => {
    expect(cardStatsOf('mud-time')).toEqual(['速度x0.6', '20秒']);
  });

  it('全14種が数値を持ち、2つを超えない', () => {
    CARD_IDS.forEach((id) => {
      const stats = cardStatsOf(id);
      expect(stats.length).toBeGreaterThan(0);
      expect(stats.length).toBeLessThanOrEqual(2);
    });
  });
});

describe('cardBadgesOf', () => {
  it('徹甲弩は対空と貫通の2つ', () => {
    expect(cardBadgesOf('piercer')).toEqual(['対空', '貫通']);
  });

  it('火砲台は範囲のみ（飛行に当たらない）', () => {
    expect(cardBadgesOf('cannon-tower')).toEqual(['範囲']);
  });

  it('弓兵はバッジなし', () => {
    expect(cardBadgesOf('arrow-tower')).toEqual([]);
  });

  it('弩砲は対空のみ（貫通も範囲もなし）', () => {
    expect(cardBadgesOf('ballista')).toEqual(['対空']);
  });

  it('投石機は範囲のみ（対空なし、単体攻撃ではない）', () => {
    expect(cardBadgesOf('catapult')).toEqual(['範囲']);
  });

  it('塔でないカードはバッジなし', () => {
    expect(cardBadgesOf('mud-time')).toEqual([]);
  });

  it('どのカードもバッジは上限を超えない', () => {
    CARD_IDS.forEach((id) => {
      expect(cardBadgesOf(id).length).toBeLessThanOrEqual(MAX_CARD_BADGES);
    });
  });
});
