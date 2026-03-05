import React from 'react';
import styled from 'styled-components';
import { Breadcrumb } from '../molecules/Breadcrumb';
import { useScrollReveal } from '../../hooks/useScrollReveal';

interface BreadcrumbItem {
  readonly label: string;
  readonly path?: string;
}

interface StaticPageLayoutProps {
  readonly title: string;
  readonly children: React.ReactNode;
  /** ページアイコン（絵文字 or Unicode 記号） */
  readonly icon?: string;
  /** パンくずリストのアイテム */
  readonly breadcrumbItems?: ReadonlyArray<BreadcrumbItem>;
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
  text-align: center;
`;

/** アイコンバッジ（グラデーション背景の円形） */
const IconBadge = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(0, 210, 255, 0.15), rgba(168, 85, 247, 0.15));
  border: 1px solid rgba(0, 210, 255, 0.2);
  font-size: 1.5rem;
  margin-bottom: 12px;
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

/** タイトル下のアクセントライン */
const TitleUnderline = styled.div`
  width: 60px;
  height: 3px;
  background: linear-gradient(to right, var(--accent-color), #a855f7);
  border-radius: 2px;
  margin: 12px auto 0;
`;

/** Glassmorphism コンテンツ領域 */
const ContentArea = styled.div`
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 40px;
  box-shadow: var(--glass-shadow);

  @media (max-width: 767px) {
    padding: 24px 16px;
  }

  h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 32px 0 16px;
    padding-left: 12px;
    padding-bottom: 8px;
    border-left: 3px solid var(--accent-color);
    border-bottom: 1px solid var(--glass-border);

    &:first-child {
      margin-top: 0;
    }
  }

  /* セクション間のグラデーション区切り線 */
  section + section {
    border-top: 1px solid transparent;
    border-image: linear-gradient(
        to right,
        transparent,
        var(--glass-border),
        transparent
      )
      1;
    padding-top: 8px;
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
 * アイコンバッジ、パンくずリスト、スクロールリビールアニメーションを統合。
 */
export const StaticPageLayout: React.FC<StaticPageLayoutProps> = ({
  title,
  children,
  icon,
  breadcrumbItems,
  publishDate,
  lastUpdated,
}) => {
  const scrollRef = useScrollReveal<HTMLDivElement>();

  return (
    <Container>
      <PageHeader>
        {icon && <IconBadge aria-hidden="true">{icon}</IconBadge>}
        <PageTitle>{title}</PageTitle>
        <TitleUnderline />
        {breadcrumbItems && <Breadcrumb items={breadcrumbItems} />}
      </PageHeader>
      <ContentArea ref={scrollRef}>{children}</ContentArea>
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
