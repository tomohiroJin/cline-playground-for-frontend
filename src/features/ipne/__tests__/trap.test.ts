/**
 * 罠システムのテスト
 */
import {
  TRAP_CONFIGS,
  createTrap,
  createDamageTrap,
  createSlowTrap,
  createAlertTrap,
  triggerTrap,
  canTriggerTrap,
  getTrapAt,
  revealTrap,
  resetTrapIdCounter,
} from '../trap';
import { TrapType, TrapState, Trap, Enemy, EnemyType, EnemyState } from '../types';
import { createTestPlayer, createTestEnemy } from './testUtils';

describe('trap', () => {
  beforeEach(() => {
    resetTrapIdCounter();
  });

  describe('罠生成', () => {
    test('ダメージ罠が正しく生成されること', () => {
      const trap = createDamageTrap(5, 5);
      expect(trap.x).toBe(5);
      expect(trap.y).toBe(5);
      expect(trap.type).toBe(TrapType.DAMAGE);
      expect(trap.state).toBe(TrapState.HIDDEN);
      expect(trap.isVisibleToThief).toBe(true);
    });

    test('移動妨害罠が正しく生成されること', () => {
      const trap = createSlowTrap(3, 3);
      expect(trap.type).toBe(TrapType.SLOW);
      expect(trap.state).toBe(TrapState.HIDDEN);
    });

    test('索敵反応罠が正しく生成されること', () => {
      const trap = createAlertTrap(2, 2);
      expect(trap.type).toBe(TrapType.ALERT);
      expect(trap.state).toBe(TrapState.HIDDEN);
    });

    test('罠IDが一意であること', () => {
      const trap1 = createDamageTrap(1, 1);
      const trap2 = createSlowTrap(2, 2);
      const trap3 = createAlertTrap(3, 3);
      expect(trap1.id).not.toBe(trap2.id);
      expect(trap2.id).not.toBe(trap3.id);
    });
  });

  describe('ダメージ罠', () => {
    test('発動でダメージが計算されること', () => {
      const trap = createDamageTrap(1, 1);
      const player = createTestPlayer(1, 1);
      const result = triggerTrap(trap, player, [], 0);
      expect(result.damage).toBe(TRAP_CONFIGS[TrapType.DAMAGE].damage);
    });

    test('1回限りで再発動不可であること', () => {
      const trap = createDamageTrap(1, 1);
      const player = createTestPlayer(1, 1);
      const result = triggerTrap(trap, player, [], 0);
      expect(result.trap.state).toBe(TrapState.TRIGGERED);
      expect(canTriggerTrap(result.trap, 0)).toBe(false);
    });
  });

  describe('移動妨害罠', () => {
    test('発動で速度低下時間が返されること', () => {
      const trap = createSlowTrap(1, 1);
      const player = createTestPlayer(1, 1);
      const result = triggerTrap(trap, player, [], 0);
      expect(result.slowDuration).toBe(TRAP_CONFIGS[TrapType.SLOW].slowDuration);
    });

    test('クールダウン後に再発動可能であること', () => {
      const trap = createSlowTrap(1, 1);
      const player = createTestPlayer(1, 1);
      const result = triggerTrap(trap, player, [], 0);

      // クールダウン中は不可
      expect(canTriggerTrap(result.trap, 1000)).toBe(false);

      // クールダウン後は可能
      const cooldownEnd = TRAP_CONFIGS[TrapType.SLOW].cooldown ?? 0;
      expect(canTriggerTrap(result.trap, cooldownEnd + 1)).toBe(true);
    });
  });

  describe('索敵反応罠', () => {
    test('発動で引き寄せ範囲が返されること', () => {
      const trap = createAlertTrap(5, 5);
      const player = createTestPlayer(5, 5);
      const result = triggerTrap(trap, player, [], 0);
      expect(result.alertRadius).toBe(TRAP_CONFIGS[TrapType.ALERT].alertRadius);
    });

    test('1回限りで再発動不可であること', () => {
      const trap = createAlertTrap(1, 1);
      const player = createTestPlayer(1, 1);
      const result = triggerTrap(trap, player, [], 0);
      expect(result.trap.state).toBe(TrapState.TRIGGERED);
      expect(canTriggerTrap(result.trap, 0)).toBe(false);
    });
  });

  describe('発見状態', () => {
    test('発動で発見済みになること', () => {
      const trap = createDamageTrap(1, 1);
      const player = createTestPlayer(1, 1);
      const result = triggerTrap(trap, player, [], 0);
      expect(result.trap.state).not.toBe(TrapState.HIDDEN);
    });

    test('revealTrapで発見済みになること', () => {
      const trap = createDamageTrap(1, 1);
      const revealed = revealTrap(trap);
      expect(revealed.state).toBe(TrapState.REVEALED);
    });
  });

  describe('canTriggerTrap', () => {
    test('未発見罠は発動可能であること', () => {
      const trap = createDamageTrap(1, 1);
      expect(canTriggerTrap(trap, 0)).toBe(true);
    });

    test('発見済み罠も発動可能であること', () => {
      const trap: Trap = { ...createDamageTrap(1, 1), state: TrapState.REVEALED };
      expect(canTriggerTrap(trap, 0)).toBe(true);
    });

    test('発動済みダメージ罠は発動不可であること', () => {
      const trap: Trap = { ...createDamageTrap(1, 1), state: TrapState.TRIGGERED };
      expect(canTriggerTrap(trap, 0)).toBe(false);
    });
  });

  describe('getTrapAt', () => {
    test('指定位置の罠を取得できること', () => {
      const traps: Trap[] = [
        createDamageTrap(1, 1),
        createSlowTrap(2, 2),
        createAlertTrap(3, 3),
      ];
      const trap = getTrapAt(traps, 2, 2);
      expect(trap).toBeDefined();
      expect(trap?.type).toBe(TrapType.SLOW);
    });

    test('罠がない位置ではundefinedを返すこと', () => {
      const traps: Trap[] = [createDamageTrap(1, 1)];
      const trap = getTrapAt(traps, 5, 5);
      expect(trap).toBeUndefined();
    });
  });

  describe('TRAP_CONFIGS', () => {
    test('ダメージ罠のダメージ量が正しいこと', () => {
      expect(TRAP_CONFIGS[TrapType.DAMAGE].damage).toBe(2);
    });

    test('移動妨害罠の設定が正しいこと', () => {
      expect(TRAP_CONFIGS[TrapType.SLOW].slowDuration).toBe(3000);
      expect(TRAP_CONFIGS[TrapType.SLOW].slowRate).toBe(0.5);
    });

    test('索敵反応罠の範囲が正しいこと', () => {
      expect(TRAP_CONFIGS[TrapType.ALERT].alertRadius).toBe(5);
    });
  });
});
