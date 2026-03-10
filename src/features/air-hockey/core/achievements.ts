import { MatchStats, Difficulty } from './types';
import { FIELDS } from './config';

const STORAGE_KEY = 'air_hockey_achievements';

// 実績の型定義
export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

// 実績チェック時に渡すコンテキスト
export type AchievementCheckContext = {
  winner: 'player' | 'cpu' | string | null;
  scores: { p: number; c: number };
  difficulty: Difficulty;
  fieldId: string;
  stats: MatchStats;
  winStreak: number;
  maxScoreDiff: number;
  fieldsWon: string[];
  itemTypesUsed: string[];
};

// 全実績定義
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_win', name: '初勝利', description: '初めて CPU に勝利', icon: '🏆' },
  { id: 'perfect', name: 'パーフェクト', description: '無失点で勝利', icon: '✨' },
  { id: 'streak_3', name: '3連勝', description: '3回連続で勝利', icon: '🔥' },
  { id: 'streak_5', name: '5連勝', description: '5回連続で勝利', icon: '💥' },
  { id: 'hard_win', name: 'ハードモード制覇', description: 'Hard で勝利', icon: '💀' },
  { id: 'all_fields', name: 'フィールドマスター', description: '全フィールドで勝利', icon: '🗺' },
  { id: 'comeback', name: '大逆転', description: '3点差以上から逆転勝利', icon: '🔄' },
  { id: 'speed_demon', name: 'スピードデーモン', description: 'パック速度 15 以上を記録', icon: '⚡' },
  { id: 'item_master', name: 'アイテムコレクター', description: '全種類のアイテムを使用', icon: '🎒' },
];

const ALL_FIELD_IDS = FIELDS.map(f => f.id);
const ALL_ITEM_TYPES = ['split', 'speed', 'invisible', 'shield', 'magnet', 'big'];
const SPEED_THRESHOLD = 15;
const COMEBACK_THRESHOLD = 3;

// 各実績の判定関数
type AchievementChecker = (ctx: AchievementCheckContext) => boolean;

const checkers: Record<string, AchievementChecker> = {
  first_win: (ctx) => ctx.winner === 'player',
  perfect: (ctx) => ctx.winner === 'player' && ctx.scores.c === 0,
  streak_3: (ctx) => ctx.winner === 'player' && ctx.winStreak >= 3,
  streak_5: (ctx) => ctx.winner === 'player' && ctx.winStreak >= 5,
  hard_win: (ctx) => ctx.winner === 'player' && ctx.difficulty === 'hard',
  all_fields: (ctx) => ctx.winner === 'player' && ALL_FIELD_IDS.every(id => ctx.fieldsWon.includes(id)),
  comeback: (ctx) => ctx.winner === 'player' && ctx.maxScoreDiff >= COMEBACK_THRESHOLD,
  speed_demon: (ctx) => ctx.stats.maxPuckSpeed >= SPEED_THRESHOLD,
  item_master: (ctx) => ALL_ITEM_TYPES.every(type => ctx.itemTypesUsed.includes(type)),
};

/**
 * 実績をチェックし、新たに解除された実績を返す
 */
export const checkAchievements = (
  ctx: AchievementCheckContext,
  alreadyUnlocked: string[],
): Achievement[] => {
  return ACHIEVEMENTS.filter(a => {
    if (alreadyUnlocked.includes(a.id)) return false;
    const checker = checkers[a.id];
    return checker ? checker(ctx) : false;
  });
};

/**
 * 解除済み実績の ID リストを localStorage から読み込む
 */
export const getUnlockedAchievements = (): string[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as string[];
  } catch {
    return [];
  }
};

/**
 * 解除済み実績の ID リストを localStorage に保存する
 */
export const saveUnlockedAchievements = (ids: string[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
};

/**
 * 実績をすべてクリアする
 */
export const clearAchievements = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
