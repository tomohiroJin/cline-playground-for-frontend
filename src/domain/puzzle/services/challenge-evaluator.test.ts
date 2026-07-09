import { evaluateChallenge } from './challenge-evaluator';

// division 4 → optimalMoves = 32 → timeLimit = 96秒, moveLimit = round(48) = 48
const optimalMoves = 32;

describe('evaluateChallenge', () => {
  it('時間内かつ手数内は gold', () => {
    expect(evaluateChallenge({ elapsedSeconds: 90, actualMoves: 40, optimalMoves })).toBe('gold');
  });

  it('時間内だが手数超過は silver', () => {
    expect(evaluateChallenge({ elapsedSeconds: 90, actualMoves: 60, optimalMoves })).toBe('silver');
  });

  it('手数内だが時間超過は silver', () => {
    expect(evaluateChallenge({ elapsedSeconds: 200, actualMoves: 40, optimalMoves })).toBe('silver');
  });

  it('両方未達（クリアのみ）は bronze', () => {
    expect(evaluateChallenge({ elapsedSeconds: 200, actualMoves: 100, optimalMoves })).toBe('bronze');
  });

  it('境界値（ちょうど制限）は達成扱い', () => {
    // timeLimit=96, moveLimit=48
    expect(evaluateChallenge({ elapsedSeconds: 96, actualMoves: 48, optimalMoves })).toBe('gold');
  });
});
