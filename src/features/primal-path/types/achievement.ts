/**
 * 実績・チャレンジの型定義
 */
import type { SynergyTag } from './evolution';

/** 実績条件 */
export type AchievementCondition =
  | { type: 'first_clear' }
  | { type: 'clear_count'; count: number }
  | { type: 'clear_difficulty'; difficulty: number }
  | { type: 'all_difficulties_cleared' }
  | { type: 'all_awakenings' }
  | { type: 'max_damage'; threshold: number }
  | { type: 'total_kills'; count: number }
  | { type: 'synergy_tier2'; tag: SynergyTag }
  | { type: 'all_synergies_tier1' }
  | { type: 'event_count'; count: number }
  | { type: 'challenge_clear'; challengeId: string }
  | { type: 'no_damage_boss' }
  | { type: 'speed_clear'; maxSeconds: number }
  | { type: 'bone_hoarder'; amount: number }
  | { type: 'full_tree' };

/** 実績定義 */
export interface AchievementDef {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly condition: AchievementCondition;
}

/** 実績状態 */
export interface AchievementState {
  id: string;
  unlocked: boolean;
  unlockedDate: string | undefined;
}
