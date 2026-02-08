/**
 * IPNE 音声設定モジュール
 *
 * 音量調整、ミュート機能、localStorage保存を管理
 */

import { AudioSettings, DEFAULT_AUDIO_SETTINGS } from '../types';
import { updateSoundSettings } from './soundEffect';
import { updateBgmSettings } from './bgm';
import { StorageProvider, createBrowserStorageProvider } from '../infrastructure/storage/StorageProvider';

/** localStorage保存用キー */
const STORAGE_KEY = 'ipne_audio_settings';

/** 現在の音声設定 */
let currentSettings: AudioSettings = { ...DEFAULT_AUDIO_SETTINGS };
let audio_storage_provider: StorageProvider = createBrowserStorageProvider();

/**
 * 音声設定モジュールのストレージ依存を差し替える
 * @param provider ストレージプロバイダ
 */
export function setAudioStorageProvider(provider: StorageProvider): void {
  audio_storage_provider = provider;
}

/**
 * 音声設定モジュールのストレージ依存をデフォルトに戻す
 */
export function resetAudioStorageProvider(): void {
  audio_storage_provider = createBrowserStorageProvider();
}

/**
 * localStorageから設定を読み込む
 * @returns 読み込んだ設定、または失敗時はundefined
 */
function loadFromStorage(): AudioSettings | undefined {
  try {
    const stored = audio_storage_provider.getItem(STORAGE_KEY);
    if (!stored) return undefined;

    const parsed = JSON.parse(stored);

    // 型の検証
    if (
      typeof parsed.masterVolume === 'number' &&
      typeof parsed.seVolume === 'number' &&
      typeof parsed.bgmVolume === 'number' &&
      typeof parsed.isMuted === 'boolean'
    ) {
      return {
        masterVolume: Math.max(0, Math.min(1, parsed.masterVolume)),
        seVolume: Math.max(0, Math.min(1, parsed.seVolume)),
        bgmVolume: Math.max(0, Math.min(1, parsed.bgmVolume)),
        isMuted: parsed.isMuted,
      };
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * localStorageに設定を保存する
 * @param settings 保存する設定
 */
function saveToStorage(settings: AudioSettings): void {
  try {
    audio_storage_provider.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage保存エラーは無視
  }
}

/**
 * 音声設定を初期化する
 * localStorageから読み込み、サウンドとBGMモジュールに反映する
 * @returns 初期化後の設定
 */
export function initializeAudioSettings(): AudioSettings {
  const stored = loadFromStorage();
  currentSettings = stored ?? { ...DEFAULT_AUDIO_SETTINGS };

  // 各モジュールに設定を反映
  updateSoundSettings(currentSettings);
  updateBgmSettings(currentSettings);

  return { ...currentSettings };
}

/**
 * マスター音量を設定する
 * @param volume 音量（0.0〜1.0）
 */
export function setMasterVolume(volume: number): void {
  const clampedVolume = Math.max(0, Math.min(1, volume));
  currentSettings = { ...currentSettings, masterVolume: clampedVolume };

  updateSoundSettings(currentSettings);
  updateBgmSettings(currentSettings);
  saveToStorage(currentSettings);
}

/**
 * SE音量を設定する
 * @param volume 音量（0.0〜1.0）
 */
export function setSeVolume(volume: number): void {
  const clampedVolume = Math.max(0, Math.min(1, volume));
  currentSettings = { ...currentSettings, seVolume: clampedVolume };

  updateSoundSettings(currentSettings);
  saveToStorage(currentSettings);
}

/**
 * BGM音量を設定する
 * @param volume 音量（0.0〜1.0）
 */
export function setBgmVolume(volume: number): void {
  const clampedVolume = Math.max(0, Math.min(1, volume));
  currentSettings = { ...currentSettings, bgmVolume: clampedVolume };

  updateBgmSettings(currentSettings);
  saveToStorage(currentSettings);
}

/**
 * ミュート状態を設定する
 * @param muted ミュート状態
 */
export function setMuted(muted: boolean): void {
  currentSettings = { ...currentSettings, isMuted: muted };

  updateSoundSettings(currentSettings);
  updateBgmSettings(currentSettings);
  saveToStorage(currentSettings);
}

/**
 * ミュート状態をトグルする
 * @returns 新しいミュート状態
 */
export function toggleMute(): boolean {
  const newMuted = !currentSettings.isMuted;
  setMuted(newMuted);
  return newMuted;
}

/**
 * 現在の音声設定を取得する
 * @returns 現在の音声設定
 */
export function getAudioSettings(): AudioSettings {
  return { ...currentSettings };
}

/**
 * 音声設定をデフォルトにリセットする
 */
export function resetAudioSettings(): void {
  currentSettings = { ...DEFAULT_AUDIO_SETTINGS };

  updateSoundSettings(currentSettings);
  updateBgmSettings(currentSettings);
  saveToStorage(currentSettings);
}

/**
 * 音声設定をクリアする（主にテスト用）
 * localStorageの設定も削除する
 */
export function clearAudioSettings(): void {
  currentSettings = { ...DEFAULT_AUDIO_SETTINGS };
  try {
    audio_storage_provider.removeItem(STORAGE_KEY);
  } catch {
    // エラーは無視
  }
}
