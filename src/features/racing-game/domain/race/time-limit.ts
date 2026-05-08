// 残時間管理（純粋関数）

/** 残時間から経過時間 dt を減算。下限 0 でクランプ */
export const tickTime = (timeRemainingSec: number, dt: number): number =>
  Math.max(0, timeRemainingSec - dt);

/** 残時間が 0 以下なら時間切れ */
export const isTimeUp = (timeRemainingSec: number): boolean =>
  timeRemainingSec <= 0;
