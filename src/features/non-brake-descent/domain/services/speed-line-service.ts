/**
 * スピードライン（速度線エフェクト）のドメインサービス
 * HIGH ランク時に画面端から中央へ流れる速度線を管理する純粋関数群
 */

import { SpeedRank } from '../../constants';
import { MathUtils } from '../math-utils';

// --- 定数 ---

/** スピードラインの最大同時表示本数 */
const MAX_SPEED_LINES = 14;

/** 1フレームあたりの新規生成確率（HIGH ランク時） */
const SPAWN_PROBABILITY = 0.55;

/** 1フレームあたりの移動速度（ピクセル） */
const MOVE_SPEED = 8;

/** 1フレームあたりの opacity 減衰量 */
const FADE_AMOUNT = 0.045;

/** ライン初期 opacity の最小値 */
const INITIAL_OPACITY_MIN = 0.6;

/** ライン初期 opacity の最大値 */
const INITIAL_OPACITY_MAX = 1.0;

/** ラインの最小長さ（ピクセル） */
const LINE_LENGTH_MIN = 30;

/** ラインの最大長さ（ピクセル） */
const LINE_LENGTH_MAX = 60;

// --- 型定義 ---

/** スピードライン1本の状態 */
export type SpeedLine = {
  readonly x: number;
  readonly y: number;
  readonly len: number;
  readonly opacity: number;
  readonly side: 'left' | 'right';
};

// --- 内部ヘルパー ---

/** 新しいスピードラインを1本生成する */
const createSpeedLine = (w: number, h: number): SpeedLine => {
  // 左右どちらの端から出現するかをランダムに決定
  const side: 'left' | 'right' = MathUtils.randomBool(0.5) ? 'left' : 'right';

  // 左端は画面左側、右端は画面右側に配置
  const x = side === 'left'
    ? MathUtils.randomRange(0, w * 0.15)
    : MathUtils.randomRange(w * 0.85, w);

  const y = MathUtils.randomRange(0, h);
  const len = MathUtils.randomRange(LINE_LENGTH_MIN, LINE_LENGTH_MAX);
  const opacity = MathUtils.randomRange(INITIAL_OPACITY_MIN, INITIAL_OPACITY_MAX);

  return { x, y, len, opacity, side };
};

// --- 公開関数 ---

/**
 * スピードラインを生成する
 * SpeedRank.HIGH のときのみ新規生成する。上限本数を超えない。
 *
 * @param existing - 既存のスピードライン配列
 * @param rank - 現在のスピードランク（SpeedRank 値）
 * @param w - 画面幅（ピクセル）
 * @param h - 画面高さ（ピクセル）
 * @returns 新規生成分を加えたスピードライン配列
 */
export const spawnSpeedLines = (
  existing: readonly SpeedLine[],
  rank: number,
  w: number,
  h: number,
): SpeedLine[] => {
  // HIGH ランク未満では生成しない
  if (rank < SpeedRank.HIGH) {
    return [...existing];
  }

  // 上限に達している場合は生成しない
  if (existing.length >= MAX_SPEED_LINES) {
    return [...existing];
  }

  // 確率判定で生成するかどうかを決定
  if (!MathUtils.randomBool(SPAWN_PROBABILITY)) {
    return [...existing];
  }

  const newLine = createSpeedLine(w, h);
  return [...existing, newLine];
};

/**
 * スピードラインの位置・opacity を更新し、消えたラインを除去する
 * 各ラインを中央方向へ移動しつつフェードアウトさせる
 *
 * @param lines - 現在のスピードライン配列
 * @param w - 画面幅（ピクセル）
 * @returns 更新後のスピードライン配列（opacity <= 0 のものは除去済み）
 */
export const updateSpeedLines = (lines: readonly SpeedLine[], w: number): SpeedLine[] => {
  return lines
    .map((line): SpeedLine => {
      // left は右（中央）方向へ、right は左（中央）方向へ移動
      const dx = line.side === 'left' ? MOVE_SPEED : -MOVE_SPEED;
      return {
        ...line,
        x: line.x + dx,
        opacity: line.opacity - FADE_AMOUNT,
      };
    })
    // opacity が 0 以下のラインを除去
    .filter((line) => line.opacity > 0);
};
