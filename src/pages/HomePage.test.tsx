import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HomePage from './HomePage';
import { Provider } from 'jotai/react';
import * as usePuzzleHook from '../hooks/usePuzzle';
import * as useHintModeHook from '../hooks/useHintMode';

// モック
jest.mock('../components/molecules/ImageUploader', () => ({
  __esModule: true,
  default: ({ onImageUpload }: { onImageUpload: Function }) => (
    <div data-testid="image-uploader">
      <button
        onClick={() => onImageUpload('test-image.jpg', 800, 600)}
        data-testid="mock-upload-button"
      >
        画像をアップロード
      </button>
    </div>
  ),
}));

jest.mock('../components/molecules/DifficultySelector', () => ({
  __esModule: true,
  default: ({
    value,
    onChange,
    disabled,
  }: {
    value: number;
    onChange: Function;
    disabled: boolean;
  }) => (
    <div data-testid="difficulty-selector">
      <select
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        disabled={disabled}
        data-testid="difficulty-select"
      >
        <option value="3">3x3</option>
        <option value="4">4x4</option>
        <option value="5">5x5</option>
      </select>
    </div>
  ),
}));

jest.mock('../components/organisms/PuzzleBoard', () => ({
  __esModule: true,
  default: ({
    onPieceMove,
    onReset,
    onToggleHint,
  }: {
    onPieceMove: Function;
    onReset: Function;
    onToggleHint: Function;
  }) => (
    <div data-testid="puzzle-board">
      <button onClick={() => onPieceMove(1, 0, 0)} data-testid="mock-piece-move">
        ピースを移動
      </button>
      <button onClick={() => onReset()} data-testid="mock-reset">
        リセット
      </button>
      <button onClick={() => onToggleHint()} data-testid="mock-toggle-hint">
        ヒント切替
      </button>
    </div>
  ),
}));

// usePuzzleフックのモック
const mockUsePuzzle: ReturnType<typeof usePuzzleHook.usePuzzle> = {
  imageUrl: null as any,
  setImageUrl: jest.fn(),
  originalImageSize: null as any,
  setOriginalImageSize: jest.fn(),
  division: 4,
  setDivision: jest.fn(),
  pieces: [],
  emptyPosition: null,
  elapsedTime: 0,
  completed: false,
  initializePuzzle: jest.fn(),
  movePiece: jest.fn(),
  resetPuzzle: jest.fn(),
};

