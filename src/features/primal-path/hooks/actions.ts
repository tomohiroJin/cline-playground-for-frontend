/**
 * 原始進化録 - PRIMAL PATH - アクション型定義
 *
 * 全 GameAction をドメイン別にグループ化し、型ガード関数を提供する。
 */
import type {
  GamePhase, RunState, Evolution, SaveData,
  BiomeId, ASkillId, EventChoice, RandomEventDef,
} from '../types';

/* ===== 戦闘アクション ===== */

export type BattleAction =
  | { type: 'BATTLE_TICK'; nextRun: RunState }
  | { type: 'AFTER_BATTLE' }
  | { type: 'USE_SKILL'; sid: ASkillId }
  | { type: 'CHANGE_SPEED'; speed: number }
  | { type: 'SURRENDER' }
  | { type: 'FINAL_BOSS_KILLED' };

const BATTLE_TYPES: ReadonlySet<string> = new Set([
  'BATTLE_TICK', 'AFTER_BATTLE', 'USE_SKILL',
  'CHANGE_SPEED', 'SURRENDER', 'FINAL_BOSS_KILLED',
]);

/* ===== 進化アクション ===== */

export type EvolutionAction =
  | { type: 'SELECT_EVO'; evo: Evolution }
  | { type: 'SKIP_EVO' }
  | { type: 'SHOW_EVO' }
  | { type: 'PROCEED_AFTER_AWK' }
  | { type: 'PROCEED_TO_BATTLE' };

const EVOLUTION_TYPES: ReadonlySet<string> = new Set([
  'SELECT_EVO', 'SKIP_EVO', 'SHOW_EVO',
  'PROCEED_AFTER_AWK', 'PROCEED_TO_BATTLE',
]);

/* ===== イベントアクション ===== */

export type EventAction =
  | { type: 'TRIGGER_EVENT'; event: RandomEventDef }
  | { type: 'CHOOSE_EVENT'; choice: EventChoice }
  | { type: 'APPLY_EVENT_RESULT'; nextRun: RunState };

const EVENT_TYPES: ReadonlySet<string> = new Set([
  'TRIGGER_EVENT', 'CHOOSE_EVENT', 'APPLY_EVENT_RESULT',
]);

/* ===== 進行アクション ===== */

export type ProgressionAction =
  | { type: 'START_RUN'; di: number; loopOverride: number }
  | { type: 'START_CHALLENGE'; challengeId: string; di: number }
  | { type: 'GO_DIFF' }
  | { type: 'GO_HOW' }
  | { type: 'GO_TREE' }
  | { type: 'PREPARE_BIOME_SELECT' }
  | { type: 'PICK_BIOME'; biome: BiomeId }
  | { type: 'GO_FINAL_BOSS' }
  | { type: 'BIOME_CLEARED' }
  | { type: 'SET_PHASE'; phase: GamePhase };

const PROGRESSION_TYPES: ReadonlySet<string> = new Set([
  'START_RUN', 'START_CHALLENGE', 'GO_DIFF', 'GO_HOW', 'GO_TREE',
  'PREPARE_BIOME_SELECT', 'PICK_BIOME', 'GO_FINAL_BOSS', 'BIOME_CLEARED',
  'SET_PHASE',
]);

/* ===== メタアクション ===== */

export type MetaAction =
  | { type: 'GAME_OVER'; won: boolean }
  | { type: 'RETURN_TO_TITLE' }
  | { type: 'BUY_TREE_NODE'; nodeId: string }
  | { type: 'RESET_SAVE' }
  | { type: 'LOAD_SAVE'; save: SaveData }
  | { type: 'LOAD_META' }
  | { type: 'RECORD_RUN_END'; won: boolean }
  | { type: 'REVIVE_ALLY'; allyIndex: number; pct: number }
  | { type: 'SKIP_REVIVE' }
  | { type: 'ENDLESS_CONTINUE' }
  | { type: 'ENDLESS_RETIRE' };

const META_TYPES: ReadonlySet<string> = new Set([
  'GAME_OVER', 'RETURN_TO_TITLE', 'BUY_TREE_NODE', 'RESET_SAVE',
  'LOAD_SAVE', 'LOAD_META', 'RECORD_RUN_END', 'REVIVE_ALLY',
  'SKIP_REVIVE', 'ENDLESS_CONTINUE', 'ENDLESS_RETIRE',
]);

/* ===== 統合型 ===== */

export type GameAction =
  | BattleAction
  | EvolutionAction
  | EventAction
  | ProgressionAction
  | MetaAction;

/* ===== 型ガード関数 ===== */

export function isBattleAction(action: GameAction): action is BattleAction {
  return BATTLE_TYPES.has(action.type);
}

export function isEvolutionAction(action: GameAction): action is EvolutionAction {
  return EVOLUTION_TYPES.has(action.type);
}

export function isEventAction(action: GameAction): action is EventAction {
  return EVENT_TYPES.has(action.type);
}

export function isProgressionAction(action: GameAction): action is ProgressionAction {
  return PROGRESSION_TYPES.has(action.type);
}

export function isMetaAction(action: GameAction): action is MetaAction {
  return META_TYPES.has(action.type);
}
