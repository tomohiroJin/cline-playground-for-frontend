// 時間表示フォーマット（純粋関数 / 共通ユーティリティ）

const padN = (n: number, width = 2): string => n.toString().padStart(width, '0');

/** `M:SS` 形式（HUD / STAGE SELECT 等で使用） */
export const formatTimeMS = (seconds: number): string => {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${padN(s)}`;
};

/** `M:SS:cc` 形式（STAGE CLEAR 等の精密表示で使用、cc はセンチ秒 = 1/100 秒） */
export const formatTimeMScc = (seconds: number): string => {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe % 60);
  const cs = Math.floor((safe * 100) % 100);
  return `${m}:${padN(s)}:${padN(cs)}`;
};
