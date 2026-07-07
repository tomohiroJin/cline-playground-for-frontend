import { galleryTokens, galleryThemeVars } from './gallery-theme';

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
