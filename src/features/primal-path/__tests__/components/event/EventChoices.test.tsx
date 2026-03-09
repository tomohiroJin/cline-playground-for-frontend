/**
 * EventChoices コンポーネントテスト
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventChoices } from '../../../components/event/EventChoices';
import type { EventChoice } from '../../../types';

describe('EventChoices', () => {
  const mockOnChoose = jest.fn();

  const choices: EventChoice[] = [
    {
      label: '骨30で取引する',
      description: '骨を消費してATK+8を得る',
      effect: { type: 'stat_change', stat: 'atk', value: 8 },
      riskLevel: 'safe',
      cost: { type: 'bone', amount: 30 },
    },
    {
      label: '立ち去る',
      description: '何も起こらない',
      effect: { type: 'nothing' },
      riskLevel: 'safe',
    },
  ];

  beforeEach(() => {
    mockOnChoose.mockClear();
  });

  it('選択肢が全て表示される', () => {
    // Arrange & Act
    render(<EventChoices choices={choices} currentBones={100} onChoose={mockOnChoose} />);

    // Assert
    expect(screen.getByText(/骨30で取引する/)).toBeInTheDocument();
    expect(screen.getByText(/立ち去る/)).toBeInTheDocument();
  });

  it('選択肢をクリックすると onChoose が呼ばれる', () => {
    // Arrange
    render(<EventChoices choices={choices} currentBones={100} onChoose={mockOnChoose} />);

    // Act
    fireEvent.click(screen.getByText(/立ち去る/).closest('button')!);

    // Assert
    expect(mockOnChoose).toHaveBeenCalledTimes(1);
  });

  it('骨コスト不足時にボタンが disabled になる', () => {
    // Arrange & Act
    render(<EventChoices choices={choices} currentBones={10} onChoose={mockOnChoose} />);

    // Assert
    const tradeBtn = screen.getByText(/骨30で取引する/).closest('button')!;
    expect(tradeBtn).toBeDisabled();
    expect(screen.getByText(/不足/)).toBeInTheDocument();
  });

  it('リスクアイコンが表示される', () => {
    // Arrange & Act
    render(<EventChoices choices={choices} currentBones={100} onChoose={mockOnChoose} />);

    // Assert
    const safeIcons = screen.getAllByText(/🟢/);
    expect(safeIcons.length).toBeGreaterThanOrEqual(1);
  });

  it('dangerous な選択肢に🔴が表示される', () => {
    // Arrange
    const dangerousChoices: EventChoice[] = [
      {
        label: '巣に突入する',
        description: '高リスク',
        effect: { type: 'stat_change', stat: 'atk', value: 15 },
        riskLevel: 'dangerous',
      },
    ];

    // Act
    render(<EventChoices choices={dangerousChoices} currentBones={0} onChoose={mockOnChoose} />);

    // Assert
    expect(screen.getByText(/🔴/)).toBeInTheDocument();
  });
});
