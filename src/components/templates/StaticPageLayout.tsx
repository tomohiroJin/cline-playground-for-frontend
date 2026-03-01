import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px 60px;
`;

const PageTitle = styled.h2`
  font-size: 2rem;
  margin-bottom: 32px;
  background: linear-gradient(to right, #fff, #a5f3fc);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;
`;

const ContentArea = styled.div`
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--glass-shadow);
  color: var(--text-primary);
  line-height: 1.8;

  h3 {
    font-size: 1.25rem;
    margin-top: 32px;
    margin-bottom: 12px;
    color: var(--text-primary);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 8px;

    &:first-child {
      margin-top: 0;
    }
  }

  p {
    margin-bottom: 16px;
    color: var(--text-secondary);
  }

  ul, ol {
    margin-bottom: 16px;
    padding-left: 24px;
    color: var(--text-secondary);
  }

  li {
    margin-bottom: 8px;
  }

  a {
    color: var(--accent-color, #00d2ff);
    text-decoration: none;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.8;
      text-decoration: underline;
    }
  }
`;

interface StaticPageLayoutProps {
  readonly title: string;
  readonly children: React.ReactNode;
}

/**
 * 静的ページ（About, プライバシーポリシー等）の共通レイアウト
 */
export const StaticPageLayout: React.FC<StaticPageLayoutProps> = ({ title, children }) => {
  return (
    <Container>
      <PageTitle>{title}</PageTitle>
      <ContentArea>{children}</ContentArea>
    </Container>
  );
};
