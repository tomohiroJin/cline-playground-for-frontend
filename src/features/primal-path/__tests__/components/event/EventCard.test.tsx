/**
 * EventCard コンポーネントテスト
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventCard } from '../../../components/event/EventCard';

describe('EventCard', () => {
  it('イベント名・説明・状況テキストが表示される', () => {
    // Arrange & Act
    render(
      <EventCard
        name="骨の商人"
        description="奇妙な商人が骨と引き換えに力を分けてくれるという。"
        situationText="取引に応じるか？"
      />,
    );

    // Assert
    expect(screen.getByText('骨の商人')).toBeInTheDocument();
    expect(screen.getByText('奇妙な商人が骨と引き換えに力を分けてくれるという。')).toBeInTheDocument();
    expect(screen.getByText('取引に応じるか？')).toBeInTheDocument();
  });
});
