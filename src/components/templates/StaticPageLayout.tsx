import React from 'react';
import styled from 'styled-components';

interface StaticPageLayoutProps {
  readonly title: string;
  readonly children: React.ReactNode;
}

/** 静的ページ全体のコンテナ */
const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px 60px;
`;

/** ページタイトル（グラデーションテキスト） */
const PageTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 32px;
  background: linear-gradient(to right, #fff, #a5f3fc);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

/** Glassmorphism コンテンツ領域 */
const ContentArea = styled.div`
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--glass-shadow);

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 32px 0 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--glass-border);

    &:first-child {
      margin-top: 0;
    }
  }

  p {
    color: var(--text-secondary);
    line-height: 1.8;
    margin: 12px 0;
  }

  ul,
  ol {
    color: var(--text-secondary);
    line-height: 1.8;
    margin: 12px 0;
    padding-left: 24px;
  }

  a {
    color: var(--accent-color);
    text-decoration: none;
    transition: text-decoration 0.2s;

    &:hover {
      text-decoration: underline;
    }
  }
`;

/**
 * 静的ページ共通レイアウトコンポーネント
 *
 * About、プライバシーポリシー、利用規約、お問い合わせページで共通使用する。
 */
export const StaticPageLayout: React.FC<StaticPageLayoutProps> = ({
  title,
  children,
}) => {
  return (
    <Container>
      <PageTitle>{title}</PageTitle>
      <ContentArea>{children}</ContentArea>
    </Container>
  );
};
