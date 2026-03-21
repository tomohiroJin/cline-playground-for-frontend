// ============================================================================
// Deep Sea Interceptor - 環境ギミックのテスト
// ============================================================================

import { updateFrame, calculateRank } from '../game-logic';
import { buildGameState, buildUiState } from '../test-factories';
import { Config } from '../constants';

describe('環境ギミック', () => {
  const mockAudioPlay = jest.fn();

  beforeEach(() => {
    mockAudioPlay.mockClear();
  });

  describe('Stage 1: 海流ギミック', () => {
    it('プレイヤーに横方向の力が適用されること', () => {
      // Arrange
      const gd = buildGameState({ currentDirection: 1, currentChangeTime: Date.now() });
      const ui = buildUiState({ stage: 1 });
      const initialX = gd.player.x;

      // Act
      updateFrame(gd, ui, Date.now(), mockAudioPlay);

      // Assert
      // 海流による力 + 入力なし → 横方向にずれる
      expect(gd.player.x).not.toBe(initialX);
    });

    it('10秒経過で海流方向が反転すること', () => {
      // Arrange
      const now = Date.now();
      const gd = buildGameState({
        currentDirection: 1,
        currentChangeTime: now - 11000,
      });
      const ui = buildUiState({ stage: 1 });

      // Act
      updateFrame(gd, ui, now, mockAudioPlay);

      // Assert
      expect(gd.currentDirection).toBe(-1);
    });
  });

  describe('Stage 3: 熱水柱ギミック', () => {
    it('熱水柱タイマーが加算されること', () => {
      // Arrange
      const gd = buildGameState({ thermalVentTimer: 0 });
      const ui = buildUiState({ stage: 3 });

      // Act
      updateFrame(gd, ui, Date.now(), mockAudioPlay);

      // Assert
      // thermalVentTimer が16加算される（1フレーム分）
      // ただし5000を超えるとリセットされるので16であること
      expect(gd.thermalVentTimer).toBe(16);
    });

    it('5秒経過で熱水柱が生成されること', () => {
      // Arrange
      const gd = buildGameState({ thermalVentTimer: 4990, thermalVents: [] });
      const ui = buildUiState({ stage: 3 });

      // Act
      updateFrame(gd, ui, Date.now(), mockAudioPlay);

      // Assert
      // 4990 + 16 > 5000 で熱水柱が生成される
      expect(gd.thermalVents.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Stage 5: 水圧ギミック', () => {
    it('30秒経過後に壁が収縮すること', () => {
      // Arrange
      const now = Date.now();
      const gd = buildGameState({
        gameStartTime: now - 35000,
        bossDefeated: false,
      });
      const ui = buildUiState({ stage: 5 });

      // Act
      updateFrame(gd, ui, now, mockAudioPlay);

      // Assert
      expect(gd.pressureBounds.left).toBeGreaterThan(0);
      expect(gd.pressureBounds.right).toBeLessThan(Config.canvas.width);
    });

    it('ボス撃破後に壁が解除されること', () => {
      // Arrange
      const now = Date.now();
      const gd = buildGameState({
        gameStartTime: now - 35000,
        bossDefeated: true,
        bossDefeatedTime: now - 100,
      });
      const ui = buildUiState({ stage: 5 });

      // Act
      updateFrame(gd, ui, now, mockAudioPlay);

      // Assert
      expect(gd.pressureBounds.left).toBe(0);
      expect(gd.pressureBounds.right).toBe(Config.canvas.width);
    });
  });
});

describe('calculateRank', () => {
  describe('正常系', () => {
    it('standard難易度で40000点以上かつ残機ありでSランクになること', () => {
      // Arrange & Act
      const rank = calculateRank(40000, 3, 'standard');

      // Assert
      expect(rank).toBe('S');
    });

    it('standard難易度で25000点以上でAランクになること', () => {
      // Arrange & Act
      const rank = calculateRank(25000, 0, 'standard');

      // Assert
      expect(rank).toBe('A');
    });

    it('standard難易度で15000点以上でBランクになること', () => {
      // Arrange & Act
      const rank = calculateRank(15000, 0, 'standard');

      // Assert
      expect(rank).toBe('B');
    });

    it('standard難易度で5000点以上でCランクになること', () => {
      // Arrange & Act
      const rank = calculateRank(5000, 0, 'standard');

      // Assert
      expect(rank).toBe('C');
    });

    it('standard難易度で5000点未満でDランクになること', () => {
      // Arrange & Act
      const rank = calculateRank(4999, 0, 'standard');

      // Assert
      expect(rank).toBe('D');
    });
  });

  describe('難易度による補正', () => {
    it('cadet難易度はスコアが2倍で割られること', () => {
      // Arrange & Act
      // cadet: 40000 / 2.0 = 20000 → Bランク
      const rank = calculateRank(40000, 3, 'cadet');

      // Assert
      expect(rank).toBe('B');
    });

    it('abyss難易度はスコアが0.5で割られること', () => {
      // Arrange & Act
      // abyss: 20000 / 0.5 = 40000 → Sランク（残機あり）
      const rank = calculateRank(20000, 1, 'abyss');

      // Assert
      expect(rank).toBe('S');
    });
  });

  describe('境界値', () => {
    it('40000点でも残機0ならAランクになること', () => {
      // Arrange & Act
      const rank = calculateRank(40000, 0, 'standard');

      // Assert
      expect(rank).toBe('A');
    });
  });
});
