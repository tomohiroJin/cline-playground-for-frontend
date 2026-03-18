/**
 * presentation/styles/design-tokens.ts のテスト
 */
import { DESIGN_TOKENS } from '../design-tokens';
import { COLORS } from '../../../constants/colors';

describe('DESIGN_TOKENS - デザイントークン', () => {
  // ── colors ──────────────────────────────────────────
  describe('colors - カラートークン', () => {
    it('既存の COLORS の値がすべて含まれている', () => {
      // COLORS の全キーがデザイントークンの colors に含まれる
      Object.keys(COLORS).forEach(key => {
        expect(DESIGN_TOKENS.colors[key as keyof typeof DESIGN_TOKENS.colors]).toBe(
          COLORS[key as keyof typeof COLORS]
        );
      });
    });

    it('セマンティックカラーが定義されている', () => {
      expect(DESIGN_TOKENS.colors.primary).toBeDefined();
      expect(DESIGN_TOKENS.colors.secondary).toBeDefined();
      expect(DESIGN_TOKENS.colors.danger).toBeDefined();
      expect(DESIGN_TOKENS.colors.warning).toBeDefined();
    });
  });

  // ── spacing ─────────────────────────────────────────
  describe('spacing - スペーシングトークン', () => {
    it('xs, sm, md, lg, xl が定義されている', () => {
      expect(DESIGN_TOKENS.spacing.xs).toBe('4px');
      expect(DESIGN_TOKENS.spacing.sm).toBe('8px');
      expect(DESIGN_TOKENS.spacing.md).toBe('16px');
      expect(DESIGN_TOKENS.spacing.lg).toBe('24px');
      expect(DESIGN_TOKENS.spacing.xl).toBe('32px');
    });
  });

  // ── borderRadius ────────────────────────────────────
  describe('borderRadius - 角丸トークン', () => {
    it('sm, md, lg, round が定義されている', () => {
      expect(DESIGN_TOKENS.borderRadius.sm).toBe('4px');
      expect(DESIGN_TOKENS.borderRadius.md).toBe('8px');
      expect(DESIGN_TOKENS.borderRadius.lg).toBe('16px');
      expect(DESIGN_TOKENS.borderRadius.round).toBe('50%');
    });
  });

  // ── fontSize ────────────────────────────────────────
  describe('fontSize - フォントサイズトークン', () => {
    it('xs, sm, md, lg, xl, xxl が定義されている', () => {
      expect(DESIGN_TOKENS.fontSize.xs).toBe('0.75rem');
      expect(DESIGN_TOKENS.fontSize.sm).toBe('0.875rem');
      expect(DESIGN_TOKENS.fontSize.md).toBe('1rem');
      expect(DESIGN_TOKENS.fontSize.lg).toBe('1.25rem');
      expect(DESIGN_TOKENS.fontSize.xl).toBe('1.5rem');
      expect(DESIGN_TOKENS.fontSize.xxl).toBe('2rem');
    });
  });

  // ── transition ──────────────────────────────────────
  describe('transition - トランジショントークン', () => {
    it('fast, normal, slow が定義されている', () => {
      expect(DESIGN_TOKENS.transition.fast).toBe('150ms ease');
      expect(DESIGN_TOKENS.transition.normal).toBe('300ms ease');
      expect(DESIGN_TOKENS.transition.slow).toBe('500ms ease');
    });
  });

  // ── fonts ───────────────────────────────────────────
  describe('fonts - フォントトークン', () => {
    it('mono と jp が定義されている', () => {
      expect(DESIGN_TOKENS.fonts.mono).toContain('monospace');
      expect(DESIGN_TOKENS.fonts.jp).toContain('sans-serif');
    });
  });

  // ── 不変性 ──────────────────────────────────────────
  describe('不変性', () => {
    it('Object.freeze で凍結されている', () => {
      expect(Object.isFrozen(DESIGN_TOKENS)).toBe(true);
    });
  });
});
