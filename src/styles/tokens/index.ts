/**
 * デザイントークン バレルエクスポート
 *
 * CSS変数文字列と TypeScript 定数の両方を提供します。
 *
 * 既存変数との対応表:
 * --text-primary    → --color-text-primary
 * --text-secondary  → --color-text-secondary
 * --accent-color    → --color-accent-primary
 * --success-color   → --color-state-success
 * --glass-bg        → (既存のまま維持)
 * --glass-border    → (既存のまま維持)
 * --glass-shadow    → (既存のまま維持)
 * --bg-gradient     → (既存のまま維持)
 */

import { lightColors, darkColors } from './colors';
import { typographyVariables } from './typography';
import { spacingVariables } from './spacing';
import { radiiVariables } from './radii';
import { lightShadows, darkShadows } from './shadows';
import { gameUiVariables } from './game-ui';

/** ライトモード用 CSS変数（:root に注入） */
export const lightTokens = `
  ${lightColors}
  ${typographyVariables}
  ${spacingVariables}
  ${radiiVariables}
  ${lightShadows}
  ${gameUiVariables}
`;

/** ダークモード用 CSS変数（body.premium-theme に注入） */
export const darkTokens = `
  ${darkColors}
  ${darkShadows}
`;

// TypeScript 定数の再エクスポート
export { colors } from './colors';
export { typography } from './typography';
export { spacing } from './spacing';
export { radii } from './radii';
export { shadows } from './shadows';
export { gameUi } from './game-ui';
