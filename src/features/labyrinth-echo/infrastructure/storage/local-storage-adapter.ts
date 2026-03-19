/**
 * 迷宮の残響 - LocalStorageAdapter
 *
 * StoragePort の実装。localStorage を使ったメタデータ・オーディオ設定の永続化を担当する。
 * localStorage 利用不可時は静かに失敗し、アプリケーションの動作を妨げない。
 */
import type { StoragePort } from '../../application/ports/storage-port';
import type { MetaState } from '../../domain/models/meta-state';
import type { AudioSettings } from '../../domain/models/audio-settings';

/** メタデータの localStorage キー */
export const META_KEY = 'labyrinth-echo-save';

/** オーディオ設定の localStorage キー */
export const AUDIO_SETTINGS_KEY = 'labyrinth-echo-audio-settings';

/** デフォルトのオーディオ設定 */
export const DEFAULT_AUDIO_SETTINGS: Readonly<AudioSettings> = Object.freeze({
  bgmVolume: 0.5,
  sfxVolume: 0.7,
  bgmEnabled: true,
  sfxEnabled: true,
});

/**
 * MetaState のスキーマバリデーション
 *
 * 最低限の型チェックで破損データを弾く。
 */
const isValidMetaState = (data: unknown): data is MetaState => {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.runs === 'number' &&
    typeof d.escapes === 'number' &&
    typeof d.kp === 'number' &&
    typeof d.bestFloor === 'number' &&
    typeof d.totalEvents === 'number' &&
    typeof d.totalDeaths === 'number' &&
    Array.isArray(d.unlocked) &&
    Array.isArray(d.endings) &&
    Array.isArray(d.clearedDifficulties)
  );
};

/** localStorage を使った StoragePort 実装 */
export class LocalStorageAdapter implements StoragePort {
  /** メタデータを保存する */
  async saveMeta(meta: MetaState): Promise<void> {
    try {
      localStorage.setItem(META_KEY, JSON.stringify(meta));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[LocalStorageAdapter.saveMeta]', msg);
    }
  }

  /** メタデータを読み込む。データがない場合や破損している場合は null を返す */
  async loadMeta(): Promise<MetaState | null> {
    try {
      const raw = localStorage.getItem(META_KEY);
      if (raw === null) return null;

      const parsed: unknown = JSON.parse(raw);
      if (!isValidMetaState(parsed)) {
        console.error('[LocalStorageAdapter.loadMeta]', 'スキーマバリデーション失敗');
        return null;
      }
      return parsed;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[LocalStorageAdapter.loadMeta]', msg);
      return null;
    }
  }

  /** メタデータを削除する */
  async resetMeta(): Promise<void> {
    try {
      localStorage.removeItem(META_KEY);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[LocalStorageAdapter.resetMeta]', msg);
    }
  }

  /** オーディオ設定を保存する */
  saveAudioSettings(settings: AudioSettings): void {
    try {
      localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[LocalStorageAdapter.saveAudioSettings]', msg);
    }
  }

  /** オーディオ設定を読み込む。データがない場合はデフォルト値を返す */
  loadAudioSettings(): AudioSettings {
    try {
      const raw = localStorage.getItem(AUDIO_SETTINGS_KEY);
      if (!raw) return { ...DEFAULT_AUDIO_SETTINGS };
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null) {
        return { ...DEFAULT_AUDIO_SETTINGS };
      }
      const obj = parsed as Record<string, unknown>;
      // 各フィールドを個別に検証し、不正値・範囲外はデフォルト値でフォールバック
      const validated: AudioSettings = {
        bgmVolume:
          typeof obj.bgmVolume === 'number' &&
          obj.bgmVolume >= 0 &&
          obj.bgmVolume <= 1
            ? obj.bgmVolume
            : DEFAULT_AUDIO_SETTINGS.bgmVolume,
        sfxVolume:
          typeof obj.sfxVolume === 'number' &&
          obj.sfxVolume >= 0 &&
          obj.sfxVolume <= 1
            ? obj.sfxVolume
            : DEFAULT_AUDIO_SETTINGS.sfxVolume,
        bgmEnabled:
          typeof obj.bgmEnabled === 'boolean'
            ? obj.bgmEnabled
            : DEFAULT_AUDIO_SETTINGS.bgmEnabled,
        sfxEnabled:
          typeof obj.sfxEnabled === 'boolean'
            ? obj.sfxEnabled
            : DEFAULT_AUDIO_SETTINGS.sfxEnabled,
      };
      return validated;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[LocalStorageAdapter.loadAudioSettings]', msg);
      return { ...DEFAULT_AUDIO_SETTINGS };
    }
  }
}
