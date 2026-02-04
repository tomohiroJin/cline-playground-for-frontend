/**
 * 自動マッピング機能のテスト
 */
import { describe, test, expect } from '@jest/globals';
import { initExploration, updateExploration, isGoalDiscovered } from './autoMapping';
import { ExplorationState, Position, TileType, GameMap } from './types';

/**
 * テスト用マップ作成（全て床タイル）
 */
function createTestMap(width: number, height: number): GameMap {
  return Array.from({ length: height }, () => Array(width).fill(TileType.FLOOR));
}

describe('autoMapping', () => {
  describe('initExploration', () => {
    test('初期状態は全て未探索', () => {
      const width = 10;
      const height = 8;
      const exploration = initExploration(width, height);

      expect(exploration.length).toBe(height);
      expect(exploration[0].length).toBe(width);

      // 全てのタイルが未探索
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          expect(exploration[y][x]).toBe(ExplorationState.UNEXPLORED);
        }
      }
    });
  });

  describe('updateExploration', () => {
    test('プレイヤー位置が通過済みになる', () => {
      const map = createTestMap(10, 8);
      const exploration = initExploration(10, 8);
      const player: Position = { x: 5, y: 4 };

      const updated = updateExploration(exploration, player, map);

      // プレイヤー位置は通過済み
      expect(updated[player.y][player.x]).toBe(ExplorationState.EXPLORED);
    });

    test('隣接8マスが可視になる（壁を除く）', () => {
      const map = createTestMap(10, 8);
      const exploration = initExploration(10, 8);
      const player: Position = { x: 5, y: 4 };

      const updated = updateExploration(exploration, player, map);

      // 隣接8マス（全て床なので全て可視）
      const neighbors = [
        { x: 4, y: 3 }, // 左上
        { x: 5, y: 3 }, // 上
        { x: 6, y: 3 }, // 右上
        { x: 4, y: 4 }, // 左
        { x: 6, y: 4 }, // 右
        { x: 4, y: 5 }, // 左下
        { x: 5, y: 5 }, // 下
        { x: 6, y: 5 }, // 右下
      ];

      for (const neighbor of neighbors) {
        expect(updated[neighbor.y][neighbor.x]).toBe(ExplorationState.VISIBLE);
      }
    });

    test('壁タイルは可視にならない', () => {
      const map = createTestMap(10, 8);
      // 上側に壁を配置
      map[3][5] = TileType.WALL;

      const exploration = initExploration(10, 8);
      const player: Position = { x: 5, y: 4 };

      const updated = updateExploration(exploration, player, map);

      // 壁タイルは未探索のまま
      expect(updated[3][5]).toBe(ExplorationState.UNEXPLORED);

      // 他の隣接タイル（床）は可視
      expect(updated[4][4]).toBe(ExplorationState.VISIBLE); // 左
      expect(updated[4][6]).toBe(ExplorationState.VISIBLE); // 右
    });

    test('既に通過済みのタイルは通過済みのまま', () => {
      const map = createTestMap(10, 8);
      let exploration = initExploration(10, 8);

      // 最初の移動
      const player1: Position = { x: 5, y: 4 };
      exploration = updateExploration(exploration, player1, map);

      // 別の位置に移動
      const player2: Position = { x: 7, y: 4 };
      exploration = updateExploration(exploration, player2, map);

      // 最初の位置は通過済みのまま
      expect(exploration[player1.y][player1.x]).toBe(ExplorationState.EXPLORED);
    });

    test('範囲外の座標は無視される', () => {
      const map = createTestMap(10, 8);
      const exploration = initExploration(10, 8);
      const player: Position = { x: 0, y: 0 };

      // エラーが発生しないことを確認
      expect(() => updateExploration(exploration, player, map)).not.toThrow();
    });
  });

  describe('isGoalDiscovered', () => {
    test('ゴール位置が可視または通過済みの場合はtrueを返す', () => {
      const map = createTestMap(10, 8);
      let exploration = initExploration(10, 8);
      const goalPos: Position = { x: 5, y: 5 };

      // 最初は発見されていない
      expect(isGoalDiscovered(exploration, goalPos)).toBe(false);

      // ゴールに隣接する位置に移動
      const player: Position = { x: 4, y: 4 };
      exploration = updateExploration(exploration, player, map);

      // ゴールが可視範囲に入ったので発見
      expect(isGoalDiscovered(exploration, goalPos)).toBe(true);
    });

    test('ゴール位置が未探索の場合はfalseを返す', () => {
      const exploration = initExploration(10, 8);
      const goalPos: Position = { x: 9, y: 7 };

      expect(isGoalDiscovered(exploration, goalPos)).toBe(false);
    });
  });
});
