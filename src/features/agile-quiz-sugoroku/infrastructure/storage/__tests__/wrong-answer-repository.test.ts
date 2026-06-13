import { WrongAnswerRepository } from '../wrong-answer-repository';
import { InMemoryStorageAdapter } from '../in-memory-storage-adapter';
import type { Question } from '../../../domain/types';

const q = (text: string): Question => ({ question: text, options: ['a', 'b', 'c', 'd'], answer: 0, tags: ['scrum'] });

describe('WrongAnswerRepository', () => {
  it('誤答を記録して読み出せる', () => {
    const repo = new WrongAnswerRepository(new InMemoryStorageAdapter());
    repo.record(q('問題A'), 1000);
    expect(repo.loadAll()).toHaveLength(1);
    expect(repo.loadAll()[0].question.question).toBe('問題A');
  });
  it('同じ問題を複数回記録しても重複しない', () => {
    const repo = new WrongAnswerRepository(new InMemoryStorageAdapter());
    repo.record(q('問題A'), 1000);
    repo.record(q('問題A'), 2000);
    expect(repo.loadAll()).toHaveLength(1);
  });
  it('正解で誤答リストから除去できる', () => {
    const repo = new WrongAnswerRepository(new InMemoryStorageAdapter());
    repo.record(q('問題A'), 1000);
    repo.remove(q('問題A'));
    expect(repo.loadAll()).toHaveLength(0);
  });
  it('上限件数を超えたら古いものから削除', () => {
    const repo = new WrongAnswerRepository(new InMemoryStorageAdapter());
    for (let i = 0; i < 60; i++) repo.record(q(`問題${i}`), i);
    expect(repo.loadAll().length).toBeLessThanOrEqual(50);
    expect(repo.loadAll().some((e) => e.question.question === '問題59')).toBe(true);
  });
});
