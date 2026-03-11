/**
 * tick 関連の型定義
 */
import type { SfxType } from './common';
import type { ASkillId } from './skill';
import type { RunState } from './game-state';

/** tick 結果 */
export interface TickResult {
  nextRun: RunState;
  events: TickEvent[];
}

/** tick イベント */
export type TickEvent =
  | { type: 'enemy_killed' }
  | { type: 'player_dead' }
  | { type: 'final_boss_killed' }
  | { type: 'sfx'; sfx: SfxType }
  | { type: 'shake_enemy' }
  | { type: 'flash_player_dmg' }
  | { type: 'flash_player_heal' }
  | { type: 'popup'; v: number; crit: boolean; heal: boolean; tgt: 'en' | 'pl' }
  | { type: 'skill_fx'; sid: ASkillId; v: number };

/** プレイヤー攻撃結果 */
export interface PlayerAttackResult {
  dmg: number;
  crit: boolean;
}
