/**
 * 灰燼の城壁 - 行動ログの localStorage 実装
 *
 * ラン横断でイベントを追記保存する。読み込み失敗時は空ログに
 * フォールバックし、書き込み失敗はゲーム進行を止めない（記録より進行優先）。
 */
import type {
  PlayLogEventBody,
  PlayLogExport,
  PlayLogPort,
} from '../../application/ports/play-log-port';

export const PLAY_LOG_STORAGE_KEY = 'ashen-rampart:play-log';

const SCHEMA_VERSION = 1;

const emptyExport = (): PlayLogExport => ({ version: SCHEMA_VERSION, events: [] });

const isPlayLogExport = (value: unknown): value is PlayLogExport =>
  typeof value === 'object' &&
  value !== null &&
  'version' in value &&
  'events' in value &&
  Array.isArray((value as { events: unknown }).events);

export class LocalStoragePlayLog implements PlayLogPort {
  record(event: PlayLogEventBody): void {
    const current = this.exportAll();
    current.events.push({ ...event, at: Date.now() });
    try {
      localStorage.setItem(PLAY_LOG_STORAGE_KEY, JSON.stringify(current));
    } catch (e) {
      console.error('行動ログの保存に失敗しました', e);
    }
  }

  exportAll(): PlayLogExport {
    try {
      const raw = localStorage.getItem(PLAY_LOG_STORAGE_KEY);
      if (raw === null) return emptyExport();
      const parsed: unknown = JSON.parse(raw);
      return isPlayLogExport(parsed) ? parsed : emptyExport();
    } catch (e) {
      console.error('行動ログの読み込みに失敗しました', e);
      return emptyExport();
    }
  }
}
