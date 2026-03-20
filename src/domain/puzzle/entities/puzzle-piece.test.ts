import { createPuzzlePiece, isInCorrectPosition, movePieceTo } from './puzzle-piece';

describe('PuzzlePiece エンティティ', () => {
  describe('createPuzzlePiece', () => {
    it('通常のピースを作成できる', () => {
      const piece = createPuzzlePiece(0, { row: 0, col: 0 }, false);
      expect(piece.id).toBe(0);
      expect(piece.correctPosition).toEqual({ row: 0, col: 0 });
      expect(piece.currentPosition).toEqual({ row: 0, col: 0 });
      expect(piece.isEmpty).toBe(false);
    });

    it('空白ピースを作成できる', () => {
      const piece = createPuzzlePiece(15, { row: 3, col: 3 }, true);
      expect(piece.isEmpty).toBe(true);
    });
  });

  describe('isInCorrectPosition', () => {
    it('正しい位置にあるピースはtrueを返す', () => {
      const piece = createPuzzlePiece(0, { row: 0, col: 0 }, false);
      expect(isInCorrectPosition(piece)).toBe(true);
    });

    it('間違った位置にあるピースはfalseを返す', () => {
      const piece = createPuzzlePiece(0, { row: 0, col: 0 }, false);
      const movedPiece = movePieceTo(piece, { row: 1, col: 0 });
      expect(isInCorrectPosition(movedPiece)).toBe(false);
    });
  });

  describe('movePieceTo', () => {
    it('新しい位置に移動した新しいピースを返す', () => {
      const piece = createPuzzlePiece(0, { row: 0, col: 0 }, false);
      const movedPiece = movePieceTo(piece, { row: 1, col: 0 });

      expect(movedPiece.currentPosition).toEqual({ row: 1, col: 0 });
      expect(movedPiece.correctPosition).toEqual({ row: 0, col: 0 });
      expect(movedPiece.id).toBe(0);
    });

    it('元のピースは変更されない（不変更新）', () => {
      const piece = createPuzzlePiece(0, { row: 0, col: 0 }, false);
      movePieceTo(piece, { row: 1, col: 0 });

      expect(piece.currentPosition).toEqual({ row: 0, col: 0 });
    });
  });
});
