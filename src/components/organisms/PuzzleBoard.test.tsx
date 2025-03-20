import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import PuzzleBoard, { PuzzleBoardProps } from './PuzzleBoard';
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

const defaultProps: PuzzleBoardProps = {
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

describe('パズルボードコンポーネント', () => {
  it('経過時間が表示される', () => {
    render(<PuzzleBoard {...defaultProps} />);
    expect(screen.getByText(/経過時間:/)).toBeInTheDocument();
  });

  it('完成時にオーバーレイが表示される', () => {
    render(<PuzzleBoard {...defaultProps} completed={true} elapsedTime={60} />);
    expect(screen.getByText('パズル完成！')).toBeInTheDocument();
    expect(screen.getByText(/所要時間:/)).toBeInTheDocument();
  });

  describe('HintToggleButton', () => {
    it('ヒントモードがfalseの時は「ヒントを表示」ボタンが表示されていること', () => {
      render(<PuzzleBoard {...defaultProps} hintMode={false} />);

      expect(screen.getByText('ヒントを表示')).toBeInTheDocument();
    });

    it('ヒントモードがtrueの時は「ヒントを隠す」が表示されていること', () => {
      render(<PuzzleBoard {...defaultProps} hintMode={true} />);

      expect(screen.getByText('ヒントを隠す')).toBeInTheDocument();
    });

    it('ヒントボタンがクリックされた時にonToggleHintが呼ばれること', () => {
      render(<PuzzleBoard {...defaultProps} />);

      const hintButton = screen.getByText('ヒントを表示');
      hintButton.click();

      expect(defaultProps.onToggleHint).toHaveBeenCalled();
    });
  });

  describe('HintImage', () => {
    it('ヒントモードがtrueで完成前の場合ヒントの画像が表示されること', () => {
      render(<PuzzleBoard {...defaultProps} hintMode={true} completed={false} />);

      expect(screen.getByTitle('ヒント画像')).toBeInTheDocument();
    });

    it('ヒントモードがfalseの時はヒントの画像が表示されないこと', () => {
      render(<PuzzleBoard {...defaultProps} hintMode={false} />);

      expect(screen.queryByTitle('ヒント画像')).toBeNull();
    });

    it('ヒントモードがtrueで完成済みの場合ヒントの画像が表示されないこと', () => {
      render(<PuzzleBoard {...defaultProps} hintMode={true} completed={true} />);

      expect(screen.queryByTitle('ヒント画像')).toBeNull();
    });
  });
});
