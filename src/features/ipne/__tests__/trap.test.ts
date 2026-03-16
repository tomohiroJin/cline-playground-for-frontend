/**
 * 罠システムのテスト
 */
import {
  TRAP_CONFIGS,
  createDamageTrap,
  createSlowTrap,
  createTeleportTrap,
  triggerTrap,
  canTriggerTrap,
  getTrapAt,
  revealTrap,
  getRandomPassableTile,
} from '../domain/entities/trap';
import { TrapType, TrapState, Trap, TileType, GameMap } from '../types';
import { createTestPlayer } from './testUtils';
import { MockIdGenerator } from './mocks/MockIdGenerator';
import { MockRandomProvider } from './mocks/MockRandomProvider';

describe('trap', () => {
  let idGen: MockIdGenerator;

  beforeEach(() => {
    idGen = new MockIdGenerator();
  });

  describe('罠生成', () => {
    test('ダメージ罠が正しく生成されること', () => {
      const trap = createDamageTrap(5, 5, idGen);
      expect(trap.x).toBe(5);
      expect(trap.y).toBe(5);
      expect(trap.type).toBe(TrapType.DAMAGE);
      expect(trap.state).toBe(TrapState.HIDDEN);
      expect(trap.isVisibleToThief).toBe(true);
    });

    test('移動妨害罠が正しく生成されること', () => {
      const trap = createSlowTrap(3, 3, idGen);
      expect(trap.type).toBe(TrapType.SLOW);
      expect(trap.state).toBe(TrapState.HIDDEN);
    });

    test('テレポート罠が正しく生成されること', () => {
      const trap = createTeleportTrap(2, 2, idGen);
      expect(trap.type).toBe(TrapType.TELEPORT);
      expect(trap.state).toBe(TrapState.HIDDEN);
    });

    test('罠IDが一意であること', () => {
      const trap1 = createDamageTrap(1, 1, idGen);
      const trap2 = createSlowTrap(2, 2, idGen);
      const trap3 = createTeleportTrap(3, 3, idGen);
      expect(trap1.id).not.toBe(trap2.id);
      expect(trap2.id).not.toBe(trap3.id);
    });
  });

  describe('ダメージ罠', () => {
    test('発動でダメージが計算されること', () => {
      const trap = createDamageTrap(1, 1, idGen);
      const player = createTestPlayer(1, 1);
      const result = triggerTrap(trap, player, 0);
      expect(result.damage).toBe(TRAP_CONFIGS[TrapType.DAMAGE].damage);
    });

    test('クールダウン後に再発動可能であること', () => {
      const trap = createDamageTrap(1, 1, idGen);
      const player = createTestPlayer(1, 1);
      const result = triggerTrap(trap, player, 0);
      expect(result.trap.state).toBe(TrapState.REVEALED);

      // クールダウン中は不可
      expect(canTriggerTrap(result.trap, 1000)).toBe(false);

      // クールダウン後は可能
      const cooldownEnd = TRAP_CONFIGS[TrapType.DAMAGE].cooldown ?? 0;
      expect(canTriggerTrap(result.trap, cooldownEnd + 1)).toBe(true);
    });
  });

  describe('移動妨害罠', () => {
    test('発動で速度低下時間が返されること', () => {
      const trap = createSlowTrap(1, 1, idGen);
      const player = createTestPlayer(1, 1);
      const result = triggerTrap(trap, player, 0);
      expect(result.slowDuration).toBe(TRAP_CONFIGS[TrapType.SLOW].slowDuration);
    });

    test('クールダウン後に再発動可能であること', () => {
      const trap = createSlowTrap(1, 1, idGen);
      const player = createTestPlayer(1, 1);
      const result = triggerTrap(trap, player, 0);

      // クールダウン中は不可
      expect(canTriggerTrap(result.trap, 1000)).toBe(false);

      // クールダウン後は可能
      const cooldownEnd = TRAP_CONFIGS[TrapType.SLOW].cooldown ?? 0;
      expect(canTriggerTrap(result.trap, cooldownEnd + 1)).toBe(true);
    });
  });

  describe('テレポート罠', () => {
    // テスト用のマップを作成
    const createTestMap = (): GameMap => [
      [TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL],
      [TileType.WALL, TileType.START, TileType.FLOOR, TileType.FLOOR, TileType.WALL],
      [TileType.WALL, TileType.FLOOR, TileType.FLOOR, TileType.FLOOR, TileType.WALL],
      [TileType.WALL, TileType.FLOOR, TileType.FLOOR, TileType.GOAL, TileType.WALL],
      [TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL, TileType.WALL],
    ];

    test('発動でテレポート先が返されること', () => {
      const trap = createTeleportTrap(1, 1, idGen);
      const player = createTestPlayer(1, 1);
      const map = createTestMap();
      const result = triggerTrap(trap, player, 0, map, new MockRandomProvider(0.5));
      expect(result.teleportDestination).toBeDefined();
      expect(result.teleportDestination?.x).toBeGreaterThanOrEqual(0);
      expect(result.teleportDestination?.y).toBeGreaterThanOrEqual(0);
    });

    test('テレポート先が通行可能タイルであること', () => {
      const trap = createTeleportTrap(1, 1, idGen);
      const player = createTestPlayer(1, 1);
      const map = createTestMap();
      const result = triggerTrap(trap, player, 0, map, new MockRandomProvider(0.5));

      if (result.teleportDestination) {
        const { x, y } = result.teleportDestination;
        const tile = map[y][x];
        expect([TileType.FLOOR, TileType.START, TileType.GOAL]).toContain(tile);
      }
    });

    test('クールダウン後に再発動可能であること', () => {
      const trap = createTeleportTrap(1, 1, idGen);
      const player = createTestPlayer(1, 1);
      const map = createTestMap();
      const result = triggerTrap(trap, player, 0, map, new MockRandomProvider(0.5));
      expect(result.trap.state).toBe(TrapState.REVEALED);

      // クールダウン中は不可
      expect(canTriggerTrap(result.trap, 1000)).toBe(false);

      // クールダウン後は可能
      const cooldownEnd = TRAP_CONFIGS[TrapType.TELEPORT].cooldown ?? 0;
      expect(canTriggerTrap(result.trap, cooldownEnd + 1)).toBe(true);
    });

    test('マップなしで発動した場合はテレポート先がundefinedになること', () => {
      const trap = createTeleportTrap(1, 1, idGen);
      const player = createTestPlayer(1, 1);
      const result = triggerTrap(trap, player, 0);
      expect(result.teleportDestination).toBeUndefined();
    });
  });

  describe('getRandomPassableTile', () => {
    const rng = new MockRandomProvider(0.5);

    test('通行可能タイルがある場合は座標を返すこと', () => {
      const map: GameMap = [
        [TileType.WALL, TileType.WALL, TileType.WALL],
        [TileType.WALL, TileType.FLOOR, TileType.WALL],
        [TileType.WALL, TileType.WALL, TileType.WALL],
      ];
      rng.reset();
      const result = getRandomPassableTile(map, rng);
      expect(result).toEqual({ x: 1, y: 1 });
    });

    test('通行可能タイルがない場合はundefinedを返すこと', () => {
      const map: GameMap = [
        [TileType.WALL, TileType.WALL],
        [TileType.WALL, TileType.WALL],
      ];
      rng.reset();
      const result = getRandomPassableTile(map, rng);
      expect(result).toBeUndefined();
    });
  });

  describe('発見状態', () => {
    test('発動で発見済みになること', () => {
      const trap = createDamageTrap(1, 1, idGen);
      const player = createTestPlayer(1, 1);
      const result = triggerTrap(trap, player, 0);
      expect(result.trap.state).not.toBe(TrapState.HIDDEN);
    });

    test('revealTrapで発見済みになること', () => {
      const trap = createDamageTrap(1, 1, idGen);
      const revealed = revealTrap(trap);
      expect(revealed.state).toBe(TrapState.REVEALED);
    });
  });

  describe('canTriggerTrap', () => {
    test('未発見罠は発動可能であること', () => {
      const trap = createDamageTrap(1, 1, idGen);
      expect(canTriggerTrap(trap, 0)).toBe(true);
    });

    test('発見済み罠も発動可能であること', () => {
      const trap: Trap = { ...createDamageTrap(1, 1, idGen), state: TrapState.REVEALED };
      expect(canTriggerTrap(trap, 0)).toBe(true);
    });

    test('クールダウン中の罠は発動不可であること', () => {
      const trap: Trap = { ...createDamageTrap(1, 1, idGen), state: TrapState.REVEALED, cooldownUntil: 5000 };
      expect(canTriggerTrap(trap, 1000)).toBe(false);
      expect(canTriggerTrap(trap, 5001)).toBe(true);
    });
  });

  describe('getTrapAt', () => {
    test('指定位置の罠を取得できること', () => {
      const traps: Trap[] = [
        createDamageTrap(1, 1, idGen),
        createSlowTrap(2, 2, idGen),
        createTeleportTrap(3, 3, idGen),
      ];
      const trap = getTrapAt(traps, 2, 2);
      expect(trap).toBeDefined();
      expect(trap?.type).toBe(TrapType.SLOW);
    });

    test('罠がない位置ではundefinedを返すこと', () => {
      const traps: Trap[] = [createDamageTrap(1, 1, idGen)];
      const trap = getTrapAt(traps, 5, 5);
      expect(trap).toBeUndefined();
    });
  });

  describe('TRAP_CONFIGS', () => {
    test('ダメージ罠のダメージ量が正しいこと', () => {
      expect(TRAP_CONFIGS[TrapType.DAMAGE].damage).toBe(3);
      expect(TRAP_CONFIGS[TrapType.DAMAGE].reusable).toBe(true);
      expect(TRAP_CONFIGS[TrapType.DAMAGE].cooldown).toBe(5000);
    });

    test('移動妨害罠の設定が正しいこと', () => {
      expect(TRAP_CONFIGS[TrapType.SLOW].slowDuration).toBe(6000);
      expect(TRAP_CONFIGS[TrapType.SLOW].slowRate).toBe(0.5);
      expect(TRAP_CONFIGS[TrapType.SLOW].reusable).toBe(true);
    });

    test('テレポート罠の設定が正しいこと', () => {
      expect(TRAP_CONFIGS[TrapType.TELEPORT].reusable).toBe(true);
      expect(TRAP_CONFIGS[TrapType.TELEPORT].cooldown).toBe(8000);
    });
  });
});
