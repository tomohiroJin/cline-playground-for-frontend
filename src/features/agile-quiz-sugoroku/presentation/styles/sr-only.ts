/**
 * スクリーンリーダー専用（視覚的に隠す）スタイル。
 * aria-live 等のテキストを視覚に出さず AT にのみ伝えるために使う。
 */
import type { CSSProperties } from 'react';

/** 視覚的に隠しつつスクリーンリーダーには読ませる標準パターン */
export const SR_ONLY_STYLE: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: 0,
};
