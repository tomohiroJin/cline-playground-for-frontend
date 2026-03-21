/**
 * スコアボードのテスト
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Scoreboard } from './Scoreboard';

describe('Scoreboard', () => {
  const defaultProps = {
    scores: { p: 2, c: 1 },
    onMenuClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('既存動作（CPU 対戦）', () => {
    it('プレイヤースコアが「YOU: {スコア}」で表示される', () => {
      render(<Scoreboard {...defaultProps} />);
      expect(screen.getByText('YOU: 2')).toBeInTheDocument();
    });

    it('CPU スコアが「CPU: {スコア}」で表示される（cpuName 未指定時）', () => {
      render(<Scoreboard {...defaultProps} />);
      expect(screen.getByText('CPU: 1')).toBeInTheDocument();
    });

    it('cpuName を指定すると CPU ラベルが変わる', () => {
      render(<Scoreboard {...defaultProps} cpuName="ヒロ" />);
      expect(screen.getByText('ヒロ: 1')).toBeInTheDocument();
    });

    it('Menu ボタンが表示される', () => {
      render(<Scoreboard {...defaultProps} />);
      expect(screen.getByText('Menu')).toBeInTheDocument();
    });
  });

  describe('2P 対戦モード', () => {
    it('playerName を指定すると「YOU」が置き換わる', () => {
      render(<Scoreboard {...defaultProps} playerName="アキラ" />);
      expect(screen.getByText('アキラ: 2')).toBeInTheDocument();
      expect(screen.queryByText('YOU: 2')).not.toBeInTheDocument();
    });

    it('cpuName と playerName の両方を指定して 2P 表示になる', () => {
      render(<Scoreboard {...defaultProps} playerName="アキラ" cpuName="ヒロ" />);
      expect(screen.getByText('アキラ: 2')).toBeInTheDocument();
      expect(screen.getByText('ヒロ: 1')).toBeInTheDocument();
    });

    it('playerColor を指定するとプレイヤースコアの色が変わる', () => {
      render(<Scoreboard {...defaultProps} playerColor="#e67e22" />);
      const playerScore = screen.getByText('YOU: 2');
      expect(playerScore).toHaveStyle({ color: '#e67e22' });
    });

    it('cpuColor を指定すると CPU スコアの色が変わる', () => {
      render(<Scoreboard {...defaultProps} cpuColor="#9b59b6" />);
      const cpuScore = screen.getByText('CPU: 1');
      expect(cpuScore).toHaveStyle({ color: '#9b59b6' });
    });
  });
});
