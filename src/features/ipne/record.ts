/**
 * IPNE ゲーム記録システム
 *
 * ゲームクリア記録の保存・読み込み・ベスト記録管理を担当
 */

import { GameRecord, BestRecords, PlayerClass, PlayerClassValue, RatingValue } from './types';

// 型の再エクスポート
export type { BestRecords, GameRecord } from './types';

/** ローカルストレージのキー */
export const STORAGE_KEYS = {
  BEST_RECORDS: 'ipne_best_records',
  TUTORIAL_COMPLETED: 'ipne_tutorial_completed',
} as const;

/**
 * 新しいゲーム記録を作成する
 * @param time クリアタイム（ミリ秒）
 * @param rating 評価ランク
 * @param playerClass プレイヤーの職業
 * @returns ゲーム記録
 */
export function createRecord(
  time: number,
  rating: RatingValue,
  playerClass: PlayerClassValue
): GameRecord {
  return {
    time,
    rating,
    playerClass,
    date: new Date().toISOString(),
  };
}

/**
 * ベスト記録をローカルストレージから読み込む
 * @returns ベスト記録（存在しない場合は空オブジェクト）
 */
export function loadBestRecords(): BestRecords {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.BEST_RECORDS);
    if (stored) {
      return JSON.parse(stored) as BestRecords;
    }
  } catch {
    console.warn('ベスト記録の読み込みに失敗しました');
  }
  return {};
}

/**
 * ベスト記録をローカルストレージに保存する
 * @param records ベスト記録
 */
export function saveBestRecords(records: BestRecords): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BEST_RECORDS, JSON.stringify(records));
  } catch {
    console.warn('ベスト記録の保存に失敗しました');
  }
}

/**
 * 指定された記録がベスト記録かどうかを判定する
 * @param record 判定する記録
 * @param currentBest 現在のベスト記録（存在しない場合はundefined）
 * @returns ベスト記録の場合true
 */
export function isBestRecord(record: GameRecord, currentBest: GameRecord | undefined): boolean {
  // ベスト記録がない場合は常にベスト
  if (!currentBest) {
    return true;
  }
  // タイムが短い方がベスト
  return record.time < currentBest.time;
}

/**
 * ベスト記録を更新する
 * @param record 新しい記録
 * @param records 現在のベスト記録
 * @returns 更新後のベスト記録と更新されたかどうか
 */
export function updateBestRecord(
  record: GameRecord,
  records: BestRecords
): { records: BestRecords; isNewBest: boolean } {
  const currentBest = records[record.playerClass];

  if (isBestRecord(record, currentBest)) {
    const newRecords = {
      ...records,
      [record.playerClass]: record,
    };
    saveBestRecords(newRecords);
    return { records: newRecords, isNewBest: true };
  }

  return { records, isNewBest: false };
}

/**
 * 記録を保存し、必要に応じてベスト記録を更新する
 * @param record 保存する記録
 * @returns 更新後のベスト記録と更新されたかどうか
 */
export function saveRecord(record: GameRecord): { records: BestRecords; isNewBest: boolean } {
  const currentRecords = loadBestRecords();
  return updateBestRecord(record, currentRecords);
}

/**
 * 全ての記録をクリアする
 */
export function clearRecords(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.BEST_RECORDS);
    localStorage.removeItem(STORAGE_KEYS.TUTORIAL_COMPLETED);
  } catch {
    console.warn('記録のクリアに失敗しました');
  }
}

/**
 * 指定された職業のベスト記録を取得する
 * @param playerClass プレイヤーの職業
 * @returns ベスト記録（存在しない場合はundefined）
 */
export function getBestRecordForClass(playerClass: PlayerClassValue): GameRecord | undefined {
  const records = loadBestRecords();
  return records[playerClass];
}

/**
 * 全職業のベスト記録を取得する
 * @returns 職業ごとのベスト記録の配列
 */
export function getAllBestRecords(): { playerClass: PlayerClassValue; record: GameRecord }[] {
  const records = loadBestRecords();
  const result: { playerClass: PlayerClassValue; record: GameRecord }[] = [];

  const warriorRecord = records[PlayerClass.WARRIOR];
  if (warriorRecord) {
    result.push({ playerClass: PlayerClass.WARRIOR, record: warriorRecord });
  }
  const thiefRecord = records[PlayerClass.THIEF];
  if (thiefRecord) {
    result.push({ playerClass: PlayerClass.THIEF, record: thiefRecord });
  }

  return result;
}
