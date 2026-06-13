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
});
