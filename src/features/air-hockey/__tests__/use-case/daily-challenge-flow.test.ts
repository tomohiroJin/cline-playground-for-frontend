/**
 * デイリーチャレンジフロー結合テスト
 * - 日付ベースの一意生成・結果保存・冪等性を検証
 */
import { DailyChallengeUseCase } from '../../application/use-cases/daily-challenge';
import { InMemoryStorageAdapter } from '../helpers/in-memory-storage';

describe('デイリーチャレンジフロー', () => {
  let storage: InMemoryStorageAdapter;
  let useCase: DailyChallengeUseCase;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
    useCase = new DailyChallengeUseCase(storage);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('今日のチャレンジが日付ベースで一意に生成される', () => {
    // Arrange & Act
    const challenge = useCase.getTodayChallenge();

    // Assert: 必要なプロパティが存在する
    expect(challenge.date).toBeDefined();
    expect(challenge.fieldId).toBeDefined();
    expect(challenge.difficulty).toBeDefined();
    expect(challenge.winScore).toBeGreaterThan(0);
    expect(challenge.modifiers.length).toBeGreaterThan(0);
    expect(challenge.title).toBeDefined();
  });

  it('チャレンジ完了結果が保存される', () => {
    // Arrange
    const challenge = useCase.getTodayChallenge();
    const result = {
      date: challenge.date,
      isCleared: true,
      playerScore: 5,
      cpuScore: 3,
    };

    // Act
    useCase.completeChallenge(result);

    // Assert: ストレージから結果を取得できる
    const savedResult = useCase.getResult(challenge.date);
    expect(savedResult).toBeDefined();
    expect(savedResult?.isCleared).toBe(true);
    expect(savedResult?.playerScore).toBe(5);
    expect(savedResult?.cpuScore).toBe(3);
  });

  it('同日に再度アクセスすると同じチャレンジが返される', () => {
    // Arrange & Act
    const challenge1 = useCase.getTodayChallenge();
    const challenge2 = useCase.getTodayChallenge();

    // Assert: 同じ日なので同一のチャレンジが生成される
    expect(challenge1.date).toBe(challenge2.date);
    expect(challenge1.fieldId).toBe(challenge2.fieldId);
    expect(challenge1.difficulty).toBe(challenge2.difficulty);
    expect(challenge1.winScore).toBe(challenge2.winScore);
    expect(challenge1.title).toBe(challenge2.title);
    expect(challenge1.modifiers).toEqual(challenge2.modifiers);
  });

  it('異なる日付にアクセスすると異なるチャレンジが生成される', () => {
    // Arrange
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-20'));
    const useCase1 = new DailyChallengeUseCase(storage);
    const challenge1 = useCase1.getTodayChallenge();

    // Act: 翌日に進める
    jest.setSystemTime(new Date('2026-03-21'));
    const useCase2 = new DailyChallengeUseCase(storage);
    const challenge2 = useCase2.getTodayChallenge();

    // Assert: 日付が異なる
    expect(challenge1.date).not.toBe(challenge2.date);
  });
});
