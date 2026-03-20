/**
 * フリー対戦ユースケース
 * - 設定に基づくゲーム開始
 * - リザルト処理（スコア保存・実績判定・アンロック判定）
 */
import type { GameStoragePort } from '../../domain/contracts/storage';
import type { GameEventDispatcher } from '../../domain/events/game-events';
import type { Difficulty, FieldConfig } from '../../core/types';
import type { AiBehaviorConfig } from '../../core/story-balance';
import type { MatchStatsData } from '../../domain/models/match-stats';
import { AI_BEHAVIOR_PRESETS } from '../../core/story-balance';
import {
  checkAchievements,
  type AchievementCheckContext,
} from '../../core/achievements';
import { checkUnlocks } from '../../core/unlock';

/** ゲーム設定 */
export type GameConfig = {
  difficulty: Difficulty;
  field: FieldConfig;
  winScore: number;
  aiConfig: AiBehaviorConfig;
};

/** ゲーム完了結果 */
export type GameCompleteResult = {
  highScores: number[];
  achievements: string[];
  newUnlocks: string[];
};

export class FreeBattleUseCase {
  /** 連勝数（インスタンスのライフサイクル内で管理） */
  private winStreak = 0;
  /** 勝利済みフィールド */
  private fieldsWon: string[] = [];
  /** 使用済みアイテムタイプ */
  private itemTypesUsed: string[] = [];
  /** 最大スコア差 */
  private maxScoreDiff = 0;

  constructor(
    private readonly storage: GameStoragePort,
    private readonly eventDispatcher: GameEventDispatcher
  ) {}

  /** 難易度・フィールド・勝利スコアからゲーム設定を生成する */
  createGameConfig(difficulty: Difficulty, field: FieldConfig, winScore: number): GameConfig {
    return {
      difficulty,
      field,
      winScore,
      aiConfig: AI_BEHAVIOR_PRESETS[difficulty],
    };
  }

  /** ゲーム完了処理 */
  completeGame(
    config: GameConfig,
    winner: 'player' | 'cpu',
    stats: MatchStatsData,
    finalScore: { player: number; cpu: number } = { player: 0, cpu: 0 }
  ): GameCompleteResult {
    const isWin = winner === 'player';

    // 連勝管理
    if (isWin) {
      this.winStreak++;
      if (!this.fieldsWon.includes(config.field.id)) {
        this.fieldsWon.push(config.field.id);
      }
    } else {
      this.winStreak = 0;
    }

    // アンロック状態の更新
    const unlockState = this.storage.loadUnlockState();
    const newUnlockState = checkUnlocks(unlockState, {
      isWin,
      difficulty: config.difficulty,
      fieldId: config.field.id,
    });
    this.storage.saveUnlockState(newUnlockState);

    // 新規アンロックの検出
    const newFieldUnlocks = newUnlockState.unlockedFields.filter(
      f => !unlockState.unlockedFields.includes(f)
    );
    const newItemUnlocks = newUnlockState.unlockedItems.filter(
      i => !unlockState.unlockedItems.includes(i)
    );
    const newUnlocks = [...newFieldUnlocks, ...newItemUnlocks];

    // 実績判定
    const alreadyUnlocked = this.storage.loadAchievements();
    const achievementCtx: AchievementCheckContext = {
      winner,
      scores: { p: finalScore.player, c: finalScore.cpu },
      difficulty: config.difficulty,
      fieldId: config.field.id,
      stats: {
        playerHits: stats.playerHits,
        cpuHits: stats.cpuHits,
        maxPuckSpeed: stats.maxPuckSpeed,
        playerItemsCollected: stats.playerItemsCollected,
        cpuItemsCollected: stats.cpuItemsCollected,
        playerSaves: stats.playerSaves,
        cpuSaves: stats.cpuSaves,
        matchDuration: stats.matchDuration,
      },
      winStreak: this.winStreak,
      maxScoreDiff: this.maxScoreDiff,
      fieldsWon: this.fieldsWon,
      itemTypesUsed: this.itemTypesUsed,
    };

    const newAchievements = checkAchievements(achievementCtx, alreadyUnlocked);
    if (newAchievements.length > 0) {
      const updatedAchievements = [...alreadyUnlocked, ...newAchievements.map(a => a.id)];
      this.storage.saveAchievements(updatedAchievements);

      // 実績解除イベントを発行
      for (const achievement of newAchievements) {
        this.eventDispatcher.dispatch({
          type: 'ACHIEVEMENT_UNLOCKED',
          achievementId: achievement.id,
        });
      }
    }

    return {
      highScores: [],
      achievements: newAchievements.map(a => a.id),
      newUnlocks,
    };
  }
}
