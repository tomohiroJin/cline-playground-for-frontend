/**
 * SpeedLine サービスのユニットテスト
 * スピードライン（高速時の速度線エフェクト）のロジックを検証する
 */

import { SpeedRank } from '../../constants';
import {
  spawnSpeedLines,
  updateSpeedLines,
  type SpeedLine,
} from './speed-line-service';

// テスト用の固定シード乱数（Math.random をモックして再現性を確保）
const mockRandom = (values: number[]): jest.SpyInstance => {
  let index = 0;
  return jest.spyOn(Math, 'random').mockImplementation(() => values[index++ % values.length]);
};

describe('spawnSpeedLines', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('正常系', () => {
    it('HIGH ランクのときに新規ラインが追加される', () => {
      // Arrange: 確率を1.0に固定して必ず生成されるようにする
      mockRandom([0.0, 0.5]); // randomBool(prob) → 0.0 < prob なら true / randomRange → 0.5
      const existing: SpeedLine[] = [];

      // Act
      const result = spawnSpeedLines(existing, SpeedRank.HIGH, 400, 600);

      // Assert
      expect(result.length).toBeGreaterThan(0);
    });

    it('生成されたラインは left または right の side を持つ', () => {
      // Arrange
      mockRandom([0.0, 0.5]);
      const existing: SpeedLine[] = [];

      // Act
      const result = spawnSpeedLines(existing, SpeedRank.HIGH, 400, 600);

      // Assert
      result.forEach((line) => {
        expect(['left', 'right']).toContain(line.side);
      });
    });

    it('生成されたラインは opacity が 0 より大きく 1 以下である', () => {
      // Arrange
      mockRandom([0.0, 0.5]);
      const existing: SpeedLine[] = [];

      // Act
      const result = spawnSpeedLines(existing, SpeedRank.HIGH, 400, 600);

      // Assert
      result.forEach((line) => {
        expect(line.opacity).toBeGreaterThan(0);
        expect(line.opacity).toBeLessThanOrEqual(1);
      });
    });

    it('left ラインの x は画面左端付近に生成される', () => {
      // Arrange: side が left になるよう side 選択で 0 を返す
      // randomBool(SPAWN_PROBABILITY) → 0.0 (true) / randomRange (y) → 0.5 / randomBool (side) → 0.0 (left)
      mockRandom([0.0, 0.5, 0.0]);
      const w = 400;

      // Act
      const result = spawnSpeedLines([], SpeedRank.HIGH, w, 600);

      // Assert: left ラインは x が 画面左側（w/2 未満）に配置される
      const leftLines = result.filter((l) => l.side === 'left');
      leftLines.forEach((line) => {
        expect(line.x).toBeLessThan(w / 2);
      });
    });

    it('right ラインの x は画面右端付近に生成される', () => {
      // Arrange: side が right になるよう 0.9 を返す
      mockRandom([0.0, 0.5, 0.9]);
      const w = 400;

      // Act
      const result = spawnSpeedLines([], SpeedRank.HIGH, w, 600);

      // Assert: right ラインは x が 画面右側（w/2 以上）に配置される
      const rightLines = result.filter((l) => l.side === 'right');
      rightLines.forEach((line) => {
        expect(line.x).toBeGreaterThanOrEqual(w / 2);
      });
    });
  });

  describe('異常系', () => {
    it('HIGH 未満のランク（LOW）では本数が増えない', () => {
      // Arrange: 常に生成するように Math.random を 0 に固定
      mockRandom([0.0, 0.5]);
      const existing: SpeedLine[] = [];

      // Act
      const result = spawnSpeedLines(existing, SpeedRank.LOW, 400, 600);

      // Assert: LOW ランクでは生成されない
      expect(result.length).toBe(0);
    });

    it('HIGH 未満のランク（MID）では本数が増えない', () => {
      // Arrange
      mockRandom([0.0, 0.5]);
      const existing: SpeedLine[] = [];

      // Act
      const result = spawnSpeedLines(existing, SpeedRank.MID, 400, 600);

      // Assert: MID ランクでは生成されない
      expect(result.length).toBe(0);
    });
  });

  describe('境界値', () => {
    it('HIGH ランクでも上限本数に達している場合は追加されない', () => {
      // Arrange: ちょうど上限本数（14）のラインが存在する（満杯状態）
      const MAX_SPEED_LINES = 14;
      const fullLines: SpeedLine[] = Array.from({ length: MAX_SPEED_LINES }, (_, i) => ({
        x: i % 2 === 0 ? 10 : 390,
        y: i * 30,
        len: 40,
        opacity: 0.8,
        side: (i % 2 === 0 ? 'left' : 'right') as 'left' | 'right',
      }));
      mockRandom([0.0, 0.5]);

      // Act
      const result = spawnSpeedLines(fullLines, SpeedRank.HIGH, 400, 600);

      // Assert: 上限に達しているので追加されず、本数が変わらない
      expect(result.length).toBe(MAX_SPEED_LINES);
    });

    it('既存ラインが空の場合でも正常に動作する', () => {
      // Arrange
      mockRandom([0.0, 0.5, 0.0]);

      // Act & Assert: エラーが発生しない
      expect(() => spawnSpeedLines([], SpeedRank.HIGH, 400, 600)).not.toThrow();
    });
  });
});

