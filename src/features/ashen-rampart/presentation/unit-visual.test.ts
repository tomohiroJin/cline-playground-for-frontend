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
  it('(役割, サイズ, 横長) の組が14種で重複しない', () => {
    const keys = CARD_IDS.map((id) => {
      const v = getUnitVisual(id);
      return `${v.role}:${v.sizePct}:${v.isWide}`;
    });
    expect(new Set(keys).size).toBe(CARD_IDS.length);
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
