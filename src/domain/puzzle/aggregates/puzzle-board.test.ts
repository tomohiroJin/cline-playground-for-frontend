import {
  createPuzzleBoard,
  movePiece,
  isCompleted,
  calculateCorrectRate,
  PuzzleBoardState,
} from './puzzle-board';

describe('PuzzleBoard 集約', () => {
  describe('createPuzzleBoard', () => {
    it('2×2のボードを生成できる', () => {
      const board = createPuzzleBoard(2);
      expect(board.pieces).toHaveLength(4);
      expect(board.division).toBe(2);
      expect(board.moveCount).toBe(0);
      // 初期状態では全ピースが正解位置なので完成状態
      expect(board.isCompleted).toBe(true);
    });

    it('4×4のボードを生成できる', () => {
      const board = createPuzzleBoard(4);
      expect(board.pieces).toHaveLength(16);
      expect(board.emptyPosition).toEqual({ row: 3, col: 3 });
    });

    it('空白ピースは右下に配置される', () => {
      const board = createPuzzleBoard(3);
      const emptyPiece = board.pieces.find(p => p.isEmpty);
      expect(emptyPiece?.correctPosition).toEqual({ row: 2, col: 2 });
    });

    it('初期状態では全ピースが正解位置にある', () => {
      const board = createPuzzleBoard(4);
      expect(isCompleted(board)).toBe(true);
    });
  });

  describe('movePiece', () => {
    let board: PuzzleBoardState;

    beforeEach(() => {
      // 2×2のボードを作成（初期状態: 空白は右下）
      board = createPuzzleBoard(2);
      // 完成状態を解除するため isCompleted を false に設定
      board = { ...board, isCompleted: false };
    });

    it('空白に隣接するピースを移動できる', () => {
      // 空白は (1,1)、隣接ピース (0,1) のID = 1
      const newBoard = movePiece(board, 1);
      expect(newBoard.moveCount).toBe(1);
      expect(newBoard.emptyPosition).toEqual({ row: 0, col: 1 });
    });

    it('空白に隣接しないピースの移動はエラー', () => {
      // (0,0) は空白 (1,1) に隣接していない
      expect(() => movePiece(board, 0)).toThrow('not adjacent');
    });

    it('空白ピース自体の移動はエラー', () => {
      // ID=3 は空白ピース
      expect(() => movePiece(board, 3)).toThrow('Cannot move empty piece');
    });

    it('存在しないピースの移動はエラー', () => {
      expect(() => movePiece(board, 99)).toThrow('Piece not found');
    });

    it('移動後もピース数は変わらない（事後条件）', () => {
      const newBoard = movePiece(board, 1);
      expect(newBoard.pieces.length).toBe(board.pieces.length);
    });

    it('完成後のピース移動はエラー', () => {
      const completedBoard = { ...board, isCompleted: true };
      expect(() => movePiece(completedBoard, 1)).toThrow('Cannot move piece after completion');
    });
  });

  describe('isCompleted', () => {
    it('全ピースが正解位置にある場合trueを返す', () => {
      const board = createPuzzleBoard(2);
      expect(isCompleted(board)).toBe(true);
    });

    it('ピースが移動済みの場合falseを返す', () => {
      let board = createPuzzleBoard(2);
      board = { ...board, isCompleted: false };
      const movedBoard = movePiece(board, 1);
      expect(isCompleted(movedBoard)).toBe(false);
    });
  });

  describe('calculateCorrectRate', () => {
    it('全ピースが正解位置の場合100を返す', () => {
      const board = createPuzzleBoard(2);
      expect(calculateCorrectRate(board)).toBe(100);
    });

    it('ピースが移動済みの場合100未満を返す', () => {
      let board = createPuzzleBoard(2);
      board = { ...board, isCompleted: false };
      const movedBoard = movePiece(board, 1);
      expect(calculateCorrectRate(movedBoard)).toBeLessThan(100);
    });

    it('ピースが空の場合0を返す', () => {
      const emptyBoard: PuzzleBoardState = {
        pieces: [],
        emptyPosition: { row: 0, col: 0 },
        division: 0,
        moveCount: 0,
        isCompleted: false,
      };
      expect(calculateCorrectRate(emptyBoard)).toBe(0);
    });
  });

  describe('境界値テスト', () => {
    it('連続移動で空白位置が正しく追跡される', () => {
      let board = createPuzzleBoard(3);
      board = { ...board, isCompleted: false };

      // (1,2) → (2,2)
      const board1 = movePiece(board, 5);
      expect(board1.emptyPosition).toEqual({ row: 1, col: 2 });

      // (0,2) → (1,2)
      const board2 = movePiece(board1, 2);
      expect(board2.emptyPosition).toEqual({ row: 0, col: 2 });
      expect(board2.moveCount).toBe(2);
    });

    it('大規模ボード(16×16)を生成できる', () => {
      const board = createPuzzleBoard(16);
      expect(board.pieces).toHaveLength(256);
      expect(board.emptyPosition).toEqual({ row: 15, col: 15 });
    });
  });
});
