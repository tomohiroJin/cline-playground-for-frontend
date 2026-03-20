/**
 * デイリーチャレンジユースケース
 * - 日付ベースのシード生成
 * - ルール生成と適用
 * - 結果の保存・読込
 */
import type { GameStoragePort } from '../../domain/contracts/storage';
import type { DailyChallengeResult } from '../../core/daily-challenge';
import {
  generateDailyChallenge,
  type DailyChallenge,
} from '../../core/daily-challenge';

export class DailyChallengeUseCase {
  constructor(private readonly storage: GameStoragePort) {}

  /** 今日のチャレンジを取得する */
  getTodayChallenge(): DailyChallenge {
    return generateDailyChallenge(new Date());
  }

  /** チャレンジ完了結果を保存する */
  completeChallenge(result: DailyChallengeResult): void {
    this.storage.saveDailyChallengeResult(result.date, result);
  }

  /** 過去の結果を取得する */
  getResult(date: string): DailyChallengeResult | undefined {
    return this.storage.loadDailyChallengeResult(date);
  }
}
