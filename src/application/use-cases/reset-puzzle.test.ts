import { resetPuzzleUseCase } from './reset-puzzle';

describe('resetPuzzle ユースケース', () => {
  it('パズルをリシャッフルして手数を0にリセットする', () => {
    const result = resetPuzzleUseCase(4);
    expect(result.moveCount).toBe(0);
    expect(result.isCompleted).toBe(false);
    expect(result.pieces).toHaveLength(16);
  });

  it('シャッフル回数を指定できる', () => {
    const result = resetPuzzleUseCase(2, 3);
    expect(result.pieces).toHaveLength(4);
    expect(result.moveCount).toBe(0);
  });
});
