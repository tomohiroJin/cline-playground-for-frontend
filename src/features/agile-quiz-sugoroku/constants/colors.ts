/**
 * Agile Quiz Sugoroku - カラー定数
 *
 * カラーパレットとカラー関連ユーティリティ
 */

/** カラーパレット */
export const COLORS = Object.freeze({
  bg: '#060a12',
  bg2: '#0c1220',
  card: '#111826',
  border: '#1c2438',
  border2: '#263050',
  text: '#d4dce8',
  text2: '#e8edf4',
  muted: '#5e6e8a',
  accent: '#4d9fff',
  accent2: '#3a7fd9',
  green: '#34d399',
  green2: '#22b07a',
  red: '#f06070',
  red2: '#d84858',
  yellow: '#f0b040',
  yellow2: '#d89a30',
  purple: '#a78bfa',
  orange: '#fb923c',
  cyan: '#22d3ee',
  blue: '#4FC3F7',
  pink: '#f472b6',
  glass: 'rgba(16,22,36,0.82)',
  glassBorder: 'rgba(80,120,200,0.1)',
});

/** 値に応じた色を取得（高いほど良い） */
export function getColorByThreshold(value: number, high: number, low: number): string {
  if (value >= high) return COLORS.green;
  if (value >= low) return COLORS.yellow;
  return COLORS.red;
}

/** 値に応じた色を取得（低いほど良い） */
export function getInverseColorByThreshold(value: number, low: number, high: number): string {
  if (value <= low) return COLORS.green;
  if (value <= high) return COLORS.yellow;
  return COLORS.red;
}
