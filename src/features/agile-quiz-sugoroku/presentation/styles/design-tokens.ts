/**
 * Agile Quiz Sugoroku - デザイントークン
 *
 * UI で使用するスタイル定数を一元管理する。
 * カラー、スペーシング、角丸、フォントサイズ、トランジション等を定義。
 */
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/game-config';

/** デザイントークン */
export const DESIGN_TOKENS = Object.freeze({
  /** カラートークン（既存 COLORS + セマンティックカラー） */
  colors: Object.freeze({
    // 既存 COLORS をスプレッド
    ...COLORS,
    // セマンティックカラー
    primary: COLORS.accent,
    secondary: COLORS.green,
    danger: COLORS.red,
    warning: COLORS.yellow,
    background: COLORS.bg,
    surface: COLORS.card,
    textPrimary: COLORS.text,
    textMuted: COLORS.muted,
  }),

  /** スペーシング */
  spacing: Object.freeze({
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  }),

  /** 角丸 */
  borderRadius: Object.freeze({
    sm: '4px',
    md: '8px',
    lg: '16px',
    round: '50%',
  }),

  /** フォントサイズ */
  fontSize: Object.freeze({
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.25rem',
    xl: '1.5rem',
    xxl: '2rem',
  }),

  /** トランジション */
  transition: Object.freeze({
    fast: '150ms ease',
    normal: '300ms ease',
    slow: '500ms ease',
  }),

  /** フォント */
  fonts: Object.freeze({ ...FONTS }),
});
