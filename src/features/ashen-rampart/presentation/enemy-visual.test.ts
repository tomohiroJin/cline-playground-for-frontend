import {
  getEnemyVisual,
  getHpBarWidthPct,
  getShapeClipPath,
} from './enemy-visual';
import { getEnemySpec } from '../domain/combat/enemies';

describe('getEnemyVisual', () => {
  describe('正常系', () => {
    it('敵IDから表示名を含む視覚表現を返す', () => {
      expect(getEnemyVisual('grunt').name).toBe('雑兵');
      expect(getEnemyVisual('runner').name).toBe('俊足');
      expect(getEnemyVisual('brute').name).toBe('重装');
    });

    it('3種の敵は互いに異なる形を持つ', () => {
      const shapes = ['grunt', 'runner', 'brute'].map(
        (id) => getEnemyVisual(id).shape
      );
      expect(new Set(shapes).size).toBe(3);
    });

    it('3種の敵は互いに異なるサイズを持つ（色に依存せず判別できる）', () => {
      const sizes = ['grunt', 'runner', 'brute'].map(
        (id) => getEnemyVisual(id).sizePct
      );
      expect(new Set(sizes).size).toBe(3);
    });

    it('重装だけが装甲リングを持つ', () => {
      expect(getEnemyVisual('brute').ringColor).toBeDefined();
      expect(getEnemyVisual('grunt').ringColor).toBeUndefined();
      expect(getEnemyVisual('runner').ringColor).toBeUndefined();
    });
  });

  describe('異常系', () => {
    it('未知の敵IDは例外を投げる', () => {
      expect(() => getEnemyVisual('unknown')).toThrow(
        /視覚表現が未定義の敵IDです/
      );
    });
  });
});

describe('getHpBarWidthPct', () => {
  it('最大HPが大きい敵ほどバーが長くなる（強さの差を絶対スケールで示す）', () => {
    const grunt = getHpBarWidthPct(getEnemySpec('grunt').hp);
    const runner = getHpBarWidthPct(getEnemySpec('runner').hp);
    const brute = getHpBarWidthPct(getEnemySpec('brute').hp);

    expect(brute).toBeGreaterThan(grunt);
    expect(grunt).toBeGreaterThan(runner);
  });

  it('重装のバーは俊足のバーより明確に長い（2倍以上）', () => {
    const runner = getHpBarWidthPct(getEnemySpec('runner').hp);
    const brute = getHpBarWidthPct(getEnemySpec('brute').hp);

    expect(brute / runner).toBeGreaterThanOrEqual(2);
  });

  it('最大HPが基準を超えても上限で頭打ちになる', () => {
    expect(getHpBarWidthPct(1000)).toBe(getHpBarWidthPct(60));
  });
});

describe('getShapeClipPath', () => {
  it('円は clip-path を使わない', () => {
    expect(getShapeClipPath('circle')).toBeUndefined();
  });

  it('菱形と六角形は互いに異なる clip-path を返す', () => {
    const diamond = getShapeClipPath('diamond');
    const hexagon = getShapeClipPath('hexagon');
    expect(diamond).toBeDefined();
    expect(hexagon).toBeDefined();
    expect(diamond).not.toBe(hexagon);
  });
});
