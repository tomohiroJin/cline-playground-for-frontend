import React from 'react';
import styled from 'styled-components';

interface StaticPageLayoutProps {
  readonly title: string;
  readonly children: React.ReactNode;
  /** 制定日（datetime 形式: YYYY-MM） */
  readonly publishDate?: string;
  /** 最終更新日（datetime 形式: YYYY-MM-DD） */
  readonly lastUpdated?: string;
}

/** 静的ページ全体のコンテナ（セマンティック: article） */
const Container = styled.article`
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px 60px;
`;

/** ページヘッダー */
const PageHeader = styled.header`
  margin-bottom: 32px;
`;

/** ページタイトル（グラデーションテキスト） */
const PageTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin: 0;
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

/** ページフッター（日付表示） */
const PageFooter = styled.footer`
  margin-top: 24px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.85rem;
  opacity: 0.7;
`;

/** 日付表示用のテキスト */
const DateText = styled.span`
  display: inline-block;
  margin: 0 8px;
`;

/**
 * 静的ページ共通レイアウトコンポーネント
 *
 * About、プライバシーポリシー、利用規約、お問い合わせページで共通使用する。
 * セマンティック HTML（article / header / footer / time）を使用する。
 */
export const StaticPageLayout: React.FC<StaticPageLayoutProps> = ({
  title,
  children,
  publishDate,
  lastUpdated,
}) => {
  return (
    <Container>
      <PageHeader>
        <PageTitle>{title}</PageTitle>
      </PageHeader>
      <ContentArea>{children}</ContentArea>
      {(publishDate || lastUpdated) && (
        <PageFooter>
          {publishDate && (
            <DateText>
              制定日: <time dateTime={publishDate}>{publishDate}</time>
            </DateText>
          )}
          {lastUpdated && (
            <DateText>
              最終更新: <time dateTime={lastUpdated}>{lastUpdated}</time>
            </DateText>
          )}
        </PageFooter>
      )}
    </Container>
  );
};
