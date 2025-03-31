import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HomePage from './HomePage';
import { Provider } from 'jotai/react';
import * as usePuzzleHook from '../hooks/usePuzzle';
import * as useHintModeHook from '../hooks/useHintMode';

// モック
jest.mock('../components/molecules/DefaultImageSelector', () => ({
  __esModule: true,
  default: ({ onImageSelect }: { onImageSelect: Function }) => (
    <div data-testid="default-image-selector">
      <button
        onClick={() => onImageSelect('default-image.jpg', 800, 600)}
        data-testid="mock-default-image-button"
      >
        デフォルト画像を選択
      </button>
    </div>
  ),
}));

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
  setPieces: jest.fn(),
  emptyPosition: null,
  elapsedTime: 0,
  completed: false,
  setCompleted: jest.fn(),
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

// renderHomePage ヘルパー関数の定義
const renderHomePage = () =>
  render(
    <Provider>
      <HomePage />
    </Provider>
  );

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // usePuzzleフックのモックを設定
    jest.spyOn(usePuzzleHook, 'usePuzzle').mockReturnValue(mockUsePuzzle);

    // useHintModeフックのモックを設定
    jest.spyOn(useHintModeHook, 'useHintMode').mockReturnValue(mockUseHintMode);
  });

  it('初期状態では設定セクションが表示されること', () => {
    renderHomePage();

    // 設定セクションの要素が表示されていることを確認
    expect(screen.getByTestId('image-uploader')).toBeInTheDocument();
    expect(screen.queryByTestId('default-image-selector')).not.toBeInTheDocument();
    expect(screen.getByTestId('difficulty-selector')).toBeInTheDocument();
    expect(screen.getByText('パズルを開始')).toBeInTheDocument();

    // ゲームセクションが表示されていないことを確認
    expect(screen.queryByTestId('puzzle-board')).not.toBeInTheDocument();
  });

  describe('画像ソースモードの切り替え', () => {
    it('初期状態では画像アップロードモードが表示されていること', () => {
      renderHomePage();

      // 画像アップロードが表示されていることを確認
      expect(screen.getByTestId('image-uploader')).toBeInTheDocument();
      expect(screen.queryByTestId('default-image-selector')).not.toBeInTheDocument();

      // 切り替えボタンが表示されていることを確認
      const uploadButtons = screen.getAllByText('画像をアップロード');
      expect(uploadButtons.length).toBeGreaterThan(0);
      expect(screen.getByText('デフォルト画像から選択')).toBeInTheDocument();
    });

    it('デフォルト画像選択ボタンをクリックするとデフォルト画像選択モードに切り替わること', () => {
      renderHomePage();

      // デフォルト画像選択ボタンをクリック
      fireEvent.click(screen.getByText('デフォルト画像から選択'));

      // デフォルト画像選択が表示されていることを確認
      expect(screen.queryByTestId('image-uploader')).not.toBeInTheDocument();
      expect(screen.getByTestId('default-image-selector')).toBeInTheDocument();
    });

    it('画像アップロードボタンをクリックすると画像アップロードモードに切り替わること', () => {
      renderHomePage();

      // デフォルト画像選択ボタンをクリック
      fireEvent.click(screen.getByText('デフォルト画像から選択'));

      // 画像アップロードボタンをクリック
      fireEvent.click(screen.getByText('画像をアップロード'));

      // 画像アップロードが表示されていることを確認
      expect(screen.getByTestId('image-uploader')).toBeInTheDocument();
      expect(screen.queryByTestId('default-image-selector')).not.toBeInTheDocument();
    });
  });

  describe('ユーザーがデフォルト画像を選択できる', () => {
    it('デフォルト画像選択モードに切り替えるとデフォルト画像を選択するボタンが表示されている', () => {
      renderHomePage();

      // デフォルト画像選択モードに切り替え
      fireEvent.click(screen.getByText('デフォルト画像から選択'));

      // デフォルト画像選択ボタンが表示されていることを確認
      expect(screen.getByTestId('mock-default-image-button')).toBeInTheDocument();
    });

    it('ボタンをクリックするとデフォルト画像を選択できる', () => {
      renderHomePage();

      // デフォルト画像選択モードに切り替え
      fireEvent.click(screen.getByText('デフォルト画像から選択'));

      // デフォルト画像選択ボタンをクリック
      fireEvent.click(screen.getByTestId('mock-default-image-button'));

      // setImageUrlとsetOriginalImageSizeが呼ばれたことを確認
      expect(mockUsePuzzle.setImageUrl).toHaveBeenCalledWith('default-image.jpg');
      expect(mockUsePuzzle.setOriginalImageSize).toHaveBeenCalledWith({
        width: 800,
        height: 600,
      });
    });
  });

  describe('ユーザーが好きな画像をアップロードできる', () => {
    it('画面を表示するとアップロードするための画像をアップロードするボタンが表示されている', () => {
      renderHomePage();

      // 画像アップロードボタンが表示されていることを確認
      expect(screen.getByTestId('mock-upload-button')).toBeInTheDocument();
    });

    it('ボタンをクリックすると画像を選択して好きな画像をアップロードすることができる', () => {
      renderHomePage();

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
    renderHomePage();

    // 難易度セレクターの値を変更
    fireEvent.change(screen.getByTestId('difficulty-select'), {
      target: { value: '5' },
    });

    // setDivisionが呼ばれたことを確認
    expect(mockUsePuzzle.setDivision).toHaveBeenCalledWith(5);
  });

  describe('パズルを開始ボタンをクリックするとゲームが開始される', () => {
    it("画面を表示すると'パズルを開始'ボタンが表示されること", () => {
      renderHomePage();

      // パズルを開始ボタンが表示されていることを確認
      expect(screen.getByText('パズルを開始')).toBeInTheDocument();
    });

    it("画像が選択されていない場合は'パズルを開始'ボタンが利用できないこと", () => {
      renderHomePage();

      // パズルを開始ボタンが利用できないことを確認
      expect(screen.getByText('パズルを開始')).toBeDisabled();
    });

    it("画像が選択されている場合は'パズルを開始'ボタンが利用できること", () => {
      // imageUrlを設定
      mockUsePuzzle.imageUrl = 'test-image.jpg';
      mockUsePuzzle.originalImageSize = { width: 800, height: 600 };

      renderHomePage();

      // パズルを開始ボタンが利用できることを確認
      expect(screen.getByText('パズルを開始')).not.toBeDisabled();
    });

    it('パズルを開始ボタンをクリックするとゲームが初期化されてパズルボードが表示されること', () => {
      // imageUrlとoriginalImageSizeを設定
      mockUsePuzzle.imageUrl = 'test-image.jpg';
      mockUsePuzzle.originalImageSize = { width: 800, height: 600 };

      renderHomePage();

      // パズル開始ボタンをクリック
      fireEvent.click(screen.getByText('パズルを開始'));

      // initializePuzzleが呼ばれたことを確認
      expect(mockUsePuzzle.initializePuzzle).toHaveBeenCalled();

      // パズルボードが表示されていることを確認
      expect(screen.getByTestId('puzzle-board')).toBeInTheDocument();

      // 設定セクションが表示されていないことを確認
      expect(screen.queryByTestId('image-uploader')).not.toBeInTheDocument();
    });
  });

  it('ピース移動ボタンをクリックするとmovePieceが呼ばれること', () => {
    // imageUrlとoriginalImageSizeを設定
    mockUsePuzzle.imageUrl = 'test-image.jpg';
    mockUsePuzzle.originalImageSize = { width: 800, height: 600 };

    renderHomePage();

    // パズル開始ボタンをクリック
    fireEvent.click(screen.getByText('パズルを開始'));

    // ピース移動ボタンをクリック
    fireEvent.click(screen.getByTestId('mock-piece-move'));

    // movePieceが呼ばれたことを確認
    expect(mockUsePuzzle.movePiece).toHaveBeenCalledWith(1);
  });

  it('リセットボタンをクリックするとresetPuzzleが呼ばれること', () => {
    // imageUrlとoriginalImageSizeを設定
    mockUsePuzzle.imageUrl = 'test-image.jpg';
    mockUsePuzzle.originalImageSize = { width: 800, height: 600 };

    renderHomePage();

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

    renderHomePage();

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

    renderHomePage();

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

    renderHomePage();

    // パズル開始ボタンをクリック
    fireEvent.click(screen.getByText('パズルを開始'));

    // パズルボードが表示されていることを確認
    expect(screen.getByTestId('puzzle-board')).toBeInTheDocument();

    // ゲームの完成を通知する要素が表示されていることを確認
    expect(await screen.findByText('パズルが完成しました！')).toBeInTheDocument();
  });
});
