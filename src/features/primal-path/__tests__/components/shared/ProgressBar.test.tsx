/**
 * ProgressBar コンポーネントテスト
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProgressBar } from '../../../components/shared/ProgressBar';

describe('ProgressBar', () => {
  it('ラベルと進捗値が表示される', () => {
    // Arrange & Act
    render(<ProgressBar current={3} max={10} label="Wave 3/10" />);

    // Assert
    expect(screen.getByText('Wave 3/10')).toBeInTheDocument();
    expect(screen.getByText('3/10')).toBeInTheDocument();
  });

  it('進捗バーの幅が正しく計算される', () => {
    // Arrange & Act
    const { container } = render(<ProgressBar current={5} max={10} label="test" />);

    // Assert: 50% の幅になるバー要素が存在する
    const bar = container.querySelector('[style*="width: 50%"]');
    expect(bar).toBeTruthy();
  });

  it('100%を超えないようにクランプされる', () => {
    // Arrange & Act
    const { container } = render(<ProgressBar current={15} max={10} label="test" />);

    // Assert: 100% でクランプ
    const bar = container.querySelector('[style*="width: 100%"]');
    expect(bar).toBeTruthy();
  });
});
