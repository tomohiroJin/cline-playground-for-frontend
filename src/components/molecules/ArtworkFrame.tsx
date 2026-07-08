import React from 'react';
import { ArtFrame } from './ArtFrame';
import { ArtworkStatus } from '../../domain/collection/types';
import { FrameFigure, Thumb, EmptySlot, Caption, Rank } from './ArtworkFrame.styles';

export interface ArtworkFrameProps {
  readonly artwork: ArtworkStatus;
}

/** 収蔵目録の作品1点。収蔵済みは額装画像＋鑑定評価、未収蔵は空フレーム */
const ArtworkFrame: React.FC<ArtworkFrameProps> = ({ artwork }) => (
  <FrameFigure>
    <ArtFrame>
      {artwork.isCollected ? (
        <Thumb src={`/images/default/${artwork.filename}`} alt={artwork.title} />
      ) : (
        <EmptySlot>未収蔵</EmptySlot>
      )}
    </ArtFrame>
    <Caption>
      {artwork.isCollected && artwork.bestRank ? (
        <Rank>{artwork.bestRank}</Rank>
      ) : (
        artwork.title
      )}
    </Caption>
  </FrameFigure>
);

export default ArtworkFrame;
