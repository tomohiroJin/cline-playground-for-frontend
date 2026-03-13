import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RiskLcdGame from './RiskLcdGame';
import { setupMockAudioContext } from '../__tests__/test-helpers';

// AudioContext のモック設定（共通ヘルパーを使用）
setupMockAudioContext();

describe('RiskLcdGame', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('タイトル画面が表示される', () => {
    render(<RiskLcdGame />);
    // DeviceFrame の Brand テキスト
    expect(screen.getByText('RISK LCD')).toBeInTheDocument();
    // TitleScreen 内の CHOOSE YOUR FATE サブタイトル
    expect(
      screen.getByText('── CHOOSE YOUR FATE ──'),
    ).toBeInTheDocument();
  });

  it('メニュー項目が表示される', () => {
    render(<RiskLcdGame />);
    expect(screen.getByText('GAME START')).toBeInTheDocument();
    // PLAY STYLE / UNLOCK / HELP はメニューとサブ画面タイトルの両方に存在する
    expect(screen.getAllByText('PLAY STYLE').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('UNLOCK').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('HELP').length).toBeGreaterThanOrEqual(1);
  });

  it('操作説明が表示される', () => {
    render(<RiskLcdGame />);
    expect(
      screen.getByText(/パークを重ねてビルドを構築せよ/),
    ).toBeInTheDocument();
  });

  it('PLAY STYLE クリックでスタイル選択画面に遷移する', () => {
    render(<RiskLcdGame />);

    // メニューの PLAY STYLE をクリック
    const playStyleLinks = screen.getAllByText('PLAY STYLE');
    fireEvent.click(playStyleLinks[0]);

    // スタイル画面のバフ説明が表示される
    expect(screen.getByText('+バランス型')).toBeInTheDocument();
    // EQUIP タグが表示される（standard が装備中）
    expect(screen.getByText('EQUIP')).toBeInTheDocument();
  });

  it('UNLOCK クリックでショップ画面に遷移する', () => {
    render(<RiskLcdGame />);

    const unlockLinks = screen.getAllByText('UNLOCK');
    fireEvent.click(unlockLinks[0]);

    // ショップアイテムの説明が表示される
    expect(screen.getByText('障害レーンのセグ列を強調')).toBeInTheDocument();
  });
});
