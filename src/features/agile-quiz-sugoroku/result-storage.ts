/**
 * Agile Quiz Sugoroku - ゲーム結果の localStorage 保存
 */
import { SavedGameResult } from './types';

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

/** ゲーム結果を保存 */
export function saveGameResult(result: SavedGameResult): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  } catch {
    // localStorage が利用できない場合は無視
  }
}

/** ゲーム結果を読み込み */
export function loadGameResult(): SavedGameResult | undefined {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return undefined;
    // 自アプリが保存した JSON を読み戻すため SavedGameResult として解釈
    const parsed: SavedGameResult = JSON.parse(data);
    return migrateResult(parsed);
  } catch {
    return undefined;
  }
}

/** ゲーム結果を削除 */
export function clearGameResult(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage が利用できない場合は無視
  }
}
