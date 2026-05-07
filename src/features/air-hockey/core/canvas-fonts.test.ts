/**
 * canvas-fonts のテスト
 * - フォント指定に DOM と統一する Inter / Noto Sans JP を含むこと
 * - 絵文字フォールバック（Segoe UI Emoji / Apple Color Emoji）を含むこと
 * - Arial ハードコードを廃止すること
 */
import { CANVAS_FONTS } from './canvas-fonts';

describe('CANVAS_FONTS', () => {
  const allFontValues = (): string[] => {
    // debugInfo は PerfProbe 等のデバッグ用にモノスペース固定（Gemini M2-M4 レビュー反映）
    // 本文・見出しフォントとは別系統なので汎用チェックから除外
    const exclude = new Set<keyof typeof CANVAS_FONTS>(['debugInfo']);
    const values: string[] = [];
    for (const [k, v] of Object.entries(CANVAS_FONTS) as [keyof typeof CANVAS_FONTS, unknown][]) {
      if (exclude.has(k)) continue;
      if (typeof v === 'string') {
        values.push(v);
      } else if (typeof v === 'function') {
        values.push((v as (s: number) => string)(1));
      }
    }
    return values;
  };

  describe('フォント仕様', () => {
    it('全フォント指定に Inter が含まれる', () => {
      for (const f of allFontValues()) {
        expect(f).toContain("'Inter'");
      }
    });

    it('全フォント指定に Noto Sans JP が含まれる（日本語フォールバック）', () => {
      for (const f of allFontValues()) {
        expect(f).toContain("'Noto Sans JP'");
      }
    });

    it('絵文字フォールバック（Segoe UI Emoji / Apple Color Emoji）を含む', () => {
      for (const f of allFontValues()) {
        expect(f).toContain("'Segoe UI Emoji'");
        expect(f).toContain("'Apple Color Emoji'");
      }
    });

    it('Arial ハードコードは存在しない', () => {
      for (const f of allFontValues()) {
        expect(f).not.toMatch(/\bArial\b/);
      }
    });
  });

  describe('要素別フォント', () => {
    it('countdownNumber / countdownGo は Orbitron 見出しフォント', () => {
      expect(CANVAS_FONTS.countdownNumber).toContain('Orbitron');
      expect(CANVAS_FONTS.countdownGo).toContain('Orbitron');
    });

    it('pauseTitle は Orbitron 見出しフォント', () => {
      expect(CANVAS_FONTS.pauseTitle).toContain('Orbitron');
    });

    it('combo は scale 引数で font-size を動的生成', () => {
      const s1 = CANVAS_FONTS.combo(1);
      const s2 = CANVAS_FONTS.combo(2);
      expect(s1).toMatch(/\b28px\b/);
      expect(s2).toMatch(/\b56px\b/);
    });

    it('debugInfo はモノスペース（PerfProbe 用）', () => {
      expect(CANVAS_FONTS.debugInfo).toContain('monospace');
      expect(CANVAS_FONTS.debugInfo).toContain('JetBrains Mono');
    });
  });
});
