/**
 * Phase 3: VS 画面のテスト
 * US-2.5（VS 画面）に対応
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { VsScreen } from './VsScreen';
import type { Character } from '../core/types';

const playerChar: Character = {
  id: 'player',
  name: 'アキラ',
  icon: '/assets/characters/akira.png',
  color: '#3498db',
  reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] },
};

const cpuChar: Character = {
  id: 'hiro',
  name: 'ヒロ',
  icon: '/assets/characters/hiro.png',
  color: '#e67e22',
  reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] },
};

describe('VsScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const defaultProps = {
    playerCharacter: playerChar,
    cpuCharacter: cpuChar,
    stageName: 'はじめの一打',
    fieldName: 'Original',
    onComplete: jest.fn(),
  };

  describe('表示', () => {
    it('VSテキストが表示される', () => {
      render(<VsScreen {...defaultProps} />);
      expect(screen.getByText('VS')).toBeInTheDocument();
    });

    it('プレイヤー名が表示される', () => {
      render(<VsScreen {...defaultProps} />);
      expect(screen.getByText('アキラ')).toBeInTheDocument();
    });

    it('対戦相手名が表示される', () => {
      render(<VsScreen {...defaultProps} />);
      expect(screen.getByText('ヒロ')).toBeInTheDocument();
    });

    it('ステージ名が表示される', () => {
      render(<VsScreen {...defaultProps} />);
      expect(screen.getByText(/はじめの一打/)).toBeInTheDocument();
    });

    it('フィールド名が表示される', () => {
      render(<VsScreen {...defaultProps} />);
      expect(screen.getByText(/Original/)).toBeInTheDocument();
    });
  });

  describe('自動遷移', () => {
    it('2.6秒後にonCompleteが呼ばれる（300msフェードイン + 2000ms表示 + 300msフェードアウト）', () => {
      render(<VsScreen {...defaultProps} />);
      expect(defaultProps.onComplete).not.toHaveBeenCalled();

      // 2.6秒後（フェードイン300ms + 表示2000ms + フェードアウト300ms）
      act(() => {
        jest.advanceTimersByTime(2600);
      });
      expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
    });

    it('2秒時点ではまだonCompleteが呼ばれない', () => {
      render(<VsScreen {...defaultProps} />);
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(defaultProps.onComplete).not.toHaveBeenCalled();
    });
  });
});
