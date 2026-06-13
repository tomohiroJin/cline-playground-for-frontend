/**
 * useStudy フックのテスト
 */

// tone モジュールのモック
jest.mock('tone', () => ({
  Synth: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
  })),
  NoiseSynth: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
  })),
  start: jest.fn(),
  getContext: jest.fn(),
}));

import { renderHook, act } from '@testing-library/react';
import { useStudy } from '../presentation/hooks/useStudy';
import { WrongAnswerRepository } from '../infrastructure/storage/wrong-answer-repository';
import { InMemoryStorageAdapter } from '../infrastructure/storage/in-memory-storage-adapter';
import type { Question } from '../domain/types';

beforeEach(() => {
  localStorage.clear();
});

describe('useStudy', () => {
  it('initWithQuestions で外部の問題配列をそのまま使う', () => {
    const { result } = renderHook(() => useStudy());
    const questions = [{ question: 'Q1', options: ['a', 'b', 'c', 'd'], answer: 0, tags: ['scrum'] }];
    act(() => result.current.initWithQuestions(questions));
    expect(result.current.questions).toHaveLength(1);
    expect(result.current.currentQuestion?.question).toBe('Q1');
  });

  it('正解時に onCorrectAnswer がその問題で呼ばれる（復習導線：誤答リポジトリから除去できる）', () => {
    const wrongRepo = new WrongAnswerRepository(new InMemoryStorageAdapter());
    const q: Question = { question: 'Q1', options: ['a', 'b', 'c', 'd'], answer: 0, tags: ['scrum'] };
    wrongRepo.record(q, 1000);
    const { result } = renderHook(() =>
      useStudy({ onCorrectAnswer: (question) => wrongRepo.remove(question) })
    );
    act(() => result.current.initWithQuestions([q]));
    expect(wrongRepo.loadAll()).toHaveLength(1);
    act(() => result.current.answer(0)); // answer index 0 = 正解
    expect(wrongRepo.loadAll()).toHaveLength(0); // 克服したので除去される
  });

  it('不正解時は onCorrectAnswer を呼ばない', () => {
    const onCorrectAnswer = jest.fn();
    const q: Question = { question: 'Q1', options: ['a', 'b', 'c', 'd'], answer: 0, tags: ['scrum'] };
    const { result } = renderHook(() => useStudy({ onCorrectAnswer }));
    act(() => result.current.initWithQuestions([q]));
    act(() => result.current.answer(1)); // 不正解
    expect(onCorrectAnswer).not.toHaveBeenCalled();
  });
});
