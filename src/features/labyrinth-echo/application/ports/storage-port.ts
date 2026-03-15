/**
 * 迷宮の残響 - StoragePort（ストレージポート）
 *
 * 依存性逆転の原則に基づくストレージインターフェース。
 * infrastructure層の実装詳細を隠蔽する。
 */
import type { MetaState } from '../../domain/models/meta-state';
import type { AudioSettings } from '../../domain/models/audio-settings';

export type { AudioSettings };

/** ストレージポート */
export interface StoragePort {
  /** メタデータを保存 */
  saveMeta(meta: MetaState): Promise<void>;
  /** メタデータを読み込み */
  loadMeta(): Promise<MetaState | null>;
  /** メタデータをリセット */
  resetMeta(): Promise<void>;
  /** オーディオ設定を保存 */
  saveAudioSettings(settings: AudioSettings): void;
  /** オーディオ設定を読み込み */
  loadAudioSettings(): AudioSettings;
}
