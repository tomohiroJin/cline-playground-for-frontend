/**
 * ゲームティック — オーケストレーター
 * 各ユースケースを順番に呼び出してゲーム状態を更新する
 */
import { updateEnemiesWithContact } from '../../domain/policies/enemyAi/enemyAiFunctions';
import { COMBAT_CONFIG } from '../../domain/services/combatService';
import { EnemyUpdateResult } from '../../domain/policies/enemyAi/enemyAiFunctions';
import { GameMap, Item, Player, Trap, Wall, Enemy } from '../../types';
import { RandomProvider } from '../../domain/ports';
import { resolveItemPickupEffects } from '../usecases/resolveItemPickupEffects';
import { resolvePlayerDamage } from '../usecases/resolvePlayerDamage';
import { resolveEnemyUpdates } from '../usecases/resolveEnemyUpdates';
import { resolveRegen } from '../usecases/resolveRegen';
import { resolveTraps } from '../usecases/resolveTraps';

export const TickSoundEffect = {
  PLAYER_DAMAGE: 'player_damage',
  ITEM_PICKUP: 'item_pickup',
  HEAL: 'heal',
  TRAP_TRIGGERED: 'trap_triggered',
  LEVEL_UP: 'level_up',
  DODGE: 'dodge',
  KEY_PICKUP: 'key_pickup',
  TELEPORT: 'teleport',
  DYING: 'dying',
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
  | { kind: 'sound'; type: TickSoundEffectValue; damage?: number; enemyType?: string; itemType?: string }
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
  random?: RandomProvider;
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
}

const defaultDependencies: TickGameStateDependencies = {
  updateEnemiesWithContact,
  resolvePlayerDamage,
  resolveItemPickupEffects,
};

export function tickGameState(
  input: TickGameStateInput,
  deps: Partial<TickGameStateDependencies> = {}
): TickGameStateResult {
  const {
    map, player, enemies, items, traps, walls,
    currentTime, maxLevel, random,
    invincibleDuration = COMBAT_CONFIG.invincibleDuration,
  } = input;
  const d = { ...defaultDependencies, ...deps };
  const effects: GameTickEffect[] = [];

  // 1. 無敵状態の解除判定
  let nextPlayer = player;
  if (nextPlayer.isInvincible && currentTime >= nextPlayer.invincibleUntil) {
    nextPlayer = { ...nextPlayer, isInvincible: false };
  }

  // 2. 敵AI更新・接触判定
  const updateResult = d.updateEnemiesWithContact(enemies, nextPlayer, map, currentTime);

  // 3. 死亡アニメーション完了した敵を除去
  const updatedEnemies = resolveEnemyUpdates(updateResult.enemies, currentTime);

  // 4. 接触ダメージ処理
  if (updateResult.contactDamage > 0) {
    const damageResult = d.resolvePlayerDamage({
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
      effects.push({
        kind: 'sound',
        type: TickSoundEffect.PLAYER_DAMAGE,
        damage: updateResult.contactDamage,
        enemyType: updateResult.contactEnemy?.type,
      });
    } else {
      effects.push({ kind: 'sound', type: TickSoundEffect.DODGE });
    }
  }

  // 5. 攻撃ダメージ処理
  if (updateResult.attackDamage > 0) {
    const damageResult = d.resolvePlayerDamage({
      player: nextPlayer,
      damage: updateResult.attackDamage,
      currentTime,
      invincibleDuration,
    });
    nextPlayer = damageResult.player;
    if (damageResult.tookDamage) {
      effects.push({
        kind: 'sound',
        type: TickSoundEffect.PLAYER_DAMAGE,
        damage: updateResult.attackDamage,
        enemyType: updateResult.contactEnemy?.type,
      });
    } else {
      effects.push({ kind: 'sound', type: TickSoundEffect.DODGE });
    }
  }

  // 6. アイテム拾得処理
  const pickupResult = d.resolveItemPickupEffects({ player: nextPlayer, items });
  nextPlayer = pickupResult.player;
  for (const event of pickupResult.events) {
    const pickedItem = items.find(i => i.id === event.itemId);
    const itemType = pickedItem?.type;
    if (event.effectType === 'key') {
      effects.push({ kind: 'sound', type: TickSoundEffect.KEY_PICKUP, itemType });
    } else if (event.healed) {
      effects.push({ kind: 'sound', type: TickSoundEffect.HEAL, itemType });
    } else {
      effects.push({ kind: 'sound', type: TickSoundEffect.ITEM_PICKUP, itemType });
    }
  }

  // 7. リジェネ処理
  nextPlayer = resolveRegen(nextPlayer, currentTime);

  // 8. 罠処理
  const trapResult = resolveTraps({
    player: nextPlayer,
    traps,
    currentTime,
    invincibleDuration,
    map,
    random,
  });
  nextPlayer = trapResult.player;
  effects.push(...trapResult.effects);

  // 9. レベルアップ判定
  let nextPendingLevelPoints = input.pendingLevelPoints;
  const effectiveLevel = nextPlayer.level + nextPendingLevelPoints;
  if (pickupResult.triggerLevelUp && effectiveLevel < maxLevel) {
    nextPendingLevelPoints += 1;
    effects.push({ kind: 'sound', type: TickSoundEffect.LEVEL_UP });
  }

  if (pickupResult.triggerMapReveal) {
    effects.push({ kind: 'display', type: TickDisplayEffect.MAP_REVEALED });
  }

  // 10. ゲームオーバー判定
  const isGameOver = nextPlayer.hp <= 0;
  if (isGameOver) {
    effects.push({ kind: 'sound', type: TickSoundEffect.DYING });
    effects.push({ kind: 'display', type: TickDisplayEffect.GAME_OVER });
  }

  return {
    player: nextPlayer,
    enemies: updatedEnemies,
    items: pickupResult.remainingItems,
    traps: trapResult.traps,
    pendingLevelPoints: nextPendingLevelPoints,
    isGameOver,
    effects,
  };
}
