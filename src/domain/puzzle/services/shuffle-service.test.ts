import { shufflePuzzle } from './shuffle-service';
import { createPuzzleBoard, isCompleted } from '../aggregates/puzzle-board';

describe('ShuffleService', () => {
  describe('shufflePuzzle', () => {
    it('シャッフル後にピース数が変わらない', () => {
      const board = createPuzzleBoard(3);
      const shuffled = shufflePuzzle(board, 20);
      expect(shuffled.pieces.length).toBe(board.pieces.length);
    });

    it('十分な回数シャッフルすると未完成状態になる', () => {
      const board = createPuzzleBoard(4);
      const shuffled = shufflePuzzle(board, 100);
      // 確率的に未完成（非常に低い確率で完成状態に戻る可能性あり）
      // 100回シャッフルで完成状態に戻る確率は実質的にゼロ
      expect(isCompleted(shuffled)).toBe(false);
    });

    it('シャッフル後に空白ピースが1つだけ存在する', () => {
      const board = createPuzzleBoard(4);
      const shuffled = shufflePuzzle(board, 50);
      const emptyPieces = shuffled.pieces.filter(p => p.isEmpty);
      expect(emptyPieces).toHaveLength(1);
    });

    it('シャッフル後の空白位置がemptyPositionと一致する', () => {
      const board = createPuzzleBoard(3);
      const shuffled = shufflePuzzle(board, 30);
      const emptyPiece = shuffled.pieces.find(p => p.isEmpty);
      expect(emptyPiece?.currentPosition).toEqual(shuffled.emptyPosition);
    });

    it('0回シャッフルは元のボードと同じ', () => {
      const board = createPuzzleBoard(2);
      const shuffled = shufflePuzzle(board, 0);
      expect(shuffled.pieces).toEqual(board.pieces);
    });

    it('大規模分割(8×8)でも正しくシャッフルされる', () => {
      const board = createPuzzleBoard(8);
      const shuffled = shufflePuzzle(board, 128);
      expect(shuffled.pieces).toHaveLength(64);
      expect(shuffled.pieces.filter(p => p.isEmpty)).toHaveLength(1);
    });
  });
});
