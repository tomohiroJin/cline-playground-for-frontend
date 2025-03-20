import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImageUploader from './ImageUploader';
import { checkImageFileSize, getImageSize } from '../../utils/puzzle-utils';

jest.mock('../../utils/puzzle-utils');

const mockedCheckImageFileSize = checkImageFileSize as jest.Mock;
const mockedGetImageSize = getImageSize as jest.Mock;

describe('ImageUploader', () => {
  // URL.createObjectURL をモック化
  beforeAll(() => {
    global.URL.createObjectURL = jest.fn(() => 'blob://test');
  });

  beforeEach(() => {
    mockedCheckImageFileSize.mockReset();
    mockedGetImageSize.mockReset();
  });

  /** input[type="file"] を取得して change イベントを発火 */
  const simulateFileInputChange = () => {
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['dummy'], 'dummy.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
  };

  test('画像が未選択の場合、アップロードのテキストが表示される', () => {
    render(<ImageUploader onImageUpload={jest.fn()} />);
    expect(screen.getByText('画像をアップロードしてください')).toBeInTheDocument();
  });

  test('正しい画像をアップロードすると onImageUpload が呼ばれ、プレビューが表示される', async () => {
    mockedCheckImageFileSize.mockReturnValue(true);
    mockedGetImageSize.mockResolvedValue({ width: 100, height: 100 });

    const onImageUpload = jest.fn();
    render(<ImageUploader onImageUpload={onImageUpload} />);

    // 「画像を選択」ボタンをクリック
    fireEvent.click(screen.getByText('画像を選択'));

    simulateFileInputChange();

    await waitFor(() => expect(onImageUpload).toHaveBeenCalledWith('blob://test', 100, 100));
    expect(screen.getByAltText('プレビュー')).toBeInTheDocument();
  });

  test('ファイルサイズが大きすぎる場合、エラーメッセージが表示され、onImageUpload は呼ばれない', async () => {
    mockedCheckImageFileSize.mockReturnValue(false);

    const onImageUpload = jest.fn();
    render(<ImageUploader onImageUpload={onImageUpload} maxSizeInMB={5} />);

    fireEvent.click(screen.getByText('画像を選択'));

    simulateFileInputChange();

    await waitFor(() =>
      expect(
        screen.getByText('画像サイズが大きすぎます。5MB以下の画像を選択してください。')
      ).toBeInTheDocument()
    );
    expect(onImageUpload).not.toHaveBeenCalled();
  });
});
