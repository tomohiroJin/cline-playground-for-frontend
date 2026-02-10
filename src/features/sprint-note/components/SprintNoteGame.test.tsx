import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SprintNoteGame from './SprintNoteGame';

// タイマーのモック化
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('SprintNoteGame', () => {
  it('タイトル画面が表示される', () => {
    render(<SprintNoteGame />);
    expect(screen.getByText('Sprint Note')).toBeTruthy();
    expect(screen.getByText('はじめる')).toBeTruthy();
  });

  it('はじめるボタンでプロジェクト提示に遷移する', () => {
    render(<SprintNoteGame />);
    fireEvent.click(screen.getByText('はじめる'));
    expect(screen.getByText(/プロジェクト提示/)).toBeTruthy();
  });

  it('TITLE → PROJECT_INTRO → TEAM_FORMATION の遷移ができる', async () => {
    render(<SprintNoteGame />);

    // TITLE → PROJECT_INTRO
    fireEvent.click(screen.getByText('はじめる'));
    expect(screen.getByText(/プロジェクト提示/)).toBeTruthy();

    // TextReveal のクリックスキップ
    // QuoteText > TextReveal の div をクリック
    const quoteArea = screen.getByText(/PM：/).closest('div[style*="cursor"]');
    if (quoteArea) {
      act(() => { fireEvent.click(quoteArea); });
    }

    // visibleCount が更新された後の useEffect を処理するためタイマーを進める
    // 段落数分のタイマーを十分に回す
    for (let i = 0; i < 10; i++) {
      act(() => { jest.advanceTimersByTime(300); });
    }

    // 「次へ」ボタンが表示されることを確認
    const nextButton = screen.queryByText('次へ');
    expect(nextButton).toBeTruthy();

    // PROJECT_INTRO → TEAM_FORMATION
    fireEvent.click(nextButton!);
    expect(screen.getByText(/チーム結成/)).toBeTruthy();
  });
});
