/**
 * ゲームクロック（タイムスケール制御）
 *
 * ゲームループ先頭のゲートとして使い、ヒットストップ（完全停止）と
 * スローモー（間引き）を純粋関数として表現する。副作用は持たない。
 */

/** タイムスケールの状態 */
export interface GameClock {
  /** 完全停止する残り tick 数（ヒットストップ） */
  readonly hitstopFrames: number;
  /** スローモー残り tick 数 */
  readonly slowMoFrames: number;
  /** 何 tick に1回 sim を進めるか（スローモー間引き） */
  readonly slowMoFactor: number;
  /** スローモー間引き判定用のカウンタ */
  readonly tickCounter: number;
}

/** advanceClock の戻り値 */
export interface AdvanceResult {
  readonly clock: GameClock;
  readonly shouldStepSim: boolean;
}

const DEFAULT_SLOWMO_FACTOR = 1;

/** 初期クロックを生成する */
export const createGameClock = (): GameClock => ({
  hitstopFrames: 0,
  slowMoFrames: 0,
  slowMoFactor: DEFAULT_SLOWMO_FACTOR,
  tickCounter: 0,
});

/** 正の整数に正規化する（負・非整数を弾く） */
const normalizeFrames = (frames: number): number => Math.max(0, Math.floor(frames));

/** ヒットストップを発動する（既存より長ければ上書き = max 合成） */
export const triggerHitstop = (clock: GameClock, frames: number): GameClock => ({
  ...clock,
  hitstopFrames: Math.max(clock.hitstopFrames, normalizeFrames(frames)),
});

/** 1 real-tick 進め、シミュレーションを進めるべきか返す */
export const advanceClock = (clock: GameClock): AdvanceResult => {
  // ヒットストップ中: 完全停止
  if (clock.hitstopFrames > 0) {
    return {
      clock: { ...clock, hitstopFrames: clock.hitstopFrames - 1 },
      shouldStepSim: false,
    };
  }
  // 通常進行
  return { clock: { ...clock, tickCounter: 0 }, shouldStepSim: true };
};
