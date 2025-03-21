import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import PuzzleBoard, { PuzzleBoardProps } from './PuzzleBoard';
import { PuzzlePiece as PuzzlePieceType } from '../../store/atoms';

// PuzzlePieceコンポーネントをモック化
jest.mock('../molecules/PuzzlePiece', () => {
  return jest.fn(() => <div data-testid="puzzle-piece" />);
});

// モックをインポート
import PuzzlePiece from '../molecules/PuzzlePiece';

// ダミーデータ（テスト用）
const dummyPieces: PuzzlePieceType[] = [
  {
    id: 1,
    currentPosition: { row: 0, col: 0 },
    correctPosition: { row: 0, col: 0 },
    isEmpty: false,
  },
  {
    id: 2,
    currentPosition: { row: 0, col: 1 },
    correctPosition: { row: 0, col: 1 },
    isEmpty: false,
  },
  {
    id: 3,
    currentPosition: { row: 1, col: 0 },
    correctPosition: { row: 1, col: 0 },
    isEmpty: false,
  },
  {
    id: 4,
    currentPosition: { row: 1, col: 1 },
    correctPosition: { row: 1, col: 1 },
    isEmpty: true,
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
  beforeEach(() => {
    // テスト前にモックをリセット
    (PuzzlePiece as jest.Mock).mockClear();
  });

  describe('パズルを表示するボード', () => {
    it('ボードのサイズに合わせて分割された枠が表示される', () => {
      render(<PuzzleBoard {...defaultProps} />);

      expect(screen.getByTitle('ボードグリッド')).toBeInTheDocument();
      expect(screen.getAllByTitle('ボードセル')).toHaveLength(4);
    });

    describe('パズルピースの表示', () => {
      it('ピースの数だけパズルピースのコンポーネントが作成されること', () => {
        render(<PuzzleBoard {...defaultProps} pieces={dummyPieces} />);

        // PuzzlePieceコンポーネントが4回呼び出されたことを確認
        expect(PuzzlePiece).toHaveBeenCalledTimes(dummyPieces.length);
      });

      describe('パズルピースのコンポーネントへの受け渡し', () => {
        const boardRef = { current: document.createElement('div') };
        jest.spyOn(React, 'useRef').mockReturnValue(boardRef);

        beforeEach(() => {
          render(<PuzzleBoard {...defaultProps} pieces={dummyPieces} />);
        });

        it('コンポーネントに必要な共通のデフォルトプロパティが渡されていること', () => {
          const props = (PuzzlePiece as jest.Mock).mock.calls[0][0];

          expect(props.imageUrl).toBe(defaultProps.imageUrl);
          expect(props.originalWidth).toBe(defaultProps.originalWidth);
          expect(props.originalHeight).toBe(defaultProps.originalHeight);
          expect(props.division).toBe(defaultProps.division);
          expect(props.boardRef).toBe(boardRef);
          expect(typeof props.onClick).toBe('function');
        });

        it.each(dummyPieces.map((piece, index) => [index, piece]))(
          'コンポーネント %d に正しい piece プロパティが渡されていること',
          (index, piece) => {
            const props = (PuzzlePiece as jest.Mock).mock.calls[index][0];
            expect(props.piece).toEqual(piece);
          }
        );
      });
    });
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

  it('経過時間が表示される', () => {
    render(<PuzzleBoard {...defaultProps} />);

    expect(screen.getByText(/経過時間:/)).toBeInTheDocument();
  });

  it('完成の場合オーバーレイが表示される', () => {
    render(<PuzzleBoard {...defaultProps} completed={true} elapsedTime={60} />);

    expect(screen.getByText('パズル完成！')).toBeInTheDocument();
    expect(screen.getByText(/所要時間:/)).toBeInTheDocument();
    expect(screen.getByText('もう一度挑戦')).toBeInTheDocument();
  });
});
