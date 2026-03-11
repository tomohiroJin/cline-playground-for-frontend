/**
 * HpBar コンポーネントテスト
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HpBar } from '../../../components/shared/HpBar';

describe('HpBar', () => {
  it('HP値が表示される', () => {
    // Arrange & Act
    render(<HpBar value={60} max={100} variant="hp" />);

    // Assert
    expect(screen.getByText('60/100')).toBeInTheDocument();
  });

  it('showPctでパーセンテージが表示される', () => {
    // Arrange & Act
    render(<HpBar value={75} max={100} variant="hp" showPct />);

    // Assert
    expect(screen.getByText('75/100 (75%)')).toBeInTheDocument();
  });

  it('HP0以下でも0と表示される', () => {
    // Arrange & Act
    render(<HpBar value={-5} max={100} variant="hp" />);

    // Assert
    expect(screen.getByText('0/100')).toBeInTheDocument();
  });

  it('ehバリアントがレンダリングされる', () => {
    // Arrange & Act
    render(<HpBar value={30} max={50} variant="eh" showPct />);

    // Assert
    expect(screen.getByText('30/50 (60%)')).toBeInTheDocument();
  });
});
