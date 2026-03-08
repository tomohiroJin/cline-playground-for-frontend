/**
 * チャレンジサービス
 *
 * チャレンジ修飾子のランステートへの適用を担当する。
 */
import type { RunState, ChallengeDef } from '../../types';
import { deepCloneRun } from '../shared/utils';

/** チャレンジ修飾子をランステートに適用する */
export function applyChallenge(run: RunState, challenge: ChallengeDef): RunState {
  const next = deepCloneRun(run);
  next.challengeId = challenge.id;

  for (const mod of challenge.modifiers) {
    switch (mod.type) {
      case 'hp_multiplier':
        next.mhp = Math.floor(next.mhp * mod.value);
        next.hp = Math.min(next.hp, next.mhp);
        break;
      case 'max_evolutions':
        next.maxEvo = mod.count;
        break;
      case 'speed_limit':
        next.timeLimit = mod.maxSeconds;
        break;
      case 'enemy_multiplier':
        if (mod.stat === 'atk') {
          next.enemyAtkMul = (next.enemyAtkMul ?? 1) * mod.value;
        }
        break;
      case 'no_healing':
        next.noHealing = true;
        break;
      case 'endless':
        next.isEndless = true;
        next.endlessWave = 0;
        break;
    }
  }

  return next;
}
