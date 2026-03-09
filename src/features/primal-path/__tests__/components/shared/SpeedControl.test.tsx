/**
 * SpeedControl コンポーネントテスト
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SpeedControl } from '../../../components/shared/SpeedControl';
import type { GameAction } from '../../../hooks';

describe('SpeedControl', () => {
  const mockDispatch = jest.fn<void, [GameAction]>();

  beforeEach(() => {
    mockDispatch.mockClear();
  });

  it('速度ラベルが表示される', () => {
    // Arrange & Act
    render(<SpeedControl battleSpd={750} dispatch={mockDispatch} />);

    // Assert
    expect(screen.getByText('速度')).toBeInTheDocument();
  });

  it('一時停止ボタンが存在する', () => {
    // Arrange & Act
    render(<SpeedControl battleSpd={750} dispatch={mockDispatch} />);

    // Assert
    expect(screen.getByText('⏸')).toBeInTheDocument();
  });

  it('ボタンクリックでCHANGE_SPEEDがディスパッチされる', () => {
    // Arrange
    render(<SpeedControl battleSpd={750} dispatch={mockDispatch} />);

    // Act
    fireEvent.click(screen.getByText('⏸'));

    // Assert
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'CHANGE_SPEED', speed: 0 });
  });
});
