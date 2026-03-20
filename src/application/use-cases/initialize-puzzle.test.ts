import { initializePuzzle } from './initialize-puzzle';

describe('initializePuzzle ユースケース', () => {
  it('指定された分割数でパズルを初期化する', () => {
    const result = initializePuzzle(4);
    expect(result.pieces).toHaveLength(16);
    expect(result.division).toBe(4);
    expect(result.moveCount).toBe(0);
  });

  it('初期化後のパズルはシャッフルされている', () => {
    const result = initializePuzzle(4);
    // シャッフルされているので未完成のはず
    expect(result.isCompleted).toBe(false);
  });

  it('空白ピースが1つだけ存在する', () => {
    const result = initializePuzzle(3);
    const emptyPieces = result.pieces.filter(p => p.isEmpty);
    expect(emptyPieces).toHaveLength(1);
  });

  it('シャッフル回数を指定できる', () => {
    const result = initializePuzzle(2, 5);
    expect(result.pieces).toHaveLength(4);
  });
});
