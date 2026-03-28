/**
 * スペーシングトークン定義
 *
 * 8px ベースのスケールで一貫したスペーシングを実現
 */

/** スペーシング CSS変数（テーマ共通） */
export const spacingVariables = `
  --space-1:  0.25rem;  /*  4px */
  --space-2:  0.5rem;   /*  8px */
  --space-3:  0.75rem;  /* 12px */
  --space-4:  1rem;     /* 16px */
  --space-5:  1.25rem;  /* 20px */
  --space-6:  1.5rem;   /* 24px */
  --space-8:  2rem;     /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
`;

/** styled-components 内でタイポ防止に使う TypeScript 定数 */
export const spacing = {
  space1: 'var(--space-1)',
  space2: 'var(--space-2)',
  space3: 'var(--space-3)',
  space4: 'var(--space-4)',
  space5: 'var(--space-5)',
  space6: 'var(--space-6)',
  space8: 'var(--space-8)',
  space10: 'var(--space-10)',
  space12: 'var(--space-12)',
  space16: 'var(--space-16)',
} as const;
