/**
 * デイリーチャレンジユースケースのテスト
 */
import { DailyChallengeUseCase } from './daily-challenge';
import { InMemoryStorageAdapter } from '../../__tests__/helpers/in-memory-storage';
import type { GameStoragePort } from '../../domain/contracts/storage';

describe('DailyChallengeUseCase', () => {
  let storage: GameStoragePort;
  let useCase: DailyChallengeUseCase;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
    useCase = new DailyChallengeUseCase(storage);
  });

  describe('getTodayChallenge', () => {
    it('今日のチャレンジを取得できる', () => {
      const challenge = useCase.getTodayChallenge();
      expect(challenge).toBeDefined();
      expect(challenge.date).toBeDefined();
      expect(challenge.fieldId).toBeDefined();
      expect(challenge.difficulty).toBeDefined();
      expect(challenge.winScore).toBeGreaterThan(0);
      expect(challenge.title).toBeDefined();
    });

    it('同日に複数回呼んでも同じチャレンジが返される', () => {
      const first = useCase.getTodayChallenge();
      const second = useCase.getTodayChallenge();
      expect(first).toEqual(second);
    });
  });

  describe('completeChallenge', () => {
    it('チャレンジ結果を保存できる', () => {
      const result = {
        date: '2026-03-20',
        isCleared: true,
        playerScore: 3,
        cpuScore: 1,
      };
      useCase.completeChallenge(result);
      const saved = useCase.getResult('2026-03-20');
      expect(saved).toEqual(result);
    });

    it('異なる日付の結果が独立して保存される', () => {
      useCase.completeChallenge({
        date: '2026-03-20',
        isCleared: true,
        playerScore: 3,
        cpuScore: 1,
      });
      useCase.completeChallenge({
        date: '2026-03-21',
        isCleared: false,
        playerScore: 1,
        cpuScore: 3,
      });
      expect(useCase.getResult('2026-03-20')?.isCleared).toBe(true);
      expect(useCase.getResult('2026-03-21')?.isCleared).toBe(false);
    });
  });

  describe('getResult', () => {
    it('保存されていない日付はundefinedを返す', () => {
      const result = useCase.getResult('2099-01-01');
      expect(result).toBeUndefined();
    });
  });
});
