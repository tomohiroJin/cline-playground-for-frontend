import { updateEnemiesWithContact } from '../../enemyAI';
import { COMBAT_CONFIG } from '../../combat';
import { applySlowEffect } from '../../player';
import { canTriggerTrap, getTrapAt, triggerTrap } from '../../trap';
import { EnemyUpdateResult } from '../../enemyAI';
import { GameMap, Item, Player, Trap, Wall, Enemy } from '../../types';
import { resolveItemPickupEffects } from '../usecases/resolveItemPickupEffects';
import { resolvePlayerDamage } from '../usecases/resolvePlayerDamage';

export const TickSoundEffect = {
  PLAYER_DAMAGE: 'player_damage',
  ITEM_PICKUP: 'item_pickup',
  HEAL: 'heal',
  TRAP_TRIGGERED: 'trap_triggered',
  LEVEL_UP: 'level_up',
} as const;

export type TickSoundEffectValue = (typeof TickSoundEffect)[keyof typeof TickSoundEffect];

export const TickDisplayEffect = {
  MAP_REVEALED: 'map_revealed',
  GAME_OVER: 'game_over',
} as const;

export type TickDisplayEffectValue = (typeof TickDisplayEffect)[keyof typeof TickDisplayEffect];

export const TickSaveEffect = {
  RECORD: 'record',
} as const;

export type TickSaveEffectValue = (typeof TickSaveEffect)[keyof typeof TickSaveEffect];

export type GameTickEffect =
  | { kind: 'sound'; type: TickSoundEffectValue }
  | { kind: 'display'; type: TickDisplayEffectValue }
  | { kind: 'save'; type: TickSaveEffectValue };

export interface TickGameStateInput {
  map: GameMap;
  player: Player;
  enemies: Enemy[];
  items: Item[];
  traps: Trap[];
  walls: Wall[];
  pendingLevelPoints: number;
  currentTime: number;
  invincibleDuration?: number;
  maxLevel: number;
}

export interface TickGameStateResult {
  player: Player;
  enemies: Enemy[];
  items: Item[];
  traps: Trap[];
  pendingLevelPoints: number;
  isGameOver: boolean;
  effects: GameTickEffect[];
}

interface TickGameStateDependencies {
  updateEnemiesWithContact: (
    enemies: Enemy[],
    player: Player,
    map: GameMap,
    currentTime: number
  ) => EnemyUpdateResult;
  resolvePlayerDamage: typeof resolvePlayerDamage;
  resolveItemPickupEffects: typeof resolveItemPickupEffects;
  getTrapAt: typeof getTrapAt;
  canTriggerTrap: typeof canTriggerTrap;
  triggerTrap: typeof triggerTrap;
  applySlowEffect: typeof applySlowEffect;
}

const defaultDependencies: TickGameStateDependencies = {
  updateEnemiesWithContact,
  resolvePlayerDamage,
  resolveItemPickupEffects,
  getTrapAt,
  canTriggerTrap,
  triggerTrap,
  applySlowEffect,
};

export function tickGameState(
  input: TickGameStateInput,
  deps: Partial<TickGameStateDependencies> = {}
): TickGameStateResult {
  const {
    map,
    player,
    enemies,
    items,
    traps,
    walls,
    currentTime,
    maxLevel,
    invincibleDuration = COMBAT_CONFIG.invincibleDuration,
  } = input;
  const dependencies: TickGameStateDependencies = { ...defaultDependencies, ...deps };
  const effects: GameTickEffect[] = [];

  let nextPlayer = player;
  if (nextPlayer.isInvincible && currentTime >= nextPlayer.invincibleUntil) {
    nextPlayer = { ...nextPlayer, isInvincible: false };
  }

  const updateResult = dependencies.updateEnemiesWithContact(enemies, nextPlayer, map, currentTime);
  const updatedEnemies = updateResult.enemies.filter(enemy => enemy.hp > 0);

  if (updateResult.contactDamage > 0) {
    const damageResult = dependencies.resolvePlayerDamage({
      player: nextPlayer,
      damage: updateResult.contactDamage,
      currentTime,
      invincibleDuration,
      sourceEnemy: updateResult.contactEnemy,
      map,
      enemies: updatedEnemies,
      walls,
    });
    nextPlayer = damageResult.player;
    if (damageResult.tookDamage) {
      effects.push({ kind: 'sound', type: TickSoundEffect.PLAYER_DAMAGE });
    }
  }

  if (updateResult.attackDamage > 0) {
    const damageResult = dependencies.resolvePlayerDamage({
      player: nextPlayer,
      damage: updateResult.attackDamage,
      currentTime,
      invincibleDuration,
    });
    nextPlayer = damageResult.player;
    if (damageResult.tookDamage) {
      effects.push({ kind: 'sound', type: TickSoundEffect.PLAYER_DAMAGE });
    }
  }

  const pickupResult = dependencies.resolveItemPickupEffects({
    player: nextPlayer,
    items,
  });
  nextPlayer = pickupResult.player;
  for (const event of pickupResult.events) {
    if (event.healed) {
      effects.push({ kind: 'sound', type: TickSoundEffect.HEAL });
    } else {
      effects.push({ kind: 'sound', type: TickSoundEffect.ITEM_PICKUP });
    }
  }

  let nextTraps = traps;
  const trapAtPlayer = dependencies.getTrapAt(nextTraps, nextPlayer.x, nextPlayer.y);
  if (trapAtPlayer && dependencies.canTriggerTrap(trapAtPlayer, currentTime)) {
    const trapResult = dependencies.triggerTrap(trapAtPlayer, nextPlayer, currentTime, map);
    const trapDamageResult = dependencies.resolvePlayerDamage({
      player: nextPlayer,
      damage: trapResult.damage,
      currentTime,
      invincibleDuration,
    });
    nextPlayer = trapDamageResult.player;
    if (trapResult.slowDuration > 0) {
      nextPlayer = dependencies.applySlowEffect(nextPlayer, currentTime, trapResult.slowDuration);
    }
    if (trapResult.teleportDestination) {
      nextPlayer = {
        ...nextPlayer,
        x: trapResult.teleportDestination.x,
        y: trapResult.teleportDestination.y,
      };
    }
    nextTraps = nextTraps.map(t => (t.id === trapResult.trap.id ? trapResult.trap : t));
    effects.push({ kind: 'sound', type: TickSoundEffect.TRAP_TRIGGERED });
    if (trapDamageResult.tookDamage) {
      effects.push({ kind: 'sound', type: TickSoundEffect.PLAYER_DAMAGE });
    }
  }

  let nextPendingLevelPoints = input.pendingLevelPoints;
  const effectiveLevel = nextPlayer.level + nextPendingLevelPoints;
  if (pickupResult.triggerLevelUp && effectiveLevel < maxLevel) {
    nextPendingLevelPoints += 1;
    effects.push({ kind: 'sound', type: TickSoundEffect.LEVEL_UP });
  }

  if (pickupResult.triggerMapReveal) {
    effects.push({ kind: 'display', type: TickDisplayEffect.MAP_REVEALED });
  }

  const isGameOver = nextPlayer.hp <= 0;
  if (isGameOver) {
    effects.push({ kind: 'display', type: TickDisplayEffect.GAME_OVER });
  }

  return {
    player: nextPlayer,
    enemies: updatedEnemies,
    items: pickupResult.remainingItems,
    traps: nextTraps,
    pendingLevelPoints: nextPendingLevelPoints,
    isGameOver,
    effects,
  };
}
