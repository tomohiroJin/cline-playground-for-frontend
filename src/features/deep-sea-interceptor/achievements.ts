// ============================================================================
// Deep Sea Interceptor - 実績システム
// ============================================================================

import type { Achievement, PlayStats, SavedAchievementData } from './types';

const STORAGE_KEY = 'deep_sea_interceptor_achievements';

/** 実績定義（10個） */
export const AchievementList: Achievement[] = [
  {
    id: 'first_sortie',
    name: '初陣',
    description: '初めてゲームをプレイした',
    condition: () => true,
  },
  {
    id: 'mission_complete',
    name: '任務完了',
    description: '全5ステージをクリアした',
    condition: (s) => s.stagesCleared >= 5,
  },
  {
    id: 'combo_master',
    name: 'コンボマスター',
    description: '最大コンボ30以上を達成した',
    condition: (s) => s.maxCombo >= 30,
  },
  {
    id: 'graze_expert',
    name: 'グレイズの達人',
    description: 'グレイズを50回以上成功した',
    condition: (s) => s.grazeCount >= 50,
  },
  {
    id: 'no_damage',
    name: '無傷の深海兵',
    description: 'ライフを一度も失わずにクリアした',
    condition: (s) => s.livesLost === 0 && s.stagesCleared >= 5,
  },
  {
    id: 'score_hunter',
    name: 'スコアハンター',
    description: '50,000点以上を獲得した',
    condition: (s) => s.score >= 50000,
  },
  {
    id: 'speed_runner',
    name: 'スピードランナー',
    description: '15分以内にクリアした',
    condition: (s) => s.stagesCleared >= 5 && s.playTime <= 15 * 60 * 1000,
  },
  {
    id: 'abyss_survivor',
    name: '深淵の生還者',
    description: 'ABYSS難易度でクリアした',
    condition: (s) => s.difficulty === 'abyss' && s.stagesCleared >= 5,
  },
  {
    id: 'weapon_master',
    name: 'ウェポンマスター',
    description: 'バイオミサイルでクリアした',
    condition: (s) => s.weaponType === 'bioMissile' && s.stagesCleared >= 5,
  },
  {
    id: 'rank_s',
    name: 'Sランク達成',
    description: 'ランクSを獲得した',
    condition: (s) => s.rank === 'S',
  },
];

/** localStorage から実績データを読み込み */
export function loadAchievements(): SavedAchievementData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // パースエラーは無視
  }
  return { unlockedIds: [], lastUpdated: 0 };
}

/** localStorage に実績データを保存 */
export function saveAchievements(data: SavedAchievementData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ストレージエラーは無視
  }
}

/** 新規解除実績をチェック */
export function checkNewAchievements(
  stats: PlayStats,
  saved: SavedAchievementData
): Achievement[] {
  return AchievementList.filter(
    a => !saved.unlockedIds.includes(a.id) && a.condition(stats)
  );
}
