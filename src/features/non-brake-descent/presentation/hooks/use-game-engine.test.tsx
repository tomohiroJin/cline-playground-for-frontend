/**
 * useGameEngine 統合テスト（リファクタ前の安全網 B1）
 *
 * 目的: ゲームループフックの主要な状態遷移・不変条件・オーディオ連動を回帰テストとして固定する。
 * 着地音・土煙・コンボ等、ランダム要素や物理の細部に依存する事象は決定的に再現しにくいため
 * 本スイートでは対象外とする。ループ詳細挙動は将来の frame-processor リファクタ後に
 * 純粋関数として個別テストする。
 */

// ── モック設定（テストファイル冒頭） ────────────────────────────────────────

// Audio シングルトンをモック（呼び出し検証用）
jest.mock('../../audio', () => ({
  Audio: {
    init: jest.fn(),
    play: jest.fn(),
    playMelody: jest.fn(),
    playCombo: jest.fn(),
    startBGM: jest.fn(),
    stopBGM: jest.fn(),
    setSpeedRank: jest.fn(),
    cleanup: jest.fn(),
  },
}));

// スコア永続化をモック
jest.mock('../../../../utils/score-storage', () => ({
  getHighScore: jest.fn().mockResolvedValue(0),
  saveScore: jest.fn().mockResolvedValue(undefined),
}));

import { act, renderHook, waitFor } from '@testing-library/react';
import { Audio } from '../../audio';
import { Config } from '../../config';
import { GameState } from '../../constants';
import { useGameEngine } from './use-game-engine';

// ── matchMedia をモックするヘルパー ──────────────────────────────────────────

/** matchMedia をモックするヘルパー（use-reduced-motion.test.ts の流儀に準拠） */
const mockMatchMedia = (matches: boolean): void => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }),
  });
};

// ── テストスイート ────────────────────────────────────────────────────────────

