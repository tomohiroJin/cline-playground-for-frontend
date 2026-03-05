/**
 * StoryScreen コンポーネントテスト
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
import { StoryScreen } from '../components/StoryScreen';
import { StoryEntry } from '../types';

// styled-components のアニメーション警告を抑制
beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterAll(() => {
  jest.restoreAllMocks();
});

/** テスト用ストーリーデータ */
const mockStory: StoryEntry = {
  sprintNumber: 1,
  title: 'はじめまして',
  narratorId: 'penguin',
  imageKey: 'story_01',
  lines: [
    { text: 'ナレーションテキスト' },
    { speakerId: 'taka', text: 'タカのセリフ' },
    { speakerId: 'penguin', text: 'ペンギンのセリフ' },
  ],
};

const defaultProps = {
  storyData: mockStory,
  sprintNumber: 1,
  onComplete: jest.fn(),
  onSkip: jest.fn(),
};

describe('StoryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ストーリータイトルが表示される', () => {
    render(<StoryScreen {...defaultProps} />);
    expect(screen.getByText('はじめまして')).toBeInTheDocument();
  });

  it('最初の行（ナレーション）が表示される', () => {
    render(<StoryScreen {...defaultProps} />);
    expect(screen.getByText('ナレーションテキスト')).toBeInTheDocument();
  });

  it('クリックで次の行が表示される', () => {
    render(<StoryScreen {...defaultProps} />);

    // 最初の行が表示されている
    expect(screen.getByText('ナレーションテキスト')).toBeInTheDocument();

    // クリックで次の行へ
    fireEvent.click(screen.getByRole('region', { name: 'ストーリー' }));
    expect(screen.getByText('タカのセリフ')).toBeInTheDocument();
  });

  it('キャラクター発言時に名前が表示される', () => {
    render(<StoryScreen {...defaultProps} />);

    // クリックしてキャラクター発言の行へ
    fireEvent.click(screen.getByRole('region', { name: 'ストーリー' }));
    expect(screen.getByText('タカ')).toBeInTheDocument();
  });

  it('全行表示後にクリックするとonCompleteが呼ばれる', () => {
    const onComplete = jest.fn();
    render(<StoryScreen {...defaultProps} onComplete={onComplete} />);

    // 3行あるので3回クリックして全行表示
    fireEvent.click(screen.getByRole('region', { name: 'ストーリー' }));
    fireEvent.click(screen.getByRole('region', { name: 'ストーリー' }));
    // 最後の行が表示された状態でもう一度クリック
    fireEvent.click(screen.getByRole('region', { name: 'ストーリー' }));

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('スキップボタンでonSkipが呼ばれる', () => {
    const onSkip = jest.fn();
    render(<StoryScreen {...defaultProps} onSkip={onSkip} />);

    fireEvent.click(screen.getByText('スキップ'));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('Escapeキーでスキップできる', () => {
    const onSkip = jest.fn();
    render(<StoryScreen {...defaultProps} onSkip={onSkip} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('Enterキーで次の行に進む', () => {
    render(<StoryScreen {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Enter' });
    expect(screen.getByText('タカのセリフ')).toBeInTheDocument();
  });

  it('Spaceキーで次の行に進む', () => {
    render(<StoryScreen {...defaultProps} />);

    fireEvent.keyDown(document, { key: ' ' });
    expect(screen.getByText('タカのセリフ')).toBeInTheDocument();
  });

  it('スプリント番号が表示される', () => {
    render(<StoryScreen {...defaultProps} />);
    expect(screen.getByText(/Sprint 1/)).toBeInTheDocument();
  });

  it('ナレーション行ではキャラクター名が表示されない', () => {
    render(<StoryScreen {...defaultProps} />);
    // 最初の行はナレーションなのでキャラクター名は出ない
    expect(screen.queryByText('タカ')).not.toBeInTheDocument();
    expect(screen.queryByText('ペンギン')).not.toBeInTheDocument();
  });
});
