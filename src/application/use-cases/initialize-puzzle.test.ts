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
    const result = initializePuzzle(2, { shuffleMovesOverride: 5 });
    expect(result.pieces).toHaveLength(4);
  });
});

describe('initializePuzzle シード対応', () => {
  it('同一シードは同一配置を生成する（同日同一シードで再現）', () => {
    const a = initializePuzzle(4, { seed: 20260709 });
    const b = initializePuzzle(4, { seed: 20260709 });
    expect(a.pieces.map(p => p.currentPosition)).toEqual(b.pieces.map(p => p.currentPosition));
    expect(a.emptyPosition).toEqual(b.emptyPosition);
    expect(a.isCompleted).toBe(false);
  });

  it('異なるシードは異なる配置になり得る', () => {
    const a = initializePuzzle(4, { seed: 1 });
    const b = initializePuzzle(4, { seed: 2 });
    expect(a.pieces.map(p => p.currentPosition)).not.toEqual(b.pieces.map(p => p.currentPosition));
  });

  it('seed 未指定時は従来どおり未完成のボードを返す', () => {
    const board = initializePuzzle(3);
    expect(board.isCompleted).toBe(false);
  });

  // 事後条件「必ず未完成」の回帰テスト。
  // 再シャッフルのフォールバックがループ最終試行と同一シードだと、
  // 完成済みボードをそのまま返し得たバグ（seed 対応で混入）への回帰防止。
  // フォールバック自体は通常引数では到達不可能なため、シード指定パス全体で
  // 事後条件が守られること（＝完成済みボードを返さないこと）を複数シード×分割数で担保する。
  it.each([
    [1, 2],
    [2, 3],
    [3, 4],
    [42, 5],
    [20260709, 4],
    [99999999, 3],
  ])('シード %i・分割数 %i でも完成済みボードは返さない', (seed, division) => {
    expect(initializePuzzle(division, { seed }).isCompleted).toBe(false);
  });
});
