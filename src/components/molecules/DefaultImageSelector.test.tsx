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
  const defaultImages = [
    '/images/default/mountain_landscape.jpg',
    '/images/default/forest_landscape.jpg',
    '/images/default/beach_landscape.jpg',
    '/images/default/cat_office.png',
    '/images/default/digital_boy.png',
    '/images/default/playful_doodle.png',
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (puzzleUtils.getImageSize as jest.Mock).mockResolvedValue(mockImageSize);

    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true,
    });
  });

  it('デフォルト画像が表示されること', () => {
    render(<DefaultImageSelector onImageSelect={mockOnImageSelect} />);

    // タイトルが表示されていることを確認
    expect(screen.getByText('デフォルト画像から選択')).toBeInTheDocument();

    // 画像が正しく表示されていることを確認
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(defaultImages.length);
    defaultImages.forEach((src, index) => {
      expect(images[index]).toHaveAttribute('src', src);
    });
  });

  it('画像をクリックすると選択状態になり、onImageSelectが呼ばれること', async () => {
    render(<DefaultImageSelector onImageSelect={mockOnImageSelect} />);

    const firstImage = screen.getAllByRole('img')[0];
    fireEvent.click(firstImage);

    const expectedUrl = `${window.location.origin}${defaultImages[0]}`;
    expect(puzzleUtils.getImageSize).toHaveBeenCalledWith(expectedUrl);

    await waitFor(() => {
      expect(mockOnImageSelect).toHaveBeenCalledWith(
        expectedUrl,
        mockImageSize.width,
        mockImageSize.height
      );
    });

    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('別の画像を選択すると選択状態が切り替わること', async () => {
    render(<DefaultImageSelector onImageSelect={mockOnImageSelect} />);

    const images = screen.getAllByRole('img');
    fireEvent.click(images[0]);

    await waitFor(() => {
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    fireEvent.click(images[1]);

    expect(puzzleUtils.getImageSize).toHaveBeenCalledTimes(2);
    await waitFor(() => {
      expect(mockOnImageSelect).toHaveBeenCalledTimes(2);
    });
  });
});
