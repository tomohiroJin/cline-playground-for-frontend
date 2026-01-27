export type ControlScheme = 'keyboard' | 'mouse' | 'touch';

export interface GameSettings {
  masterVolume: number; // 0-100
  sfxVolume: number; // 0-100
  bgmVolume: number; // 0-100
  controls: ControlScheme;
  showFps: boolean;
  reducedMotion: boolean;
}

const SETTINGS_KEY = 'game-platform-settings';

const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 100,
  sfxVolume: 100,
  bgmVolume: 100,
  controls: 'keyboard',
  showFps: false,
  reducedMotion: false,
};

export const loadSettings = (): GameSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const json = localStorage.getItem(SETTINGS_KEY);
    if (!json) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(json) };
  } catch (e) {
    console.error('Failed to load settings:', e);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: GameSettings): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
};
