import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameNotice } from './GameNotice';
import { GameNoticeInfo } from '../../constants/game-notices';

describe('GameNotice', () => {
  const baseNotice: GameNoticeInfo = {
    name: 'Test Game',
    hasAudio: false,
    hasFlashing: false,
    recommendedDevice: 'both',
  };

  describe('正常系', () => {
    it('ゲーム名が表示される', () => {
      render(<GameNotice notice={baseNotice} onAccept={jest.fn()} />);
      expect(screen.getByText('Test Game')).toBeInTheDocument();
    });

    it('推奨ブラウザが表示される', () => {
      render(<GameNotice notice={baseNotice} onAccept={jest.fn()} />);
      expect(screen.getByText(/推奨ブラウザ/)).toBeInTheDocument();
    });

    it('OKボタンをクリックするとonAcceptが呼ばれる', () => {
      // Arrange
      const handleAccept = jest.fn();

      // Act
      render(<GameNotice notice={baseNotice} onAccept={handleAccept} />);
      fireEvent.click(screen.getByRole('button', { name: 'OK' }));

      // Assert
      expect(handleAccept).toHaveBeenCalledTimes(1);
    });

    it('免責事項が表示される', () => {
      render(<GameNotice notice={baseNotice} onAccept={jest.fn()} />);
      expect(screen.getByText(/学習・趣味目的/)).toBeInTheDocument();
    });
  });

  describe('条件付き表示', () => {
    it('音声ありの場合に音量注意が表示される', () => {
      const notice: GameNoticeInfo = { ...baseNotice, hasAudio: true };
      render(<GameNotice notice={notice} onAccept={jest.fn()} />);
      expect(screen.getByText(/音量にご注意/)).toBeInTheDocument();
    });

    it('音声なしの場合は音量注意が表示されない', () => {
      render(<GameNotice notice={baseNotice} onAccept={jest.fn()} />);
      expect(screen.queryByText(/音量にご注意/)).not.toBeInTheDocument();
    });

    it('点滅ありの場合に点滅注意が表示される', () => {
      const notice: GameNoticeInfo = { ...baseNotice, hasFlashing: true };
      render(<GameNotice notice={notice} onAccept={jest.fn()} />);
      expect(screen.getByText(/光の点滅表現/)).toBeInTheDocument();
    });

    it('点滅なしの場合は点滅注意が表示されない', () => {
      render(<GameNotice notice={baseNotice} onAccept={jest.fn()} />);
      expect(screen.queryByText(/光の点滅表現/)).not.toBeInTheDocument();
    });

    it('PC推奨の場合にPC推奨メッセージが表示される', () => {
      const notice: GameNoticeInfo = { ...baseNotice, recommendedDevice: 'pc' };
      render(<GameNotice notice={notice} onAccept={jest.fn()} />);
      expect(screen.getByText(/PC でのプレイを推奨/)).toBeInTheDocument();
    });

    it('both推奨の場合はPC推奨メッセージが表示されない', () => {
      render(<GameNotice notice={baseNotice} onAccept={jest.fn()} />);
      expect(screen.queryByText(/PC でのプレイを推奨/)).not.toBeInTheDocument();
    });
  });
});
