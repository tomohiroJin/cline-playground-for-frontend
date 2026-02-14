import { clamp, distance } from '../../utils/math-utils';

// ==================== UTILITIES ====================
export const manhattan = (x1: number, y1: number, x2: number, y2: number) =>
  Math.abs(x2 - x1) + Math.abs(y2 - y1);

export const normAngle = (a: number) => {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
};

export const toHex = (n: number) => Math.floor(n).toString(16).padStart(2, '0').slice(-2);

export const formatTime = (sec: number) =>
  Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');

export { clamp, distance };
