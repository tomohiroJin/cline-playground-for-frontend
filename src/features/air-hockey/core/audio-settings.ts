const STORAGE_KEY = 'air_hockey_audio_settings';

// 音量設定の型定義
export type AudioSettings = {
  bgmVolume: number;  // 0〜100
  seVolume: number;    // 0〜100
  muted: boolean;
};

// デフォルト設定
export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  bgmVolume: 50,
  seVolume: 50,
  muted: false,
};

/**
 * 音量設定を localStorage から読み込む
 */
export const loadAudioSettings = (): AudioSettings => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return { ...DEFAULT_AUDIO_SETTINGS };
    return JSON.parse(data) as AudioSettings;
  } catch {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }
};

/**
 * 音量設定を localStorage に保存する
 */
export const saveAudioSettings = (settings: AudioSettings): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};
