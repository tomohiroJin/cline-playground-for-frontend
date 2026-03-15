/**
 * 履歴リポジトリ
 *
 * 過去のプレイ結果を最大10件保存する。
 * aqs_last_result からのマイグレーション機能付き。
 */
import { GameHistoryEntry, SavedGameResult } from '../../domain/types';
import { StoragePort } from './storage-port';

const HISTORY_KEY = 'aqs_history';
const LAST_RESULT_KEY = 'aqs_last_result';

/** 最大保存件数 */
export const MAX_HISTORY_COUNT = 10;

export class HistoryRepository {
  constructor(private readonly storage: StoragePort) {}

  /** 履歴を全件読み込む */
  loadAll(): GameHistoryEntry[] {
    const data = this.storage.get<GameHistoryEntry[]>(HISTORY_KEY);
    if (!data || !Array.isArray(data)) return [];
    return data;
  }

  /** 履歴にエントリを追加する（最大件数を超えたら古いものを削除） */
  save(entry: GameHistoryEntry): void {
    const history = this.loadAll();
    history.push(entry);
    while (history.length > MAX_HISTORY_COUNT) {
      history.shift();
    }
    this.storage.set(HISTORY_KEY, history);
  }

  /** 履歴を全て削除する */
  clear(): void {
    this.storage.remove(HISTORY_KEY);
  }

  /** 旧 aqs_last_result から履歴へのマイグレーション */
  migrateLastResultToHistory(): void {
    const existing = this.loadAll();
    if (existing.length > 0) return;

    const lastResult = this.storage.get<SavedGameResult>(LAST_RESULT_KEY);
    if (!lastResult) return;

    const entry = HistoryRepository.toHistoryEntry(lastResult);
    this.save(entry);
  }

  /** SavedGameResult から GameHistoryEntry に変換する */
  static toHistoryEntry(result: SavedGameResult): GameHistoryEntry {
    return {
      totalCorrect: result.totalCorrect,
      totalQuestions: result.totalQuestions,
      correctRate: result.correctRate,
      averageSpeed: result.averageSpeed,
      stability: result.stability,
      debt: result.debt,
      maxCombo: result.maxCombo,
      grade: result.grade,
      gradeLabel: result.gradeLabel,
      teamTypeId: result.teamTypeId,
      teamTypeName: result.teamTypeName,
      timestamp: result.timestamp,
    };
  }
}
