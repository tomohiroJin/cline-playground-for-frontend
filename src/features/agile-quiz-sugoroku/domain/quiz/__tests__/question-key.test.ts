import { makeQuestionKey } from '../question-key';
import type { Question } from '../../types';

const q = (question: string): Question => ({ question, options: ['a', 'b', 'c', 'd'], answer: 0 });

describe('makeQuestionKey', () => {
  it('同じ問題文には同じキー', () => {
    expect(makeQuestionKey(q('テスト問題'))).toBe(makeQuestionKey(q('テスト問題')));
  });
  it('違う問題文は違うキー', () => {
    expect(makeQuestionKey(q('問題A'))).not.toBe(makeQuestionKey(q('問題B')));
  });
  it('前後空白に依存しない', () => {
    expect(makeQuestionKey(q('  問題  '))).toBe(makeQuestionKey(q('問題')));
  });
});
