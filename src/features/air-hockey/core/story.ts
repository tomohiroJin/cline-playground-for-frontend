/**
 * ストーリー進行管理
 * US-2.8: ストーリー進行の保存・読み込み・リセット
 */
import type { Difficulty } from './types';

// ── ストーリー用の型定義 ────────────────────────────

// ダイアログ中の表情指定（省略時は 'normal'）
export type DialogueExpression = 'normal' | 'happy';

/** ダイアログ1行分 */
export type Dialogue = {
  characterId: string;
  text: string;
  expression?: DialogueExpression;
};

/** ステージ定義 */
export type StageDefinition = {
  id: string;
  chapter: number;
  stageNumber: number;
  name: string;
  characterId: string;
  fieldId: string;
  difficulty: Difficulty;
  winScore: number;
  preDialogue: Dialogue[];
  postWinDialogue: Dialogue[];
  postLoseDialogue: Dialogue[];
  backgroundId?: string;
  chapterTitle?: string;
  chapterSubtitle?: string;
  isChapterFinale?: boolean;
};

/** ストーリー進行データ */
export type StoryProgress = {
  clearedStages: string[];
};

// ── localStorage 操作 ──────────────────────────────

export const STORY_PROGRESS_KEY = 'ah_story_progress';

/** デフォルトのストーリー進行データ */
const DEFAULT_PROGRESS: StoryProgress = { clearedStages: [] };

/** ストーリー進行を読み込む（localStorage 破損時はフォールバック） */
export const loadStoryProgress = (): StoryProgress => {
  const raw = localStorage.getItem(STORY_PROGRESS_KEY);
  if (!raw) return { ...DEFAULT_PROGRESS };

  try {
    const parsed: unknown = JSON.parse(raw);
    // clearedStages が配列であることを検証
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'clearedStages' in parsed &&
      Array.isArray((parsed as StoryProgress).clearedStages)
    ) {
      return parsed as StoryProgress;
    }
    return { ...DEFAULT_PROGRESS };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
};

/** ストーリー進行を保存する */
export const saveStoryProgress = (progress: StoryProgress): void => {
  localStorage.setItem(STORY_PROGRESS_KEY, JSON.stringify(progress));
};

/** ストーリー進行をリセットする */
export const resetStoryProgress = (): void => {
  localStorage.removeItem(STORY_PROGRESS_KEY);
};

// ── ステージ解放判定 ───────────────────────────────

/** 指定ステージが解放されているか判定する */
export const isStageUnlocked = (
  stageId: string,
  progress: StoryProgress,
  stages: StageDefinition[]
): boolean => {
  const idx = stages.findIndex(s => s.id === stageId);
  // 最初のステージは常に解放
  if (idx <= 0) return true;
  // 前のステージがクリア済みなら解放
  const prevStage = stages[idx - 1];
  return progress.clearedStages.includes(prevStage.id);
};
