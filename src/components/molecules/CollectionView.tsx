import React, { useMemo } from 'react';
import { Theme, PuzzleRecord } from '../../types/puzzle';
import { buildCollectionSummary } from '../../domain/collection/collection-service';
import ArtworkFrame from './ArtworkFrame';
import CuratorGoalBanner from './CuratorGoalBanner';
import {
  ViewContainer,
  ViewHeader,
  ViewTitle,
  BackButton,
  Room,
  RoomHeader,
  RoomName,
  RoomRate,
  Wall,
  LockedRoom,
} from './CollectionView.styles';

export interface CollectionViewProps {
  readonly themes: Theme[];
  readonly records: PuzzleRecord[];
  readonly totalClears: number;
  readonly onBack: () => void;
}

/** 収蔵目録の独立ビュー。展示室ごとに作品の壁を並べる */
const CollectionView: React.FC<CollectionViewProps> = ({
  themes,
  records,
  totalClears,
  onBack,
}) => {
  const summary = useMemo(
    () => buildCollectionSummary(themes, records, totalClears),
    [themes, records, totalClears]
  );

  return (
    <ViewContainer>
      <ViewHeader>
        <ViewTitle>収蔵目録</ViewTitle>
        <BackButton onClick={onBack}>戻る</BackButton>
      </ViewHeader>

      <CuratorGoalBanner goal={summary.goal} />

      {summary.rooms.map(room => (
        <Room key={room.themeId}>
          <RoomHeader>
            <RoomName>{room.name}</RoomName>
            {room.isUnlocked && (
              <RoomRate>{room.collectedCount} / {room.totalCount}</RoomRate>
            )}
          </RoomHeader>
          {room.isUnlocked ? (
            <Wall>
              {room.artworks.map(artwork => (
                <ArtworkFrame key={artwork.imageId} artwork={artwork} />
              ))}
            </Wall>
          ) : (
            <LockedRoom>{room.unlockHint}</LockedRoom>
          )}
        </Room>
      ))}
    </ViewContainer>
  );
};

export default CollectionView;
