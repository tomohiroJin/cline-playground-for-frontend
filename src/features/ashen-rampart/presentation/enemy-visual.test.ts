import {
  getEnemyVisual,
  getHpBarColor,
  getShapeClipPath,
} from './enemy-visual';

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

describe('getHpBarColor', () => {
  it('残量が多いときは緑を返す', () => {
    expect(getHpBarColor(1)).toBe('#6ab04c');
  });

  it('残量が中程度のときは黄を返す', () => {
    expect(getHpBarColor(0.5)).toBe('#f0c419');
  });

  it('残量が少ないときは赤を返す', () => {
    expect(getHpBarColor(0.1)).toBe('#e74c3c');
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
