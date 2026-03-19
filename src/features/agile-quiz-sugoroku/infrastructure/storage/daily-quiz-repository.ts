/**
 * デイリークイズリポジトリ
 *
 * デイリークイズの結果保存とストリーク計算を管理する。
 * 問題選出ロジック（getDailyQuestions 等）はドメイン層に留まる。
 */
import { StoragePort } from './storage-port';

/** デイリークイズの結果 */
export interface DailyResult {
  /** 日付キー（YYYY-MM-DD） */
  dateKey: string;
  /** 正解数 */
  correctCount: number;
  /** 出題数 */
  totalCount: number;
  /** タイムスタンプ */
  timestamp: number;
}

/** デイリークイズ日別保存データ */
interface DailyStorage {
  [dateKey: string]: DailyResult;
}

const STORAGE_KEY = 'aqs_daily';

/** 日付キーをフォーマットする（YYYY-MM-DD） */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export class DailyQuizRepository {
  constructor(private readonly storage: StoragePort) {}

  /** デイリー結果を保存する */
  saveResult(result: DailyResult): void {
    const data = this.loadStorage();
    data[result.dateKey] = result;
    this.storage.set(STORAGE_KEY, data);
  }

  /** 指定日のデイリー結果を取得する */
  getResult(dateKey: string): DailyResult | undefined {
    const data = this.loadStorage();
    return data[dateKey];
  }

  /** 連続参加日数（ストリーク）を計算する */
  getStreak(today: Date): number {
    const data = this.loadStorage();
    let streak = 0;
    const current = new Date(today);

    while (true) {
      const key = formatDateKey(current);
      if (data[key]) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  /** 内部ストレージを読み込む */
  private loadStorage(): DailyStorage {
    const data = this.storage.get<DailyStorage>(STORAGE_KEY);
    return data ?? {};
  }
}
