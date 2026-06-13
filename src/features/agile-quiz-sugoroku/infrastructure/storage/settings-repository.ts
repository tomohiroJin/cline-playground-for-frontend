/**
 * 設定リポジトリ
 *
 * サウンド ON/OFF などのアプリ設定を永続化する。
 */
import { AppSettings, DEFAULT_APP_SETTINGS } from '../../domain/types';
import { StoragePort } from './storage-port';

const SETTINGS_KEY = 'aqs_settings';

export class SettingsRepository {
  constructor(private readonly storage: StoragePort) {}

  /** 設定を読み込む（壊れている/未保存ならデフォルト） */
  load(): AppSettings {
    const data = this.storage.get<Partial<AppSettings>>(SETTINGS_KEY);
    if (!data || typeof data !== 'object') {
      return { ...DEFAULT_APP_SETTINGS };
    }
    return {
      soundEnabled:
        typeof data.soundEnabled === 'boolean'
          ? data.soundEnabled
          : DEFAULT_APP_SETTINGS.soundEnabled,
    };
  }

  /** 設定を保存する */
  save(settings: AppSettings): void {
    this.storage.set(SETTINGS_KEY, settings);
  }

  /** soundEnabled だけ更新する */
  setSoundEnabled(enabled: boolean): void {
    const current = this.load();
    this.save({ ...current, soundEnabled: enabled });
  }
}
