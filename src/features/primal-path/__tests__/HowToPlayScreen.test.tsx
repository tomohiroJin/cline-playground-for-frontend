/**
 * 原始進化録 - PRIMAL PATH - 遊び方画面コンポーネントテスト（Phase 7-6）
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HowToPlayScreen } from '../components/HowToPlayScreen';
import type { SfxType } from '../types';
import type { GameAction } from '../hooks';

/* ===== テスト ===== */

describe('HowToPlayScreen', () => {
  const mockDispatch = jest.fn<void, [GameAction]>();
  const mockPlaySfx = jest.fn<void, [SfxType]>();

  beforeEach(() => {
    mockDispatch.mockClear();
    mockPlaySfx.mockClear();
  });

  describe('既存セクション', () => {
    it('基本ルールセクションが表示される', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      expect(screen.getByText(/基本ルール/)).toBeInTheDocument();
    });

    it('三大文明セクションが表示される', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      expect(screen.getByText(/三大文明/)).toBeInTheDocument();
    });

    it('アクティブスキルセクションが表示される', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      expect(screen.getByText(/アクティブスキル/)).toBeInTheDocument();
    });
  });

  describe('シナジーセクション', () => {
    it('シナジーシステムの見出しが表示される', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      expect(screen.getByText(/シナジーシステム/)).toBeInTheDocument();
    });

    it('タグ2個でボーナス発動の説明がある', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      expect(screen.getByText(/Tier1ボーナス/)).toBeInTheDocument();
    });
  });

  describe('ランダムイベントセクション', () => {
    it('ランダムイベントの説明が表示される', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      expect(screen.getAllByText(/ランダムイベント/).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('実績・チャレンジセクション', () => {
    it('実績・チャレンジの見出しが表示される', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      expect(screen.getByText(/実績・チャレンジ/)).toBeInTheDocument();
    });

    it('チャレンジの種類説明が表示される', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      expect(screen.getByText(/タイムアタック/)).toBeInTheDocument();
    });
  });

  describe('戻るボタン', () => {
    it('戻るボタンクリックで dispatch と playSfx が呼ばれる', () => {
      render(<HowToPlayScreen dispatch={mockDispatch} playSfx={mockPlaySfx} />);
      fireEvent.click(screen.getByText(/もどる/));
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'RETURN_TO_TITLE' });
      expect(mockPlaySfx).toHaveBeenCalledWith('click');
    });
  });
});
