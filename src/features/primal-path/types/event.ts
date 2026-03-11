/**
 * ランダムイベントの型定義
 */
import type { BiomeId, CivType } from './common';

/** イベントID */
export type EventId =
  | 'bone_merchant'
  | 'ancient_shrine'
  | 'lost_ally'
  | 'poison_swamp'
  | 'mystery_fossil'
  | 'beast_den'
  | 'starry_night'
  | 'cave_painting';

/** イベント効果 */
export type EventEffect =
  | { type: 'stat_change'; stat: 'hp' | 'atk' | 'def'; value: number }
  | { type: 'heal'; amount: number }
  | { type: 'damage'; amount: number }
  | { type: 'bone_change'; amount: number }
  | { type: 'add_ally'; allyTemplate: string }
  | { type: 'random_evolution' }
  | { type: 'civ_level_up'; civType: CivType | 'dominant' }
  | { type: 'nothing' };

/** イベント選択肢コスト */
export type EventCost =
  | { readonly type: 'bone'; readonly amount: number }
  | { readonly type: 'hp_damage'; readonly amount: number };

/** イベント選択肢 */
export interface EventChoice {
  readonly label: string;
  readonly description: string;
  readonly effect: EventEffect;
  readonly riskLevel: 'safe' | 'risky' | 'dangerous';
  readonly cost?: EventCost;
}

/** ランダムイベント定義 */
export interface RandomEventDef {
  readonly id: EventId;
  readonly name: string;
  readonly description: string;
  readonly situationText: string;
  readonly choices: readonly EventChoice[];
  readonly biomeAffinity?: readonly BiomeId[];
  readonly minBiomeCount?: number;
}
