/**
 * 勉強会モードの累計回答数リポジトリ
 *
 * 「学習の鬼」実績（勉強会モードで累計100問回答）の判定に用いる
 * セッションをまたいだ累計回答数を永続化する。
 */
import { StoragePort } from './storage-port';

const STORAGE_KEY = 'aqs_study_total_answered';

export class StudyProgressRepository {
  constructor(private readonly storage: StoragePort) {}

  /** 累計回答数を取得する */
  getTotalAnswered(): number {
    return this.storage.get<number>(STORAGE_KEY) ?? 0;
  }

  /** 累計回答数を 1 増やして永続化し、新しい累計値を返す */
  incrementAnswered(): number {
    const next = this.getTotalAnswered() + 1;
    this.storage.set(STORAGE_KEY, next);
    return next;
  }
}
