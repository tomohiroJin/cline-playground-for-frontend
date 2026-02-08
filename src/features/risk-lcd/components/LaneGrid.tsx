import React from 'react';
import type { GameState, ArtKey } from '../types';
import type { SegState } from '../hooks';
import { ROWS, LANES } from '../constants';
import CharacterArt from './CharacterArt';
import {
  GameField,
  LaneCol,
  LaneHeader,
  MultLabel,
  LaneLabel,
  SegsCol,
  Segment,
  BeatBarBg,
  BeatBarFill,
  PopText,
  FlashOverlay,
} from './styles';

interface LaneInfo {
  mult: number;
  restricted: boolean;
  shelter: boolean;
  forecast: string;
}

interface Props {
  game: GameState;
  segments: (SegState | null)[][];
  segTexts: string[][];
  laneArt: ArtKey[];
  beatAnimating: boolean;
  shaking: boolean;
  flash: boolean;
  popText: { lane: number; text: string; id: number } | null;
  getLaneInfo: (lane: number) => LaneInfo;
}

// 3レーン × 8セグメントのグリッド表示
const LaneGrid: React.FC<Props> = ({
  game,
  segments,
  segTexts,
  laneArt,
  beatAnimating,
  shaking,
  flash,
  popText,
  getLaneInfo,
}) => (
  <>
    <GameField $shaking={shaking}>
      {LANES.map((lane) => {
        const info = getLaneInfo(lane);
        const multText = info.restricted
          ? '──'
          : info.shelter
            ? '避'
            : '×' + info.mult;

        return (
          <LaneCol key={lane} $shelter={info.shelter}>
            <LaneHeader>
              <MultLabel
                $here={lane === game.lane}
                $restricted={info.restricted}
                $shelter={info.shelter}
              >
                {multText}
              </MultLabel>
              <LaneLabel>{info.forecast}</LaneLabel>
            </LaneHeader>
            <SegsCol>
              {Array.from({ length: ROWS }, (_, r) => (
                <Segment
                  key={r}
                  $state={segments[lane]?.[r] ?? undefined}
                >
                  {segTexts[lane]?.[r] ?? '╳'}
                </Segment>
              ))}
            </SegsCol>
            <BeatBarBg>
              <BeatBarFill $visible={beatAnimating} $animate={beatAnimating} />
            </BeatBarBg>
            <CharacterArt
              artKey={laneArt[lane]}
              frame={game.artFrame}
              here={lane === game.lane}
              danger={
                laneArt[lane] === 'danger' && lane === game.lane
              }
              hit={!game.alive && lane === game.lane}
            />
            {popText && popText.lane === lane && (
              <PopText key={popText.id}>{popText.text}</PopText>
            )}
          </LaneCol>
        );
      })}
      <FlashOverlay $active={flash} />
    </GameField>
  </>
);

export default LaneGrid;
