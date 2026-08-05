/**
 * カードの視覚表現のテスト
 *
 * カードは「形 × サイズ × 文字」の3重符号で区別する。敵（enemy-visual.ts）が
 * 色を使うのに対し、こちらは文字を使う。theme.ts の6トークンを増やさないため。
 * グレースケールでも (形, サイズ) だけで一意に定まることが要件（設計書 §4.5）。
 */
import {
  getUnitVisual,
  getRoleClipPath,
  roleLabelOf,
  roleOf,
  sizePctOf,
  MISSING_GLYPH_IDS,
} from './unit-visual';
import { CARD_IDS, getCardDefinition } from '../domain/cards/card-pool';

describe('unit-visual の網羅', () => {
  it('14種すべてに文字が定義されている', () => {
    expect(MISSING_GLYPH_IDS).toEqual([]);
    expect(CARD_IDS).toHaveLength(14);
  });

  it('未知のカードIDは契約違反として例外', () => {
    expect(() => getUnitVisual('unknown-card')).toThrow();
  });
});

describe('roleOf', () => {
  it.each([
    ['arrow-tower', 'attacker'],
    ['ballista', 'attacker'],
    ['cannon-tower', 'attacker'],
    ['piercer', 'attacker'],
    ['catapult', 'attacker'],
    ['beacon', 'support'],
    ['forge', 'support'],
    ['stone-wall', 'wall'],
    ['spike-trap', 'trap'],
    ['snare-net', 'trap'],
    ['reactor', 'reactor'],
    ['ember-blast', 'ember'],
    ['mud-time', 'spell'],
    ['levy', 'levy'],
  ])('%s は %s', (cardId, expected) => {
    expect(roleOf(getCardDefinition(cardId))).toBe(expected);
  });
});

describe('sizePctOf', () => {
  it('コスト0が最小45%、コスト5が最大85%', () => {
    expect(sizePctOf(0)).toBe(45);
    expect(sizePctOf(5)).toBe(85);
  });

  it('コストが1上がるごとに8%widen する', () => {
    expect(sizePctOf(3) - sizePctOf(2)).toBe(8);
  });
});

describe('符号の一意性（グレースケール要件）', () => {
  it('(実際に描かれる形, サイズ) の組が14種で重複しない', () => {
    // 役割名で数えると、別々の役割に**同じ clip-path** を割り当てても
    // 検出できない（棘罠と徴発はどちらも 53% なので、形が同じになれば
    // 盤面と手札で見分けがつかなくなる。最終レビュー指摘I-2）。
    // 「文字に依存せず識別できる」という主張を守るため、形そのもので数える。
    const keys = CARD_IDS.map((id) => {
      const v = getUnitVisual(id);
      const shape = getRoleClipPath(v.role) ?? (v.isWide ? 'rounded-rect' : 'circle');
      return `${shape}:${v.sizePct}`;
    });
    expect(new Set(keys).size).toBe(CARD_IDS.length);
  });

  it('形（clip-path）は役割ごとに異なる（同じ形を2つの役割へ割り当てない）', () => {
    const roles = CARD_IDS.map((id) => getUnitVisual(id).role);
    const clipPaths = [...new Set(roles)]
      .map((role) => getRoleClipPath(role))
      .filter((value): value is string => value !== undefined);
    expect(new Set(clipPaths).size).toBe(clipPaths.length);
  });

  it('文字も14種で重複しない', () => {
    const glyphs = CARD_IDS.map((id) => getUnitVisual(id).glyph);
    expect(new Set(glyphs).size).toBe(CARD_IDS.length);
  });
});

describe('形とラベル', () => {
  it('石壁だけが横長プレート', () => {
    expect(getUnitVisual('stone-wall').isWide).toBe(true);
    expect(getUnitVisual('arrow-tower').isWide).toBe(false);
  });

  it('円と横長長方形は clip-path を使わない（border-radius で描くため）', () => {
    expect(getRoleClipPath('support')).toBeUndefined();
    expect(getRoleClipPath('wall')).toBeUndefined();
    expect(getRoleClipPath('attacker')).toContain('polygon');
  });

  it('役割の日本語ラベルが引ける（aria-label 用）', () => {
    expect(roleLabelOf('attacker')).toBe('攻撃塔');
    expect(roleLabelOf('reactor')).toBe('魔力炉');
  });
});
