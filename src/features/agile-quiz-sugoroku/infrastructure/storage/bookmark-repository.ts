/**
 * ブックマークリポジトリ
 *
 * 復習モード用に、ブックマークした問題のスナップショットを永続化する。
 * 件数上限は設けない（ユーザーが能動的に管理するため）。
 */
import type { Question, ReviewEntry } from '../../domain/types';
import { makeQuestionKey } from '../../domain/quiz';
import { StoragePort } from './storage-port';

const BOOKMARK_KEY = 'aqs_bookmarks';

export class BookmarkRepository {
  constructor(private readonly storage: StoragePort) {}

  /** ブックマーク一覧を読み込む（不正データは空配列にフォールバック） */
  loadAll(): ReviewEntry[] {
    const data = this.storage.get<ReviewEntry[]>(BOOKMARK_KEY);
    if (!data || !Array.isArray(data)) return [];
    return data;
  }

  /** 問題がブックマーク済みかどうか確認する */
  isBookmarked(question: Question): boolean {
    const key = makeQuestionKey(question);
    return this.loadAll().some((e) => e.key === key);
  }

  /** ブックマークを切り替える（なければ追加、あれば削除） */
  toggle(question: Question, recordedAt: number): void {
    const key = makeQuestionKey(question);
    const list = this.loadAll();
    const exists = list.some((e) => e.key === key);
    this.storage.set(
      BOOKMARK_KEY,
      exists ? list.filter((e) => e.key !== key) : [...list, { key, question, recordedAt }],
    );
  }

  /** ブックマークを全件削除する */
  clear(): void {
    this.storage.remove(BOOKMARK_KEY);
  }
}
