import {
  isWall,
  canMove,
  checkEnemyCollision,
  getEnemyAtPosition,
  getEnemiesInRange,
} from '../domain/services/collisionService';
import { aMap, anEnemy } from './builders';
import { WallType, WallState, Wall } from '../types';

describe('collision', () => {
  const testMap = aMap(5, 5).build();

  describe('isWall', () => {
    test('壁タイルの位置でtrueを返すこと', () => {
      expect(isWall(testMap, 0, 0)).toBe(true);
      expect(isWall(testMap, 4, 4)).toBe(true);
    });

    test('床タイルの位置でfalseを返すこと', () => {
      expect(isWall(testMap, 1, 1)).toBe(false);
      expect(isWall(testMap, 2, 2)).toBe(false);
    });

    test('マップ範囲外ではtrueを返すこと', () => {
      expect(isWall(testMap, -1, 0)).toBe(true);
      expect(isWall(testMap, 0, -1)).toBe(true);
      expect(isWall(testMap, 5, 0)).toBe(true);
      expect(isWall(testMap, 0, 5)).toBe(true);
    });
  });

  describe('canMove', () => {
    test('床タイルに移動できること', () => {
      expect(canMove(testMap, 1, 1)).toBe(true);
      expect(canMove(testMap, 2, 2)).toBe(true);
    });

    test('壁タイルに移動できないこと', () => {
      expect(canMove(testMap, 0, 0)).toBe(false);
      expect(canMove(testMap, 4, 4)).toBe(false);
    });

    test('マップ範囲外に移動できないこと', () => {
      expect(canMove(testMap, -1, 0)).toBe(false);
      expect(canMove(testMap, 0, -1)).toBe(false);
      expect(canMove(testMap, 5, 0)).toBe(false);
      expect(canMove(testMap, 0, 5)).toBe(false);
    });

    test('ゴールタイルに移動できること', () => {
      // Arrange
      const mapWithGoal = aMap(5, 5).withGoal(2, 2).build();

      // Act & Assert
      expect(canMove(mapWithGoal, 2, 2)).toBe(true);
    });

    test('スタートタイルに移動できること', () => {
      // Arrange
      const mapWithStart = aMap(5, 5).withStart(1, 1).build();

      // Act & Assert
      expect(canMove(mapWithStart, 1, 1)).toBe(true);
    });

    test('破壊済みの特殊壁は通過できること', () => {
      // Arrange
      const walls: Wall[] = [
        { x: 0, y: 0, type: WallType.BREAKABLE, state: WallState.BROKEN },
      ];

      // Act & Assert
      expect(canMove(testMap, 0, 0, walls)).toBe(true);
    });

    test('すり抜け可能壁は通過できること', () => {
      // Arrange
      const walls: Wall[] = [
        { x: 0, y: 0, type: WallType.PASSABLE, state: WallState.INTACT },
      ];

      // Act & Assert
      expect(canMove(testMap, 0, 0, walls)).toBe(true);
    });

    test('通常の特殊壁は通過できないこと', () => {
      // Arrange
      const walls: Wall[] = [
        { x: 0, y: 0, type: WallType.NORMAL, state: WallState.INTACT },
      ];

      // Act & Assert
      expect(canMove(testMap, 0, 0, walls)).toBe(false);
    });

    test('walls配列に該当位置の壁がない場合は通過できないこと', () => {
      // Arrange
      const walls: Wall[] = [
        { x: 3, y: 3, type: WallType.BREAKABLE, state: WallState.BROKEN },
      ];

      // Act & Assert
      expect(canMove(testMap, 0, 0, walls)).toBe(false);
    });

    test('walls引数ありでも床タイルは移動できること', () => {
      // Arrange
      const walls: Wall[] = [];

      // Act & Assert
      expect(canMove(testMap, 1, 1, walls)).toBe(true);
    });
  });

  describe('checkEnemyCollision', () => {
    test('プレイヤーと同じ位置の敵がいる場合trueを返すこと', () => {
      // Arrange
      const player = { x: 5, y: 5 };
      const enemies = [anEnemy().at(5, 5).build()];

      // Act
      const result = checkEnemyCollision(player, enemies);

      // Assert
      expect(result).toBe(true);
    });

    test('プレイヤーと同じ位置の敵がいない場合falseを返すこと', () => {
      // Arrange
      const player = { x: 1, y: 1 };
      const enemies = [anEnemy().at(3, 3).build()];

      // Act
      const result = checkEnemyCollision(player, enemies);

      // Assert
      expect(result).toBe(false);
    });

    test('敵がいない場合falseを返すこと', () => {
      // Arrange
      const player = { x: 1, y: 1 };

      // Act
      const result = checkEnemyCollision(player, []);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getEnemyAtPosition', () => {
    test('指定位置に敵がいる場合その敵を返すこと', () => {
      // Arrange
      const enemy = anEnemy().at(3, 4).build();
      const enemies = [enemy];

      // Act
      const result = getEnemyAtPosition(enemies, 3, 4);

      // Assert
      expect(result).toEqual(enemy);
    });

    test('指定位置に敵がいない場合undefinedを返すこと', () => {
      // Arrange
      const enemies = [anEnemy().at(3, 4).build()];

      // Act
      const result = getEnemyAtPosition(enemies, 1, 1);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('getEnemiesInRange', () => {
    test('マンハッタン距離が範囲内の敵を返すこと', () => {
      // Arrange
      const nearEnemy = anEnemy().at(2, 3).build();
      const farEnemy = anEnemy().at(9, 9).build();
      const enemies = [nearEnemy, farEnemy];
      const position = { x: 2, y: 2 };

      // Act
      const result = getEnemiesInRange(enemies, position, 2);

      // Assert
      expect(result).toEqual([nearEnemy]);
    });

    test('範囲内に敵がいない場合空配列を返すこと', () => {
      // Arrange
      const enemies = [anEnemy().at(9, 9).build()];
      const position = { x: 1, y: 1 };

      // Act
      const result = getEnemiesInRange(enemies, position, 1);

      // Assert
      expect(result).toEqual([]);
    });

    test('距離がちょうど範囲と等しい敵も含まれること', () => {
      // Arrange
      const enemy = anEnemy().at(3, 2).build();
      const enemies = [enemy];
      const position = { x: 1, y: 1 };

      // Act: マンハッタン距離 = |3-1| + |2-1| = 3
      const result = getEnemiesInRange(enemies, position, 3);

      // Assert
      expect(result).toEqual([enemy]);
    });
  });
});
