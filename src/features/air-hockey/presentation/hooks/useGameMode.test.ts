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

    it('resetToFree で winScore がデフォルト値（3）にリセットされる', () => {
      const { result } = renderHook(() => useGameMode());

      // ストーリーモードで winScore=5 に変更
      act(() => {
        result.current.setWinScore(5);
      });
      expect(result.current.winScore).toBe(5);

      // resetToFree でデフォルト値に戻る
      act(() => {
        result.current.resetToFree();
      });
      expect(result.current.winScore).toBe(3);
    });

    it('setGameMode で 2p-local に切り替えられる', () => {
      const { result } = renderHook(() => useGameMode());

      act(() => {
        result.current.setGameMode('2p-local');
      });

      expect(result.current.gameMode).toBe('2p-local');
    });

    it('resetToFree で 2p-local からフリーモードにリセットされる', () => {
      const { result } = renderHook(() => useGameMode());

      act(() => {
        result.current.setGameMode('2p-local');
      });

      act(() => {
        result.current.resetToFree();
      });

      expect(result.current.gameMode).toBe('free');
    });
  });

  describe('フリー対戦 CPU キャラ選択', () => {
    it('初期の selectedCpuCharacter は undefined である', () => {
      const { result } = renderHook(() => useGameMode());
      expect(result.current.selectedCpuCharacter).toBeUndefined();
    });

    it('setSelectedCpuCharacter で CPU キャラクターを設定できる', () => {
      const { result } = renderHook(() => useGameMode());
      const mockCharacter = { id: 'hiro', name: 'ヒロ', icon: '', color: '#e67e22', reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] } };

      act(() => {
        result.current.setSelectedCpuCharacter(mockCharacter);
      });

      expect(result.current.selectedCpuCharacter).toEqual(mockCharacter);
    });

    it('resetToFree で selectedCpuCharacter もリセットされる', () => {
      const { result } = renderHook(() => useGameMode());
      const mockCharacter = { id: 'hiro', name: 'ヒロ', icon: '', color: '#e67e22', reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] } };

      act(() => {
        result.current.setSelectedCpuCharacter(mockCharacter);
      });

      act(() => {
        result.current.resetToFree();
      });

      expect(result.current.selectedCpuCharacter).toBeUndefined();
    });
  });

  describe('2P 対戦用の状態管理', () => {
    it('初期の player1Character は undefined である', () => {
      const { result } = renderHook(() => useGameMode());
      expect(result.current.player1Character).toBeUndefined();
    });

    it('初期の player2Character は undefined である', () => {
      const { result } = renderHook(() => useGameMode());
      expect(result.current.player2Character).toBeUndefined();
    });

    it('setPlayer1Character でキャラクターを設定できる', () => {
      const { result } = renderHook(() => useGameMode());
      const mockCharacter = { id: 'player', name: 'アキラ', icon: '', color: '#3498db', reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] } };

      act(() => {
        result.current.setPlayer1Character(mockCharacter);
      });

      expect(result.current.player1Character).toEqual(mockCharacter);
    });

    it('setPlayer2Character でキャラクターを設定できる', () => {
      const { result } = renderHook(() => useGameMode());
      const mockCharacter = { id: 'hiro', name: 'ヒロ', icon: '', color: '#e74c3c', reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] } };

      act(() => {
        result.current.setPlayer2Character(mockCharacter);
      });

      expect(result.current.player2Character).toEqual(mockCharacter);
    });

    it('resetToFree でキャラクター選択もリセットされる', () => {
      const { result } = renderHook(() => useGameMode());
      const mockCharacter = { id: 'player', name: 'アキラ', icon: '', color: '#3498db', reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] } };

      act(() => {
        result.current.setGameMode('2p-local');
        result.current.setPlayer1Character(mockCharacter);
        result.current.setPlayer2Character(mockCharacter);
      });

      act(() => {
        result.current.resetToFree();
      });

      expect(result.current.player1Character).toBeUndefined();
      expect(result.current.player2Character).toBeUndefined();
    });
  });

  describe('ペアマッチ（2v2）用の状態管理', () => {
    const mockAlly = { id: 'rookie', name: 'ルーキー', icon: '', color: '#27ae60', reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] } };
    const mockEnemy1 = { id: 'regular', name: 'レギュラー', icon: '', color: '#e67e22', reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] } };
    const mockEnemy2 = { id: 'ace', name: 'エース', icon: '', color: '#e74c3c', reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] } };

    it('初期の allyCharacter は undefined である', () => {
      const { result } = renderHook(() => useGameMode());
      expect(result.current.allyCharacter).toBeUndefined();
    });

    it('初期の enemyCharacter1 は undefined である', () => {
      const { result } = renderHook(() => useGameMode());
      expect(result.current.enemyCharacter1).toBeUndefined();
    });

    it('初期の enemyCharacter2 は undefined である', () => {
      const { result } = renderHook(() => useGameMode());
      expect(result.current.enemyCharacter2).toBeUndefined();
    });

    it('初期の pairMatchDifficulty は normal である', () => {
      const { result } = renderHook(() => useGameMode());
      expect(result.current.pairMatchDifficulty).toBe('normal');
    });

    it('setAllyCharacter で味方キャラクターを設定できる', () => {
      const { result } = renderHook(() => useGameMode());

      act(() => {
        result.current.setAllyCharacter(mockAlly);
      });

      expect(result.current.allyCharacter).toEqual(mockAlly);
    });

    it('setEnemyCharacter1 で敵1キャラクターを設定できる', () => {
      const { result } = renderHook(() => useGameMode());

      act(() => {
        result.current.setEnemyCharacter1(mockEnemy1);
      });

      expect(result.current.enemyCharacter1).toEqual(mockEnemy1);
    });

    it('setEnemyCharacter2 で敵2キャラクターを設定できる', () => {
      const { result } = renderHook(() => useGameMode());

      act(() => {
        result.current.setEnemyCharacter2(mockEnemy2);
      });

      expect(result.current.enemyCharacter2).toEqual(mockEnemy2);
    });

    it('setPairMatchDifficulty でペアマッチ難易度を変更できる', () => {
      const { result } = renderHook(() => useGameMode());

      act(() => {
        result.current.setPairMatchDifficulty('hard');
      });

      expect(result.current.pairMatchDifficulty).toBe('hard');
    });

    it('resetToFree でペアマッチ用キャラクターもリセットされる', () => {
      const { result } = renderHook(() => useGameMode());

      act(() => {
        result.current.setGameMode('2v2-local');
        result.current.setAllyCharacter(mockAlly);
        result.current.setEnemyCharacter1(mockEnemy1);
        result.current.setEnemyCharacter2(mockEnemy2);
      });

      act(() => {
        result.current.resetToFree();
      });

      expect(result.current.allyCharacter).toBeUndefined();
      expect(result.current.enemyCharacter1).toBeUndefined();
      expect(result.current.enemyCharacter2).toBeUndefined();
    });

    it('resetToFree で pairMatchDifficulty はリセットされない', () => {
      const { result } = renderHook(() => useGameMode());

      act(() => {
        result.current.setPairMatchDifficulty('hard');
      });

      act(() => {
        result.current.resetToFree();
      });

      expect(result.current.pairMatchDifficulty).toBe('hard');
    });
  });
});
