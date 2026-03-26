/**
 * 原始進化録 - PRIMAL PATH - インラインフォントサイズ定数テスト
 */
import { IFS } from '../constants/ui';

describe('IFS（インラインフォントサイズ）', () => {
  it('xs は 12px である', () => {
    expect(IFS.xs).toBe(12);
  });

  it('sm は 14px である', () => {
    expect(IFS.sm).toBe(14);
  });

  it('md は 16px である', () => {
    expect(IFS.md).toBe(16);
  });

  it('lg は 18px である', () => {
    expect(IFS.lg).toBe(18);
  });

  it('xl は 20px である', () => {
    expect(IFS.xl).toBe(20);
  });

  it('全フォントサイズが 12px 以上である', () => {
    const MIN_FONT_SIZE = 12;
    for (const [, size] of Object.entries(IFS)) {
      expect(size).toBeGreaterThanOrEqual(MIN_FONT_SIZE);
    }
  });

  it('サイズが昇順に並んでいる（xs < sm < md < lg < xl）', () => {
    expect(IFS.xs).toBeLessThan(IFS.sm);
    expect(IFS.sm).toBeLessThan(IFS.md);
    expect(IFS.md).toBeLessThan(IFS.lg);
    expect(IFS.lg).toBeLessThan(IFS.xl);
  });
});
