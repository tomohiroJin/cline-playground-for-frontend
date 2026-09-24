/**
 * WCAG 2.x のコントラスト比（反復7 段階2・設計書 §4.0 b）
 */
import { compositeOver, contrastRatio, relativeLuminance } from './contrast';

describe('relativeLuminance', () => {
  it('黒は0・白は1', () => {
    expect(relativeLuminance('#000000')).toBe(0);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 10);
  });

  it('#rrggbb 以外は契約違反として例外', () => {
    expect(() => relativeLuminance('red')).toThrow('#rrggbb 形式ではありません: red');
  });
});

describe('contrastRatio', () => {
  it('白と黒は 21:1、同じ色は 1:1', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
    expect(contrastRatio('#7d6d58', '#7d6d58')).toBe(1);
  });

  it('引数の順序によらない', () => {
    expect(contrastRatio('#e8a33d', '#1a1614')).toBeCloseTo(contrastRatio('#1a1614', '#e8a33d'), 10);
  });

  it('既知の値と一致する（#777777 と白は約 4.48:1）', () => {
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
  });

  it('段階1 の経路と経路外の比はほぼ 1:1 だった（設計書 §4.0 b の原因）', () => {
    expect(contrastRatio('#2a2320', '#211c19')).toBeLessThan(1.2);
  });
});

describe('compositeOver', () => {
  /**
   * LaneMark・CellArrow は opacity 付きの色を経路の上に描くため、実際に
   * 目に入る色は前景色そのものではなく背景と混ざった後の色になる。
   * board-colors.test.ts はこの関数で合成した色を使ってコントラスト比を
   * 検査する（不透明の色同士で比べても実際の見た目を測れないため。
   * コントローラ追加指示）。
   */
  it('不透明度1なら前景そのもの', () => {
    expect(compositeOver('#7d6d58', '#211c19', 1)).toBe('#7d6d58');
  });

  it('不透明度0なら背景そのもの', () => {
    expect(compositeOver('#7d6d58', '#211c19', 0)).toBe('#211c19');
  });

  it('白と黒を0.5で重ねると中間の灰色になる', () => {
    expect(compositeOver('#ffffff', '#000000', 0.5)).toBe('#808080');
  });
});
