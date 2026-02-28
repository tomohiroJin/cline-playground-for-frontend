/**
 * 迷宮の残響 - セクションコンポーネント
 *
 * ダークパネルセクション（オプショナルヘッダー付き）。
 * 10以上のインラインパネルパターンを置換する。
 */
import type { CSSProperties, ReactNode } from 'react';

interface SectionProps {
  label?: string;
  color?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export const Section = ({ label, color = "var(--dim)", style, children }: SectionProps) => (
  <div className="sec" style={style}>
    {label && <div className="sec-hd" style={{ color }}>{`── ${label} ──`}</div>}
    {children}
  </div>
);
