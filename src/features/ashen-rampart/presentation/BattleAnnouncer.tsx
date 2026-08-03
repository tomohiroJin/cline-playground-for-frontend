/**
 * 灰燼の城壁 - 戦況の読み上げ
 *
 * **流す基準は要素名ではなく性質で決める**: 「頻度が低く、かつ
 * 取り返しがつかない」出来事のみ。具体的には漏れとウェーブ境界。
 * 撃破・射撃は頻度が高く、読み上げが詰まってかえって情報が失われる。
 */
import React from 'react';
import styled from 'styled-components';

/** 視覚的には隠すが支援技術からは読める */
const VisuallyHidden = styled.p`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
`;

interface Props {
  message?: string;
}

export const BattleAnnouncer: React.FC<Props> = ({ message }) => (
  <VisuallyHidden role="status" aria-live="polite">
    {message ?? ''}
  </VisuallyHidden>
);
