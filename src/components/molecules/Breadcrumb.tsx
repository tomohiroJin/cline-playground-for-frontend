import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

interface BreadcrumbItem {
  readonly label: string;
  /** パスが undefined の場合はリンクなし（現在のページ） */
  readonly path?: string;
}

interface BreadcrumbProps {
  readonly items: ReadonlyArray<BreadcrumbItem>;
}

/** パンくずリスト ナビゲーション */
const Nav = styled.nav`
  margin-top: 12px;
`;

/** パンくずリスト本体 */
const List = styled.ol`
  display: flex;
  align-items: center;
  gap: 0;
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.8rem;
  justify-content: center;
`;

/** パンくずリストアイテム */
const ListItem = styled.li`
  display: flex;
  align-items: center;
  color: var(--text-secondary);

  /* 最初のアイテム以外に区切り文字を挿入 */
  &:not(:first-child)::before {
    content: '>';
    margin: 0 8px;
    color: var(--text-secondary);
    opacity: 0.5;
  }
`;

/** パンくずリストのリンク */
const BreadcrumbLink = styled(Link)`
  color: var(--accent-color);
  text-decoration: none;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
    text-decoration: underline;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/** 現在のページ表示 */
const CurrentPage = styled.span`
  color: var(--text-secondary);
  opacity: 0.8;
`;

/**
 * パンくずリスト UI コンポーネント
 *
 * セマンティックな nav > ol > li 構造で表示する。
 * 最後のアイテム（path 未指定）は aria-current="page" で現在のページを示す。
 */
export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <Nav aria-label="パンくずリスト">
      <List>
        {items.map((item) => {
          const isCurrent = !item.path;
          return (
            <ListItem
              key={item.label}
              {...(isCurrent ? { 'aria-current': 'page' as const } : {})}
            >
              {item.path ? (
                <BreadcrumbLink to={item.path}>{item.label}</BreadcrumbLink>
              ) : (
                <CurrentPage>{item.label}</CurrentPage>
              )}
            </ListItem>
          );
        })}
      </List>
    </Nav>
  );
};
