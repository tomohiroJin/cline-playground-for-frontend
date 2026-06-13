/**
 * ReviewSelectScreen コンポーネントテスト
 *
 * 復習ソース選択画面の振る舞いを検証する。
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

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReviewSelectScreen } from '../presentation/components/screens/ReviewSelectScreen';

// styled-components のアニメーション警告を抑制
beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterAll(() => {
  jest.restoreAllMocks();
});

describe('ReviewSelectScreen', () => {
  it('誤答件数とブックマーク件数を表示し、誤答ソースを選べる', () => {
    const onSelect = jest.fn();
    render(<ReviewSelectScreen wrongCount={3} bookmarkCount={2} onSelectSource={onSelect} onBack={() => undefined} />);
    expect(screen.getByText(/誤答から復習/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /誤答から復習/ }));
    expect(onSelect).toHaveBeenCalledWith('wrong');
  });
  it('誤答が0件のとき誤答ボタンは無効', () => {
    render(<ReviewSelectScreen wrongCount={0} bookmarkCount={0} onSelectSource={() => undefined} onBack={() => undefined} />);
    expect(screen.getByRole('button', { name: /誤答から復習/ })).toBeDisabled();
  });
  it('戻るボタンで onBack が呼ばれる', () => {
    const onBack = jest.fn();
    render(<ReviewSelectScreen wrongCount={1} bookmarkCount={0} onSelectSource={() => undefined} onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /タイトルへ戻る|戻る/ }));
    expect(onBack).toHaveBeenCalled();
  });
});
