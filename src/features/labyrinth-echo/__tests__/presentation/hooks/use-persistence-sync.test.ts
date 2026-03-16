/**
 * 迷宮の残響 - usePersistenceSync テスト
 *
 * MetaState 変更時の自動保存をテストする。
 */
import { renderHook, act } from '@testing-library/react';
import { usePersistenceSync } from '../../../presentation/hooks/use-persistence-sync';
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
        await new Promise(r => setTimeout(r, 0));
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
        await new Promise(r => setTimeout(r, 0));
      });

      // Assert
      expect(result.current.loaded).toBe(true);
      expect(result.current.meta.runs).toBe(0);
      expect(result.current.meta.kp).toBe(0);
    });
  });

  describe('自動保存', () => {
    it('updateMeta で変更した内容が自動保存される', async () => {
      // Arrange
      const { result } = renderHook(() => usePersistenceSync(mockStorage));

      await act(async () => {
        await new Promise(r => setTimeout(r, 0));
      });

      // Act
      act(() => {
        result.current.updateMeta(m => ({ runs: m.runs + 1 }));
      });

      // Assert
      // 初期ロード後の保存 + updateMeta 後の保存
      expect(mockStorage.save).toHaveBeenCalled();
      const lastCall = mockStorage.save.mock.calls[mockStorage.save.mock.calls.length - 1][0];
      expect(lastCall.runs).toBe(1);
    });
  });

  describe('リセット', () => {
    it('resetMeta で全データを初期化する', async () => {
      // Arrange
      const savedMeta = createTestMeta({ runs: 10, kp: 500 });
      mockStorage.load.mockResolvedValue(savedMeta);
      const { result } = renderHook(() => usePersistenceSync(mockStorage));

      await act(async () => {
        await new Promise(r => setTimeout(r, 0));
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
