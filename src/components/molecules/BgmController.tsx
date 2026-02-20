import React from 'react';
import { BgmTrack } from '../../types/puzzle';
import {
  BgmContainer,
  BgmRow,
  TrackName,
  BgmButton,
  VolumeRow,
  VolumeLabel,
  VolumeSlider,
  VolumeValue,
} from './BgmController.styles';

export interface BgmControllerProps {
  currentTrack: BgmTrack;
  isPlaying: boolean;
  volume: number;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onVolumeChange: (volume: number) => void;
}

const BgmController: React.FC<BgmControllerProps> = ({
  currentTrack,
  isPlaying,
  volume,
  onTogglePlay,
  onNextTrack,
  onPrevTrack,
  onVolumeChange,
}) => {
  return (
    <BgmContainer>
      <BgmRow>
        <TrackName>🎵 {currentTrack.name}</TrackName>
        <BgmButton onClick={onPrevTrack} title="前のトラック">◀</BgmButton>
        <BgmButton onClick={onNextTrack} title="次のトラック">▶</BgmButton>
        <BgmButton onClick={onTogglePlay} title={isPlaying ? '停止' : '再生'}>
          {isPlaying ? '⏸' : '⏯'}
        </BgmButton>
      </BgmRow>
      <VolumeRow>
        <VolumeLabel>🔊</VolumeLabel>
        <VolumeSlider
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={e => onVolumeChange(Number(e.target.value))}
          aria-label="BGM音量"
        />
        <VolumeValue>{volume}%</VolumeValue>
      </VolumeRow>
    </BgmContainer>
  );
};

export default BgmController;
