import { movePlayer, createPlayer } from '../player';
import { TileType, GameMap, Direction } from '../types';

describe('player', () => {
  describe('createPlayer', () => {
    test('初期位置でプレイヤーを作成できること', () => {
      const player = createPlayer(5, 3);
      expect(player.x).toBe(5);
      expect(player.y).toBe(3);
    });
  });

  describe('movePlayer', () => {
    // テスト用のシンプルなマップ
    const testMap: GameMap = [
      [TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL],
      [TileType.WALL, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.WALL],
      [TileType.WALL, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.WALL],
      [TileType.WALL, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.WALL],
      [TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL],
    ];

    test('上方向に移動できること', () => {
      const player = createPlayer(2, 2);
      const newPlayer = movePlayer(player, Direction.UP, testMap);
      expect(newPlayer.y).toBe(1);
      expect(newPlayer.x).toBe(2);
    });

    test('下方向に移動できること', () => {
      const player = createPlayer(2, 2);
      const newPlayer = movePlayer(player, Direction.DOWN, testMap);
      expect(newPlayer.y).toBe(3);
      expect(newPlayer.x).toBe(2);
    });

    test('左方向に移動できること', () => {
      const player = createPlayer(2, 2);
      const newPlayer = movePlayer(player, Direction.LEFT, testMap);
      expect(newPlayer.x).toBe(1);
      expect(newPlayer.y).toBe(2);
    });

    test('右方向に移動できること', () => {
      const player = createPlayer(2, 2);
      const newPlayer = movePlayer(player, Direction.RIGHT, testMap);
      expect(newPlayer.x).toBe(3);
      expect(newPlayer.y).toBe(2);
    });

    test('壁に向かって移動できないこと', () => {
      const player = createPlayer(1, 1);
      // 上は壁
      const newPlayer = movePlayer(player, Direction.UP, testMap);
      expect(newPlayer.x).toBe(1);
      expect(newPlayer.y).toBe(1);
    });
  });
});