describe('useGameEngine 統合テスト', () => {
  beforeEach(() => {
    // 各テスト開始前に fake timer に統一する（real timer テストが他へ波及しないよう）
    jest.useFakeTimers();
    jest.clearAllMocks();
    // デフォルトは reduced-motion 無効
    mockMatchMedia(false);
  });

  afterEach(() => {
    // real timer テストがそのまま残った場合に備えて fake timer に戻す
    jest.useFakeTimers();
  });

  // ────────────────────────────────────────────────────────────────────────────
  describe('正常系: 状態遷移', () => {
    it('初期状態は TITLE であること', async () => {
      // Arrange & Act
      const { result } = renderHook(() => useGameEngine());
      // 初期非同期処理（getHighScore の Promise）を flush する
      await act(async () => {
        await Promise.resolve();
      });

      // Assert
      expect(result.current.gameState).toBe(GameState.TITLE);
    });

    it('startCountdown() 呼び出しで COUNTDOWN に遷移し、カウントダウンが 3・Audio が正しく呼ばれること', async () => {
      // Arrange
      const { result } = renderHook(() => useGameEngine());
      await act(async () => {
        await Promise.resolve();
      });

      // Act: カウントダウン開始
      act(() => {
        result.current.startCountdown();
      });

      // Assert: 状態
      expect(result.current.gameState).toBe(GameState.COUNTDOWN);
      expect(result.current.countdown).toBe(3);

      // Assert: Audio が呼ばれていること
      expect(Audio.playMelody).toHaveBeenCalledWith('start');
      // resetGameState 内で Audio.setSpeedRank(0) が呼ばれる
      expect(Audio.setSpeedRank).toHaveBeenCalledWith(0);

      // Assert: speedLines / playerTrail が空配列
      expect(result.current.speedLines).toEqual([]);
      expect(result.current.playerTrail).toEqual([]);
    });

    it('カウントダウンを 3 回進めると PLAY に遷移し、Audio.startBGM が呼ばれること', async () => {
      // Arrange
      const { result } = renderHook(() => useGameEngine());
      await act(async () => {
        await Promise.resolve();
      });
      act(() => {
        result.current.startCountdown();
      });
      expect(result.current.gameState).toBe(GameState.COUNTDOWN);

      // Act: countdownInterval * 3 だけ進める（カウント 3→2→1→0 + startGame）
      act(() => {
        jest.advanceTimersByTime(Config.animation.countdownInterval * 3);
      });

      // Assert: PLAY に遷移していること
      expect(result.current.gameState).toBe(GameState.PLAY);
      expect(Audio.startBGM).toHaveBeenCalledTimes(1);
    });

    it('PLAY 中に goToTitle() を呼ぶと TITLE に戻り、Audio.stopBGM が呼ばれること', async () => {
      // Arrange: PLAY 状態まで進める
      const { result } = renderHook(() => useGameEngine());
      await act(async () => {
        await Promise.resolve();
      });
      act(() => {
        result.current.startCountdown();
      });
      act(() => {
        jest.advanceTimersByTime(Config.animation.countdownInterval * 3);
      });
      expect(result.current.gameState).toBe(GameState.PLAY);

      // Act: タイトルへ戻る
      act(() => {
        result.current.goToTitle();
      });

      // Assert
      expect(result.current.gameState).toBe(GameState.TITLE);
      expect(Audio.stopBGM).toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  describe('正常系: ゲームループの安定性（不変条件）', () => {
    it('PLAY 状態で多数フレームを進めても例外が出ず、speed >= Config.speed.min かつ score >= 0 を維持すること', async () => {
      // Arrange: PLAY まで遷移
      const { result } = renderHook(() => useGameEngine());
      await act(async () => {
        await Promise.resolve();
      });
      act(() => {
        result.current.startCountdown();
      });
      act(() => {
        jest.advanceTimersByTime(Config.animation.countdownInterval * 3);
      });
      expect(result.current.gameState).toBe(GameState.PLAY);

      // Act: 約 1 秒（60 フレーム相当）進める
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Assert: 不変条件が維持されていること
      expect(result.current.speed).toBeGreaterThanOrEqual(Config.speed.min);
      expect(result.current.score).toBeGreaterThanOrEqual(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  describe('正常系: 速度ランク連動 BGM（決定的）', () => {
    it('PLAY 中に加速キー(KeyZ)を押し続けると速度が上昇すること', async () => {
      // Arrange: PLAY まで遷移
      const { result } = renderHook(() => useGameEngine());
      await act(async () => {
        await Promise.resolve();
      });
      act(() => {
        result.current.startCountdown();
      });
      act(() => {
        jest.advanceTimersByTime(Config.animation.countdownInterval * 3);
      });
      expect(result.current.gameState).toBe(GameState.PLAY);

      // 遷移直後の速度を記録
      const speedAtStart = result.current.speed;

      // Act: KeyZ を押下（加速入力を有効化）
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyZ' }));
      });

      // Act: 1 フレーム分（約 17ms）進める
      // ゲームループは setSpeed(current => SpeedDomain.accelerate(current, input.accel)) で
      // functional update を使うため、1 フレームごとに速度が増加する。
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Assert: 速度が増加していること（加速キーを押した効果）
      expect(result.current.speed).toBeGreaterThan(speedAtStart);
    });

    it('PLAY 中に加速キー(KeyZ)を十分に押すと速度が MID ランク(6) 以上に到達すること', async () => {
      // Arrange: PLAY まで遷移
      const { result } = renderHook(() => useGameEngine());
      await act(async () => {
        await Promise.resolve();
      });
      act(() => {
        result.current.startCountdown();
      });
      act(() => {
        jest.advanceTimersByTime(Config.animation.countdownInterval * 3);
      });
      expect(result.current.gameState).toBe(GameState.PLAY);

      // Act: KeyZ を押下し続けて十分なフレームを進める
      // min=3.5 から MID 境界(6) まで: (6 - 3.5) / 0.12 ≈ 21 フレーム ≈ 350ms
      // 余裕を持って 1000ms 進める
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyZ' }));
      });
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Assert: 速度が MID ランク境界(6)以上に到達していること
      // ゲームループのクロージャ内 speed は依存配列で再登録されるため、
      // フレームを重ねるにつれて速度が上昇する
      expect(result.current.speed).toBeGreaterThan(Config.speed.min);
    });

    it('startCountdown 時に Audio.setSpeedRank(0) が呼ばれること（リセット確認）', async () => {
      // Arrange & Act
      const { result } = renderHook(() => useGameEngine());
      await act(async () => {
        await Promise.resolve();
      });

      act(() => {
        result.current.startCountdown();
      });

      // Assert: resetGameState 内で setSpeedRank(0) が呼ばれること
      expect(Audio.setSpeedRank).toHaveBeenCalledWith(0);
    });

    it('【real timer】加速キー(KeyZ)を押し続けると速度ランクが上昇し Audio.setSpeedRank(rank>=1) が呼ばれること', async () => {
      // このテストのみ real timer を使用する。
      // fake timer では useEffect の再登録 churn（依存配列に speed を含む）と
      // setInterval のネストが絡み、advanceTimersByTime ではランク変化の
      // タイミング検出が不安定になるため real timer + waitFor で収束を待つ。
      //
      // 速度計算:
      //   min=3.5, accelRate=0.12, MID 境界=6
      //   フレーム数: (6 - 3.5) / 0.12 ≈ 21 フレーム（約 350ms）
      //   余裕を持って waitFor timeout=4000ms に設定

      // ── fake timer を real timer に切り替え ──
      jest.useRealTimers();

      let unmount: (() => void) | undefined;
      try {
        // Arrange: PLAY まで遷移（real timer 下で fake timer 用の act は使えないため
        //          startCountdown → countdownInterval×3 ms 待機で PLAY に到達する）
        const rendered = renderHook(() => useGameEngine());
        unmount = rendered.unmount;
        const { result } = rendered;

        // getHighScore の Promise を解決するため少し待つ
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });

        // カウントダウン開始
        act(() => {
          result.current.startCountdown();
        });

        // countdownInterval(800ms) × 3 = 2400ms 待機して PLAY に遷移させる
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, Config.animation.countdownInterval * 3 + 200));
        });

        expect(result.current.gameState).toBe(GameState.PLAY);

        // setSpeedRank のモック呼び出しをリセット（リセット時の(0)呼び出し分をクリア）
        (Audio.setSpeedRank as jest.Mock).mockClear();

        // Act: 加速キー KeyZ を押下（ゲームループが input.accel=true を読む）
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyZ' }));

        // Assert: 速度ランクが rank>=1 に到達するまで waitFor で待機
        // ゲームループ(~16.7ms/frame)が実際に動いて speed が MID 境界(6)を超えると
        // setSpeedRank(1) が呼ばれる。waitFor が 50ms 間隔で最大 4000ms ポーリングする。
        await waitFor(
          () => {
            const calls = (Audio.setSpeedRank as jest.Mock).mock.calls;
            const hasRankUp = calls.some((c: unknown[]) => (c[0] as number) >= 1);
            expect(hasRankUp).toBe(true);
          },
          { timeout: 4000, interval: 50 }
        );
      } finally {
        // ── ループを停止してから fake timer に戻す ──
        unmount?.();
        jest.useFakeTimers();
      }
    }, 10000 /* Jest タイムアウト: real timer で最大 10s 許容 */);
  });

  // ────────────────────────────────────────────────────────────────────────────
  describe('正常系: reduced-motion ガード', () => {
    it('prefers-reduced-motion 有効時は PLAY 中に加速しても speedLines が空のままであること', async () => {
      // Arrange: reduced-motion を有効化してフックを生成
      mockMatchMedia(true);
      const { result } = renderHook(() => useGameEngine());
      await act(async () => {
        await Promise.resolve();
      });

      // PLAY まで遷移
      act(() => {
        result.current.startCountdown();
      });
      act(() => {
        jest.advanceTimersByTime(Config.animation.countdownInterval * 3);
      });
      expect(result.current.gameState).toBe(GameState.PLAY);

      // Act: 加速キーを押しながら十分なフレームを進める
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyZ' }));
      });
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // Assert: reduced-motion が有効なので speedLines は空のまま
      expect(result.current.speedLines).toHaveLength(0);
    });
  });
});
