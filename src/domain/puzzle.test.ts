import { generateBoard, movePiece, shuffleBoard, isSamePosition } from './puzzle';
import { toCoordinate, toPieceId } from './types';

describe('Puzzle Domain Logic', () => {
  describe('generateBoard', () => {
    it('should generate a board with correct size and pieces', () => {
      const division = 3;
      const state = generateBoard(division);

      expect(state.division).toBe(division);
      expect(state.pieces).toHaveLength(division * division);
      expect(state.completed).toBe(true);
      expect(state.emptyPosition).toEqual({
        row: toCoordinate(2),
        col: toCoordinate(2),
      });
    });

    it('should assign correct positions to pieces', () => {
      const state = generateBoard(2);
      // 0: (0,0), 1: (0,1), 2: (1,0), 3: (1,1) [Empty]
      const piece0 = state.pieces.find(p => p.id === toPieceId(0));
      const piece1 = state.pieces.find(p => p.id === toPieceId(1));

      expect(piece0?.currentPosition).toEqual({ row: toCoordinate(0), col: toCoordinate(0) });
      expect(piece1?.currentPosition).toEqual({ row: toCoordinate(0), col: toCoordinate(1) });
    });
  });

  describe('movePiece', () => {
    it('should move a piece adjacent to empty space', () => {
      // 2x2 board:
      // [0, 1]
      // [2, E]
      // Empty is at (1,1). Piece 2 is at (1,0). Piece 1 is at (0,1).
      const state = generateBoard(2);

      // Move Piece 2 (1,0) to Empty (1,1)
      // New State:
      // [0, 1]
      // [E, 2]
      const result = movePiece(state, toPieceId(2));

      expect(result.ok).toBe(true);
      if (result.ok) {
        const newState = result.value;
        const newPiece2 = newState.pieces.find(p => p.id === toPieceId(2));
        const newEmpty = newState.pieces.find(p => p.isEmpty);

        expect(newPiece2?.currentPosition).toEqual({ row: toCoordinate(1), col: toCoordinate(1) });
        expect(newState.emptyPosition).toEqual({ row: toCoordinate(1), col: toCoordinate(0) });
        expect(newEmpty?.currentPosition).toEqual({ row: toCoordinate(1), col: toCoordinate(0) });
        expect(newState.completed).toBe(false);
      }
    });

    it('should return error for non-adjacent move', () => {
      // 2x2 board. Empty at (1,1). Piece 0 at (0,0) is diagonal (not adjacent).
      const state = generateBoard(2);
      const result = movePiece(state, toPieceId(0));

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('Piece is not adjacent to empty space');
      }
    });

    it('should complete the puzzle when moved correctly', () => {
      // Setup: 2x2 board one step away from completion.
      // [0, 1]
      // [E, 2]
      // Correct for 2 is (1,0). Current is (1,1). Empty at (1,0).
      // Move 2 to (1,0) should complete it.

      const initialState = generateBoard(2);
      // Manually shuffle to "one step away" state using pure functions (or manual setup if needed)
      // Let's use movePiece to create the state properly

      // Initial:
      // [0, 1]
      // [2, E]

      // Move 2 ->
      // [0, 1]
      // [E, 2]
      const step1 = movePiece(initialState, toPieceId(2));
      if (!step1.ok) throw step1.error;

      expect(step1.value.completed).toBe(false);

      // Move 2 back ->
      // [0, 1]
      // [2, E] (Completed)
      const step2 = movePiece(step1.value, toPieceId(2));
      if (!step2.ok) throw step2.error;

      expect(step2.value.completed).toBe(true);
    });
  });

  describe('shuffleBoard', () => {
    it('should shuffle the board loosely based on random provider', () => {
      const state = generateBoard(3);
      // Mock random to always pick the first adjacent move
      const mockRandom = jest.fn().mockReturnValue(0);

      const shuffled = shuffleBoard(state, 5, mockRandom);

      expect(mockRandom).toHaveBeenCalledTimes(5);
      expect(shuffled.completed).toBe(false);
      expect(shuffled.pieces).not.toEqual(state.pieces);
    });
  });
});
