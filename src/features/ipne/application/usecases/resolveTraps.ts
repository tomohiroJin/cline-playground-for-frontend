/**
 * 罠トリガー処理ユースケース
 * プレイヤー位置の罠を検出し、効果を適用する
 */
import { Player, Trap, GameMap, TrapType } from '../../types';
import { getTrapAt, canTriggerTrap, triggerTrap } from '../../domain/entities/trap';
import { applySlowEffect } from '../../domain/entities/player';
import { resolvePlayerDamage } from './resolvePlayerDamage';
import { GameTickEffect, TickSoundEffect } from '../engine/tickGameState';
import { RandomProvider } from '../../domain/ports';

export interface ResolveTrapsInput {
  player: Player;
  traps: Trap[];
  currentTime: number;
  invincibleDuration: number;
  map: GameMap;
  random?: RandomProvider;
}

export interface ResolveTrapsResult {
  player: Player;
  traps: Trap[];
  effects: GameTickEffect[];
}

interface ResolveTrapsDependencies {
  getTrapAt: typeof getTrapAt;
  canTriggerTrap: typeof canTriggerTrap;
  triggerTrap: typeof triggerTrap;
  applySlowEffect: typeof applySlowEffect;
  resolvePlayerDamage: typeof resolvePlayerDamage;
}

const defaultDependencies: ResolveTrapsDependencies = {
  getTrapAt,
  canTriggerTrap,
  triggerTrap,
  applySlowEffect,
  resolvePlayerDamage,
};

/**
 * プレイヤー位置の罠を検出し、効果を適用する
 */
export function resolveTraps(
  input: ResolveTrapsInput,
  deps: Partial<ResolveTrapsDependencies> = {}
): ResolveTrapsResult {
  const { player, traps, currentTime, invincibleDuration, map, random } = input;
  const d = { ...defaultDependencies, ...deps };
  const effects: GameTickEffect[] = [];

  const trapAtPlayer = d.getTrapAt(traps, player.x, player.y);
  if (!trapAtPlayer || !d.canTriggerTrap(trapAtPlayer, currentTime)) {
    return { player, traps, effects };
  }

  const trapResult = d.triggerTrap(trapAtPlayer, player, currentTime, map, random);
  const trapDamageResult = d.resolvePlayerDamage({
    player,
    damage: trapResult.damage,
    currentTime,
    invincibleDuration,
  });

  let nextPlayer = trapDamageResult.player;

  if (trapResult.slowDuration > 0) {
    nextPlayer = d.applySlowEffect(nextPlayer, currentTime, trapResult.slowDuration);
  }

  if (trapResult.teleportDestination) {
    nextPlayer = {
      ...nextPlayer,
      x: trapResult.teleportDestination.x,
      y: trapResult.teleportDestination.y,
    };
  }

  const nextTraps = traps.map(t => (t.id === trapResult.trap.id ? trapResult.trap : t));

  // テレポート罠は専用の効果音、それ以外は共通の罠発動音
  if (trapAtPlayer.type === TrapType.TELEPORT) {
    effects.push({ kind: 'sound', type: TickSoundEffect.TELEPORT });
  } else {
    effects.push({ kind: 'sound', type: TickSoundEffect.TRAP_TRIGGERED });
  }

  if (trapDamageResult.tookDamage) {
    effects.push({ kind: 'sound', type: TickSoundEffect.PLAYER_DAMAGE });
  }

  return { player: nextPlayer, traps: nextTraps, effects };
}
