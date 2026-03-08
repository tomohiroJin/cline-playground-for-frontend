/**
 * Phase 3: ダイアログオーバーレイのテスト
 * US-2.4（試合前ダイアログ）に対応
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { DialogueOverlay } from './DialogueOverlay';
import type { Dialogue } from '../core/story';
import type { Character } from '../core/types';

// テスト用キャラクター
const testCharacters: Record<string, Character> = {
  hiro: {
    id: 'hiro',
    name: 'ヒロ',
    icon: '/assets/characters/hiro.png',
    color: '#e67e22',
    reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] },
  },
  player: {
    id: 'player',
    name: 'アキラ',
    icon: '/assets/characters/akira.png',
    color: '#3498db',
    reactions: { onScore: [], onConcede: [], onWin: [], onLose: [] },
  },
};

const testDialogues: Dialogue[] = [
  { characterId: 'hiro', text: 'おっ、新入り？' },
  { characterId: 'hiro', text: 'まずは俺と一勝負だ。' },
  { characterId: 'player', text: 'よろしくお願いします！' },
];

describe('DialogueOverlay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const defaultProps = {
    dialogues: testDialogues,
    characters: testCharacters,
    onComplete: jest.fn(),
  };

  describe('表示', () => {
    it('半透明の暗転オーバーレイが表示される', () => {
      render(<DialogueOverlay {...defaultProps} />);
      expect(screen.getByTestId('dialogue-overlay')).toBeInTheDocument();
    });

    it('キャラクター名が表示される', () => {
      render(<DialogueOverlay {...defaultProps} />);
      expect(screen.getByText('ヒロ')).toBeInTheDocument();
    });

    it('スキップボタンが表示される', () => {
      render(<DialogueOverlay {...defaultProps} />);
      expect(screen.getByText('スキップ')).toBeInTheDocument();
    });
  });

  describe('文字送り', () => {
    it('セリフが1文字ずつ表示される', () => {
      render(<DialogueOverlay {...defaultProps} />);
      // 初期状態では全文は表示されていない
      const textElement = screen.getByTestId('dialogue-text');
      expect(textElement.textContent).not.toBe('おっ、新入り？');

      // 全文字分の時間経過（30ms/文字 × 7文字）
      act(() => {
        jest.advanceTimersByTime(30 * 7);
      });
      expect(textElement.textContent).toBe('おっ、新入り？');
    });

    it('表示中にクリックで全文が即座に表示される', () => {
      render(<DialogueOverlay {...defaultProps} />);
      // 途中まで表示
      act(() => {
        jest.advanceTimersByTime(30 * 2);
      });

      // クリックで全文表示
      fireEvent.click(screen.getByTestId('dialogue-overlay'));
      expect(screen.getByTestId('dialogue-text').textContent).toBe('おっ、新入り？');
    });

    it('全文表示後にクリックで次のセリフへ進む', () => {
      render(<DialogueOverlay {...defaultProps} />);
      // 全文表示
      act(() => {
        jest.advanceTimersByTime(30 * 10);
      });

      // クリックで次のセリフ
      fireEvent.click(screen.getByTestId('dialogue-overlay'));

      // 次のセリフの文字送り開始
      act(() => {
        jest.advanceTimersByTime(30 * 20);
      });
      expect(screen.getByTestId('dialogue-text').textContent).toBe('まずは俺と一勝負だ。');
    });

    it('最後のセリフの後にクリックでonCompleteが呼ばれる', () => {
      render(<DialogueOverlay {...defaultProps} />);

      // 1つ目のセリフ全文表示 → クリック
      act(() => { jest.advanceTimersByTime(30 * 10); });
      fireEvent.click(screen.getByTestId('dialogue-overlay'));

      // 2つ目のセリフ全文表示 → クリック
      act(() => { jest.advanceTimersByTime(30 * 20); });
      fireEvent.click(screen.getByTestId('dialogue-overlay'));

      // 3つ目のセリフ全文表示 → クリック
      act(() => { jest.advanceTimersByTime(30 * 20); });
      fireEvent.click(screen.getByTestId('dialogue-overlay'));

      expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('スキップ', () => {
    it('スキップボタンクリックで即座にonCompleteが呼ばれる', () => {
      render(<DialogueOverlay {...defaultProps} />);
      fireEvent.click(screen.getByText('スキップ'));
      expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('キャラクター切り替え', () => {
    it('セリフのキャラクターが変わると表示名が変わる', () => {
      render(<DialogueOverlay {...defaultProps} />);
      expect(screen.getByText('ヒロ')).toBeInTheDocument();

      // 1つ目のセリフを完了 → 2つ目へ
      act(() => { jest.advanceTimersByTime(30 * 10); });
      fireEvent.click(screen.getByTestId('dialogue-overlay'));
      // 2つ目もヒロ
      expect(screen.getByText('ヒロ')).toBeInTheDocument();

      // 2つ目のセリフを完了 → 3つ目（アキラ）へ
      act(() => { jest.advanceTimersByTime(30 * 20); });
      fireEvent.click(screen.getByTestId('dialogue-overlay'));
      act(() => { jest.advanceTimersByTime(30 * 1); });
      expect(screen.getByText('アキラ')).toBeInTheDocument();
    });
  });
});
