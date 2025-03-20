import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import PuzzleBoard from './PuzzleBoard';
import { PuzzlePiece as PuzzlePieceType } from '../../store/atoms';

// ダミーデータ（テスト用）
const dummyPieces: PuzzlePieceType[] = [
  {
    id: 1,
    currentPosition: { row: 0, col: 0 },
    correctPosition: { row: 0, col: 0 },
    isEmpty: false,
  },
];

const defaultProps = {
  imageUrl: 'test.png',
  originalWidth: 400,
  originalHeight: 400,
  pieces: dummyPieces,
  division: 2,
  elapsedTime: 30,
  completed: false,
  hintMode: false,
  emptyPosition: { row: 0, col: 1 },
  onPieceMove: jest.fn(),
  onReset: jest.fn(),
  onToggleHint: jest.fn(),
};

describe('PuzzleBoard コンポーネントのテスト', () => {
  it('経過時間が表示される', () => {
    render(<PuzzleBoard {...defaultProps} />);
    expect(screen.getByText(/経過時間:/)).toBeInTheDocument();
  });

  it('完成時にオーバーレイが表示される', () => {
    render(<PuzzleBoard {...defaultProps} completed={true} elapsedTime={60} />);
    expect(screen.getByText('パズル完成！')).toBeInTheDocument();
    expect(screen.getByText(/所要時間:/)).toBeInTheDocument();
  });

  it('ヒントボタンのテキストが切り替わる', () => {
    const { rerender } = render(<PuzzleBoard {...defaultProps} hintMode={false} />);
    expect(screen.getByText('ヒントを表示')).toBeInTheDocument();
    rerender(<PuzzleBoard {...defaultProps} hintMode={true} />);
    expect(screen.getByText('ヒントを隠す')).toBeInTheDocument();
  });
});
