/**
 * 実績通知 Observer パターン
 *
 * 実績の獲得をイベントとして通知し、UI（トースト表示）と
 * ストレージ（永続化）を疎結合にする。
 */
import type { AchievementDefinition } from '../domain/types';

/** 実績イベントのリスナー型 */
export type AchievementListener = (achievements: AchievementDefinition[]) => void;

/**
 * 実績通知オブザーバー
 *
 * 実績獲得時にリスナーを呼び出して通知する。
 * UI コンポーネントやストレージ永続化を疎結合に接続可能。
 */
export class AchievementObserver {
  private listeners: AchievementListener[] = [];

  /** リスナーを登録 */
  subscribe(listener: AchievementListener): () => void {
    this.listeners.push(listener);
    // 購読解除関数を返す
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /** 実績獲得を通知 */
  notify(achievements: AchievementDefinition[]): void {
    if (achievements.length === 0) return;
    for (const listener of this.listeners) {
      listener(achievements);
    }
  }

  /** 全リスナーを解除 */
  clear(): void {
    this.listeners = [];
  }
}
