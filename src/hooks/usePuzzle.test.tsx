import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePuzzle } from './usePuzzle';
import { Provider } from 'jotai';
import * as puzzleUtils from '../utils/puzzle-utils';

// モック
jest.mock('../utils/puzzle-utils', () => ({
  generatePuzzlePieces: jest.fn(),
  shufflePuzzlePieces: jest.fn(),
  isPuzzleCompleted: jest.fn(),
  getAdjacentPositions: jest.fn(),
}));

// テスト用のデータ
const mockPieces = [
  {
    id: 0,
    correctPosition: { row: 0, col: 0 },
    currentPosition: { row: 0, col: 0 },
    isEmpty: false,
  },
  {
    id: 1,
    correctPosition: { row: 0, col: 1 },
    currentPosition: { row: 0, col: 1 },
    isEmpty: false,
  },
  {
    id: 2,
    correctPosition: { row: 1, col: 0 },
    currentPosition: { row: 1, col: 0 },
    isEmpty: false,
  },
  {
    id: 3,
    correctPosition: { row: 1, col: 1 },
    currentPosition: { row: 1, col: 1 },
    isEmpty: true,
  },
];

const mockEmptyPosition = { row: 1, col: 1 };

// Providerでラップするためのユーティリティ関数
const renderHookWithJotai = <Result, Props>(
  callback: (props: Props) => Result,
  initialProps?: Props
) => {
  return renderHook(callback, {
    wrapper: ({ children }: { children: React.ReactNode }) => <Provider>{children}</Provider>,
    initialProps,
  });
};

