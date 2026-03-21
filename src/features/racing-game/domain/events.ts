// ドメインイベント型定義

import type { Point } from './shared/types';
import type { HighlightEvent } from './highlight/types';
import type { Card } from './card/types';

/** ドメインで発生するイベント */
export type DomainEvent =
  | { readonly type: 'lap_completed'; readonly player: number; readonly lap: number; readonly lapTime: number }
  | { readonly type: 'race_finished'; readonly winner: string; readonly totalTimes: readonly number[] }
  | { readonly type: 'collision'; readonly player1: number; readonly player2: number; readonly point: Point }
  | { readonly type: 'wall_hit'; readonly player: number; readonly stage: number }
  | { readonly type: 'drift_start'; readonly player: number }
  | { readonly type: 'drift_end'; readonly player: number; readonly boostPower: number }
  | { readonly type: 'heat_boost'; readonly player: number }
  | { readonly type: 'checkpoint_passed'; readonly player: number; readonly checkpoint: number }
  | { readonly type: 'draft_triggered'; readonly player: number; readonly lap: number }
  | { readonly type: 'card_selected'; readonly player: number; readonly card: Card }
  | { readonly type: 'highlight'; readonly event: HighlightEvent };
