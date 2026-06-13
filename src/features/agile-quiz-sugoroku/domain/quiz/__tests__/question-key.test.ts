import { makeQuestionKey } from '../question-key';
import type { Question } from '../../types';

const q = (question: string, options?: string[]): Question => ({
  question,
  options: options ?? ['a', 'b', 'c', 'd'],
  answer: 0,
});

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
  it('問題文が空文字のとき空でないキーを返す', () => {
    const key = makeQuestionKey(q(''));
    expect(key).not.toBe('');
  });
  it('問題文が空白のみのとき空でないキーを返す', () => {
    const key = makeQuestionKey(q('   '));
    expect(key).not.toBe('');
  });
  it('問題文が空で選択肢が異なる問題はそれぞれ異なるキーを返す', () => {
    const key1 = makeQuestionKey(q('', ['x', 'y', 'z', 'w']));
    const key2 = makeQuestionKey(q('', ['p', 'q', 'r', 's']));
    expect(key1).not.toBe(key2);
  });
});
