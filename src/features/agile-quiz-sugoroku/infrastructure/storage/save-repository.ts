/**
 * セーブデータリポジトリ
 *
 * ゲーム途中の状態を保存・復元する。
 * バージョン不一致のデータは自動削除する。
 */
import { SaveState } from '../../domain/types';
import { StoragePort } from './storage-port';

const SAVE_KEY = 'aqs_save_state';

/** セーブデータのバージョン */
export const SAVE_VERSION = 1;

export class SaveRepository {
  constructor(private readonly storage: StoragePort) {}

  /** ゲーム状態を保存する */
  save(state: SaveState): void {
    this.storage.set(SAVE_KEY, state);
  }

  /** ゲーム状態を読み込む（バージョン不一致・破損データは削除して undefined を返す） */
  load(): SaveState | undefined {
    const data = this.storage.get<SaveState>(SAVE_KEY);
    if (!data) {
      // パース失敗等で get が undefined を返したが、生データは残っている場合は削除
      if (this.storage.has(SAVE_KEY)) {
        this.delete();
      }
      return undefined;
    }

    if (data.version !== SAVE_VERSION) {
      this.delete();
      return undefined;
    }

    return data;
  }

  /** セーブデータを削除する */
  delete(): void {
    this.storage.remove(SAVE_KEY);
  }

  /** セーブデータが存在するか確認する（生データレベルで判定） */
  exists(): boolean {
    return this.storage.has(SAVE_KEY);
  }
}
