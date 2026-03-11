/**
 * ゲームフェーズのステートマシン定義
 */

/** ゲームフェーズの明示的定義 */
export type GamePhase =
  | 'title'
  | 'diff'
  | 'how'
  | 'tree'
  | 'biome'
  | 'evo'
  | 'battle'
  | 'awakening'
  | 'prefinal'
  | 'endless_checkpoint'
  | 'ally_revive'
  | 'event'
  | 'over'
  | 'stats'
  | 'achievements'
  | 'challenge';

/** フェーズ遷移の許可テーブル */
export const PHASE_TRANSITIONS: Record<GamePhase, readonly GamePhase[]> = {
  title: ['diff', 'how', 'tree', 'challenge'],
  diff: ['biome', 'title'],
  how: ['title'],
  tree: ['title'],
  challenge: ['biome', 'title'],
  biome: ['evo'],
  evo: ['battle'],
  battle: ['evo', 'awakening', 'prefinal', 'over', 'event', 'ally_revive', 'endless_checkpoint'],
  awakening: ['battle', 'evo', 'prefinal'],
  prefinal: ['battle'],
  endless_checkpoint: ['battle', 'over'],
  ally_revive: ['evo', 'prefinal'],
  event: ['battle'],
  over: ['stats', 'title'],
  stats: ['achievements', 'title'],
  achievements: ['title'],
};

/** 遷移が許可されているかを判定する */
export function isValidTransition(from: GamePhase, to: GamePhase): boolean {
  return PHASE_TRANSITIONS[from].includes(to);
}

/** 遷移が許可されていない場合に例外を投げる */
export function assertValidTransition(from: GamePhase, to: GamePhase): void {
  if (!isValidTransition(from, to)) {
    throw new Error(
      `不正なフェーズ遷移: ${from} → ${to}（許可: ${PHASE_TRANSITIONS[from].join(', ')}）`
    );
  }
}
