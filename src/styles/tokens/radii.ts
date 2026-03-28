/**
 * 角丸トークン定義
 *
 * コンポーネント間で一貫した角丸を提供
 */

/** 角丸 CSS変数（テーマ共通） */
export const radiiVariables = `
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   16px;
  --radius-2xl:  20px;
  --radius-full: 50%;
`;

/** styled-components 内でタイポ防止に使う TypeScript 定数 */
export const radii = {
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  xxl: 'var(--radius-2xl)',
  full: 'var(--radius-full)',
} as const;
