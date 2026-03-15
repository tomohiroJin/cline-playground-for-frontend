/**
 * ゲーム音声管理フック
 * BGM/SE 管理・画面ごとの切り替え
 */
import { useState, useEffect, useCallback } from 'react';
import { ScreenState, ScreenStateValue } from '../../index';
import { AudioSettings, StageNumber } from '../../types';
import {
  enableAudio,
  initializeAudioSettings,
  getAudioSettings,
  setMasterVolume,
  setSeVolume,
  setBgmVolume,
  toggleMute as toggleMuteAudio,
  playTitleBgm,
  playClearJingle,
  playGameOverJingle,
  stopBgm,
  playGameClearSound,
  playGameOverSound,
  playStageGameBgm,
} from '../../audio';

/**
 * ゲーム音声管理フック
 */
export function useGameAudio(screen: ScreenStateValue, currentStage: StageNumber) {
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => initializeAudioSettings());
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);

  const handleEnableAudio = useCallback(async () => {
    const success = await enableAudio();
    if (success) {
      setIsAudioReady(true);
      if (screen === ScreenState.TITLE) {
        playTitleBgm();
      }
    }
  }, [screen]);

  const handleAudioSettingsToggle = useCallback(() => {
    setShowAudioSettings(prev => !prev);
  }, []);

  const handleMasterVolumeChange = useCallback((value: number) => {
    setMasterVolume(value);
    setAudioSettings(getAudioSettings());
  }, []);

  const handleSeVolumeChange = useCallback((value: number) => {
    setSeVolume(value);
    setAudioSettings(getAudioSettings());
  }, []);

  const handleBgmVolumeChange = useCallback((value: number) => {
    setBgmVolume(value);
    setAudioSettings(getAudioSettings());
  }, []);

  const handleToggleMute = useCallback(() => {
    toggleMuteAudio();
    setAudioSettings(getAudioSettings());
  }, []);

  // 画面遷移時のBGM切り替え
  useEffect(() => {
    if (!isAudioReady) return;

    switch (screen) {
      case ScreenState.TITLE:
        playTitleBgm();
        break;
      case ScreenState.GAME:
        playStageGameBgm(currentStage);
        break;
      case ScreenState.STAGE_CLEAR:
        stopBgm();
        playClearJingle();
        break;
      case ScreenState.FINAL_CLEAR:
        stopBgm();
        playClearJingle();
        playGameClearSound();
        break;
      case ScreenState.STAGE_STORY:
      case ScreenState.STAGE_REWARD:
        stopBgm();
        break;
      case ScreenState.DYING:
        stopBgm();
        break;
      case ScreenState.GAME_OVER:
        playGameOverJingle();
        playGameOverSound();
        break;
      default:
        break;
    }
    return () => { stopBgm(); };
  }, [screen, isAudioReady, currentStage]);

  return {
    audioSettings,
    showAudioSettings,
    isAudioReady,
    handleEnableAudio,
    handleAudioSettingsToggle,
    handleMasterVolumeChange,
    handleSeVolumeChange,
    handleBgmVolumeChange,
    handleToggleMute,
  };
}
