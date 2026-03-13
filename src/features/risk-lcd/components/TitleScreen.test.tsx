import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TitleScreen from './TitleScreen';

describe('TitleScreen', () => {
  const defaultProps = {
    active: true,
    menuIndex: 0,
    pts: 150,
    best: 500,
    onMenuClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示', () => {
    it('タイトルテキスト「RISK LCD」が表示される', () => {
      render(<TitleScreen {...defaultProps} />);
      expect(screen.getByText(/RISK/)).toBeInTheDocument();
    });

    it('サブタイトル「CHOOSE YOUR FATE」が表示される', () => {
      render(<TitleScreen {...defaultProps} />);
      expect(screen.getByText('── CHOOSE YOUR FATE ──')).toBeInTheDocument();
    });

    it('ポイント残高が表示される', () => {
      render(<TitleScreen {...defaultProps} />);
      expect(screen.getByText('PT:150')).toBeInTheDocument();
    });

    it('ベストスコアが0より大きい場合に表示される', () => {
      render(<TitleScreen {...defaultProps} best={500} />);
      expect(screen.getByText('BEST:500')).toBeInTheDocument();
    });

    it('ベストスコアが0の場合は非表示', () => {
      render(<TitleScreen {...defaultProps} best={0} />);
      expect(screen.queryByText(/BEST:/)).not.toBeInTheDocument();
    });

    it('全6メニュー項目が表示される', () => {
      render(<TitleScreen {...defaultProps} />);
      expect(screen.getByText('GAME START')).toBeInTheDocument();
      expect(screen.getByText('DAILY')).toBeInTheDocument();
      expect(screen.getByText('PRACTICE')).toBeInTheDocument();
      // PLAY STYLE, UNLOCK, HELP はメニュー内に存在
      expect(screen.getByText('PLAY STYLE')).toBeInTheDocument();
      expect(screen.getByText('UNLOCK')).toBeInTheDocument();
      expect(screen.getByText('HELP')).toBeInTheDocument();
    });

    it('操作説明が表示される', () => {
      render(<TitleScreen {...defaultProps} />);
      expect(screen.getByText(/◀▶ 移動/)).toBeInTheDocument();
      expect(screen.getByText(/パークを重ねてビルドを構築せよ/)).toBeInTheDocument();
    });
  });

  describe('選択状態', () => {
    it('選択中のメニュー項目に矢印▶が表示される', () => {
      render(<TitleScreen {...defaultProps} menuIndex={2} />);
      // PRACTICE の横に矢印が表示されている
      const arrows = screen.getAllByText('▶');
      expect(arrows.length).toBeGreaterThan(0);
    });
  });

  describe('操作', () => {
    it('メニュー項目クリックで onMenuClick が呼ばれる', () => {
      const onMenuClick = jest.fn();
      render(<TitleScreen {...defaultProps} onMenuClick={onMenuClick} />);

      fireEvent.click(screen.getByText('DAILY'));
      expect(onMenuClick).toHaveBeenCalledWith(1);
    });

    it('GAME START クリックで onMenuClick(0) が呼ばれる', () => {
      const onMenuClick = jest.fn();
      render(<TitleScreen {...defaultProps} onMenuClick={onMenuClick} />);

      fireEvent.click(screen.getByText('GAME START'));
      expect(onMenuClick).toHaveBeenCalledWith(0);
    });

    it('HELP クリックで onMenuClick(5) が呼ばれる', () => {
      const onMenuClick = jest.fn();
      render(<TitleScreen {...defaultProps} onMenuClick={onMenuClick} />);

      fireEvent.click(screen.getByText('HELP'));
      expect(onMenuClick).toHaveBeenCalledWith(5);
    });
  });
});
