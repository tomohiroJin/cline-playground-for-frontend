import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import PuzzlePiece from './PuzzlePiece';
import { PuzzlePiece as PuzzlePieceType } from '../../store/atoms';

// モックデータ
const mockPiece: PuzzlePieceType = {
  id: 1,
  isEmpty: false,
  currentPosition: { row: 0, col: 0 },
  correctPosition: { row: 0, col: 0 },
};

describe('パズルピース', () => {
  it('指定された表示位置に描画されること', () => {
    const { container } = render(
      <PuzzlePiece
        piece={{ ...mockPiece, currentPosition: { row: 0, col: 0 } }}
        imageUrl="test-image.jpg"
        originalWidth={100}
        originalHeight={100}
        pieceWidth={50}
        pieceHeight={50}
        division={2}
        onClick={jest.fn()}
      />
    );

    const element = container.firstChild as HTMLElement;
    expect(element).toHaveStyle('transform: translate(0px, 0px)');
    expect(container.firstChild).toBeInTheDocument();
  });

  it('クリック時に onClick が呼ばれること', () => {
    const onClick = jest.fn();
    const { container } = render(
      <PuzzlePiece
        piece={mockPiece}
        imageUrl="test-image.jpg"
        originalWidth={100}
        originalHeight={100}
        pieceWidth={50}
        pieceHeight={50}
        division={2}
        onClick={onClick}
      />
    );

    // コンテナ要素に対してクリックイベントを発火
    const element = container.firstChild as HTMLElement;
    fireEvent.click(element);

    expect(onClick).toHaveBeenCalledWith(
      mockPiece.id,
      mockPiece.currentPosition.row,
      mockPiece.currentPosition.col
    );
  });

  it('ピースの位置が変更されたときに状態が更新されること', () => {
    const defaultProps = {
      imageUrl: 'test-image.jpg',
      originalWidth: 100,
      originalHeight: 100,
      pieceWidth: 50,
      pieceHeight: 50,
      division: 2,
      onClick: jest.fn(),
      boardRef: React.createRef(),
    };

    const { container, rerender } = render(
      <PuzzlePiece
        {...defaultProps}
        piece={{ ...mockPiece, currentPosition: { row: 0, col: 0 } }}
      />
    );

    // piece.currentPosition を更新して再レンダリング
    const updatedPiece = { ...mockPiece, currentPosition: { row: 1, col: 1 } };
    rerender(<PuzzlePiece {...defaultProps} piece={updatedPiece} />);

    // 位置変更後の transform を検証
    const element = container.firstChild as HTMLElement;
    expect(element).toHaveStyle('transform: translate(50px, 50px)');
  });

  it('空白ピースの場合は画像が表示されないこと', () => {
    const defaultProps = {
      imageUrl: 'test-image.jpg',
      originalWidth: 100,
      originalHeight: 100,
      pieceWidth: 50,
      pieceHeight: 50,
      division: 2,
      onClick: jest.fn(),
      boardRef: React.createRef(),
    };

    // 空白ピースを作成
    const emptyPiece: PuzzlePieceType = {
      ...mockPiece,
      isEmpty: true,
    };

    const { container } = render(<PuzzlePiece {...defaultProps} piece={emptyPiece} />);

    // PieceImageコンポーネントが存在しないことを確認
    const pieceContainer = container.firstChild as HTMLElement;
    expect(pieceContainer).toBeInTheDocument();
    expect(pieceContainer.children.length).toBe(0);
  });
});
