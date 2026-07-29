/**
 * 敵の視覚表現のテスト
 *
 * 敵種は「形 × サイズ × 色」の3重符号で区別する。グレースケールでも
 * 形とサイズだけで見分けられることが要件（S1 の教訓）。
 */
import { getEnemyVisual, getHpBarWidthPct, getShapeClipPath, MAX_ENEMY_HP } from './enemy-visual';
import { ENEMY_IDS } from '../domain/combat/enemies';
import { COLORS } from './theme';

/** #rrggbb を 0-360 の色相（Hue）に変換する（テスト専用の簡易実装） */
const hexToHue = (hex: string): number => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return 0;
  let hue = 0;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  hue *= 60;
  return hue < 0 ? hue + 360 : hue;
};

/** 円環上の色相の距離（0〜180） */
const hueDistance = (a: number, b: number): number => {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
};

describe('getEnemyVisual', () => {
  it('敵5種すべてに視覚表現がある', () => {
    ENEMY_IDS.forEach((id) => expect(() => getEnemyVisual(id)).not.toThrow());
  });

  it('形かサイズのどちらかが必ず異なる（色に依存しない）', () => {
    const keys = ENEMY_IDS.map((id) => {
      const v = getEnemyVisual(id);
      return `${v.shape}:${v.sizePct}`;
    });
    expect(new Set(keys).size).toBe(ENEMY_IDS.length);
  });

  it('表示名は敵定義の名前を引き継ぐ', () => {
    expect(getEnemyVisual('raven').name).toBe('鴉');
  });

  it('未知のIDは契約違反として例外', () => {
    expect(() => getEnemyVisual('unknown')).toThrow('視覚表現が未定義の敵IDです: unknown');
  });

  it('雑兵を含むどの敵色も危険色 #8b2635 と色相が近すぎない（指摘7の回帰: 赤は危険専用）', () => {
    const dangerHue = hexToHue(COLORS.danger);
    ENEMY_IDS.forEach((id) => {
      const { color } = getEnemyVisual(id);
      const distance = hueDistance(hexToHue(color), dangerHue);
      expect(distance).toBeGreaterThan(30);
    });
  });
});

describe('getHpBarWidthPct', () => {
  it('最大HPが大きいほどバーが長い（絶対スケール）', () => {
    expect(getHpBarWidthPct(60)).toBeGreaterThan(getHpBarWidthPct(20));
    expect(getHpBarWidthPct(20)).toBeGreaterThan(getHpBarWidthPct(8));
  });

  it('MAX_ENEMY_HP を超えても上限で頭打ちになる', () => {
    expect(getHpBarWidthPct(MAX_ENEMY_HP * 2)).toBe(getHpBarWidthPct(MAX_ENEMY_HP));
  });
});

describe('getShapeClipPath', () => {
  it('円は clip-path を使わない', () => {
    expect(getShapeClipPath('circle')).toBeUndefined();
  });

  it('菱形と六角形は clip-path を返す', () => {
    expect(getShapeClipPath('diamond')).toContain('polygon');
    expect(getShapeClipPath('hexagon')).toContain('polygon');
  });
});
