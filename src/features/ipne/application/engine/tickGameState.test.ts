import { createEnemy } from '../../enemy';
import { createItem } from '../../item';
import { createPlayer } from '../../player';
import { createTrap } from '../../trap';
import { EnemyType, ItemType, TileType, TrapState, TrapType } from '../../types';
import { tickGameState, TickDisplayEffect, TickSoundEffect } from './tickGameState';

describe('tickGameState', () => {
  const createFloorMap = (size: number) =>
    Array.from({ length: size }, () => Array.from({ length: size }, () => TileType.FLOOR));

  const createBaseInput = () => ({
    map: createFloorMap(7),
    player: createPlayer(2, 2),
    enemies: [createEnemy(EnemyType.PATROL, 4, 4)],
    items: [],
    traps: [],
    walls: [],
    pendingLevelPoints: 0,
    currentTime: 1000,
    maxLevel: 10,
  });

  test('無敵解除後に接触ダメージが適用され、音エフェクトが返ること', () => {
    const input = createBaseInput();
    const expiredInvinciblePlayer = {
      ...input.player,
      isInvincible: true,
      invincibleUntil: 900,
    };
    const survivingEnemy = createEnemy(EnemyType.PATROL, 5, 5);
    const deadEnemy = { ...createEnemy(EnemyType.PATROL, 6, 6), hp: 0 };
    const damagedPlayer = { ...expiredInvinciblePlayer, hp: expiredInvinciblePlayer.hp - 2, isInvincible: true };

    const updateEnemiesWithContact = jest.fn().mockReturnValue({
      enemies: [survivingEnemy, deadEnemy],
      contactDamage: 2,
      contactEnemy: survivingEnemy,
      attackDamage: 0,
    });
    const resolvePlayerDamage = jest
      .fn()
      .mockReturnValueOnce({ player: damagedPlayer, tookDamage: true });
    const resolveItemPickupEffects = jest.fn().mockReturnValue({
      player: damagedPlayer,
      remainingItems: [],
      triggerLevelUp: false,
      triggerMapReveal: false,
      triggerKeyPickup: false,
      events: [],
    });

    const result = tickGameState(
      { ...input, player: expiredInvinciblePlayer },
      {
        updateEnemiesWithContact,
        resolvePlayerDamage,
        resolveItemPickupEffects,
      }
    );

    expect(updateEnemiesWithContact.mock.calls[0][1].isInvincible).toBe(false);
    expect(result.player.hp).toBe(expiredInvinciblePlayer.hp - 2);
    expect(result.enemies).toHaveLength(1);
    expect(result.effects).toEqual(
      expect.arrayContaining([{ kind: 'sound', type: TickSoundEffect.PLAYER_DAMAGE }])
    );
  });

  test('アイテム取得イベントから効果音・表示エフェクト・レベルアップポイントを生成すること', () => {
    const input = createBaseInput();
    const levelUpItem = createItem(ItemType.LEVEL_UP, input.player.x, input.player.y);
    const mapRevealItem = createItem(ItemType.MAP_REVEAL, input.player.x, input.player.y);
    const nextPlayer = { ...input.player };
    const updateEnemiesWithContact = jest.fn().mockReturnValue({
      enemies: input.enemies,
      contactDamage: 0,
      attackDamage: 0,
    });
    const resolveItemPickupEffects = jest.fn().mockReturnValue({
      player: nextPlayer,
      remainingItems: [],
      triggerLevelUp: true,
      triggerMapReveal: true,
      triggerKeyPickup: false,
      events: [
        { itemId: levelUpItem.id, effectType: 'level_up', healed: false },
        { itemId: mapRevealItem.id, effectType: 'map_reveal', healed: true },
      ],
    });

    const result = tickGameState(
      { ...input, items: [levelUpItem, mapRevealItem] },
      {
        updateEnemiesWithContact,
        resolveItemPickupEffects,
      }
    );

    expect(result.pendingLevelPoints).toBe(1);
    expect(result.effects).toEqual(
      expect.arrayContaining([
        { kind: 'sound', type: TickSoundEffect.ITEM_PICKUP },
        { kind: 'sound', type: TickSoundEffect.HEAL },
        { kind: 'sound', type: TickSoundEffect.LEVEL_UP },
        { kind: 'display', type: TickDisplayEffect.MAP_REVEALED },
      ])
    );
  });

  test('罠発動で罠更新・スロー・テレポート・ダメージエフェクトが適用されること', () => {
    const input = createBaseInput();
    const trap = createTrap(TrapType.DAMAGE, input.player.x, input.player.y);
    const updateEnemiesWithContact = jest.fn().mockReturnValue({
      enemies: input.enemies,
      contactDamage: 0,
      attackDamage: 0,
    });
    const resolveItemPickupEffects = jest.fn().mockReturnValue({
      player: input.player,
      remainingItems: input.items,
      triggerLevelUp: false,
      triggerMapReveal: false,
      triggerKeyPickup: false,
      events: [],
    });
    const resolvePlayerDamage = jest.fn().mockReturnValue({
      player: { ...input.player, hp: input.player.hp - 3 },
      tookDamage: true,
    });
    const triggerTrap = jest.fn().mockReturnValue({
      trap: { ...trap, state: TrapState.REVEALED },
      damage: 3,
      slowDuration: 500,
      teleportDestination: { x: 5, y: 5 },
    });
    const applySlowEffect = jest
      .fn()
      .mockImplementation((player, currentTime, duration) => ({ ...player, slowedUntil: currentTime + duration }));

    const result = tickGameState(
      { ...input, traps: [trap] },
      {
        updateEnemiesWithContact,
        resolveItemPickupEffects,
        resolvePlayerDamage,
        getTrapAt: () => trap,
        canTriggerTrap: () => true,
        triggerTrap,
        applySlowEffect,
      }
    );

    expect(result.traps[0].state).toBe(TrapState.REVEALED);
    expect(result.player.hp).toBe(input.player.hp - 3);
    expect(result.player.slowedUntil).toBe(input.currentTime + 500);
    expect(result.player.x).toBe(5);
    expect(result.player.y).toBe(5);
    expect(result.effects).toEqual(
      expect.arrayContaining([
        { kind: 'sound', type: TickSoundEffect.TRAP_TRIGGERED },
        { kind: 'sound', type: TickSoundEffect.PLAYER_DAMAGE },
      ])
    );
  });
});
