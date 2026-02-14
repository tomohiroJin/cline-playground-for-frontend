/**
 * タイトル画面コンポーネント
 */
import React from 'react';
import {
  Overlay,
  TitleContainer,
  StartButton,
  AudioSettingsButton,
  AudioSettingsPanel,
  AudioSettingsTitle,
  VolumeSliderContainer,
  VolumeLabel,
  VolumeName,
  VolumeValue,
  VolumeSlider,
  MuteButton,
  TapToStartMessage,
} from '../../../../pages/IpnePage.styles';
import { AudioSettings } from '../../types';
import titleBg from '../../../../assets/images/ipne_title_bg.webp';
import titleBgMobile from '../../../../assets/images/ipne_title_bg_mobile.webp';

/**
 * 音声設定コンポーネント（MVP5）
 */
export const AudioSettingsComponent: React.FC<{
  settings: AudioSettings;
  onMasterVolumeChange: (value: number) => void;
  onSeVolumeChange: (value: number) => void;
  onBgmVolumeChange: (value: number) => void;
  onToggleMute: () => void;
}> = ({ settings, onMasterVolumeChange, onSeVolumeChange, onBgmVolumeChange, onToggleMute }) => (
  <AudioSettingsPanel onClick={e => e.stopPropagation()}>
    <AudioSettingsTitle>音声設定</AudioSettingsTitle>

    <VolumeSliderContainer>
      <VolumeLabel>
        <VolumeName>マスター音量</VolumeName>
        <VolumeValue>{Math.round(settings.masterVolume * 100)}%</VolumeValue>
      </VolumeLabel>
      <VolumeSlider
        min={0}
        max={100}
        value={settings.masterVolume * 100}
        onChange={e => onMasterVolumeChange(Number(e.target.value) / 100)}
      />
    </VolumeSliderContainer>

    <VolumeSliderContainer>
      <VolumeLabel>
        <VolumeName>効果音</VolumeName>
        <VolumeValue>{Math.round(settings.seVolume * 100)}%</VolumeValue>
      </VolumeLabel>
      <VolumeSlider
        min={0}
        max={100}
        value={settings.seVolume * 100}
        onChange={e => onSeVolumeChange(Number(e.target.value) / 100)}
      />
    </VolumeSliderContainer>

    <VolumeSliderContainer>
      <VolumeLabel>
        <VolumeName>BGM</VolumeName>
        <VolumeValue>{Math.round(settings.bgmVolume * 100)}%</VolumeValue>
      </VolumeLabel>
      <VolumeSlider
        min={0}
        max={100}
        value={settings.bgmVolume * 100}
        onChange={e => onBgmVolumeChange(Number(e.target.value) / 100)}
      />
    </VolumeSliderContainer>

    <MuteButton $muted={settings.isMuted} onClick={onToggleMute}>
      {settings.isMuted ? '🔇 ミュート中' : '🔊 サウンドON'}
    </MuteButton>
  </AudioSettingsPanel>
);

/**
 * タイトル画面コンポーネント
 */
export const TitleScreen: React.FC<{
  onStart: () => void;
  audioSettings: AudioSettings;
  showAudioSettings: boolean;
  isAudioReady: boolean;
  onAudioSettingsToggle: () => void;
  onMasterVolumeChange: (value: number) => void;
  onSeVolumeChange: (value: number) => void;
  onBgmVolumeChange: (value: number) => void;
  onToggleMute: () => void;
  onTapToStart: () => void;
}> = ({
  onStart,
  audioSettings,
  showAudioSettings,
  isAudioReady,
  onAudioSettingsToggle,
  onMasterVolumeChange,
  onSeVolumeChange,
  onBgmVolumeChange,
  onToggleMute,
  onTapToStart,
}) => (
  <Overlay $bgImage={titleBg} $bgImageMobile={titleBgMobile} onClick={!isAudioReady ? onTapToStart : undefined}>
    <AudioSettingsButton onClick={onAudioSettingsToggle} aria-label="音声設定">
      {audioSettings.isMuted ? '🔇' : '🔊'}
    </AudioSettingsButton>
    {showAudioSettings && (
      <AudioSettingsComponent
        settings={audioSettings}
        onMasterVolumeChange={onMasterVolumeChange}
        onSeVolumeChange={onSeVolumeChange}
        onBgmVolumeChange={onBgmVolumeChange}
        onToggleMute={onToggleMute}
      />
    )}
    <TitleContainer>
      {isAudioReady ? (
        <StartButton
          onClick={onStart}
          aria-label="ゲームを開始"
          style={{ marginTop: '60vh' }}
        >
          ゲームを開始
        </StartButton>
      ) : (
        <TapToStartMessage>
          タップしてゲームを開始
        </TapToStartMessage>
      )}
    </TitleContainer>
  </Overlay>
);
