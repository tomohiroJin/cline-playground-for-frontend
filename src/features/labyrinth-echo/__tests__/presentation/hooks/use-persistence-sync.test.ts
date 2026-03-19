/**
 * 迷宮の残響 - usePersistenceSync テスト
 *
 * MetaState 変更時の自動保存をテストする。
 */
import { renderHook, act } from '@testing-library/react';
import { usePersistenceSync, mergeWithDefaults } from '../../../presentation/hooks/use-persistence-sync';
import { FRESH_META } from '../../../domain/models/meta-state';
import { createTestMeta } from '../../helpers/factories';

describe('usePersistenceSync', () => {
  let mockStorage: {
    save: jest.Mock;
    load: jest.Mock;
  };

  beforeEach(() => {
    mockStorage = {
      save: jest.fn().mockResolvedValue(undefined),
      load: jest.fn().mockResolvedValue(null),
    };
  });

  describe('初期ロード', () => {
    it('マウント時にストレージからメタデータをロードする', async () => {
      // Arrange
      const savedMeta = createTestMeta({ runs: 5, kp: 100 });
      mockStorage.load.mockResolvedValue(savedMeta);

      // Act
      const { result } = renderHook(() => usePersistenceSync(mockStorage));

      // loaded が true になるまで待つ
      await act(async () => {
        await Promise.resolve();
      });

      // Assert
      expect(mockStorage.load).toHaveBeenCalled();
      expect(result.current.loaded).toBe(true);
      expect(result.current.meta.runs).toBe(5);
      expect(result.current.meta.kp).toBe(100);
    });

    it('ストレージにデータがない場合は初期状態を使用する', async () => {
      // Arrange
      mockStorage.load.mockResolvedValue(null);

      // Act
      const { result } = renderHook(() => usePersistenceSync(mockStorage));

      await act(async () => {
        await Promise.resolve();
      });

      // Assert
      expect(result.current.loaded).toBe(true);
      expect(result.current.meta.runs).toBe(0);
      expect(result.current.meta.kp).toBe(0);
    });

    it('初期ロード時にマイグレーションが適用され、FRESH_METAの全フィールドがデフォルト値で埋められる', async () => {
      // Arrange: 旧フィールド名を含む保存データ（bestFl → bestFloor へマイグレーション対象）
      const legacyData = { bestFl: 3, runs: 2, kp: 50 };
      mockStorage.load.mockResolvedValue(legacyData);

      // Act
      const { result } = renderHook(() => usePersistenceSync(mockStorage));
      await act(async () => {
        await Promise.resolve();
      });

      // Assert: マイグレーション済みフィールド
      expect(result.current.meta.bestFloor).toBe(3);
      expect(result.current.meta.runs).toBe(2);
      expect(result.current.meta.kp).toBe(50);
      // FRESH_META のデフォルト値で補完されたフィールド
      expect(result.current.meta.escapes).toBe(FRESH_META.escapes);
      expect(result.current.meta.totalEvents).toBe(FRESH_META.totalEvents);
      expect(result.current.meta.endings).toEqual(FRESH_META.endings);
      expect(result.current.meta.clearedDifficulties).toEqual(FRESH_META.clearedDifficulties);
      expect(result.current.meta.totalDeaths).toBe(FRESH_META.totalDeaths);
      expect(result.current.meta.lastRun).toBe(FRESH_META.lastRun);
      expect(result.current.meta.activeTitle).toBe(FRESH_META.activeTitle);
      expect(result.current.meta.unlocked).toEqual(FRESH_META.unlocked);
    });

    it('保存データに不足フィールドがある場合、FRESH_METAのデフォルト値で補完される', async () => {
      // Arrange: 一部フィールドのみ含む保存データ（totalEvents, endings を意図的に除外）
      const saved = { runs: 7, kp: 200 } as Record<string, unknown>;
      mockStorage.load.mockResolvedValue(saved);

      // Act
      const { result } = renderHook(() => usePersistenceSync(mockStorage));
      await act(async () => {
        await Promise.resolve();
      });

      // Assert: 保存されていた値はそのまま
      expect(result.current.meta.runs).toBe(7);
      expect(result.current.meta.kp).toBe(200);
      // 不足フィールドはFRESH_METAのデフォルト値
      expect(result.current.meta.totalEvents).toBe(FRESH_META.totalEvents);
      expect(result.current.meta.endings).toEqual(FRESH_META.endings);
      expect(result.current.meta.bestFloor).toBe(FRESH_META.bestFloor);
    });
  });

  describe('mergeWithDefaults', () => {
    it('マイグレーション済みデータのフィールドを保持しつつ、不足フィールドをFRESH_METAで補完する', () => {
      // Arrange
      const migrated: Record<string, unknown> = { runs: 5, kp: 100, bestFloor: 3 };

      // Act
      const result = mergeWithDefaults(migrated);

      // Assert: 指定値が保持される
      expect(result.runs).toBe(5);
      expect(result.kp).toBe(100);
      expect(result.bestFloor).toBe(3);
      // 不足フィールドはデフォルト値
      expect(result.escapes).toBe(FRESH_META.escapes);
      expect(result.totalEvents).toBe(FRESH_META.totalEvents);
      expect(result.endings).toEqual(FRESH_META.endings);
      expect(result.clearedDifficulties).toEqual(FRESH_META.clearedDifficulties);
      expect(result.totalDeaths).toBe(FRESH_META.totalDeaths);
      expect(result.lastRun).toBe(FRESH_META.lastRun);
      expect(result.activeTitle).toBe(FRESH_META.activeTitle);
      expect(result.unlocked).toEqual(FRESH_META.unlocked);
    });

    it('全フィールドが揃っている場合はそのまま返す', () => {
      // Arrange
      const full: Record<string, unknown> = {
        runs: 10, escapes: 2, kp: 500, unlocked: ['t01'],
        bestFloor: 5, totalEvents: 30, endings: ['standard'],
        clearedDifficulties: ['normal'], totalDeaths: 3,
        lastRun: { cause: 'clear', floor: 5, endingId: 'standard', hp: 30, mn: 20, inf: 15 },
        activeTitle: 't01',
      };

      // Act
      const result = mergeWithDefaults(full);

      // Assert
      expect(result.runs).toBe(10);
      expect(result.unlocked).toEqual(['t01']);
      expect(result.lastRun).toEqual(full.lastRun);
    });

    it('空オブジェクトを渡した場合はFRESH_META相当を返す', () => {
      // Arrange & Act
      const result = mergeWithDefaults({});

      // Assert
      for (const key of Object.keys(FRESH_META)) {
        expect(result[key as keyof typeof result]).toEqual(
          FRESH_META[key as keyof typeof FRESH_META]
        );
      }
    });
  });

  describe('自動保存', () => {
    it('updateMeta で変更した内容が自動保存される', async () => {
      // Arrange
      const { result } = renderHook(() => usePersistenceSync(mockStorage));

      await act(async () => {
        await Promise.resolve();
      });

      // Act
      act(() => {
        result.current.updateMeta(m => ({ runs: m.runs + 1 }));
      });

      // Assert
      // 初期ロード後の保存 + updateMeta 後の保存
      expect(mockStorage.save).toHaveBeenCalledWith(
        expect.objectContaining({ runs: 1 }),
      );
    });
  });

  describe('リセット', () => {
    it('resetMeta で全データを初期化する', async () => {
      // Arrange
      const savedMeta = createTestMeta({ runs: 10, kp: 500 });
      mockStorage.load.mockResolvedValue(savedMeta);
      const { result } = renderHook(() => usePersistenceSync(mockStorage));

      await act(async () => {
        await Promise.resolve();
      });

      // Act
      await act(async () => {
        await result.current.resetMeta();
      });

      // Assert
      expect(result.current.meta.runs).toBe(0);
      expect(result.current.meta.kp).toBe(0);
      expect(result.current.meta.unlocked).toEqual([]);
    });
  });
});
