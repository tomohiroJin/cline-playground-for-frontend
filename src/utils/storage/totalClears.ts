const TOTAL_CLEARS_KEY = 'puzzle_total_clears';

/**
 * 累計クリア回数を取得する
 */
export const getTotalClears = (): number => {
  try {
    const value = localStorage.getItem(TOTAL_CLEARS_KEY);
    return value ? parseInt(value, 10) : 0;
  } catch {
    return 0;
  }
};

/**
 * 累計クリア回数をインクリメントする
 */
export const incrementTotalClears = (): number => {
  const current = getTotalClears();
  const next = current + 1;
  try {
    localStorage.setItem(TOTAL_CLEARS_KEY, String(next));
  } catch {
    // ignore
  }
  return next;
};
