import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PuzzleBoard, { PuzzleBoardProps } from './PuzzleBoard';
import { PuzzlePiece as PuzzlePieceType } from '../../store/atoms';

// PuzzlePieceコンポーネントをモック化
jest.mock('../molecules/PuzzlePiece', () => {
  return jest.fn(props => (
    <div
      data-testid="puzzle-piece"
      data-piece-id={props.piece.id}
      data-row={props.piece.currentPosition.row}
      data-col={props.piece.currentPosition.col}
      data-is-empty={props.piece.isEmpty}
      onClick={() =>
        props.onClick(
          props.piece.id,
          props.piece.currentPosition.row,
          props.piece.currentPosition.col
        )
      }
    />
  ));
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
  // テスト用のピースデータを作成する関数
  const createTestPieces = (
    division: number,
    emptyRow: number,
    emptyCol: number
  ): PuzzlePieceType[] => {
    const pieces: PuzzlePieceType[] = [];
    for (let row = 0; row < division; row++) {
      for (let col = 0; col < division; col++) {
        const isEmpty = row === emptyRow && col === emptyCol;
        pieces.push({
          id: row * division + col + 1, // IDは1から始まる
          correctPosition: { row, col },
          currentPosition: { row, col },
          isEmpty,
        });
      }
    }
    return pieces;
  };

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

    describe('ピースのスライド移動', () => {
      it('空白ピースに隣接するピースをクリックすると、onPieceMoveが呼び出される', () => {
        // 3x3のパズルで中央が空白
        const emptyRow = 1;
        const emptyCol = 1;
        const testPieces = createTestPieces(3, emptyRow, emptyCol);
        const onPieceMove = jest.fn();

        const props: PuzzleBoardProps = {
          ...defaultProps,
          pieces: testPieces,
          emptyPosition: { row: emptyRow, col: emptyCol },
          onPieceMove,
        };

        render(<PuzzleBoard {...props} />);

        // 空白の上のピース（隣接している）をクリック
        const topPiece = screen
          .getAllByTestId('puzzle-piece')
          .find(
            piece =>
              piece.getAttribute('data-row') === '0' && piece.getAttribute('data-col') === '1'
          );

        if (topPiece) {
          fireEvent.click(topPiece);
          // onPieceMoveが正しいパラメータで呼び出されたことを確認
          expect(onPieceMove).toHaveBeenCalledWith(
            Number(topPiece.getAttribute('data-piece-id')),
            emptyRow,
            emptyCol
          );
        }
      });

      it('空白ピースに隣接しないピースをクリックしても、onPieceMoveは呼び出されない', () => {
        // 3x3のパズルで中央が空白
        const emptyRow = 1;
        const emptyCol = 1;
        const testPieces = createTestPieces(3, emptyRow, emptyCol);
        const onPieceMove = jest.fn();

        const props: PuzzleBoardProps = {
          ...defaultProps,
          pieces: testPieces,
          emptyPosition: { row: emptyRow, col: emptyCol },
          onPieceMove,
        };

        render(<PuzzleBoard {...props} />);

        // 右下のピース（隣接していない）をクリック
        const cornerPiece = screen
          .getAllByTestId('puzzle-piece')
          .find(
            piece =>
              piece.getAttribute('data-row') === '2' && piece.getAttribute('data-col') === '2'
          );

        fireEvent.click(cornerPiece!);
        // onPieceMoveが呼び出されないことを確認
        expect(onPieceMove).not.toHaveBeenCalled();
      });

      it('空白ピースをクリックしても何も起こらない', () => {
        // 3x3のパズルで中央が空白
        const emptyRow = 1;
        const emptyCol = 1;
        const testPieces = createTestPieces(3, emptyRow, emptyCol);
        const onPieceMove = jest.fn();

        const props: PuzzleBoardProps = {
          ...defaultProps,
          pieces: testPieces,
          emptyPosition: { row: emptyRow, col: emptyCol },
          onPieceMove,
        };

        render(<PuzzleBoard {...props} />);

        // 空白ピースをクリック
        const emptyPiece = screen
          .getAllByTestId('puzzle-piece')
          .find(piece => piece.getAttribute('data-is-empty') === 'true');

        fireEvent.click(emptyPiece!);
        // onPieceMoveが呼び出されないことを確認
        expect(onPieceMove).not.toHaveBeenCalled();
      });
    });

    describe('境界値テスト - 右下の位置のピース', () => {
      it('右下が空白で、その隣のピースをクリックするとonPieceMoveが呼び出される', () => {
        // 3x3のパズルで右下が空白
        const division = 3;
        const emptyRow = division - 1;
        const emptyCol = division - 1;
        const testPieces = createTestPieces(division, emptyRow, emptyCol);
        const onPieceMove = jest.fn();

        const props: PuzzleBoardProps = {
          ...defaultProps,
          division,
          pieces: testPieces,
          emptyPosition: { row: emptyRow, col: emptyCol },
          onPieceMove,
        };

        render(<PuzzleBoard {...props} />);

        // 空白の左のピース（隣接している）をクリック
        const leftPiece = screen
          .getAllByTestId('puzzle-piece')
          .find(
            piece =>
              piece.getAttribute('data-row') === String(emptyRow) &&
              piece.getAttribute('data-col') === String(emptyCol - 1)
          );

        if (leftPiece) {
          fireEvent.click(leftPiece);
          // onPieceMoveが正しいパラメータで呼び出されたことを確認
          expect(onPieceMove).toHaveBeenCalledWith(
            Number(leftPiece.getAttribute('data-piece-id')),
            emptyRow,
            emptyCol
          );
        }
      });

      it('ピースが右下に移動した後も正しく表示され、クリック可能であること', () => {
        // 3x3のパズルで中央が空白
        const division = 3;
        const emptyRow = 1;
        const emptyCol = 1;
        const testPieces = createTestPieces(division, emptyRow, emptyCol);
        const onPieceMove = jest.fn();

        // 右下のピースを取得
        const rightBottomPiece = testPieces.find(
          p => p.currentPosition.row === division - 1 && p.currentPosition.col === division - 1
        );

        // 右下のピースを空白の位置に移動させる（シミュレーション）
        if (rightBottomPiece) {
          rightBottomPiece.currentPosition = { row: emptyRow, col: emptyCol };
          // 空白ピースを右下に移動
          const emptyPiece = testPieces.find(p => p.isEmpty);
          if (emptyPiece) {
            emptyPiece.currentPosition = { row: division - 1, col: division - 1 };
          }
        }

        const props: PuzzleBoardProps = {
          ...defaultProps,
          division,
          pieces: testPieces,
          emptyPosition: { row: division - 1, col: division - 1 }, // 空白が右下に移動
          onPieceMove,
        };

        render(<PuzzleBoard {...props} />);

        // 中央に移動した元右下のピースを取得
        const movedPiece = screen
          .getAllByTestId('puzzle-piece')
          .find(
            piece =>
              piece.getAttribute('data-row') === String(emptyRow) &&
              piece.getAttribute('data-col') === String(emptyCol) &&
              piece.getAttribute('data-is-empty') === 'false'
          );

        // ピースが存在することを確認
        expect(movedPiece).toBeTruthy();

        // ピースをクリックできることを確認
        if (movedPiece) {
          fireEvent.click(movedPiece);
          // 隣接していないので呼び出されないはず
          expect(onPieceMove).not.toHaveBeenCalled();

          // 隣接する空白ピースがある場合は呼び出される
          // 上下左右の隣接ピースをクリック
          const adjacentPositions = [
            { row: emptyRow - 1, col: emptyCol }, // 上
            { row: emptyRow + 1, col: emptyCol }, // 下
            { row: emptyRow, col: emptyCol - 1 }, // 左
            { row: emptyRow, col: emptyCol + 1 }, // 右
          ];

          // 隣接ピースをクリック
          adjacentPositions.forEach(pos => {
            // ボード内の位置かチェック
            if (pos.row >= 0 && pos.row < division && pos.col >= 0 && pos.col < division) {
              const adjacentPiece = screen
                .getAllByTestId('puzzle-piece')
                .find(
                  piece =>
                    piece.getAttribute('data-row') === String(pos.row) &&
                    piece.getAttribute('data-col') === String(pos.col) &&
                    piece.getAttribute('data-is-empty') === 'false'
                );

              if (adjacentPiece && pos.row === division - 1 && pos.col === division - 1) {
                // 右下の空白に隣接するピースをクリック
                fireEvent.click(adjacentPiece);
                expect(onPieceMove).toHaveBeenCalledWith(
                  Number(adjacentPiece.getAttribute('data-piece-id')),
                  division - 1,
                  division - 1
                );
              }
            }
          });
        }
      });

      it('右下の上が空白の場合に右下のピースをクリックすると右下のピースが一つ上に移動する', () => {
        // 3x3のパズルで右下が空白、右下の上が空白でない
        const division = 3;
        const emptyRow = division - 1;
        const emptyCol = division - 1;
        const testPieces = createTestPieces(division, emptyRow, emptyCol);
        const onPieceMove = jest.fn();

        const props: PuzzleBoardProps = {
          ...defaultProps,
          division,
          pieces: testPieces,
          emptyPosition: { row: emptyRow, col: emptyCol },
          onPieceMove,
        };

        render(<PuzzleBoard {...props} />);

        // 右下のピース（空白の上のピース）をクリック
        const bottomPiece = screen
          .getAllByTestId('puzzle-piece')
          .find(
            piece =>
              piece.getAttribute('data-row') === String(division - 2) &&
              piece.getAttribute('data-col') === String(division - 1)
          );

        fireEvent.click(bottomPiece!);
        // 右下のピースが一つ上に移動する
        expect(onPieceMove).toHaveBeenCalledWith(
          Number(bottomPiece!.getAttribute('data-piece-id')),
          division - 1,
          division - 1
        );
      });

      it('右下のピースが空白でない場合、そのピースをクリックしても何も起こらない', () => {
        // 3x3のパズルで左上が空白、右下は通常のピース
        const division = 3;
        const emptyRow = 0;
        const emptyCol = 0;
        const testPieces = createTestPieces(division, emptyRow, emptyCol);
        const onPieceMove = jest.fn();

        const props: PuzzleBoardProps = {
          ...defaultProps,
          division,
          pieces: testPieces,
          emptyPosition: { row: emptyRow, col: emptyCol },
          onPieceMove,
        };

        render(<PuzzleBoard {...props} />);

        // 右下のピース（空白に隣接していない）をクリック
        const cornerPiece = screen
          .getAllByTestId('puzzle-piece')
          .find(
            piece =>
              piece.getAttribute('data-row') === String(division - 1) &&
              piece.getAttribute('data-col') === String(division - 1)
          );

        if (cornerPiece) {
          fireEvent.click(cornerPiece);
          // onPieceMoveが呼び出されないことを確認
          expect(onPieceMove).not.toHaveBeenCalled();
        }
      });

      it('空白ピースが右下から他の位置に移動した後も正しく機能すること', () => {
        // 3x3のパズルで右下が空白
        const division = 3;
        const emptyRow = division - 1;
        const emptyCol = division - 1;
        const testPieces = createTestPieces(division, emptyRow, emptyCol);
        const onPieceMove = jest.fn();

        // 空白ピースを中央に移動させる（シミュレーション）
        const emptyPiece = testPieces.find(p => p.isEmpty);
        if (emptyPiece) {
          // 元の空白ピースの位置を保存
          const originalEmptyPos = { ...emptyPiece.currentPosition };

          // 空白ピースを中央に移動
          emptyPiece.currentPosition = { row: 1, col: 1 };

          // 中央のピースを元の空白位置に移動
          const centerPiece = testPieces.find(
            p => p.currentPosition.row === 1 && p.currentPosition.col === 1 && !p.isEmpty
          );

          if (centerPiece) {
            centerPiece.currentPosition = originalEmptyPos;
          }
        }

        const props: PuzzleBoardProps = {
          ...defaultProps,
          division,
          pieces: testPieces,
          emptyPosition: { row: 1, col: 1 }, // 空白が中央に移動
          onPieceMove,
        };

        render(<PuzzleBoard {...props} />);

        // 右下に移動したピースをクリック
        const movedPiece = screen
          .getAllByTestId('puzzle-piece')
          .find(
            piece =>
              piece.getAttribute('data-row') === String(division - 1) &&
              piece.getAttribute('data-col') === String(division - 1) &&
              piece.getAttribute('data-is-empty') === 'false'
          );

        // ピースが存在することを確認
        expect(movedPiece).toBeTruthy();

        // 中央の空白に隣接するピースをクリック
        const adjacentPieces = [
          { row: 0, col: 1 }, // 上
          { row: 2, col: 1 }, // 下
          { row: 1, col: 0 }, // 左
          { row: 1, col: 2 }, // 右
        ];

        adjacentPieces.forEach(pos => {
          const adjacentPiece = screen
            .getAllByTestId('puzzle-piece')
            .find(
              piece =>
                piece.getAttribute('data-row') === String(pos.row) &&
                piece.getAttribute('data-col') === String(pos.col) &&
                piece.getAttribute('data-is-empty') === 'false'
            );

          if (adjacentPiece) {
            fireEvent.click(adjacentPiece);
            expect(onPieceMove).toHaveBeenCalledWith(
              Number(adjacentPiece.getAttribute('data-piece-id')),
              1, // 中央の行
              1 // 中央の列
            );
            onPieceMove.mockClear();
          }
        });
      });

      it('パズルが完成した状態ではピースをクリックしてもonPieceMoveは呼び出されない', () => {
        // 3x3のパズルで右下が空白、パズルは完成状態
        const division = 3;
        const emptyRow = division - 1;
        const emptyCol = division - 1;
        const testPieces = createTestPieces(division, emptyRow, emptyCol);
        const onPieceMove = jest.fn();

        const props: PuzzleBoardProps = {
          ...defaultProps,
          division,
          pieces: testPieces,
          emptyPosition: { row: emptyRow, col: emptyCol },
          completed: true, // パズルが完成している
          onPieceMove,
        };

        render(<PuzzleBoard {...props} />);

        // 空白の上のピース（隣接している）をクリック
        const topPiece = screen
          .getAllByTestId('puzzle-piece')
          .find(
            piece =>
              piece.getAttribute('data-row') === String(emptyRow - 1) &&
              piece.getAttribute('data-col') === String(emptyCol)
          );

        if (topPiece) {
          fireEvent.click(topPiece);
          // 修正後の実装では、パズルが完成している場合はonPieceMoveが呼び出されない
          expect(onPieceMove).not.toHaveBeenCalled();
        }
      });
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
