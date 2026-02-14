// 落ち物シューティング ユーティリティ関数

import type { TimingConfig } from './types';

/** ユニークID生成 */
export const uid = (): string => Math.random().toString(36).slice(2);

/** 配列からランダムに1要素を取得 */
export const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

/** タイミング計算（スポーン間隔・落下速度等） */
export const calcTiming = (
  { base, min, decay, stageMult }: TimingConfig,
  time: number,
  stage: number
): number => Math.max(min, base - time * decay - stage * stageMult);
