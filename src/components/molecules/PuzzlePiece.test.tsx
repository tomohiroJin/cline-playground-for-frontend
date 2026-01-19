import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import PuzzlePiece from './PuzzlePiece';
import { PuzzlePiece as PuzzlePieceType } from '../../store/atoms';

import { toPieceId, toCoordinate } from '../../domain/types';

// モックデータ
const mockPiece: PuzzlePieceType = {
  id: toPieceId(1),
  isEmpty: false,
  currentPosition: { row: toCoordinate(0), col: toCoordinate(0) },
  correctPosition: { row: toCoordinate(0), col: toCoordinate(0) },
};

// 共通のデフォルトプロパティ
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

describe('パズルピース', () => {
  it('指定された表示位置に描画されること', () => {
    const { container } = render(
      <PuzzlePiece
        {...defaultProps}
        piece={{ ...mockPiece, currentPosition: { row: toCoordinate(0), col: toCoordinate(0) } }}
      />
    );

    const element = container.firstChild as HTMLElement;
    expect(element).toHaveStyle('transform: translate(0px, 0px)');
    expect(container.firstChild).toBeInTheDocument();
  });

  it('クリック時に onClick が呼ばれること', () => {
    const onClick = jest.fn();
    const { container } = render(
      <PuzzlePiece {...defaultProps} piece={mockPiece} onClick={onClick} />
    );

    const element = container.firstChild as HTMLElement;
    fireEvent.click(element);

    expect(onClick).toHaveBeenCalledWith(
      mockPiece.id,
      mockPiece.currentPosition.row,
      mockPiece.currentPosition.col
    );
  });

  it('ピースの位置が変更されたときに状態が更新されること', () => {
    const { container, rerender } = render(
      <PuzzlePiece
        {...defaultProps}
        piece={{ ...mockPiece, currentPosition: { row: toCoordinate(0), col: toCoordinate(0) } }}
      />
    );

    const updatedPiece = {
      ...mockPiece,
      currentPosition: { row: toCoordinate(1), col: toCoordinate(1) },
    };
    rerender(<PuzzlePiece {...defaultProps} piece={updatedPiece} />);

    const element = container.firstChild as HTMLElement;
    expect(element).toHaveStyle('transform: translate(50px, 50px)');
  });

  it('空白ピースの場合は画像が表示されないこと', () => {
    const emptyPiece: PuzzlePieceType = {
      ...mockPiece,
      isEmpty: true,
    };

    const { container } = render(<PuzzlePiece {...defaultProps} piece={emptyPiece} />);

    const pieceContainer = container.firstChild as HTMLElement;
    expect(pieceContainer).toBeInTheDocument();
    expect(pieceContainer.children.length).toBe(0);
  });
});
