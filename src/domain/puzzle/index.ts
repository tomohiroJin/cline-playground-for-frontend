/**
 * パズルドメイン バレルエクスポート
 */

// 値オブジェクト
export {
  createGridPosition,
  isPositionEqual,
  isAdjacent,
  getAdjacentPositions,
} from './value-objects/grid-position';

export {
  createDivision,
  calculateShuffleMoves,
  getDivisionMultiplier,
} from './value-objects/division';
export type { Division } from './value-objects/division';

// エンティティ
export {
  createPuzzlePiece,
  isInCorrectPosition,
  movePieceTo,
} from './entities/puzzle-piece';

// 集約
export {
  createPuzzleBoard,
  movePiece,
  isCompleted,
  calculateCorrectRate,
} from './aggregates/puzzle-board';
export type { PuzzleBoardState } from './aggregates/puzzle-board';

// サービス
export { shufflePuzzle } from './services/shuffle-service';
