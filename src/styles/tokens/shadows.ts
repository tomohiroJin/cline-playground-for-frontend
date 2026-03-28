/**
 * シャドウトークン定義
 *
 * 汎用シャドウとゲーム向けグローエフェクトを提供
 */

/** ライトモード用シャドウ CSS変数 */
export const lightShadows = `
  --shadow-sm:  0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-md:  0 4px 16px rgba(0, 0, 0, 0.15);
  --shadow-lg:  0 8px 32px rgba(0, 0, 0, 0.2);
  --shadow-xl:  0 16px 48px rgba(0, 0, 0, 0.3);
  --shadow-glow-cyan:   0 0 15px rgba(0, 210, 255, 0.2);
  --shadow-glow-purple: 0 0 15px rgba(168, 85, 247, 0.2);
`;

/** ダークモード用シャドウ CSS変数（アルファ値増加で深みを出す） */
export const darkShadows = `
  --shadow-sm:  0 2px 8px rgba(0, 0, 0, 0.2);
  --shadow-md:  0 4px 16px rgba(0, 0, 0, 0.3);
  --shadow-lg:  0 8px 32px rgba(0, 0, 0, 0.4);
  --shadow-xl:  0 16px 48px rgba(0, 0, 0, 0.5);
  --shadow-glow-cyan:   0 0 15px rgba(0, 210, 255, 0.3);
  --shadow-glow-purple: 0 0 15px rgba(168, 85, 247, 0.3);
`;

/** styled-components 内でタイポ防止に使う TypeScript 定数 */
export const shadows = {
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  xl: 'var(--shadow-xl)',
  glowCyan: 'var(--shadow-glow-cyan)',
  glowPurple: 'var(--shadow-glow-purple)',
} as const;
