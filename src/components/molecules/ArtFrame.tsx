import React from 'react';
import { FrameOuter, FrameMat } from './ArtFrame.styles';

export interface ArtFrameProps {
  /** 額装する中身（画像・盤面など） */
  readonly children: React.ReactNode;
  /** 外枠へ渡す追加クラス */
  readonly className?: string;
}

/** 作品を美術館の額縁＋マットで額装する共通コンポーネント */
export const ArtFrame: React.FC<ArtFrameProps> = ({ children, className }) => (
  <FrameOuter className={className} data-testid="art-frame">
    <FrameMat>{children}</FrameMat>
  </FrameOuter>
);
