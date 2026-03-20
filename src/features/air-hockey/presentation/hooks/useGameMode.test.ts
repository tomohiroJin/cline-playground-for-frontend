import { renderHook, act } from '@testing-library/react';
import { useGameMode } from './useGameMode';
import { FIELDS } from '../../core/config';

describe('useGameMode', () => {
  describe('初期状態', () => {
    it('初期モードは free である', () => {
      const { result } = renderHook(() => useGameMode());
      expect(result.current.gameMode).toBe('free');
    });

    it('初期難易度は normal である', () => {
      const { result } = renderHook(() => useGameMode());
      expect(result.current.difficulty).toBe('normal');
    });

    it('初期フィールドは FIELDS[0] である', () => {
      const { result } = renderHook(() => useGameMode());
      expect(result.current.field).toEqual(FIELDS[0]);
    });

    it('初期勝利スコアは 3 である', () => {
      const { result } = renderHook(() => useGameMode());
      expect(result.current.winScore).toBe(3);
    });

    it('初期のデイリーモードは false である', () => {
      const { result } = renderHook(() => useGameMode());
      expect(result.current.isDailyMode).toBe(false);
    });

    it('初期のストーリーステージは undefined である', () => {
      const { result } = renderHook(() => useGameMode());
      expect(result.current.currentStage).toBeUndefined();
    });
  });

  describe('設定変更', () => {
    it('setDifficulty で難易度を変更できる', () => {
      const { result } = renderHook(() => useGameMode());

      act(() => {
        result.current.setDifficulty('hard');
      });

      expect(result.current.difficulty).toBe('hard');
    });

    it('setField でフィールドを変更できる', () => {
      const { result } = renderHook(() => useGameMode());

      act(() => {
        result.current.setField(FIELDS[1]);
      });

      expect(result.current.field).toEqual(FIELDS[1]);
    });

    it('setWinScore で勝利スコアを変更できる', () => {
      const { result } = renderHook(() => useGameMode());

      act(() => {
        result.current.setWinScore(5);
      });

      expect(result.current.winScore).toBe(5);
    });

    it('setWinScore に 0 以下を渡すと 1 にクランプされる', () => {
      const { result } = renderHook(() => useGameMode());

      act(() => {
        result.current.setWinScore(0);
      });
      expect(result.current.winScore).toBe(1);

      act(() => {
        result.current.setWinScore(-5);
      });
      expect(result.current.winScore).toBe(1);
    });

    it('setWinScore に 10 を超える値を渡すと 10 にクランプされる', () => {
      const { result } = renderHook(() => useGameMode());

      act(() => {
        result.current.setWinScore(99);
      });

      expect(result.current.winScore).toBe(10);
    });

    it('setWinScore に小数を渡すと切り捨てられる', () => {
      const { result } = renderHook(() => useGameMode());

      act(() => {
        result.current.setWinScore(3.7);
      });

      expect(result.current.winScore).toBe(3);
    });
  });

  describe('モード切り替え', () => {
    it('setGameMode で story に切り替えられる', () => {
      const { result } = renderHook(() => useGameMode());

      act(() => {
        result.current.setGameMode('story');
      });

      expect(result.current.gameMode).toBe('story');
    });

    it('setIsDailyMode でデイリーモードを切り替えられる', () => {
      const { result } = renderHook(() => useGameMode());

      act(() => {
        result.current.setIsDailyMode(true);
      });

      expect(result.current.isDailyMode).toBe(true);
    });

    it('resetToFree でフリーモードにリセットされる', () => {
      const { result } = renderHook(() => useGameMode());

      act(() => {
        result.current.setGameMode('story');
        result.current.setIsDailyMode(true);
      });

      act(() => {
        result.current.resetToFree();
      });

      expect(result.current.gameMode).toBe('free');
      expect(result.current.isDailyMode).toBe(false);
    });
  });
});
