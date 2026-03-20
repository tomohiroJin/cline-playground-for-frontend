/**
 * 音声設定管理フック
 *
 * 責務:
 * - SoundSystem の遅延初期化
 * - AudioSettings の読込・保存・反映
 * - BGM の有効/無効管理
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import type { SoundSystem } from '../../core/types';
import { createSoundSystem } from '../../core/sound';
import { AudioSettings, loadAudioSettings, saveAudioSettings } from '../../core/audio-settings';

/** 音声管理フックの返り値 */
export type UseAudioManagerReturn = {
  audioSettings: AudioSettings;
  setAudioSettings: (settings: AudioSettings) => void;
  bgmEnabled: boolean;
  toggleBgm: () => void;
  getSound: () => SoundSystem;
};

export function useAudioManager(): UseAudioManagerReturn {
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(loadAudioSettings);
  const [bgmEnabled, setBgmEnabled] = useState(false);
  const soundRef = useRef<SoundSystem | null>(null);

  /** 音量設定をサウンドシステムに適用 */
  const applySettings = useCallback((sound: SoundSystem, settings: AudioSettings) => {
    sound.setBgmVolume(settings.bgmVolume);
    sound.setSeVolume(settings.seVolume);
    sound.setMuted(settings.muted);
  }, []);

  /** サウンドシステムを取得（遅延初期化） */
  const getSound = useCallback(() => {
    if (!soundRef.current) {
      soundRef.current = createSoundSystem();
      applySettings(soundRef.current, audioSettings);
    }
    return soundRef.current;
  }, [applySettings, audioSettings]);

  /** BGM のトグル */
  const toggleBgm = useCallback(() => {
    setBgmEnabled(prev => !prev);
  }, []);

  // 音量設定変更時の反映・永続化
  useEffect(() => {
    if (soundRef.current) {
      applySettings(soundRef.current, audioSettings);
    }
    saveAudioSettings(audioSettings);
  }, [audioSettings, applySettings]);

  return {
    audioSettings,
    setAudioSettings,
    bgmEnabled,
    toggleBgm,
    getSound,
  };
}