describe('updateSpeedLines', () => {
  describe('正常系', () => {
    it('left ラインは中央（右）方向へ x が増加する', () => {
      // Arrange
      const lines: SpeedLine[] = [
        { x: 10, y: 100, len: 40, opacity: 0.8, side: 'left' },
      ];

      // Act
      const result = updateSpeedLines(lines, 400);

      // Assert
      const updated = result.find((l) => l.side === 'left');
      expect(updated).toBeDefined();
      if (updated) {
        expect(updated.x).toBeGreaterThan(lines[0].x);
      }
    });

    it('right ラインは中央（左）方向へ x が減少する', () => {
      // Arrange
      const lines: SpeedLine[] = [
        { x: 390, y: 100, len: 40, opacity: 0.8, side: 'right' },
      ];

      // Act
      const result = updateSpeedLines(lines, 400);

      // Assert
      const updated = result.find((l) => l.side === 'right');
      expect(updated).toBeDefined();
      if (updated) {
        expect(updated.x).toBeLessThan(lines[0].x);
      }
    });

    it('各フレームで opacity が減衰する', () => {
      // Arrange
      const lines: SpeedLine[] = [
        { x: 50, y: 100, len: 40, opacity: 0.8, side: 'left' },
      ];

      // Act
      const result = updateSpeedLines(lines, 400);

      // Assert
      expect(result[0].opacity).toBeLessThan(lines[0].opacity);
    });

    it('opacity が 0 以下のラインは除去される', () => {
      // Arrange: opacity がほぼ 0 のライン
      const lines: SpeedLine[] = [
        { x: 50, y: 100, len: 40, opacity: 0.001, side: 'left' },
        { x: 100, y: 200, len: 40, opacity: 0.8, side: 'right' },
      ];

      // Act
      const result = updateSpeedLines(lines, 400);

      // Assert: opacity <= 0 のラインが除去され、有効なものだけ残る
      expect(result.length).toBe(1);
      expect(result[0].side).toBe('right');
    });

    it('空の配列を渡してもエラーにならない', () => {
      // Act & Assert
      expect(() => updateSpeedLines([], 400)).not.toThrow();
      expect(updateSpeedLines([], 400)).toEqual([]);
    });
  });

  describe('境界値', () => {
    it('opacity がちょうど 0 のラインは除去される', () => {
      // Arrange
      const lines: SpeedLine[] = [
        { x: 50, y: 100, len: 40, opacity: 0, side: 'left' },
      ];

      // Act
      const result = updateSpeedLines(lines, 400);

      // Assert
      expect(result.length).toBe(0);
    });

    it('複数のラインがすべて有効な場合、すべて残る', () => {
      // Arrange
      const lines: SpeedLine[] = [
        { x: 10, y: 100, len: 40, opacity: 0.9, side: 'left' },
        { x: 390, y: 200, len: 40, opacity: 0.7, side: 'right' },
      ];

      // Act
      const result = updateSpeedLines(lines, 400);

      // Assert
      expect(result.length).toBe(2);
    });
  });
});
