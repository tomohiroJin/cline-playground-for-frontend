/**
 * TeamSetupScreen のテスト
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TeamSetupScreen } from './TeamSetupScreen';

describe('TeamSetupScreen', () => {
  const defaultProps = {
    onStart: jest.fn(),
    onBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('チーム構成が表示される', () => {
    render(<TeamSetupScreen {...defaultProps} />);
    expect(screen.getByText('P1: あなた')).toBeDefined();
    expect(screen.getByText('P2: CPU（味方）')).toBeDefined();
    expect(screen.getByText('P3: CPU（敵1）')).toBeDefined();
    expect(screen.getByText('P4: CPU（敵2）')).toBeDefined();
  });

  it('「対戦開始！」ボタンで onStart が呼ばれる', () => {
    render(<TeamSetupScreen {...defaultProps} />);
    fireEvent.click(screen.getByText('対戦開始！'));
    expect(defaultProps.onStart).toHaveBeenCalledTimes(1);
  });

  it('「戻る」ボタンで onBack が呼ばれる', () => {
    render(<TeamSetupScreen {...defaultProps} />);
    fireEvent.click(screen.getByText('← 戻る'));
    expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
  });

  it('Field / Win Score の選択 UI が存在しない', () => {
    render(<TeamSetupScreen {...defaultProps} />);
    expect(screen.queryByText('Field')).toBeNull();
    expect(screen.queryByText('Win Score')).toBeNull();
  });

  describe('レイアウト統一（CharacterSelectScreen と同パターン）', () => {
    it('フルスクリーンコンテナで表示される', () => {
      const { container } = render(<TeamSetupScreen {...defaultProps} />);
      const root = container.firstElementChild as HTMLElement;
      expect(root.style.height).toBe('100%');
      expect(root.style.display).toBe('flex');
      expect(root.style.flexDirection).toBe('column');
    });

    it('ヘッダーが space-between レイアウトで戻るボタン・タイトルが配置される', () => {
      render(<TeamSetupScreen {...defaultProps} />);
      // タイトルがヘッダー内に表示される
      const title = screen.getByText('ペアマッチ');
      expect(title).toBeDefined();
      // 戻るボタンが button 要素で表示される
      const backButton = screen.getByRole('button', { name: /戻る/ });
      expect(backButton).toBeDefined();
      // ヘッダーコンテナが space-between レイアウト
      const header = backButton.parentElement as HTMLElement;
      expect(header.style.justifyContent).toBe('space-between');
    });

    it('MenuCard コンポーネントを使用しない（独自レイアウト）', () => {
      const { container } = render(<TeamSetupScreen {...defaultProps} />);
      const root = container.firstElementChild as HTMLElement;
      // フルスクリーンコンテナの背景色が設定されている
      expect(root.style.backgroundColor).toBeTruthy();
    });
  });
});
