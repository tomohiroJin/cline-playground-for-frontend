import { PuzzleImage, PuzzleRank, PuzzleRecord } from '../../types/puzzle';
import { ArtworkStatus } from './types';

/** ランクの優劣順序（大きいほど上位） */
const RANK_ORDER: Record<PuzzleRank, number> = {
  'クリア': 0,
  '★☆☆': 1,
  '★★☆': 2,
  '★★★': 3,
};

/** ランクを比較する。a が上位なら正、同位で 0、下位で負 */
export const compareRank = (a: PuzzleRank, b: PuzzleRank): number =>
  RANK_ORDER[a] - RANK_ORDER[b];

/**
 * 1作品（imageId）について、全難易度のレコードを最良値へ集約する。
 * 収蔵判定は clearCount > 0。表示名は image.alt を流用する。
 */
export const aggregateByArtwork = (
  image: PuzzleImage,
  records: readonly PuzzleRecord[]
): ArtworkStatus => {
  const mine = records.filter(r => r.imageId === image.id && r.clearCount > 0);
  const base = {
    imageId: image.id,
    title: image.alt,
    filename: image.filename,
  };

  if (mine.length === 0) {
    return { ...base, isCollected: false, bestScore: 0, clearCount: 0 };
  }

  const bestScore = Math.max(...mine.map(r => r.bestScore));
  const bestRank = mine
    .map(r => r.bestRank)
    .reduce((best, cur) => (compareRank(cur, best) > 0 ? cur : best));
  const bestTime = Math.min(...mine.map(r => r.bestTime));
  const moves = mine.map(r => r.bestMoves).filter((m): m is number => m !== null);
  const bestMoves = moves.length > 0 ? Math.min(...moves) : undefined;
  const clearCount = mine.reduce((sum, r) => sum + r.clearCount, 0);
  const lastClearDate = mine
    .map(r => r.lastClearDate)
    .reduce((latest, cur) => (cur > latest ? cur : latest));

  return {
    ...base,
    isCollected: true,
    bestRank,
    bestScore,
    bestTime,
    bestMoves,
    clearCount,
    lastClearDate,
  };
};
