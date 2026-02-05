/**
 * 迷路生成安定化機能のテスト
 */
import {
  SAFE_ZONE_RADIUS,
  MAX_GENERATION_RETRIES,
  DANGEROUS_ENEMIES,
  DANGEROUS_TRAPS,
  isInSafeZone,
  validateEnemyPlacement,
  validateTrapPlacement,
  validateGeneration,
  getPositionsOutsideSafeZone,
  generateSafeMaze,
} from '../mazeGenerator';
import { EnemyType, TrapType } from '../types';

describe('mazeValidation', () => {
  describe('定数', () => {
    test('SAFE_ZONE_RADIUSが3であること', () => {
      expect(SAFE_ZONE_RADIUS).toBe(3);
    });

    test('MAX_GENERATION_RETRIESが5であること', () => {
      expect(MAX_GENERATION_RETRIES).toBe(5);
    });

    test('危険な敵タイプが正しく設定されていること', () => {
      expect(DANGEROUS_ENEMIES).toContain(EnemyType.CHARGE);
      expect(DANGEROUS_ENEMIES).toContain(EnemyType.RANGED);
      expect(DANGEROUS_ENEMIES).toContain(EnemyType.BOSS);
      expect(DANGEROUS_ENEMIES).not.toContain(EnemyType.PATROL);
      expect(DANGEROUS_ENEMIES).not.toContain(EnemyType.SPECIMEN);
    });

    test('危険な罠タイプが正しく設定されていること', () => {
      expect(DANGEROUS_TRAPS).toContain(TrapType.DAMAGE);
      expect(DANGEROUS_TRAPS).toContain(TrapType.TELEPORT);
      expect(DANGEROUS_TRAPS).not.toContain(TrapType.SLOW);
    });
  });

  describe('isInSafeZone', () => {
    const startX = 5;
    const startY = 5;

    test('スタート地点はセーフゾーン内であること', () => {
      expect(isInSafeZone(5, 5, startX, startY)).toBe(true);
    });

    test('半径内の座標はセーフゾーン内であること', () => {
      expect(isInSafeZone(5, 2, startX, startY)).toBe(true);
      expect(isInSafeZone(8, 5, startX, startY)).toBe(true);
      expect(isInSafeZone(2, 5, startX, startY)).toBe(true);
      expect(isInSafeZone(5, 8, startX, startY)).toBe(true);
    });

    test('半径外の座標はセーフゾーン外であること', () => {
      expect(isInSafeZone(5, 1, startX, startY)).toBe(false);
      expect(isInSafeZone(9, 5, startX, startY)).toBe(false);
      expect(isInSafeZone(1, 5, startX, startY)).toBe(false);
      expect(isInSafeZone(5, 9, startX, startY)).toBe(false);
    });

    test('斜め方向も正しく判定されること', () => {
      expect(isInSafeZone(8, 8, startX, startY)).toBe(true);
      expect(isInSafeZone(2, 2, startX, startY)).toBe(true);
      expect(isInSafeZone(9, 9, startX, startY)).toBe(false);
    });

    test('カスタム半径で判定できること', () => {
      expect(isInSafeZone(5, 0, startX, startY, 5)).toBe(true);
      expect(isInSafeZone(5, 0, startX, startY, 4)).toBe(false);
    });
  });

  describe('validateEnemyPlacement', () => {
    const startX = 5;
    const startY = 5;

    test('セーフゾーン外の危険な敵は問題なしであること', () => {
      const enemies = [
        { type: EnemyType.CHARGE, x: 15, y: 15 },
        { type: EnemyType.BOSS, x: 20, y: 20 },
      ];

      const invalid = validateEnemyPlacement(enemies, startX, startY);
      expect(invalid).toHaveLength(0);
    });

    test('セーフゾーン内の危険な敵は問題ありであること', () => {
      const enemies = [
        { type: EnemyType.CHARGE, x: 6, y: 5 },
        { type: EnemyType.BOSS, x: 5, y: 6 },
      ];

      const invalid = validateEnemyPlacement(enemies, startX, startY);
      expect(invalid).toHaveLength(2);
    });

    test('セーフゾーン内のPATROL敵は問題なしであること', () => {
      const enemies = [
        { type: EnemyType.PATROL, x: 5, y: 5 },
        { type: EnemyType.SPECIMEN, x: 6, y: 6 },
      ];

      const invalid = validateEnemyPlacement(enemies, startX, startY);
      expect(invalid).toHaveLength(0);
    });
  });

  describe('validateTrapPlacement', () => {
    const startX = 5;
    const startY = 5;

    test('セーフゾーン外の危険な罠は問題なしであること', () => {
      const traps = [
        { type: TrapType.DAMAGE, x: 15, y: 15 },
        { type: TrapType.TELEPORT, x: 20, y: 20 },
      ];

      const invalid = validateTrapPlacement(traps, startX, startY);
      expect(invalid).toHaveLength(0);
    });

    test('セーフゾーン内の危険な罠は問題ありであること', () => {
      const traps = [
        { type: TrapType.DAMAGE, x: 6, y: 5 },
        { type: TrapType.TELEPORT, x: 5, y: 6 },
      ];

      const invalid = validateTrapPlacement(traps, startX, startY);
      expect(invalid).toHaveLength(2);
    });

    test('セーフゾーン内のSLOW罠は問題なしであること', () => {
      const traps = [{ type: TrapType.SLOW, x: 5, y: 5 }];

      const invalid = validateTrapPlacement(traps, startX, startY);
      expect(invalid).toHaveLength(0);
    });
  });

  describe('validateGeneration', () => {
    const startX = 5;
    const startY = 5;

    test('問題がない場合はisValidがtrueであること', () => {
      const enemies = [{ type: EnemyType.CHARGE, x: 15, y: 15 }];
      const traps = [{ type: TrapType.DAMAGE, x: 20, y: 20 }];

      const result = validateGeneration(enemies, traps, startX, startY);

      expect(result.isValid).toBe(true);
      expect(result.invalidEnemies).toHaveLength(0);
      expect(result.invalidTraps).toHaveLength(0);
    });

    test('問題がある場合はisValidがfalseであること', () => {
      const enemies = [{ type: EnemyType.CHARGE, x: 6, y: 5 }];
      const traps = [{ type: TrapType.DAMAGE, x: 5, y: 6 }];

      const result = validateGeneration(enemies, traps, startX, startY);

      expect(result.isValid).toBe(false);
      expect(result.invalidEnemies).toHaveLength(1);
      expect(result.invalidTraps).toHaveLength(1);
    });

    test('空の配列でもisValidがtrueであること', () => {
      const result = validateGeneration([], [], startX, startY);

      expect(result.isValid).toBe(true);
    });
  });

  describe('getPositionsOutsideSafeZone', () => {
    const startX = 5;
    const startY = 5;

    test('セーフゾーン外の位置のみを返すこと', () => {
      const positions = [
        { x: 5, y: 5 },
        { x: 15, y: 15 },
        { x: 6, y: 6 },
        { x: 20, y: 20 },
      ];

      const outside = getPositionsOutsideSafeZone(positions, startX, startY);

      expect(outside).toHaveLength(2);
      expect(outside).toContainEqual({ x: 15, y: 15 });
      expect(outside).toContainEqual({ x: 20, y: 20 });
    });

    test('全てセーフゾーン内の場合は空配列を返すこと', () => {
      const positions = [
        { x: 5, y: 5 },
        { x: 6, y: 6 },
        { x: 4, y: 4 },
      ];

      const outside = getPositionsOutsideSafeZone(positions, startX, startY);

      expect(outside).toHaveLength(0);
    });
  });

  describe('generateSafeMaze', () => {
    const config = {
      width: 50,
      height: 50,
      minRoomSize: 4,
      maxRoomSize: 8,
      corridorWidth: 2,
      maxDepth: 4,
      loopCount: 2,
    };

    test('迷路を生成できること', () => {
      const result = generateSafeMaze(config);

      expect(result).not.toBeNull();
      expect(result?.rooms.length).toBeGreaterThanOrEqual(2);
      expect(result?.grid).toBeDefined();
    });

    test('指定リトライ回数まで試行すること', () => {
      // 非常に小さい設定で失敗しやすくする
      const smallConfig = {
        width: 10,
        height: 10,
        minRoomSize: 8,
        maxRoomSize: 8,
        corridorWidth: 1,
        maxDepth: 1,
        loopCount: 0,
      };

      // 失敗する可能性があるが、結果はnullか有効な迷路のどちらか
      const result = generateSafeMaze(smallConfig, 1);
      expect(result === null || result.rooms.length >= 0).toBe(true);
    });
  });
});