// useHintModeフックのモック
const mockUseHintMode: ReturnType<typeof useHintModeHook.useHintMode> = {
  hintModeEnabled: false,
  toggleHintMode: jest.fn(),
  enableHintMode: jest.fn(),
  disableHintMode: jest.fn(),
};

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // usePuzzleフックのモックを設定
    jest.spyOn(usePuzzleHook, 'usePuzzle').mockReturnValue(mockUsePuzzle);

    // useHintModeフックのモックを設定
    jest.spyOn(useHintModeHook, 'useHintMode').mockReturnValue(mockUseHintMode);
  });

  it('初期状態では設定セクションが表示されること', () => {
    render(
      <Provider>
        <HomePage />
      </Provider>
    );

    // 設定セクションの要素が表示されていることを確認
    expect(screen.getByTestId('image-uploader')).toBeInTheDocument();
    expect(screen.getByTestId('difficulty-selector')).toBeInTheDocument();
    expect(screen.getByText('パズルを開始')).toBeInTheDocument();

    // ゲームセクションが表示されていないことを確認
    expect(screen.queryByTestId('puzzle-board')).not.toBeInTheDocument();
  });

  describe('ユーザーが好きな画像をアップロードできる', () => {
    it('画面を表示するとアップロードするための画像をアップロードするボタンが表示されている', () => {
      render(
        <Provider>
          <HomePage />
        </Provider>
      );

      // 画像アップロードボタンが表示されていることを確認
      expect(screen.getByTestId('mock-upload-button')).toBeInTheDocument();
    });

    it('ボタンをクリックすると画像を選択して好きな画像をアップロードすることができる', () => {
      render(
        <Provider>
          <HomePage />
        </Provider>
      );

      // 画像アップロードボタンをクリック
      fireEvent.click(screen.getByTestId('mock-upload-button'));

      // setImageUrlとsetOriginalImageSizeが呼ばれたことを確認
      expect(mockUsePuzzle.setImageUrl).toHaveBeenCalledWith('test-image.jpg');
      expect(mockUsePuzzle.setOriginalImageSize).toHaveBeenCalledWith({
        width: 800,
        height: 600,
      });
    });
  });

  it('難易度が変更されると状態が更新されること', () => {
    render(
      <Provider>
        <HomePage />
      </Provider>
    );

    // 難易度セレクターの値を変更
    fireEvent.change(screen.getByTestId('difficulty-select'), {
      target: { value: '5' },
    });

    // setDivisionが呼ばれたことを確認
    expect(mockUsePuzzle.setDivision).toHaveBeenCalledWith(5);
  });

  it('パズル開始ボタンをクリックするとゲームが開始されること', () => {
    // imageUrlとoriginalImageSizeを設定
    mockUsePuzzle.imageUrl = 'test-image.jpg';
    mockUsePuzzle.originalImageSize = { width: 800, height: 600 };

    render(
      <Provider>
        <HomePage />
      </Provider>
    );

    // パズル開始ボタンをクリック
    fireEvent.click(screen.getByText('パズルを開始'));

    // initializePuzzleが呼ばれたことを確認
    expect(mockUsePuzzle.initializePuzzle).toHaveBeenCalled();
  });

  it('ゲーム開始後はパズルボードが表示されること', () => {
    // imageUrlとoriginalImageSizeを設定
    mockUsePuzzle.imageUrl = 'test-image.jpg';
    mockUsePuzzle.originalImageSize = { width: 800, height: 600 };

    render(
      <Provider>
        <HomePage />
      </Provider>
    );

    // パズル開始ボタンをクリック
    fireEvent.click(screen.getByText('パズルを開始'));

    // パズルボードが表示されていることを確認
    expect(screen.getByTestId('puzzle-board')).toBeInTheDocument();

    // 設定セクションが表示されていないことを確認
    expect(screen.queryByTestId('image-uploader')).not.toBeInTheDocument();
  });

  it('ピース移動ボタンをクリックするとmovePieceが呼ばれること', () => {
    // imageUrlとoriginalImageSizeを設定
    mockUsePuzzle.imageUrl = 'test-image.jpg';
    mockUsePuzzle.originalImageSize = { width: 800, height: 600 };

    render(
      <Provider>
        <HomePage />
      </Provider>
    );

    // パズル開始ボタンをクリック
    fireEvent.click(screen.getByText('パズルを開始'));

    // ピース移動ボタンをクリック
    fireEvent.click(screen.getByTestId('mock-piece-move'));

    // movePieceが呼ばれたことを確認
    expect(mockUsePuzzle.movePiece).toHaveBeenCalledWith(1, 0, 0);
  });

  it('リセットボタンをクリックするとresetPuzzleが呼ばれること', () => {
    // imageUrlとoriginalImageSizeを設定
    mockUsePuzzle.imageUrl = 'test-image.jpg';
    mockUsePuzzle.originalImageSize = { width: 800, height: 600 };

    render(
      <Provider>
        <HomePage />
      </Provider>
    );

    // パズル開始ボタンをクリック
    fireEvent.click(screen.getByText('パズルを開始'));

    // リセットボタンをクリック
    fireEvent.click(screen.getByTestId('mock-reset'));

    // resetPuzzleが呼ばれたことを確認
    expect(mockUsePuzzle.resetPuzzle).toHaveBeenCalled();
  });

  it('ヒント切替ボタンをクリックするとtoggleHintModeが呼ばれること', () => {
    // imageUrlとoriginalImageSizeを設定
    mockUsePuzzle.imageUrl = 'test-image.jpg';
    mockUsePuzzle.originalImageSize = { width: 800, height: 600 };

    render(
      <Provider>
        <HomePage />
      </Provider>
    );

    // パズル開始ボタンをクリック
    fireEvent.click(screen.getByText('パズルを開始'));

    // ヒント切替ボタンをクリック
    fireEvent.click(screen.getByTestId('mock-toggle-hint'));

    // toggleHintModeが呼ばれたことを確認
    expect(mockUseHintMode.toggleHintMode).toHaveBeenCalled();
  });

  it('ゲーム終了ボタンをクリックするとゲームが終了すること', () => {
    // imageUrlとoriginalImageSizeを設定
    mockUsePuzzle.imageUrl = 'test-image.jpg';
    mockUsePuzzle.originalImageSize = { width: 800, height: 600 };

    render(
      <Provider>
        <HomePage />
      </Provider>
    );

    // パズル開始ボタンをクリック
    fireEvent.click(screen.getByText('パズルを開始'));

    // ゲーム終了ボタンをクリック
    fireEvent.click(screen.getByText('ゲームを終了して設定に戻る'));

    // 設定セクションが表示されていることを確認
    expect(screen.getByTestId('image-uploader')).toBeInTheDocument();

    // パズルボードが表示されていないことを確認
    expect(screen.queryByTestId('puzzle-board')).not.toBeInTheDocument();
  });

  it("パズルが完成すると'パズルが完成しました！'と表示されること", async () => {
    // imageUrlとoriginalImageSizeを設定
    mockUsePuzzle.imageUrl = 'test-image.jpg';
    mockUsePuzzle.originalImageSize = { width: 800, height: 600 };
    // パズルが完成した状態にする
    mockUsePuzzle.completed = true;

    render(
      <Provider>
        <HomePage />
      </Provider>
    );

    // パズル開始ボタンをクリック
    fireEvent.click(screen.getByText('パズルを開始'));

    // パズルボードが表示されていることを確認
    expect(screen.getByTestId('puzzle-board')).toBeInTheDocument();

    // ゲームの完成を通知する要素が表示されていることを確認
    expect(await screen.findByText('パズルが完成しました！')).toBeInTheDocument();
  });
});
