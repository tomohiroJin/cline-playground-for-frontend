// @ts-nocheck
/**
 * 迷宮の残響 - ページレイアウトコンポーネント
 */
import { CSS, PAGE_STYLE } from '../styles';

export const Page = ({ children, particles }) => (
  <div style={PAGE_STYLE}><style>{CSS}</style>{particles}{children}</div>
);
