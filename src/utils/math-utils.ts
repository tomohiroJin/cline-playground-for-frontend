/**
 * 共通数学関数モジュール
 * 複数のゲームやコンポーネントで使用される数学ユーティリティ関数
 */

/**
 * 2点間のユークリッド距離を計算する
 * @param x1 点1のX座標
 * @param y1 点1のY座標
 * @param x2 点2のX座標
 * @param y2 点2のY座標
 * @returns 2点間の距離
 */
export const distance = (x1: number, y1: number, x2: number, y2: number): number =>
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

/**
 * 値を指定範囲内に制限する
 * @param value 制限する値
 * @param min 最小値
 * @param max 最大値
 * @returns 制限された値
 */
export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

/**
 * ベクトルの大きさ（長さ）を計算する
 * @param vx X成分
 * @param vy Y成分
 * @returns ベクトルの大きさ
 */
export const magnitude = (vx: number, vy: number): number => Math.sqrt(vx ** 2 + vy ** 2);

/**
 * 指定範囲内のランダムな浮動小数点数を生成する
 * @param min 最小値（含む）
 * @param max 最大値（含まない）
 * @returns ランダムな浮動小数点数
 */
export const randomRange = (min: number, max: number): number => Math.random() * (max - min) + min;

/**
 * 指定範囲内のランダムな整数を生成する
 * @param min 最小値（含む）
 * @param max 最大値（含む）
 * @returns ランダムな整数
 */
export const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * 線形補間（Linear Interpolation）
 * @param a 開始値
 * @param b 終了値
 * @param t 補間係数（0〜1）
 * @returns 補間された値
 */
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * 配列をFisher-Yatesアルゴリズムでシャッフルする（元の配列は変更しない）
 * @param array シャッフルする配列
 * @returns シャッフルされた新しい配列
 */
export const shuffle = <T>(array: readonly T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * 値を指定範囲から0〜1の範囲に正規化する
 * @param value 正規化する値
 * @param min 入力範囲の最小値
 * @param max 入力範囲の最大値
 * @returns 0〜1に正規化された値
 */
export const normalize = (value: number, min: number, max: number): number => {
  if (max === min) return 0;
  return (value - min) / (max - min);
};

/**
 * 2Dベクトルを正規化する（単位ベクトルにする）
 * ゼロベクトルの場合は{x: 0, y: 0}を返す
 * @param x X成分
 * @param y Y成分
 * @returns 正規化されたベクトル
 */
export const normalizeVector = (x: number, y: number): { x: number; y: number } => {
  const len = Math.sqrt(x * x + y * y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: x / len, y: y / len };
};

/**
 * 2点間のマンハッタン距離を計算する
 * @param x1 点1のX座標
 * @param y1 点1のY座標
 * @param x2 点2のX座標
 * @param y2 点2のY座標
 * @returns マンハッタン距離
 */
export const manhattanDistance = (x1: number, y1: number, x2: number, y2: number): number =>
  Math.abs(x2 - x1) + Math.abs(y2 - y1);

/**
 * 指定した確率でtrueを返すランダムブール値を生成する
 * @param probability trueが返る確率（0〜1、デフォルト0.5）
 * @returns ランダムなブール値
 */
export const randomBool = (probability: number = 0.5): boolean => Math.random() < probability;