describe('usePuzzle', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // モックの実装をセット
    (puzzleUtils.generatePuzzlePieces as jest.Mock).mockReturnValue({
      pieces: mockPieces,
      emptyPosition: mockEmptyPosition,
    });

    (puzzleUtils.shufflePuzzlePieces as jest.Mock).mockReturnValue({
      pieces: mockPieces,
      emptyPosition: mockEmptyPosition,
    });

    (puzzleUtils.getAdjacentPositions as jest.Mock).mockReturnValue([
      { row: 0, col: 1 }, // 上
      { row: 1, col: 0 }, // 左
    ]);

    // Date.nowのモック
    jest.spyOn(Date, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('初期状態が正しく設定されていること', () => {
    const { result } = renderHookWithJotai(() => usePuzzle());

    expect(result.current.imageUrl).toBeNull();
    expect(result.current.originalImageSize).toBeNull();
    expect(result.current.division).toBe(4); // デフォルト値
    expect(result.current.pieces).toEqual([]);
    expect(result.current.emptyPosition).toBeNull();
    expect(result.current.elapsedTime).toBe(0);
    expect(result.current.completed).toBe(false);
  });

  it('initializePuzzleを呼び出すとパズルが初期化されること', () => {
    const { result } = renderHookWithJotai(() => usePuzzle());

    // 画像URLを設定
    act(() => {
      result.current.setImageUrl('test.jpg');
    });

    // divisionを設定
    act(() => {
      result.current.setDivision(4);
    });

    // パズルを初期化
    act(() => {
      result.current.initializePuzzle();
    });

    // generatePuzzlePiecesが呼ばれたことを確認
    expect(puzzleUtils.generatePuzzlePieces).toHaveBeenCalledWith(4);

    // shufflePuzzlePiecesが呼ばれたことを確認
    expect(puzzleUtils.shufflePuzzlePieces).toHaveBeenCalledWith(mockPieces, mockEmptyPosition, 4);

    // 状態が更新されたことを確認
    expect(result.current.pieces).toEqual(mockPieces);
    expect(result.current.emptyPosition).toEqual(mockEmptyPosition);
    expect(result.current.completed).toBe(false);
  });

  it('画像URLが設定されていない場合はinitializePuzzleが何もしないこと', () => {
    const { result } = renderHookWithJotai(() => usePuzzle());

    // パズルを初期化（画像URLなし）
    act(() => {
      result.current.initializePuzzle();
    });

    // generatePuzzlePiecesが呼ばれていないことを確認
    expect(puzzleUtils.generatePuzzlePieces).not.toHaveBeenCalled();

    // 状態が更新されていないことを確認
    expect(result.current.pieces).toEqual([]);
  });

  describe('movePiece', () => {
    // DRY: 共通のパズルセットアップ関数を定義
    const setupCustomPuzzle = (
      getAdjacentPositionsImpl: (row: number, col: number) => { row: number; col: number }[]
    ) => {
      const customMockPieces = [
        {
          id: 0,
          correctPosition: { row: 0, col: 0 },
          currentPosition: { row: 0, col: 0 },
          isEmpty: false,
        },
        {
          id: 1,
          correctPosition: { row: 0, col: 1 },
          currentPosition: { row: 0, col: 1 },
          isEmpty: false,
        },
        {
          id: 2,
          correctPosition: { row: 1, col: 0 },
          currentPosition: { row: 1, col: 0 },
          isEmpty: true, // 空白ピース
        },
      ];
      const customEmptyPosition = { row: 1, col: 0 };
      (puzzleUtils.generatePuzzlePieces as jest.Mock).mockReturnValue({
        pieces: customMockPieces,
        emptyPosition: customEmptyPosition,
      });
      (puzzleUtils.shufflePuzzlePieces as jest.Mock).mockReturnValue({
        pieces: customMockPieces,
        emptyPosition: customEmptyPosition,
      });
      (puzzleUtils.getAdjacentPositions as jest.Mock).mockImplementation(getAdjacentPositionsImpl);
    };

    it('ピースを移動することで全体のピースに更新が発生すること', () => {
      setupCustomPuzzle((row, col) => {
        if (row === 0 && col === 0) {
          return [{ row: 1, col: 0 }];
        }
        return [];
      });

      const { result } = renderHookWithJotai(() => usePuzzle());
      // ...initializePuzzle前の共通処理...
      act(() => {
        result.current.setImageUrl('test.jpg');
      });
      act(() => {
        result.current.initializePuzzle();
      });

      const initialPieces = JSON.parse(JSON.stringify(result.current.pieces));
      act(() => {
        result.current.movePiece(0, 1, 0);
      });
      expect(result.current.pieces).not.toEqual(initialPieces);
    });

    it('移動したピースの現在位置が更新されること', () => {
      setupCustomPuzzle((row, col) => {
        if (row === 0 && col === 0) {
          return [{ row: 1, col: 0 }];
        }
        return [];
      });

      const { result } = renderHookWithJotai(() => usePuzzle());
      // ...initializePuzzle前の共通処理...
      act(() => {
        result.current.setImageUrl('test.jpg');
      });
      act(() => {
        result.current.initializePuzzle();
      });
      act(() => {
        result.current.movePiece(0, 1, 0);
      });
      const movedPiece = result.current.pieces.find(p => p.id === 0);
      expect(movedPiece).toBeDefined();
      expect(movedPiece?.currentPosition).toEqual({ row: 1, col: 0 });
    });

    it('ピースを移動した後に空白ピースの位置情報が正しく更新されること', async () => {
      setupCustomPuzzle((row, col) => {
        if (row === 0 && col === 0) {
          return [
            { row: 0, col: 0 },
            { row: 1, col: 1 },
          ];
        }
        return [];
      });

      const { result } = renderHookWithJotai(() => usePuzzle());
      // ...initializePuzzle前の共通処理...
      act(() => {
        result.current.setImageUrl('test.jpg');
      });
      act(() => {
        result.current.initializePuzzle();
      });
      act(() => {
        result.current.movePiece(0, 1, 0);
      });
      expect(result.current.emptyPosition).toEqual({ row: 0, col: 0 });
    });
  });

  describe('completed', () => {
    const setupInitializedPuzzle = () => {
      const { result } = renderHookWithJotai(() => usePuzzle());

      // 画像URLを設定
      act(() => {
        result.current.setImageUrl('test.jpg');
      });

      // divisionを設定
      act(() => {
        result.current.setDivision(4);
      });
    };

    // パズルを初期化
    it('パズルが完成するとcompletedがtrueになること', () => {
      // カスタムモックピースを作成
      const customMockPieces = [
        {
          id: 0,
          correctPosition: { row: 0, col: 0 },
          currentPosition: { row: 0, col: 0 },
          isEmpty: false,
        },
        {
          id: 1,
          correctPosition: { row: 0, col: 1 },
          currentPosition: { row: 0, col: 1 },
          isEmpty: false,
        },
        {
          id: 2,
          correctPosition: { row: 1, col: 0 },
          currentPosition: { row: 1, col: 0 },
          isEmpty: true, // 空白ピース
        },
      ];

      const customEmptyPosition = { row: 1, col: 0 };

      // モックを設定
      (puzzleUtils.generatePuzzlePieces as jest.Mock).mockReturnValue({
        pieces: customMockPieces,
        emptyPosition: customEmptyPosition,
      });

      (puzzleUtils.shufflePuzzlePieces as jest.Mock).mockReturnValue({
        pieces: customMockPieces,
        emptyPosition: customEmptyPosition,
      });

      // 隣接位置のモックを設定
      (puzzleUtils.getAdjacentPositions as jest.Mock).mockImplementation((row, col) => {
        // id=0のピース（位置: 0,0）の隣接位置を返す
        if (row === 0 && col === 0) {
          return [
            { row: 1, col: 0 }, // 下（空白ピースの位置）
          ];
        }
        return [];
      });

      // isPuzzleCompletedのモックを設定（完成状態）
      (puzzleUtils.isPuzzleCompleted as jest.Mock).mockReturnValue(true);

      const { result } = renderHookWithJotai(() => usePuzzle());

      // 画像URLを設定
      act(() => {
        result.current.setImageUrl('test.jpg');
      });

      // パズルを初期化
      act(() => {
        result.current.initializePuzzle();
      });

      // ピースを移動（空白ピースの位置を指定）
      act(() => {
        result.current.movePiece(0, 1, 0); // id=0のピースを空白ピースの位置(1,0)に移動
      });

      // completedがtrueになったことを確認
      expect(result.current.completed).toBe(true);
    });
  });

  it('resetPuzzleを呼び出すとパズルがリセットされること', () => {
    const { result } = renderHookWithJotai(() => usePuzzle());

    // 画像URLを設定
    act(() => {
      result.current.setImageUrl('test.jpg');
    });

    // divisionを設定
    act(() => {
      result.current.setDivision(4);
    });

    // パズルを初期化
    act(() => {
      result.current.initializePuzzle();
    });

    // generatePuzzlePiecesのモックをクリア
    (puzzleUtils.generatePuzzlePieces as jest.Mock).mockClear();

    // パズルをリセット
    act(() => {
      result.current.resetPuzzle();
    });

    // initializePuzzleが呼ばれたことを確認（内部的にgeneratePuzzlePiecesが呼ばれる）
    expect(puzzleUtils.generatePuzzlePieces).toHaveBeenCalledWith(4);
  });
});
