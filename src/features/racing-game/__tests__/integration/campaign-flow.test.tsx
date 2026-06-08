// キャンペーン統合フローテスト（Phase 1.7 受け入れテストの一部）
//
// メニューに CAMPAIGN ボタンが表示され、クリックで STAGE SELECT に遷移し、
// ロックされていない Stage 1 が選択できることをトップレベルから確認。

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RacingGame from '../../RacingGame';

beforeAll(() => {
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});
afterAll(() => {
  jest.restoreAllMocks();
});

beforeEach(() => {
  // localStorage をクリーンに
  window.localStorage.clear();
});

describe('Racing Game キャンペーン統合フロー', () => {
  test('メニューに CAMPAIGN ボタンが表示される', () => {
    render(<RacingGame />);
    expect(screen.getByText(/CAMPAIGN/)).toBeInTheDocument();
  });

  test('CAMPAIGN ボタンをクリックすると STAGE SELECT に遷移する', () => {
    render(<RacingGame />);
    fireEvent.click(screen.getByText(/CAMPAIGN/));
    expect(screen.getByText('STAGE SELECT')).toBeInTheDocument();
  });

  test('STAGE SELECT で Stage 1 (FOREST CALLING) が解放されている', () => {
    render(<RacingGame />);
    fireEvent.click(screen.getByText(/CAMPAIGN/));
    // 解放済みステージ
    expect(screen.getByLabelText(/STAGE 1 FOREST/)).toBeInTheDocument();
  });

  test('STAGE SELECT で Stage 2-8 はロックされている', () => {
    render(<RacingGame />);
    fireEvent.click(screen.getByText(/CAMPAIGN/));
    expect(screen.getByLabelText(/STAGE 2.*locked/)).toBeInTheDocument();
    expect(screen.getByLabelText(/STAGE 8.*locked/)).toBeInTheDocument();
  });

  test('OPTIONS ボタンを開くことができる', () => {
    render(<RacingGame />);
    fireEvent.click(screen.getByText(/CAMPAIGN/));
    fireEvent.click(screen.getByLabelText('OPTIONS'));
    expect(screen.getByText('OPTIONS')).toBeInTheDocument();
    expect(screen.getByLabelText('REPLAY ENDING')).toBeInTheDocument();
    expect(screen.getByLabelText('RESET PROGRESS')).toBeInTheDocument();
  });

  test('OPTIONS の REPLAY ENDING は未クリア時 disabled', () => {
    render(<RacingGame />);
    fireEvent.click(screen.getByText(/CAMPAIGN/));
    fireEvent.click(screen.getByLabelText('OPTIONS'));
    expect((screen.getByLabelText('REPLAY ENDING') as HTMLButtonElement).disabled).toBe(true);
  });

  test('OPTIONS に音量スライダー（MASTER/BGM/SE）が配線されている', () => {
    render(<RacingGame />);
    fireEvent.click(screen.getByText(/CAMPAIGN/));
    fireEvent.click(screen.getByLabelText('OPTIONS'));
    expect(screen.getByLabelText('マスター音量')).toBeInTheDocument();
    expect(screen.getByLabelText('BGM 音量')).toBeInTheDocument();
    expect(screen.getByLabelText('SE 音量')).toBeInTheDocument();
  });

  test('BACK TO MENU でメニュー画面に戻る', () => {
    render(<RacingGame />);
    fireEvent.click(screen.getByText(/CAMPAIGN/));
    fireEvent.click(screen.getByText('BACK TO MENU'));
    expect(screen.getByText('🏁 スタート!')).toBeInTheDocument();
  });

  test('ロック中ステージのクリックで DENIED トースト', () => {
    render(<RacingGame />);
    fireEvent.click(screen.getByText(/CAMPAIGN/));
    fireEvent.click(screen.getByLabelText(/STAGE 5.*locked/));
    expect(screen.getByText(/STAGE LOCKED/)).toBeInTheDocument();
  });
});
