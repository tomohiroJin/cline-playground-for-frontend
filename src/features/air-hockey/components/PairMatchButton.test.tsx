/**
 * Phase S4-5: ペアマッチ UI テスト
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TitleScreen } from './TitleScreen';
import { FIELDS } from '../core/config';

describe('Phase S4-5: ペアマッチ UI', () => {
  const defaultProps = {
    diff: 'normal' as const,
    setDiff: jest.fn(),
    field: FIELDS[0],
    setField: jest.fn(),
    winScore: 7,
    setWinScore: jest.fn(),
    highScore: 0,
    onStart: jest.fn(),
  };

  describe('S4-5-1: タイトル画面「ペアマッチ」ボタン', () => {
    it('onPairMatchClick が渡された場合「ペアマッチ」ボタンが表示される', () => {
      const handleClick = jest.fn();
      render(<TitleScreen {...defaultProps} onPairMatchClick={handleClick} />);
      const button = screen.getByText('ペアマッチ');
      expect(button).toBeDefined();
    });

    it('「ペアマッチ」ボタンクリックで onPairMatchClick が呼ばれる', () => {
      const handleClick = jest.fn();
      render(<TitleScreen {...defaultProps} onPairMatchClick={handleClick} />);
      fireEvent.click(screen.getByText('ペアマッチ'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('onPairMatchClick が渡されない場合「ペアマッチ」ボタンは非表示', () => {
      render(<TitleScreen {...defaultProps} />);
      expect(screen.queryByText('ペアマッチ')).toBeNull();
    });
  });
});
