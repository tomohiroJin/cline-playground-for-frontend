/**
 * localStorage アダプタ
 *
 * localStorage への汎用的な読み書きを提供する。
 * 既存の utils/storage/localStorage.ts から移動。
 */

/**
 * localStorage から値を読み取る
 *
 * JSON パースに失敗した場合や、データが破損している場合はフォールバック値を返す。
 * localStorage の値はユーザーが手動変更可能なため、パースエラーは許容する。
 *
 * @param key ストレージキー
 * @param fallback パースまたは取得に失敗した場合のデフォルト値
 * @param validator オプションのバリデーション関数（構造チェック用）
 * @returns パースされた値またはフォールバック
 */
export const readLocalStorage = <T>(
  key: string,
  fallback: T,
  validator?: (value: unknown) => value is T
): T => {
  try {
    const json = localStorage.getItem(key);
    if (json === null) return fallback;

    const parsed: unknown = JSON.parse(json);

    // バリデーション関数が提供されている場合は検証する
    if (validator) {
      return validator(parsed) ? parsed : fallback;
    }

    // 基本的な型チェック: フォールバックと同じ構造型であることを確認
    if (Array.isArray(fallback)) {
      return Array.isArray(parsed) ? (parsed as T) : fallback;
    }
    if (typeof parsed !== typeof fallback && fallback !== null) {
      return fallback;
    }

    return parsed as T;
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
