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
