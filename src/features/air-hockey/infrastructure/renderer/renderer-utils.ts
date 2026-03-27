/**
 * レンダラー共通ユーティリティ
 * - 色操作関数
 * - パック速度ベースの表示関数
 */

// パック速度の閾値定数
export const SPEED_NORMAL = 8;
export const SPEED_FAST = 13;

// HEX カラーを RGB 成分に分解する
const parseHex = (hex: string): [number, number, number] => {
  const num = parseInt(hex.replace('#', ''), 16);
  return [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff];
};

// 色を明るくする
export const lightenColor = (hex: string, amount: number): string => {
  const [r, g, b] = parseHex(hex);
  return `rgb(${Math.min(255, r + amount)}, ${Math.min(255, g + amount)}, ${Math.min(255, b + amount)})`;
};

// 色を暗くする
export const darkenColor = (hex: string, amount: number): string => {
  const [r, g, b] = parseHex(hex);
  return `rgb(${Math.max(0, r - amount)}, ${Math.max(0, g - amount)}, ${Math.max(0, b - amount)})`;
};

// 速度に応じたパックの色を取得
export const getPuckColorBySpeed = (speed: number): string => {
  if (speed > SPEED_FAST) return '#ff4444';
  if (speed > SPEED_NORMAL) return '#ffdd00';
  return '#ffffff';
};

// 速度に応じたトレイル長を取得
export const getTrailLengthBySpeed = (speed: number): number => {
  if (speed > SPEED_FAST) return 16;
  if (speed > SPEED_NORMAL) return 12;
  return 8;
};
