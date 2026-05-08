// キャンペーン進捗の永続化ポート（インターフェース）
//
// 実装は infrastructure/storage/campaign-progress-repository.ts。
// テストではインメモリ実装に差し替え可能。

import type { CampaignProgress } from '../../domain/race/campaign-progress';

export interface CampaignProgressPort {
  /** 現在の進捗を読み込む。未保存ならデフォルト進捗 */
  load(): CampaignProgress;
  /** 進捗を保存 */
  save(progress: CampaignProgress): void;
  /** 進捗を消去（RESET PROGRESS 動作） */
  clear(): void;
}
