/**
 * ゲーム進行状態の atom 定義
 */
import { atom } from 'jotai';
import { PuzzleScore } from '../../types/puzzle';

/** ゲームフェーズ */
export type GamePhase = 'title' | 'setup' | 'playing' | 'result';

/** ゲームフェーズ atom */
export const gamePhaseAtom = atom<GamePhase>('title');

/** 選択画像URL */
export const selectedImageUrlAtom = atom<string | null>(null);

/** 選択画像の元サイズ */
export const selectedImageSizeAtom = atom<{ width: number; height: number } | null>(null);

/** 経過時間（秒） */
export const gameElapsedTimeAtom = atom<number>(0);

/** スコア */
export const gameScoreAtom = atom<PuzzleScore | null>(null);

/** ベストスコアフラグ */
export const isBestScoreAtom = atom<boolean>(false);
