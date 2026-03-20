import { completePuzzleUseCase } from './complete-puzzle';
import { PuzzleRecordStorage, TotalClearsStorage } from '../ports/storage-port';

describe('completePuzzle ユースケース', () => {
  // モックストレージ
  const createMockRecordStorage = (): PuzzleRecordStorage => ({
    getAll: jest.fn(() => []),
    get: jest.fn(() => undefined),
    save: jest.fn(),
    recordScore: jest.fn(() => ({ isBestScore: true })),
  });

  const createMockTotalClearsStorage = (): TotalClearsStorage => ({
    get: jest.fn(() => 0),
    increment: jest.fn(() => 1),
  });

  it('スコアを計算して記録を保存する', () => {
    const recordStorage = createMockRecordStorage();
    const totalClearsStorage = createMockTotalClearsStorage();

    const result = completePuzzleUseCase({
      imageId: 'test-image',
      actualMoves: 20,
      optimalMoves: 10,
      elapsedSeconds: 30,
      hintUsed: false,
      division: 4,
      recordStorage,
      totalClearsStorage,
    });

    expect(result.score.totalScore).toBeGreaterThan(0);
    expect(result.score.rank).toBeDefined();
    expect(result.isBestScore).toBe(true);
    expect(totalClearsStorage.increment).toHaveBeenCalled();
    expect(recordStorage.recordScore).toHaveBeenCalledWith(
      'test-image',
      4,
      result.score.totalScore,
      result.score.rank,
      30,
      20
    );
  });

  it('ヒント使用でスコアにペナルティが適用される', () => {
    const recordStorage = createMockRecordStorage();
    const totalClearsStorage = createMockTotalClearsStorage();

    const withHint = completePuzzleUseCase({
      imageId: 'test-image',
      actualMoves: 10,
      optimalMoves: 10,
      elapsedSeconds: 0,
      hintUsed: true,
      division: 4,
      recordStorage,
      totalClearsStorage,
    });

    const withoutHint = completePuzzleUseCase({
      imageId: 'test-image',
      actualMoves: 10,
      optimalMoves: 10,
      elapsedSeconds: 0,
      hintUsed: false,
      division: 4,
      recordStorage,
      totalClearsStorage,
    });

    expect(withHint.score.totalScore).toBeLessThan(withoutHint.score.totalScore);
  });
});
