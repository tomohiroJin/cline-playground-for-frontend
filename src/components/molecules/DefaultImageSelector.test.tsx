import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DefaultImageSelector from './DefaultImageSelector';
import * as puzzleUtils from '../../utils/puzzle-utils';

// getImageSizeのモック
jest.mock('../../utils/puzzle-utils', () => ({
  getImageSize: jest.fn(),
}));

describe('DefaultImageSelector', () => {
  const mockOnImageSelect = jest.fn();
  const mockImageSize = { width: 800, height: 600 };

  beforeEach(() => {
    jest.clearAllMocks();
    // getImageSizeのモック実装
    (puzzleUtils.getImageSize as jest.Mock).mockResolvedValue(mockImageSize);

    // windowのlocationをモック
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:3000',
      },
      writable: true,
    });
  });

  it('デフォルト画像が表示されること', () => {
    render(<DefaultImageSelector onImageSelect={mockOnImageSelect} />);

    // タイトルが表示されていることを確認
    expect(screen.getByText('デフォルト画像から選択')).toBeInTheDocument();

    // 3つの画像が表示されていることを確認
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(3);

    // 画像のsrc属性を確認
    expect(images[0]).toHaveAttribute('src', '/images/default/nature1.jpg');
    expect(images[1]).toHaveAttribute('src', '/images/default/nature2.jpg');
    expect(images[2]).toHaveAttribute('src', '/images/default/nature3.jpg');
  });

  it('画像をクリックすると選択状態になり、onImageSelectが呼ばれること', async () => {
    render(<DefaultImageSelector onImageSelect={mockOnImageSelect} />);

    // 最初の画像をクリック
    const firstImage = screen.getAllByRole('img')[0];
    fireEvent.click(firstImage);

    // getImageSizeが呼ばれたことを確認
    expect(puzzleUtils.getImageSize).toHaveBeenCalledWith(
      'http://localhost:3000/images/default/nature1.jpg'
    );

    // onImageSelectが正しいパラメータで呼ばれたことを確認
    await waitFor(() => {
      expect(mockOnImageSelect).toHaveBeenCalledWith(
        'http://localhost:3000/images/default/nature1.jpg',
        mockImageSize.width,
        mockImageSize.height
      );
    });

    // 選択状態のインジケータが表示されていることを確認
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('別の画像を選択すると選択状態が切り替わること', async () => {
    render(<DefaultImageSelector onImageSelect={mockOnImageSelect} />);

    // 最初の画像をクリック
    const images = screen.getAllByRole('img');
    fireEvent.click(images[0]);

    // 選択状態のインジケータが表示されていることを確認
    await waitFor(() => {
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    // 2番目の画像をクリック
    fireEvent.click(images[1]);

    // getImageSizeが2回呼ばれたことを確認
    expect(puzzleUtils.getImageSize).toHaveBeenCalledTimes(2);

    // onImageSelectが2回呼ばれたことを確認
    await waitFor(() => {
      expect(mockOnImageSelect).toHaveBeenCalledTimes(2);
    });
  });
});
