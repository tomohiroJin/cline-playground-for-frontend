/**
 * セーブ/ロードユースケース
 *
 * infrastructure の SaveRepository に委譲しつつ、
 * Set ↔ 配列の変換を行う。
 */
import type {
  SaveState,
  GameStats,
  SprintSummary,
  TagStats,
  AnswerResultWithDetail,
} from '../domain/types';
import { SaveRepository, SAVE_VERSION } from '../infrastructure/storage/save-repository';

/** セーブ/ロード共通の依存 */
export interface SaveLoadDeps {
  saveRepository: SaveRepository;
}

/** ロード結果 */
export interface LoadGameResult {
  /** セーブデータ（配列形式） */
  saveState: SaveState;
  /** 使用済み問題（Set 形式に変換済み） */
  usedQuestionsAsSet: Record<string, Set<number>>;
}

/** セーブデータ構築入力 */
export interface BuildSaveStateInput {
  sprintCount: number;
  currentSprint: number;
  stats: GameStats;
  log: SprintSummary[];
  usedQuestions: Record<string, Set<number>>;
  tagStats: TagStats;
  incorrectQuestions: AnswerResultWithDetail[];
}

/**
 * ゲーム状態を保存する
 */
export function executeSaveGame(
  saveState: SaveState,
  deps: SaveLoadDeps,
): void {
  deps.saveRepository.save(saveState);
}

/**
 * ゲーム状態を読み込む
 *
 * usedQuestions を配列→Set に変換して返す。
 */
export function executeLoadGame(
  deps: SaveLoadDeps,
): LoadGameResult | undefined {
  const saveState = deps.saveRepository.load();
  if (!saveState) return undefined;

  // 配列→Set 変換
  const usedQuestionsAsSet: Record<string, Set<number>> = {};
  for (const [key, indices] of Object.entries(saveState.usedQuestions)) {
    usedQuestionsAsSet[key] = new Set(indices);
  }

  return { saveState, usedQuestionsAsSet };
}

/**
 * 現在の状態からセーブデータを構築する
 *
 * Set→配列 変換を行い、SaveState 形式にする。
 */
export function executeBuildSaveState(
  input: BuildSaveStateInput,
): SaveState {
  // Set→配列 変換
  const serializedUsed: Record<string, number[]> = {};
  for (const [key, indices] of Object.entries(input.usedQuestions)) {
    serializedUsed[key] = [...indices];
  }

  return {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    sprintCount: input.sprintCount,
    currentSprint: input.currentSprint,
    stats: input.stats,
    log: input.log,
    usedQuestions: serializedUsed,
    tagStats: input.tagStats,
    incorrectQuestions: input.incorrectQuestions,
  };
}
