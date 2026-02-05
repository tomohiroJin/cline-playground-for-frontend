/**
 * 壁ギミックのテスト
 */
import {
  WALL_CONFIGS,
  createWall,
  createBreakableWall,
  createPassableWall,
  createInvisibleWall,
  damageWall,
  isWallPassable,
  isWallBlocking,
  revealWall,
  getWallAt,
} from '../wall';
import { WallType, WallState, Wall } from '../types';

describe('wall', () => {
  describe('壁生成', () => {
    test('通常壁が正しく生成されること', () => {
      const wall = createWall(WallType.NORMAL, 5, 5);
      expect(wall.x).toBe(5);
      expect(wall.y).toBe(5);
      expect(wall.type).toBe(WallType.NORMAL);
      expect(wall.state).toBe(WallState.INTACT);
      expect(wall.hp).toBeUndefined();
    });

    test('破壊可能壁が正しく生成されること', () => {
      const wall = createBreakableWall(3, 3);
      expect(wall.type).toBe(WallType.BREAKABLE);
      expect(wall.state).toBe(WallState.INTACT);
      expect(wall.hp).toBe(3);
    });

    test('すり抜け可能壁が正しく生成されること', () => {
      const wall = createPassableWall(2, 2);
      expect(wall.type).toBe(WallType.PASSABLE);
      expect(wall.state).toBe(WallState.INTACT);
    });

    test('透明壁が正しく生成されること', () => {
      const wall = createInvisibleWall(1, 1);
      expect(wall.type).toBe(WallType.INVISIBLE);
      expect(wall.state).toBe(WallState.INTACT);
    });
  });

  describe('破壊可能壁', () => {
    test('ダメージでHPが減少すること', () => {
      const wall = createBreakableWall(0, 0);
      const damaged = damageWall(wall, 1);
      expect(damaged.hp).toBe(2);
      expect(damaged.state).toBe(WallState.DAMAGED);
    });

    test('HP0で破壊状態になること', () => {
      const wall = createBreakableWall(0, 0);
      let damaged = damageWall(wall, 1);
      damaged = damageWall(damaged, 1);
      damaged = damageWall(damaged, 1);
      expect(damaged.hp).toBe(0);
      expect(damaged.state).toBe(WallState.BROKEN);
    });

    test('破壊後は通過可能であること', () => {
      const wall: Wall = { ...createBreakableWall(0, 0), state: WallState.BROKEN, hp: 0 };
      expect(isWallPassable(wall)).toBe(true);
    });

    test('破壊前は通過不可であること', () => {
      const wall = createBreakableWall(0, 0);
      expect(isWallPassable(wall)).toBe(false);
    });
  });

  describe('すり抜け可能壁', () => {
    test('最初から通過可能であること', () => {
      const wall = createPassableWall(0, 0);
      expect(isWallPassable(wall)).toBe(true);
    });

    test('発見済みに変更できること', () => {
      const wall = createPassableWall(0, 0);
      const revealed = revealWall(wall);
      expect(revealed.state).toBe(WallState.REVEALED);
    });
  });

  describe('透明壁', () => {
    test('通過不可であること', () => {
      const wall = createInvisibleWall(0, 0);
      expect(isWallPassable(wall)).toBe(false);
    });

    test('接触で発見済みになること', () => {
      const wall = createInvisibleWall(0, 0);
      const revealed = revealWall(wall);
      expect(revealed.state).toBe(WallState.REVEALED);
    });
  });

  describe('通過判定', () => {
    test('通常壁は通過不可であること', () => {
      const wall = createWall(WallType.NORMAL, 0, 0);
      expect(isWallPassable(wall)).toBe(false);
    });

    test('破壊可能壁（未破壊）は通過不可であること', () => {
      const wall = createBreakableWall(0, 0);
      expect(isWallPassable(wall)).toBe(false);
    });

    test('すり抜け可能壁は通過可能であること', () => {
      const wall = createPassableWall(0, 0);
      expect(isWallPassable(wall)).toBe(true);
    });

    test('透明壁は通過不可であること', () => {
      const wall = createInvisibleWall(0, 0);
      expect(isWallPassable(wall)).toBe(false);
    });
  });

  describe('isWallBlocking', () => {
    test('通常壁は通行を妨げること', () => {
      const wall = createWall(WallType.NORMAL, 0, 0);
      expect(isWallBlocking(wall)).toBe(true);
    });

    test('破壊済み壁は通行を妨げないこと', () => {
      const wall: Wall = { ...createBreakableWall(0, 0), state: WallState.BROKEN, hp: 0 };
      expect(isWallBlocking(wall)).toBe(false);
    });

    test('すり抜け可能壁は通行を妨げないこと', () => {
      const wall = createPassableWall(0, 0);
      expect(isWallBlocking(wall)).toBe(false);
    });
  });

  describe('getWallAt', () => {
    test('指定位置の壁を取得できること', () => {
      const walls: Wall[] = [
        createBreakableWall(1, 1),
        createPassableWall(2, 2),
        createInvisibleWall(3, 3),
      ];
      const wall = getWallAt(walls, 2, 2);
      expect(wall).toBeDefined();
      expect(wall?.type).toBe(WallType.PASSABLE);
    });

    test('壁がない位置ではundefinedを返すこと', () => {
      const walls: Wall[] = [createBreakableWall(1, 1)];
      const wall = getWallAt(walls, 5, 5);
      expect(wall).toBeUndefined();
    });
  });

  describe('WALL_CONFIGS', () => {
    test('破壊可能壁のHP設定が正しいこと', () => {
      expect(WALL_CONFIGS[WallType.BREAKABLE].hp).toBe(3);
    });
  });
});
