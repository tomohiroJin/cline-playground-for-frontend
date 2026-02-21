/**
 * localStorage の汎用読み書きヘルパー
 */

/**
 * localStorage から値を読み取る
 *
 * @param key ストレージキー
 * @param fallback パースまたは取得に失敗した場合のデフォルト値
 * @returns パースされた値またはフォールバック
 */
export const readLocalStorage = <T>(key: string, fallback: T): T => {
  try {
    const json = localStorage.getItem(key);
    if (json === null) return fallback;
    return JSON.parse(json) as T;
  } catch (error) {
    console.error(`ローカルストレージの読み取りに失敗しました (${key}):`, error);
    return fallback;
  }
};

/**
 * localStorage に値を書き込む
 *
 * @param key ストレージキー
 * @param value 保存する値
 */
export const writeLocalStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`ローカルストレージの書き込みに失敗しました (${key}):`, error);
  }
};
