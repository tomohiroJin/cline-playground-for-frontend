import type { SegState } from './useGameEngine';
import { ROWS, LANES } from '../constants';
import { createSegments, createSegTexts } from './segment-helpers';

/** カスケードフレーム描画のパラメータ */
export interface CascadeFrameParams {
  /** 現在の行インデックス */
  row: number;
  /** 障害物レーン配列 */
  obstacles: readonly number[];
  /** フェイク障害物のレーンインデックス（-1 で無効） */
  fakeIdx: number;
  /** レーンごとの bf（予告開始行）を計算する関数 */
  calcBf: (lane: number) => number;
  /** 避難所判定関数 */
  isShelter: (lane: number) => boolean;
  /** 避難所レーン配列 */
  shelterLanes: readonly number[];
}

/** カスケードフレームの描画結果 */
export interface CascadeFrameResult {
  segs: (SegState | null)[][];
  texts: string[][];
  /** 接近中の危険レーン */
  dangerLanes: number[];
}

/**
 * カスケードアニメーションの1フレームを描画する純粋関数
 *
 * 各行（row）ごとに障害物の表示状態を計算する。
 */
export function renderCascadeFrame(params: CascadeFrameParams): CascadeFrameResult {
  const { row, obstacles, fakeIdx, calcBf, isShelter, shelterLanes } = params;
  const segs = createSegments(shelterLanes);
  const texts = createSegTexts(shelterLanes);

  obstacles.forEach((l) => {
    const bf = calcBf(l);
    const shl = isShelter(l);

    // 現在行に障害物セグメントを描画
    if (row >= bf) {
      if (l === fakeIdx && row < ROWS - 2) {
        segs[l][row] = 'fake';
        texts[l][row] = 'SAFE?';
      } else if (shl) {
        segs[l][row] = 'shieldWarn';
        texts[l][row] = '╳';
      } else {
        segs[l][row] = 'warn';
        texts[l][row] = '╳';
      }
    }
    // 過去行を danger に更新
    for (let pr = bf; pr < row; pr++) {
      if (segs[l][pr] !== 'danger') {
        segs[l][pr] = shl ? 'shield' : 'danger';
        texts[l][pr] = shl ? '─' : '╳';
      }
    }
  });

  // 接近時の危険レーン判定
  const dangerLanes =
    row >= ROWS - 3
      ? obstacles.filter((l) => !isShelter(l) && row >= calcBf(l))
      : [];

  return { segs, texts, dangerLanes };
}

/** ファイナルフレーム描画のパラメータ */
export interface FinalFrameParams {
  obstacles: readonly number[];
  isShelter: (lane: number) => boolean;
  isRestricted: (lane: number) => boolean;
  shelterLanes: readonly number[];
}

/** ファイナルフレームの描画結果 */
export interface FinalFrameResult {
  segs: (SegState | null)[][];
  texts: string[][];
}

/**
 * サイクル最終フレーム（判定直前）の表示を描画する純粋関数
 */
export function renderFinalFrame(params: FinalFrameParams): FinalFrameResult {
  const { obstacles, isShelter, isRestricted, shelterLanes } = params;
  const segs = createSegments(shelterLanes);
  const texts = createSegTexts(shelterLanes);

  // 障害物レーンを全行 danger / impact で埋める
  obstacles.forEach((l) => {
    const shl = isShelter(l);
    for (let r = 0; r < ROWS; r++) {
      segs[l][r] = shl ? 'shield' : 'danger';
      texts[l][r] = shl ? '─' : '╳';
    }
    if (!shl) {
      segs[l][ROWS - 1] = 'impact';
      texts[l][ROWS - 1] = '╳';
    }
  });

  // 安全レーン表示
  const mid = Math.floor(ROWS / 2);
  LANES.filter(
    (l) => (!obstacles.includes(l) && !isRestricted(l)) || isShelter(l),
  ).forEach((l) => {
    segs[l][mid] = 'safe';
    texts[l][mid] = isShelter(l) ? 'SHELTER' : '─SAFE─';
  });

  return { segs, texts };
}
