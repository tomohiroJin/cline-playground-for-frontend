import React from 'react';
import { render, screen } from '@testing-library/react';
import PuzzleBoard from './PuzzleBoard';
import { useCompletionOverlay } from '../../hooks/useCompletionOverlay';
import { useVideoPlayback } from '../../hooks/useVideoPlayback';
import { addClearHistory, extractImageName } from '../../utils/storage-utils';

// モックの設定
jest.mock('../../hooks/useCompletionOverlay');
jest.mock('../../hooks/useVideoPlayback');
jest.mock('../../utils/storage-utils');

describe('PuzzleBoard', () => {
  // モックの初期化
  beforeEach(() => {
    // useCompletionOverlayのモック
    (useCompletionOverlay as jest.Mock).mockReturnValue({
      overlayVisible: true,
      toggleOverlay: jest.fn(),
    });

    // useVideoPlaybackのモック
    (useVideoPlayback as jest.Mock).mockReturnValue({
      videoPlaybackEnabled: false,
      videoUrl: null,
      enableVideoPlayback: jest.fn(),
      disableVideoPlayback: jest.fn(),
      getVideoUrlFromImage: jest.fn(),
      setVideo: jest.fn(),
    });

    // addClearHistoryとextractImageNameのモック
    (addClearHistory as jest.Mock).mockReturnValue([]);
    (extractImageName as jest.Mock).mockReturnValue('test_image');
  });

  // テスト後のクリーンアップ
  afterEach(() => {
    jest.clearAllMocks();
  });

  // 基本的なレンダリングテスト
  it('基本的なコンポーネントがレンダリングされる', () => {
    const props = {
      imageUrl: 'test.jpg',
      originalWidth: 800,
      originalHeight: 600,
      pieces: [],
      division: 4,
      elapsedTime: 120,
      completed: false,
      hintMode: false,
      emptyPosition: { row: 0, col: 0 },
      moveCount: 0,
      correctRate: 0,
      score: null,
      isBestScore: false,
      onPieceMove: jest.fn(),
      onReset: jest.fn(),
      onToggleHint: jest.fn(),
    };

    render(<PuzzleBoard {...props} />);

    // ステータスバーが表示されていることを確認
    expect(screen.getByText('⏱ 02:00')).toBeInTheDocument();
    expect(screen.getByText('👣 0手')).toBeInTheDocument();
    expect(screen.getByText('📊 正解率 0%')).toBeInTheDocument();
    expect(screen.getByText('ヒントを表示')).toBeInTheDocument();
  });

  // 完了状態のテスト
  it('パズルが完成するとリザルト画面が表示される', () => {
    const props = {
      imageUrl: 'test.jpg',
      originalWidth: 800,
      originalHeight: 600,
      pieces: [],
      division: 4,
      elapsedTime: 120,
      completed: true,
      hintMode: false,
      emptyPosition: { row: 0, col: 0 },
      moveCount: 42,
      correctRate: 100,
      score: {
        totalScore: 7250,
        moveCount: 42,
        elapsedTime: 120,
        hintUsed: false,
        division: 4,
        rank: '★★☆' as const,
        shuffleMoves: 32,
      },
      isBestScore: true,
      onPieceMove: jest.fn(),
      onReset: jest.fn(),
      onToggleHint: jest.fn(),
    };

    render(<PuzzleBoard {...props} />);

    // リザルト画面が表示されていることを確認
    expect(screen.getByText('パズル完成！')).toBeInTheDocument();
    expect(screen.getByText('02:00')).toBeInTheDocument();
    expect(screen.getByText('もう一度')).toBeInTheDocument();
    expect(screen.getByText('7,250')).toBeInTheDocument();
    expect(screen.getByText('★★☆')).toBeInTheDocument();
    expect(screen.getByText('ベストスコア更新！')).toBeInTheDocument();
  });

  // クリア履歴保存のテスト
  it('パズルが完成するとクリア履歴が保存される', () => {
    const props = {
      imageUrl: 'test.jpg',
      originalWidth: 800,
      originalHeight: 600,
      pieces: [],
      division: 4,
      elapsedTime: 120,
      completed: true,
      hintMode: false,
      emptyPosition: { row: 0, col: 0 },
      moveCount: 0,
      correctRate: 0,
      score: null,
      isBestScore: false,
      onPieceMove: jest.fn(),
      onReset: jest.fn(),
      onToggleHint: jest.fn(),
    };

    render(<PuzzleBoard {...props} />);

    // extractImageNameが呼ばれたことを確認
    expect(extractImageName).toHaveBeenCalledWith('test.jpg');

    // addClearHistoryが呼ばれたことを確認
    expect(addClearHistory).toHaveBeenCalledWith('test_image', 120);
  });

  // ヒントモードのテスト
  it('ヒントモードが有効の場合、ヒント画像が表示される', () => {
    const props = {
      imageUrl: 'test.jpg',
      originalWidth: 800,
      originalHeight: 600,
      pieces: [],
      division: 4,
      elapsedTime: 120,
      completed: false,
      hintMode: true,
      emptyPosition: { row: 0, col: 0 },
      moveCount: 0,
      correctRate: 0,
      score: null,
      isBestScore: false,
      onPieceMove: jest.fn(),
      onReset: jest.fn(),
      onToggleHint: jest.fn(),
    };

    render(<PuzzleBoard {...props} />);

    // ヒント画像が表示されていることを確認
    const hintImage = screen.getByTitle('ヒント画像');
    expect(hintImage).toBeInTheDocument();

    // ヒントボタンのテキストが変わっていることを確認
    expect(screen.getByText('ヒントを隠す')).toBeInTheDocument();
  });
});
