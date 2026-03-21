// ラップカウンターのテスト

import { checkLapComplete, calculateLapTime } from '../../../domain/race/lap-counter';
import type { Player } from '../../../domain/player/types';
import type { StartLine } from '../../../domain/track/types';
import { createPlayer } from '../../../domain/player/player-factory';

const makeStartLine = (): StartLine => ({
  cx: 450, cy: 650, px: 0, py: 1, dx: 1, dy: 0, len: 110,
});

const makePlayer = (overrides: Partial<Player> = {}): Player => ({
  ...createPlayer({ x: 450, y: 620, angle: 0, color: '#f00', name: 'P1', isCpu: false }),
  ...overrides,
});

describe('lap-counter', () => {
  describe('checkLapComplete', () => {
    it('スタートラインを横切り全チェックポイント通過済みならラップ完了', () => {
      // Arrange
      const player = makePlayer({
        checkpointFlags: 15, // 4 チェックポイント全通過
        lastSeg: 15,         // トラック末尾のセグメント
        lap: 1,
        lapStart: 1000,
      });

      // Act
      const result = checkLapComplete(
        player,
        makeStartLine(),
        0,        // 現在セグメント = スタート付近
        15,       // 前セグメント = 末尾
        16,       // 全セグメント数
        4,        // 全チェックポイント数
        55,       // トラック幅
        2000,     // 現在時刻
      );

      // Assert
      expect(result.completed).toBe(true);
      expect(result.lapTime).toBe(1000); // 2000 - 1000
    });

    it('チェックポイント未通過ではラップ完了しない', () => {
      const player = makePlayer({
        checkpointFlags: 7, // 3 つしか通過していない（4つ必要）
        lastSeg: 15,
      });

      const result = checkLapComplete(player, makeStartLine(), 0, 15, 16, 4, 55, 2000);
      expect(result.completed).toBe(false);
    });

    it('スタートラインを横切っていない場合はラップ完了しない', () => {
      const player = makePlayer({
        checkpointFlags: 15,
        lastSeg: 5, // トラック中間
      });

      const result = checkLapComplete(player, makeStartLine(), 6, 5, 16, 4, 55, 2000);
      expect(result.completed).toBe(false);
    });
  });

  describe('calculateLapTime', () => {
    it('現在時刻とラップ開始時刻の差を返す', () => {
      expect(calculateLapTime(5000, 3000)).toBe(2000);
    });

    it('結果は 0 以上', () => {
      expect(calculateLapTime(1000, 1000)).toBe(0);
    });
  });
});
