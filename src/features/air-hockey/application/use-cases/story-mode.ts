/**
 * ストーリーモードユースケース
 * - ストーリーフロー管理（ステージ選択→ゲーム→リザルト）
 * - ストーリー進行の保存・読込
 * - キャラクターアンロック連携
 */
import type { GameStoragePort } from '../../domain/contracts/storage';
import type { GameEventDispatcher } from '../../domain/events/game-events';
import type { StoryProgress } from '../../domain/types';
import type { FieldConfig } from '../../core/types';
import type { AiBehaviorConfig } from '../../core/story-balance';
import type { MatchStatsData } from '../../domain/models/match-stats';
import { getStoryStageBalance } from '../../core/story-balance';
import { CHAPTER_1_STAGES } from '../../core/dialogue-data';
import { FIELDS } from '../../core/config';
import { CharacterDexUseCase } from './character-dex';

/** ステージクリア結果 */
export type StageCompleteResult = {
  progress: StoryProgress;
  newUnlocks: string[];
  achievements: string[];
};

export class StoryModeUseCase {
  constructor(
    private readonly storage: GameStoragePort,
    private readonly eventDispatcher: GameEventDispatcher
  ) {}

  /** ストーリー進行を読み込む */
  loadProgress(): StoryProgress {
    return this.storage.loadStoryProgress();
  }

  /** ステージの AI 設定とフィールドを取得する */
  getStageConfig(stageId: string): { aiConfig: AiBehaviorConfig; field: FieldConfig } {
    const stage = CHAPTER_1_STAGES.find(s => s.id === stageId);
    const balance = getStoryStageBalance(stageId);

    const fieldId = stage?.fieldId ?? 'classic';
    const field = FIELDS.find(f => f.id === fieldId) ?? FIELDS[0];

    return {
      aiConfig: balance.ai,
      field,
    };
  }

  /** ステージクリア処理 */
  completeStage(
    stageId: string,
    winner: 'player' | 'cpu',
    _stats: MatchStatsData
  ): StageCompleteResult {
    const progress = this.storage.loadStoryProgress();

    // CPU が勝利した場合は進行を更新しない
    if (winner !== 'player') {
      return { progress, newUnlocks: [], achievements: [] };
    }

    // 重複を防いでクリア済みステージに追加
    const clearedStages = progress.clearedStages.includes(stageId)
      ? progress.clearedStages
      : [...progress.clearedStages, stageId];

    const updatedProgress: StoryProgress = { clearedStages };
    this.storage.saveStoryProgress(updatedProgress);

    // 図鑑アンロック判定（CharacterDexUseCase に委譲）
    const dex = new CharacterDexUseCase(this.storage);
    const newUnlocks = dex.checkAndUnlock(updatedProgress);

    return {
      progress: updatedProgress,
      newUnlocks,
      achievements: [],
    };
  }

  /** ストーリー進行をリセットする */
  resetProgress(): void {
    this.storage.saveStoryProgress({ clearedStages: [] });
  }
}
