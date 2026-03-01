/**
 * 迷宮の残響 - バッジコンポーネント
 *
 * コレクションバッジ — ロック/アンロック状態のアイテムをグリッド表示。
 */
import type { CSSProperties } from 'react';

interface BadgeProps {
  got: boolean;
  color: string;
  label: string;
  hiddenLabel?: string;
  style?: CSSProperties;
}

export const Badge = ({ got, color, label, hiddenLabel = "???", style }: BadgeProps) => (
  <span className="badge" style={{
    background: got ? `${color}15` : "rgba(30,30,50,.5)",
    border: `1px solid ${got ? `${color}30` : "rgba(40,40,60,.2)"}`,
    color: got ? color : "#353555", ...style,
  }}>{got ? label : hiddenLabel}</span>
);
