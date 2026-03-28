/**
 * カラートークン定義
 *
 * 60-30-10 ルールに基づくカラーシステム:
 * - 60% ドミナント（背景・基調色）
 * - 30% セカンダリ（パネル・カード）
 * - 10% アクセント（CTA・重要要素）
 */

/** ライトモード用カラー CSS変数 */
export const lightColors = `
  /* 背景 */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8f9fa;
  --color-bg-tertiary: #e9ecef;

  /* テキスト */
  --color-text-primary: #333333;
  --color-text-secondary: #666666;
  --color-text-muted: #999999;

  /* アクセント */
  --color-accent-primary: #4caf50;
  --color-accent-secondary: #7c4dff;
  --color-accent-primary-hover: #43a047;
  --color-accent-primary-active: #388e3c;

  /* ボーダー */
  --color-border-default: #dee2e6;
  --color-border-subtle: #e9ecef;
  --color-border-accent: #4caf50;

  /* 状態 */
  --color-state-success: #4caf50;
  --color-state-warning: #ffc107;
  --color-state-error: #ef4444;
  --color-state-info: #2196f3;
  --color-state-success-bg: rgba(76, 175, 80, 0.08);
  --color-state-warning-bg: rgba(255, 193, 7, 0.08);
  --color-state-error-bg: rgba(239, 68, 68, 0.08);
  --color-state-info-bg: rgba(33, 150, 243, 0.08);

  /* インタラクティブ */
  --color-interactive-bg: rgba(255, 255, 255, 0.7);
  --color-interactive-bg-hover: rgba(255, 255, 255, 0.9);
  --color-interactive-border: #cccccc;
`;

/** ダークモード（premium-theme）用カラー CSS変数 */
export const darkColors = `
  /* 背景 */
  --color-bg-primary: #0f0c29;
  --color-bg-secondary: #1a1a2e;
  --color-bg-tertiary: #252540;

  /* テキスト */
  --color-text-primary: #ffffff;
  --color-text-secondary: rgba(255, 255, 255, 0.75);
  --color-text-muted: rgba(255, 255, 255, 0.5);

  /* アクセント */
  --color-accent-primary: #00d2ff;
  --color-accent-secondary: #a855f7;
  --color-accent-primary-hover: #33dbff;
  --color-accent-primary-active: #00b8e6;

  /* ボーダー */
  --color-border-default: rgba(255, 255, 255, 0.1);
  --color-border-subtle: rgba(255, 255, 255, 0.05);
  --color-border-accent: #00d2ff;

  /* 状態 */
  --color-state-success: #4caf50;
  --color-state-warning: #fbbf24;
  --color-state-error: #f87171;
  --color-state-info: #60a5fa;
  --color-state-success-bg: rgba(76, 175, 80, 0.1);
  --color-state-warning-bg: rgba(251, 191, 36, 0.1);
  --color-state-error-bg: rgba(248, 113, 113, 0.1);
  --color-state-info-bg: rgba(96, 165, 250, 0.1);

  /* インタラクティブ */
  --color-interactive-bg: rgba(255, 255, 255, 0.08);
  --color-interactive-bg-hover: rgba(255, 255, 255, 0.15);
  --color-interactive-border: rgba(255, 255, 255, 0.2);
`;

/** styled-components 内でタイポ防止に使う TypeScript 定数 */
export const colors = {
  bgPrimary: 'var(--color-bg-primary)',
  bgSecondary: 'var(--color-bg-secondary)',
  bgTertiary: 'var(--color-bg-tertiary)',
  textPrimary: 'var(--color-text-primary)',
  textSecondary: 'var(--color-text-secondary)',
  textMuted: 'var(--color-text-muted)',
  accentPrimary: 'var(--color-accent-primary)',
  accentSecondary: 'var(--color-accent-secondary)',
  accentPrimaryHover: 'var(--color-accent-primary-hover)',
  accentPrimaryActive: 'var(--color-accent-primary-active)',
  borderDefault: 'var(--color-border-default)',
  borderSubtle: 'var(--color-border-subtle)',
  borderAccent: 'var(--color-border-accent)',
  stateSuccess: 'var(--color-state-success)',
  stateWarning: 'var(--color-state-warning)',
  stateError: 'var(--color-state-error)',
  stateInfo: 'var(--color-state-info)',
  stateSuccessBg: 'var(--color-state-success-bg)',
  stateWarningBg: 'var(--color-state-warning-bg)',
  stateErrorBg: 'var(--color-state-error-bg)',
  stateInfoBg: 'var(--color-state-info-bg)',
  interactiveBg: 'var(--color-interactive-bg)',
  interactiveBgHover: 'var(--color-interactive-bg-hover)',
  interactiveBorder: 'var(--color-interactive-border)',
} as const;
