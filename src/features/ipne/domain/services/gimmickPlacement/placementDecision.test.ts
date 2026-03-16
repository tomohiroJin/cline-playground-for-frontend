/**
 * placementDecision のユニットテスト
 *
 * ギミック配置の種類選択・検証ロジックを検証する。
 */

import { TrapType, WallType } from '../../../types';
import {
  selectTrapType,
  selectWallType,
  calculateWallTypeCounts,
  placeMultiWallCandidate,
  validateGimmickPlacementConfig,
  assertGimmickPlacementPostconditions,
  PlacementConfigLike,
} from './placementDecision';
import { createWall } from '../../entities/wall';
import { MockRandomProvider } from '../../../__tests__/mocks/MockRandomProvider';

describe('placementDecision', () => {
  describe('selectTrapType', () => {
    it('乱数に基づいて罠タイプを選択する', () => {
      const ratio = { damage: 0.5, slow: 0.3, teleport: 0.2 };

      // 異なる乱数値で全タイプが出現することを確認
      const values = Array.from({ length: 100 }, (_, i) => i / 100);
      const rng = new MockRandomProvider(values);
      const types = new Set<string>();
      for (let i = 0; i < 100; i++) {
        types.add(selectTrapType(ratio, rng));
      }
      expect(types.has(TrapType.DAMAGE)).toBe(true);
      expect(types.has(TrapType.SLOW)).toBe(true);
      expect(types.has(TrapType.TELEPORT)).toBe(true);
    });

    it('damage比率1.0では常にDAMAGEを返す', () => {
      const ratio = { damage: 1.0, slow: 0, teleport: 0 };
      const rng = new MockRandomProvider(0.5);
      for (let i = 0; i < 10; i++) {
        expect(selectTrapType(ratio, rng)).toBe(TrapType.DAMAGE);
      }
    });
  });

  describe('selectWallType', () => {
    it('乱数に基づいて壁タイプを選択する', () => {
      const ratio = { breakable: 0.4, passable: 0.3, invisible: 0.3 };

      // 異なる乱数値で全タイプが出現することを確認
      const values = Array.from({ length: 100 }, (_, i) => i / 100);
      const rng = new MockRandomProvider(values);
      const types = new Set<string>();
      for (let i = 0; i < 100; i++) {
        types.add(selectWallType(ratio, rng));
      }
      expect(types.has(WallType.BREAKABLE)).toBe(true);
      expect(types.has(WallType.PASSABLE)).toBe(true);
      expect(types.has(WallType.INVISIBLE)).toBe(true);
    });
  });

  describe('calculateWallTypeCounts', () => {
    it('壁数と比率から各タイプの個数を算出する', () => {
      const result = calculateWallTypeCounts(10, {
        breakable: 0.5,
        passable: 0.3,
        invisible: 0.2,
      });

      expect(result.breakableCount).toBe(5);
      expect(result.passableCount).toBe(3);
      expect(result.invisibleCount).toBe(2);
    });

    it('端数は切り上げる（breakable, passable）', () => {
      const result = calculateWallTypeCounts(3, {
        breakable: 0.4,
        passable: 0.3,
        invisible: 0.3,
      });

      // Math.ceil(3 * 0.4) = 2, Math.ceil(3 * 0.3) = 1
      expect(result.breakableCount).toBe(2);
      expect(result.passableCount).toBe(1);
      // invisible は残りで調整
      expect(result.invisibleCount).toBe(0);
    });

    it('壁数0の場合は全て0', () => {
      const result = calculateWallTypeCounts(0, {
        breakable: 0.5,
        passable: 0.3,
        invisible: 0.2,
      });

      expect(result.breakableCount).toBe(0);
      expect(result.passableCount).toBe(0);
      expect(result.invisibleCount).toBe(0);
    });
  });

  describe('placeMultiWallCandidate', () => {
    it('候補の壁タイルを配置する', () => {
      const walls: ReturnType<typeof createWall>[] = [];
      const usedPositions = new Set<string>();

      placeMultiWallCandidate(
        {
          position: { x: 3, y: 3 },
          score: 5,
          type: 'shortcutBlock',
          wallTiles: [{ x: 3, y: 3 }, { x: 4, y: 3 }],
        },
        WallType.BREAKABLE,
        walls,
        usedPositions
      );

      expect(walls).toHaveLength(2);
      expect(usedPositions.has('3,3')).toBe(true);
      expect(usedPositions.has('4,3')).toBe(true);
    });

    it('既に使用済みの位置はスキップする', () => {
      const walls: ReturnType<typeof createWall>[] = [];
      const usedPositions = new Set<string>(['3,3']);

      placeMultiWallCandidate(
        {
          position: { x: 3, y: 3 },
          score: 5,
          type: 'shortcutBlock',
          wallTiles: [{ x: 3, y: 3 }, { x: 4, y: 3 }],
        },
        WallType.BREAKABLE,
        walls,
        usedPositions
      );

      expect(walls).toHaveLength(1); // (4,3) のみ配置
    });

    it('wallTiles がない場合は position を使う', () => {
      const walls: ReturnType<typeof createWall>[] = [];
      const usedPositions = new Set<string>();

      placeMultiWallCandidate(
        {
          position: { x: 5, y: 5 },
          score: 3,
          type: 'trickWall',
        },
        WallType.PASSABLE,
        walls,
        usedPositions
      );

      expect(walls).toHaveLength(1);
      expect(usedPositions.has('5,5')).toBe(true);
    });
  });

  describe('validateGimmickPlacementConfig', () => {
    it('正しい設定ではエラーを投げない', () => {
      const config: PlacementConfigLike = {
        trapCount: 5,
        trapRatio: { damage: 0.5, slow: 0.3, teleport: 0.2 },
        wallCount: 3,
        wallRatio: { breakable: 0.4, passable: 0.3, invisible: 0.3 },
      };

      expect(() => validateGimmickPlacementConfig(config)).not.toThrow();
    });

    it('比率合計が1でない場合エラーを投げる', () => {
      const config: PlacementConfigLike = {
        trapCount: 5,
        trapRatio: { damage: 0.5, slow: 0.3, teleport: 0.3 },
        wallCount: 3,
        wallRatio: { breakable: 0.4, passable: 0.3, invisible: 0.3 },
      };

      expect(() => validateGimmickPlacementConfig(config)).toThrow();
    });

    it('負の trapCount ではエラーを投げる', () => {
      const config: PlacementConfigLike = {
        trapCount: -1,
        trapRatio: { damage: 0.5, slow: 0.3, teleport: 0.2 },
        wallCount: 3,
        wallRatio: { breakable: 0.4, passable: 0.3, invisible: 0.3 },
      };

      expect(() => validateGimmickPlacementConfig(config)).toThrow();
    });
  });

  describe('assertGimmickPlacementPostconditions', () => {
    it('正しい配置結果ではエラーを投げない', () => {
      const config: PlacementConfigLike = {
        trapCount: 3,
        trapRatio: { damage: 0.5, slow: 0.3, teleport: 0.2 },
        wallCount: 2,
        wallRatio: { breakable: 0.5, passable: 0.3, invisible: 0.2 },
      };

      const traps = [
        { id: 'trap-1', x: 1, y: 1, type: 'damage' as const, state: 'hidden' as const, isVisibleToThief: false },
        { id: 'trap-2', x: 2, y: 2, type: 'slow' as const, state: 'hidden' as const, isVisibleToThief: false },
      ];

      const walls = [
        createWall(WallType.BREAKABLE, 3, 3),
      ];

      expect(() => assertGimmickPlacementPostconditions(traps, walls, config)).not.toThrow();
    });

    it('trapCount を超える罠があるとエラーを投げる', () => {
      const config: PlacementConfigLike = {
        trapCount: 1,
        trapRatio: { damage: 1, slow: 0, teleport: 0 },
        wallCount: 0,
        wallRatio: { breakable: 0.5, passable: 0.3, invisible: 0.2 },
      };

      const traps = [
        { id: 'trap-1', x: 1, y: 1, type: 'damage' as const, state: 'hidden' as const, isVisibleToThief: false },
        { id: 'trap-2', x: 2, y: 2, type: 'damage' as const, state: 'hidden' as const, isVisibleToThief: false },
      ];

      expect(() => assertGimmickPlacementPostconditions(traps, [], config)).toThrow();
    });

    it('罠と壁が同一座標の場合エラーを投げる', () => {
      const config: PlacementConfigLike = {
        trapCount: 5,
        trapRatio: { damage: 1, slow: 0, teleport: 0 },
        wallCount: 5,
        wallRatio: { breakable: 1, passable: 0, invisible: 0 },
      };

      const traps = [
        { id: 'trap-1', x: 3, y: 3, type: 'damage' as const, state: 'hidden' as const, isVisibleToThief: false },
      ];

      const walls = [createWall(WallType.BREAKABLE, 3, 3)];

      expect(() => assertGimmickPlacementPostconditions(traps, walls, config)).toThrow();
    });
  });
});
