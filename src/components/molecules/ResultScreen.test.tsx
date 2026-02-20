import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ResultScreen from './ResultScreen';
import { PuzzleScore } from '../../types/puzzle';

describe('ResultScreen', () => {
  const mockScore: PuzzleScore = {
    totalScore: 7250,
    moveCount: 42,
    elapsedTime: 225,
    hintUsed: false,
    division: 4,
    rank: '★★☆',
    shuffleMoves: 32,
  };

  const defaultProps = {
    imageAlt: 'snowy_mountain_ukiyoe',
    division: 4,
    score: mockScore,
    isBestScore: false,
    onRetry: jest.fn(),
    onBackToSetup: jest.fn(),
  };

  it('スコア情報が正しく表示されること', () => {
    render(<ResultScreen {...defaultProps} />);

    expect(screen.getByText('パズル完成！')).toBeInTheDocument();
    expect(screen.getByText('snowy_mountain_ukiyoe')).toBeInTheDocument();
    expect(screen.getByText('4×4')).toBeInTheDocument();
    expect(screen.getByText('03:45')).toBeInTheDocument();
    expect(screen.getByText('42手 / 最適 32')).toBeInTheDocument();
    expect(screen.getByText('7,250')).toBeInTheDocument();
    expect(screen.getByText('★★☆')).toBeInTheDocument();
  });

  it('ベストスコア更新時にバッジが表示されること', () => {
    render(<ResultScreen {...defaultProps} isBestScore={true} />);

    expect(screen.getByText('ベストスコア更新！')).toBeInTheDocument();
  });

  it('ベストスコア未更新時にバッジが表示されないこと', () => {
    render(<ResultScreen {...defaultProps} isBestScore={false} />);

    expect(screen.queryByText('ベストスコア更新！')).not.toBeInTheDocument();
  });

  it('もう一度ボタンがクリックできること', () => {
    const onRetry = jest.fn();
    render(<ResultScreen {...defaultProps} onRetry={onRetry} />);

    fireEvent.click(screen.getByText('もう一度'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('設定に戻るボタンがクリックできること', () => {
    const onBackToSetup = jest.fn();
    render(<ResultScreen {...defaultProps} onBackToSetup={onBackToSetup} />);

    fireEvent.click(screen.getByText('設定に戻る'));
    expect(onBackToSetup).toHaveBeenCalledTimes(1);
  });

  it('シェアボタンが表示されること', () => {
    render(<ResultScreen {...defaultProps} />);

    expect(screen.getByLabelText('シェアする')).toBeInTheDocument();
  });
});
