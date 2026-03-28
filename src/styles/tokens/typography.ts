/**
 * タイポグラフィトークン定義
 *
 * clamp() による流動的タイポグラフィスケールで
 * ブレイクポイント不要のレスポンシブ化を実現
 */

/** タイポグラフィ CSS変数（テーマ共通） */
export const typographyVariables = `
  /* フォントファミリー */
  --font-family-body: 'Inter', system-ui, -apple-system, sans-serif;
  --font-family-heading: 'Orbitron', 'Inter', sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* フォントサイズ（流動的スケール） */
  --font-size-xs:   clamp(0.7rem, 0.65rem + 0.25vw, 0.8rem);
  --font-size-sm:   clamp(0.8rem, 0.75rem + 0.25vw, 0.9rem);
  --font-size-base: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
  --font-size-md:   clamp(1rem, 0.9rem + 0.5vw, 1.25rem);
  --font-size-lg:   clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
  --font-size-xl:   clamp(1.5rem, 1.2rem + 1.5vw, 2rem);
  --font-size-2xl:  clamp(2rem, 1.5rem + 2.5vw, 2.8rem);
  --font-size-3xl:  clamp(2.5rem, 1.8rem + 3.5vw, 3.5rem);

  /* フォントウェイト */
  --font-weight-normal: 400;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;

  /* 行間 */
  --line-height-tight: 1.2;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.7;

  /* 字間 */
  --letter-spacing-tight: -0.02em;
  --letter-spacing-normal: 0;
  --letter-spacing-wide: 0.05em;
`;

/** styled-components 内でタイポ防止に使う TypeScript 定数 */
export const typography = {
  fontFamilyBody: 'var(--font-family-body)',
  fontFamilyHeading: 'var(--font-family-heading)',
  fontFamilyMono: 'var(--font-family-mono)',
  fontSizeXs: 'var(--font-size-xs)',
  fontSizeSm: 'var(--font-size-sm)',
  fontSizeBase: 'var(--font-size-base)',
  fontSizeMd: 'var(--font-size-md)',
  fontSizeLg: 'var(--font-size-lg)',
  fontSizeXl: 'var(--font-size-xl)',
  fontSize2xl: 'var(--font-size-2xl)',
  fontSize3xl: 'var(--font-size-3xl)',
  fontWeightNormal: 'var(--font-weight-normal)',
  fontWeightSemibold: 'var(--font-weight-semibold)',
  fontWeightBold: 'var(--font-weight-bold)',
  fontWeightExtrabold: 'var(--font-weight-extrabold)',
  lineHeightTight: 'var(--line-height-tight)',
  lineHeightNormal: 'var(--line-height-normal)',
  lineHeightRelaxed: 'var(--line-height-relaxed)',
  letterSpacingTight: 'var(--letter-spacing-tight)',
  letterSpacingNormal: 'var(--letter-spacing-normal)',
  letterSpacingWide: 'var(--letter-spacing-wide)',
} as const;
