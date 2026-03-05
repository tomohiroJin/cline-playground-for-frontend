import React from 'react';
import styled from 'styled-components';

interface SectionCardProps {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}

/** フィーチャーカード本体 */
const Card = styled.div`
  background: var(--glass-bg);
  backdrop-filter: blur(8px);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 24px 16px;
  text-align: center;
  transition: transform 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: var(--accent-color);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:hover {
      transform: none;
    }
  }
`;

/** アイコン表示 */
const Icon = styled.div`
  font-size: 2rem;
  margin-bottom: 8px;
`;

/** カードタイトル */
const Title = styled.div`
  font-weight: 600;
  color: var(--accent-color);
  font-size: 0.95rem;
  margin-bottom: 4px;
`;

/** カード説明文 */
const Description = styled.div`
  color: var(--text-secondary);
  font-size: 0.85rem;
  line-height: 1.5;
`;

/**
 * フィーチャーカード コンポーネント
 *
 * About ページ等で特徴を視覚的に表示する。
 * アイコン + タイトル + 説明文の構成。
 */
export const SectionCard: React.FC<SectionCardProps> = ({ icon, title, description }) => {
  return (
    <Card data-testid="section-card">
      <Icon aria-hidden="true">{icon}</Icon>
      <Title>{title}</Title>
      <Description>{description}</Description>
    </Card>
  );
};
