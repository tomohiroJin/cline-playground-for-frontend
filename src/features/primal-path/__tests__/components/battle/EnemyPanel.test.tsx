/**
 * EnemyPanel コンポーネントテスト
 * 敵の表示パネル（スプライト、HP、ステータス、ポップアップ）
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EnemyPanel } from '../../../components/battle/EnemyPanel';
import type { Enemy } from '../../../types';
import type { PopupEntry } from '../../../components/battle/use-battle-popups';

// Canvas のモック
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  beginPath: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  drawImage: jest.fn(),
  globalAlpha: 1,
  setTransform: jest.fn(),
})) as unknown as typeof HTMLCanvasElement.prototype.getContext;

describe('EnemyPanel', () => {
  const mockEnemy: Enemy = {
    n: 'スライム',
    hp: 80,
    mhp: 100,
    atk: 15,
    def: 5,
    bone: 10,
  };

  const defaultProps = {
    enemy: mockEnemy,
    boss: false,
    burn: 0,
    turn: 1,
    isHit: false,
    popups: [] as PopupEntry[],
  };

  it('敵の名前が表示される', () => {
    // Arrange & Act
    render(<EnemyPanel {...defaultProps} />);

    // Assert
    expect(screen.getByText(/スライム/)).toBeInTheDocument();
  });

  it('敵のATK/DEF/骨が表示される', () => {
    // Arrange & Act
    render(<EnemyPanel {...defaultProps} />);

    // Assert
    expect(screen.getByText(/ATK 15/)).toBeInTheDocument();
    expect(screen.getByText(/DEF 5/)).toBeInTheDocument();
  });

  it('ボスの場合に👑が表示される', () => {
    // Arrange & Act
    render(<EnemyPanel {...defaultProps} boss={true} />);

    // Assert
    expect(screen.getByText(/👑/)).toBeInTheDocument();
  });

  it('HPが0以下で💀が表示される', () => {
    // Arrange
    const deadEnemy = { ...mockEnemy, hp: 0 };

    // Act
    render(<EnemyPanel {...defaultProps} enemy={deadEnemy} />);

    // Assert
    expect(screen.getByText(/💀/)).toBeInTheDocument();
  });

  it('火傷時に🔥が表示される', () => {
    // Arrange & Act
    render(<EnemyPanel {...defaultProps} burn={5} />);

    // Assert
    expect(screen.getByText('🔥')).toBeInTheDocument();
  });
});
