import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  ListPanelWrap,
  LpHeader,
  LpSub,
  LpScrollWrap,
  LpList,
  LpArrow,
  LpFooter,
} from './styles';

interface Props {
  /** パネルが表示中か */
  active: boolean;
  /** ヘッダータイトル */
  title: string;
  /** サブタイトル（PT表示など、省略可） */
  subtitle?: string;
  /** フッターテキスト */
  footer: string;
  /** 現在選択中のインデックス（スクロール追従用） */
  selectedIndex?: number;
  /** リスト内容 */
  children: React.ReactNode;
}

// 共通リストパネル（スタイル/ショップ/ヘルプで共有）
const ListPanel: React.FC<Props> = ({
  active,
  title,
  subtitle,
  footer,
  selectedIndex,
  children,
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [showUp, setShowUp] = useState(false);
  const [showDown, setShowDown] = useState(false);

  // スクロール位置に応じて矢印表示を更新
  const updateArrows = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setShowUp(el.scrollTop > 4);
    setShowDown(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  }, []);

  useEffect(() => {
    if (!active) return;
    // 初回表示時に矢印状態を計算
    const timer = setTimeout(updateArrows, 50);
    return () => clearTimeout(timer);
  }, [active, updateArrows, children]);

  // 選択アイテムが変わったらスクロール追従
  useEffect(() => {
    if (!active || selectedIndex == null) return;
    const el = listRef.current;
    if (!el) return;
    const items = el.children;
    const target = items[selectedIndex] as HTMLElement | undefined;
    if (target) {
      target.scrollIntoView({ block: 'nearest' });
      // scrollIntoView 後に矢印状態を更新
      requestAnimationFrame(updateArrows);
    }
  }, [active, selectedIndex, updateArrows]);

  return (
    <ListPanelWrap $active={active}>
      <LpHeader>{title}</LpHeader>
      {subtitle && <LpSub>{subtitle}</LpSub>}
      <LpScrollWrap>
        <LpArrow $dir="up" $visible={showUp}>
          ▲
        </LpArrow>
        <LpList ref={listRef} onScroll={updateArrows}>
          {children}
        </LpList>
        <LpArrow $dir="down" $visible={showDown}>
          ▼
        </LpArrow>
      </LpScrollWrap>
      <LpFooter>{footer}</LpFooter>
    </ListPanelWrap>
  );
};

export default ListPanel;
