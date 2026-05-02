/**
 * Canvas 描画内容を aria-live で DOM 同期し、スクリーンリーダーに露出する
 *
 * Canvas の中で起きているゲーム状態の変化（スコア / トースト / 勝敗）を
 * 支援技術に伝えるためのライブリージョン。
 *
 * 注意（Codex P2-5）: role="status" を付けると暗黙に polite になるため、
 * assertive も流せるよう role は付けず aria-live のみで制御する。
 */
import React from 'react';
import styled from 'styled-components';

const VisuallyHidden = styled.div`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

type Props = {
  message: string;
  politeness?: 'polite' | 'assertive';
};

export const CanvasLiveRegion: React.FC<Props> = ({ message, politeness = 'polite' }) => (
  <VisuallyHidden aria-live={politeness} aria-atomic="true">
    {message}
  </VisuallyHidden>
);
