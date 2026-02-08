/** セーブデータのlocalStorageキー */
export const SAVE_KEY = 'labyrinth-echo-save';

/** 安全に非同期処理を実行するヘルパー */
export const safeAsync = async <T>(
  fn: () => Promise<T>,
  ctx: string
): Promise<T | null> => {
  try {
    return await fn();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[${ctx}]`, msg);
    return null;
  }
};

/** localStorage ラッパー */
export const Storage = Object.freeze({
  save: (data: unknown) =>
    safeAsync(
      async () => localStorage.setItem(SAVE_KEY, JSON.stringify(data)),
      'Storage.save'
    ),
  load: () =>
    safeAsync(async () => {
      const r = localStorage.getItem(SAVE_KEY);
      return r ? JSON.parse(r) : null;
    }, 'Storage.load'),
});
