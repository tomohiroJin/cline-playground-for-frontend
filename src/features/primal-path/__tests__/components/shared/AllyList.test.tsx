/**
 * AllyList コンポーネントテスト
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AllyList } from '../../../components/shared/AllyList';
import type { Ally } from '../../../types';

describe('AllyList', () => {
  const makeAlly = (overrides: Partial<Ally> = {}): Ally => ({
    n: '炎の戦士',
    t: 'tech',
    hp: 30,
    mhp: 30,
    atk: 5,
    a: 1,
    ...overrides,
  });

  it('仲間がいない場合は何も表示しない', () => {
    // Arrange & Act
    const { container } = render(<AllyList allies={[]} mode="battle" />);

    // Assert
    expect(container.innerHTML).toBe('');
  });

  it('バトルモードで仲間の名前とHP表示される', () => {
    // Arrange
    const allies = [makeAlly({ n: '炎の戦士', hp: 20, mhp: 30 })];

    // Act
    render(<AllyList allies={allies} mode="battle" />);

    // Assert
    expect(screen.getByText('炎の戦士')).toBeInTheDocument();
    expect(screen.getByText('20/30')).toBeInTheDocument();
  });

  it('死亡した仲間に💀が表示される', () => {
    // Arrange
    const allies = [makeAlly({ n: '倒れた者', a: 0 })];

    // Act
    render(<AllyList allies={allies} mode="battle" />);

    // Assert
    expect(screen.getByText('💀')).toBeInTheDocument();
  });

  it('進化モードでHP形式が異なる', () => {
    // Arrange
    const allies = [makeAlly({ n: '仲間A', hp: 25 })];

    // Act
    render(<AllyList allies={allies} mode="evo" />);

    // Assert
    expect(screen.getByText('仲間A')).toBeInTheDocument();
    expect(screen.getByText('HP25')).toBeInTheDocument();
  });
});
