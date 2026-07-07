/**
 * ギャラリー（美術館）トーンの局所テーマ。
 * PuzzlePageContainer にのみ注入し、配下だけへ適用する。
 * グローバル :root（styles/GlobalStyle.ts）は不可侵 —— 他ゲームへ波及させないため。
 */
export const galleryTokens = {
  cream: '#f4f1ea',
  ink: '#2b2620',
  sub: '#7a7062',
  gold: '#a8894e',
  sage: '#8a9a7b',
  mat: '#fffdf9',
  frameBorder: '#e3ddd0',
} as const;

/** PuzzlePageContainer に注入する CSS カスタムプロパティ上書き（配下限定） */
export const galleryThemeVars = `
  --bg-gradient: none;
  --text-primary: ${galleryTokens.ink};
  --text-secondary: ${galleryTokens.sub};
  --accent-color: ${galleryTokens.gold};
  --glass-bg: ${galleryTokens.mat};
  --glass-border: ${galleryTokens.frameBorder};
  --glass-shadow: 0 8px 22px rgba(0, 0, 0, 0.12);
`;
