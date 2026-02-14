// @ts-nocheck
/**
 * 迷宮の残響 - セクションコンポーネント
 *
 * ダークパネルセクション（オプショナルヘッダー付き）。
 * 10以上のインラインパネルパターンを置換する。
 */
export const Section = ({ label, color = "var(--dim)", style, children }) => (
  <div className="sec" style={style}>
    {label && <div className="sec-hd" style={{ color }}>{`── ${label} ──`}</div>}
    {children}
  </div>
);
