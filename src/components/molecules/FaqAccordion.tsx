import React from 'react';
import styled from 'styled-components';

interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

interface FaqAccordionProps {
  readonly items: ReadonlyArray<FaqItem>;
}

/** FAQ アコーディオン コンテナ */
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
`;

/** 各 FAQ アイテムのラッパー（details で開閉制御） */
const FaqDetails = styled.details`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.2s ease;

  &[open] {
    border-color: var(--accent-color);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/** 質問部分（summary） */
const Question = styled.summary`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  cursor: pointer;
  color: var(--text-primary);
  font-weight: 500;
  font-size: 0.95rem;
  list-style: none;
  user-select: none;

  /* デフォルトの三角アイコンを非表示 */
  &::-webkit-details-marker {
    display: none;
  }

  &::before {
    content: '▶';
    font-size: 0.7rem;
    color: var(--accent-color);
    transition: transform 0.2s ease;
    flex-shrink: 0;
  }

  details[open] > &::before {
    transform: rotate(90deg);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  @media (prefers-reduced-motion: reduce) {
    &::before {
      transition: none;
    }
  }
`;

/** 回答部分 */
const Answer = styled.div`
  padding: 0 16px 12px 36px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.7;
`;

/**
 * FAQ アコーディオン コンポーネント
 *
 * HTML ネイティブの details/summary を使用してアコーディオン動作を実現する。
 * details/summary はネイティブでアクセシブルなため、追加の ARIA 属性は不要。
 */
export const FaqAccordion: React.FC<FaqAccordionProps> = ({ items }) => {
  return (
    <Container>
      {items.map((item) => (
        <FaqDetails key={item.question}>
          <Question>{item.question}</Question>
          <Answer>{item.answer}</Answer>
        </FaqDetails>
      ))}
    </Container>
  );
};
