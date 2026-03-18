/**
 * ゲーム結果リポジトリ
 *
 * 最後のゲーム結果を保存・読込する。
 * 旧エンジニアタイプデータの自動マイグレーション機能付き。
 */
import { SavedGameResult } from '../../domain/types';
import { StoragePort } from './storage-port';

const STORAGE_KEY = 'aqs_last_result';

/** 旧エンジニアタイプID → チームタイプIDのマッピング */
const ENGINEER_TO_TEAM_ID: Record<string, string> = {
  stable: 'synergy',
  firefighter: 'resilient',
  growth: 'evolving',
  speed: 'agile',
  debt: 'struggling',
  default: 'forming',
};

/** 旧エンジニアタイプ名 → チームタイプ名のマッピング */
const ENGINEER_TO_TEAM_NAME: Record<string, string> = {
  '安定運用型エンジニア': 'シナジーチーム',
  '火消し職人エンジニア': 'レジリエントチーム',
  '成長曲線型エンジニア': '成長するチーム',
  '高速レスポンスエンジニア': 'アジャイルチーム',
  '技術的負債と共に生きる人': 'もがくチーム',
  '無難に回すエンジニア': '結成したてのチーム',
};

/** 後方互換性: 旧フォーマットの teamTypeId/Name を補完 */
function migrateResult(result: SavedGameResult): SavedGameResult {
  if (!result.teamTypeId && result.engineerTypeId) {
    return {
      ...result,
      teamTypeId: ENGINEER_TO_TEAM_ID[result.engineerTypeId] ?? 'forming',
      teamTypeName: ENGINEER_TO_TEAM_NAME[result.engineerTypeName ?? ''] ?? '結成したてのチーム',
    };
  }
  return result;
}

export class GameResultRepository {
  constructor(private readonly storage: StoragePort) {}

  /** ゲーム結果を保存する */
  save(result: SavedGameResult): void {
    this.storage.set(STORAGE_KEY, result);
  }

  /** ゲーム結果を読み込む（旧フォーマットは自動マイグレーション） */
  load(): SavedGameResult | undefined {
    const data = this.storage.get<SavedGameResult>(STORAGE_KEY);
    if (!data) return undefined;
    return migrateResult(data);
  }

  /** ゲーム結果を削除する */
  clear(): void {
    this.storage.remove(STORAGE_KEY);
  }
}
