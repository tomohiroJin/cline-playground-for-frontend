import { buildReviewPool } from '../review-question-pool';
import type { Question, ReviewEntry } from '../../types';

const q = (text: string, tags: string[]): Question => ({
  question: text,
  options: ['a', 'b', 'c', 'd'],
  answer: 0,
  tags,
});

const entry = (text: string, tags: string[]): ReviewEntry => ({
  key: text,
  question: q(text, tags),
  recordedAt: 0,
});

describe('buildReviewPool', () => {
  it('source=wrong は誤答の問題', () => {
    expect(
      buildReviewPool({
        source: 'wrong',
        wrong: [entry('A', ['scrum'])],
        bookmarks: [],
        allByTag: {},
      }).map((p) => p.question),
    ).toEqual(['A']);
  });
  it('source=bookmark はブックマークの問題', () => {
    expect(
      buildReviewPool({
        source: 'bookmark',
        wrong: [],
        bookmarks: [entry('B', ['agile'])],
        allByTag: {},
      }).map((p) => p.question),
    ).toEqual(['B']);
  });
  it('source=tag は指定タグの全問題', () => {
    const allByTag = { scrum: [q('C', ['scrum']), q('D', ['scrum'])] };
    expect(
      buildReviewPool({
        source: 'tag',
        tagId: 'scrum',
        wrong: [],
        bookmarks: [],
        allByTag,
      })
        .map((p) => p.question)
        .sort(),
    ).toEqual(['C', 'D']);
  });
  it('該当なしは空配列', () => {
    expect(
      buildReviewPool({ source: 'wrong', wrong: [], bookmarks: [], allByTag: {} }),
    ).toEqual([]);
  });
});
