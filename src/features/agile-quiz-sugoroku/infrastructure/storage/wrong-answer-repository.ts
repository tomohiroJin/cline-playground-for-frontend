/**
 * 誤答リポジトリ
 *
 * 復習モード用に、誤答した問題のスナップショットを永続化する。
 * 問題同定は makeQuestionKey（問題文ベース）。正解で除去する。
 */
import type { Question, ReviewEntry } from '../../domain/types';
import { makeQuestionKey } from '../../domain/quiz';
import { StoragePort } from './storage-port';

const WRONG_KEY = 'aqs_wrong_answers';

/** 保持する最大件数 */
export const MAX_WRONG_COUNT = 50;

export class WrongAnswerRepository {
  constructor(private readonly storage: StoragePort) {}

  /** 誤答一覧を読み込む（不正データは空配列にフォールバック） */
  loadAll(): ReviewEntry[] {
    const data = this.storage.get<ReviewEntry[]>(WRONG_KEY);
    if (!data || !Array.isArray(data)) return [];
    return data;
  }

  /** 誤答を記録する（同一キーは最新で上書き、上限超過で古いものを削除） */
  record(question: Question, recordedAt: number): void {
    const key = makeQuestionKey(question);
    const list = this.loadAll().filter((e) => e.key !== key);
    list.push({ key, question, recordedAt });
    while (list.length > MAX_WRONG_COUNT) list.shift();
    this.storage.set(WRONG_KEY, list);
  }

  /** 正解した問題を誤答リストから除去する */
  remove(question: Question): void {
    const key = makeQuestionKey(question);
    this.storage.set(WRONG_KEY, this.loadAll().filter((e) => e.key !== key));
  }

  /** 誤答リストを全件削除する */
  clear(): void {
    this.storage.remove(WRONG_KEY);
  }
}
