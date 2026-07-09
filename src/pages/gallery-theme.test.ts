import { galleryTokens, galleryThemeVars } from './gallery-theme';

// WCAG 相対輝度によるコントラスト比（テスト内ローカル計算・実装非依存）
const channelLuminance = (value: number): number => {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const relativeLuminance = (hex: string): number => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
};
const contrastRatio = (fg: string, bg: string): number => {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
};

describe('gallery-theme', () => {
  it('美術館トーンの基調色トークンを提供する', () => {
    expect(galleryTokens.cream).toBe('#f4f1ea');
    expect(galleryTokens.ink).toBe('#2b2620');
    expect(galleryTokens.gold).toBe('#a8894e');
  });

  it('text-primary をインク色へ局所上書きする', () => {
    expect(galleryThemeVars).toContain(`--text-primary: ${galleryTokens.ink}`);
  });

  it('グローバル背景グラデを配下で無効化する', () => {
    expect(galleryThemeVars).toContain('--bg-gradient: none');
  });

  it('アクセント色をゴールドへ差し替える', () => {
    expect(galleryThemeVars).toContain(`--accent-color: ${galleryTokens.gold}`);
  });
});

describe('gallery-theme コントラスト（WCAG AA）', () => {
  it('sub はテキスト色として cream/mat 背景で 4.5:1 以上', () => {
    expect(contrastRatio(galleryTokens.sub, galleryTokens.cream)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(galleryTokens.sub, galleryTokens.mat)).toBeGreaterThanOrEqual(4.5);
  });

  it('goldText はテキスト色として cream/mat 背景で 4.5:1 以上', () => {
    expect(contrastRatio(galleryTokens.goldText, galleryTokens.cream)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(galleryTokens.goldText, galleryTokens.mat)).toBeGreaterThanOrEqual(4.5);
  });

  it('ink は本文テキストとして cream 背景で AA を十分満たす', () => {
    expect(contrastRatio(galleryTokens.ink, galleryTokens.cream)).toBeGreaterThanOrEqual(7);
  });
});
