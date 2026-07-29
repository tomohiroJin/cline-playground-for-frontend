/**
 * 敵の視覚表現のテスト
 *
 * 敵種は「形 × サイズ × 色」の3重符号で区別する。グレースケールでも
 * 形とサイズだけで見分けられることが要件（S1 の教訓）。
 */
import { getEnemyVisual, getHpBarWidthPct, getShapeClipPath, MAX_ENEMY_HP } from './enemy-visual';
import { ENEMY_IDS } from '../domain/combat/enemies';

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
