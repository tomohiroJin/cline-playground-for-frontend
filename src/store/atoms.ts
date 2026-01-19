import { atom } from 'jotai';
import { ImageSize, PuzzleDomainState } from '../domain/types';
import { generateBoard as initBoard } from '../domain/puzzle';

/**
 * 共通のアトム作成ヘルパー関数
 */
function createAtom<T>(defaultValue: T) {
  return atom<T>(defaultValue);
}

// 初期値の定数
const DEFAULT_PUZZLE_DIVISION = 4;
const DEFAULT_PUZZLE_ELAPSED_TIME = 0;

/**
 * アップロードされた画像のURLを管理するアトム
 */
export const imageUrlAtom = createAtom<string | null>(null);

/**
 * 元の画像のサイズを管理するアトム
 */
export const originalImageSizeAtom = createAtom<ImageSize | null>(null);

/**
 * パズルのドメイン状態（ピース、分割数、完了状態など）を管理するアトム
 */
export const puzzleStateAtom = createAtom<PuzzleDomainState>(initBoard(DEFAULT_PUZZLE_DIVISION));

/**
 * パズルの開始時間（タイムスタンプ）を管理するアトム
 */
export const puzzleStartTimeAtom = createAtom<number | null>(null);

/**
 * パズルの経過時間（秒）を管理するアトム
 */
export const puzzleElapsedTimeAtom = createAtom<number>(DEFAULT_PUZZLE_ELAPSED_TIME);

/**
 * ヒントモードが有効かどうかを管理するアトム
 */
export const hintModeEnabledAtom = createAtom<boolean>(false);

/**
 * 完成オーバーレイの表示状態を管理するアトム
 */
export const completionOverlayVisibleAtom = createAtom<boolean>(true);

/**
 * 動画再生モードの状態を管理するアトム
 */
export const videoPlaybackEnabledAtom = createAtom<boolean>(false);

/**
 * 再生する動画のURLを管理するアトム
 */
export const videoUrlAtom = createAtom<string | null>(null);

// ----------------------------------------------------------------------
// Legacy Export Compatibility (for gradual refactoring if needed,
// but since we are doing global refactor, we might not need these exports
// if we update hooks. However, to keep types available for now...)
// ----------------------------------------------------------------------
export type { PuzzlePiece, Position } from '../domain/types';
