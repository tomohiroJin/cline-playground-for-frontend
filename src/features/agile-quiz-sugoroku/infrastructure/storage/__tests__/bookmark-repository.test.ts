import { BookmarkRepository } from '../bookmark-repository';
import { InMemoryStorageAdapter } from '../in-memory-storage-adapter';
import type { Question } from '../../../domain/types';

const q = (text: string): Question => ({ question: text, options: ['a', 'b', 'c', 'd'], answer: 0, tags: ['scrum'] });

describe('BookmarkRepository', () => {
  it('toggle で追加・削除を切り替える', () => {
    const repo = new BookmarkRepository(new InMemoryStorageAdapter());
    expect(repo.isBookmarked(q('問題A'))).toBe(false);
    repo.toggle(q('問題A'), 1000);
    expect(repo.isBookmarked(q('問題A'))).toBe(true);
    repo.toggle(q('問題A'), 2000);
    expect(repo.isBookmarked(q('問題A'))).toBe(false);
  });
  it('loadAll でブックマーク済みを返す', () => {
    const repo = new BookmarkRepository(new InMemoryStorageAdapter());
    repo.toggle(q('問題A'), 1000);
    expect(repo.loadAll()).toHaveLength(1);
  });
});
