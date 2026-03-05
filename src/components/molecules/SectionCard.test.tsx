import React from 'react';
import { render, screen } from '@testing-library/react';
import { SectionCard } from './SectionCard';

describe('SectionCard', () => {
  const defaultProps = {
    icon: '🎮',
    title: '13種類のゲーム',
    description: '多彩なジャンルのゲームを提供',
  };

  describe('基本レンダリング', () => {
    it('アイコンが表示されること', () => {
      render(<SectionCard {...defaultProps} />);
      expect(screen.getByText('🎮')).toBeInTheDocument();
    });

    it('タイトルが表示されること', () => {
      render(<SectionCard {...defaultProps} />);
      expect(screen.getByText('13種類のゲーム')).toBeInTheDocument();
    });

    it('説明文が表示されること', () => {
      render(<SectionCard {...defaultProps} />);
      expect(screen.getByText('多彩なジャンルのゲームを提供')).toBeInTheDocument();
    });
  });

  describe('複数カード', () => {
    it('複数のカードが正しく表示されること', () => {
      const cards = [
        { icon: '🎮', title: 'ゲーム', description: '13種類' },
        { icon: '💰', title: '無料', description: '課金要素なし' },
        { icon: '👤', title: '登録不要', description: 'すぐにプレイ' },
      ];
      const { container } = render(
        <>
          {cards.map((card) => (
            <SectionCard key={card.title} {...card} />
          ))}
        </>
      );
      expect(container.querySelectorAll('[data-testid="section-card"]')).toHaveLength(3);
    });
  });
});
