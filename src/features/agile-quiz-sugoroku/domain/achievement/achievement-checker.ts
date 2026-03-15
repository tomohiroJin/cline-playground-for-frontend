/**
 * 実績システム
 *
 * 旧 achievements.ts から移動。
 * 15個の実績定義と判定ロジック
 */
import { AchievementDefinition, AchievementContext } from '../types';

/** 全チームタイプID */
const ALL_TEAM_TYPE_IDS = ['synergy', 'resilient', 'evolving', 'agile', 'struggling', 'forming'];

/** 深夜時間帯の範囲 */
const NIGHT_HOUR_START = 0;
const NIGHT_HOUR_END = 5;

/** 前半スプリントの割合 */
const FIRST_HALF_RATIO = 0.5;

/** 逆転劇の閾値 */
const COMEBACK_FIRST_HALF_THRESHOLD = 50;
const COMEBACK_FINAL_THRESHOLD = 70;

/** 継続系の閾値 */
const PLAY_COUNT_3 = 3;
const PLAY_COUNT_10 = 10;
const TOTAL_CORRECT_100 = 100;
const TOTAL_CORRECT_500 = 500;
const IMPROVEMENT_THRESHOLD = 10;

/** 実績定義一覧（20個） */
export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first-clear',
    name: 'はじめの一歩',
    description: '初回クリア',
    rarity: 'Bronze',
    check: () => true,
  },
  {
    id: 'perfect-sprint',
    name: 'パーフェクトスプリント',
    description: '1スプリント全問正解',
    rarity: 'Silver',
    check: (ctx) => ctx.sprintCorrectRates.some(rate => rate >= 100),
  },
  {
    id: 'all-correct',
    name: '完璧主義者',
    description: '全問正解でクリア',
    rarity: 'Gold',
    check: (ctx) => ctx.result.correctRate >= 100,
  },
  {
    id: 'combo-5',
    name: 'コンボマスター',
    description: '5コンボ達成',
    rarity: 'Bronze',
    check: (ctx) => ctx.result.maxCombo >= 5,
  },
  {
    id: 'combo-10',
    name: 'コンボレジェンド',
    description: '10コンボ達成',
    rarity: 'Gold',
    check: (ctx) => ctx.result.maxCombo >= 10,
  },
  {
    id: 'speed-demon',
    name: '高速回答',
    description: '平均回答時間3秒以内',
    rarity: 'Silver',
    check: (ctx) => ctx.result.averageSpeed <= 3,
  },
  {
    id: 'firefighter',
    name: '火消しの達人',
    description: '緊急対応3回成功',
    rarity: 'Silver',
    check: (ctx) => {
      const totalEmergencySuccess = ctx.result.sprintLog.reduce(
        (sum, s) => sum + s.emergencySuccessCount, 0
      );
      return totalEmergencySuccess >= 3;
    },
  },
  {
    id: 'zero-debt',
    name: 'クリーンコード',
    description: '負債0でクリア',
    rarity: 'Gold',
    check: (ctx) => ctx.result.debt <= 0,
  },
  {
    id: 'grade-s',
    name: 'Sランカー',
    description: 'Sグレード獲得',
    rarity: 'Gold',
    check: (ctx) => ctx.result.grade === 'S',
  },
  {
    id: 'all-types',
    name: 'タイプコレクター',
    description: '全6チームタイプ獲得',
    rarity: 'Platinum',
    check: (ctx) => {
      const collectedIds = new Set([
        ...ctx.history.map(h => h.teamTypeId),
        ctx.result.teamTypeId,
      ]);
      return ALL_TEAM_TYPE_IDS.every(id => collectedIds.has(id));
    },
  },
  {
    id: 'study-100',
    name: '学習の鬼',
    description: '勉強会モードで累計100問回答',
    rarity: 'Silver',
    // 勉強会モードのカウントは別途管理するため、ここでは常にfalse
    // 実際の判定はuseStudy側で行う
    check: () => false,
  },
  {
    id: 'genre-master',
    name: 'ジャンルマスター',
    description: '任意のジャンルで正答率100%',
    rarity: 'Gold',
    check: (ctx) => {
      const tags = ctx.result.tagStats;
      return Object.values(tags).some(
        stat => stat.total >= 3 && stat.correct === stat.total
      );
    },
  },
  {
    id: 'sprint-8',
    name: 'マラソンランナー',
    description: '8スプリントモードクリア',
    rarity: 'Silver',
    check: (ctx) => ctx.result.sprintLog.length >= 8,
  },
  {
    id: 'comeback',
    name: '逆転劇',
    description: '前半50%未満→最終70%以上',
    rarity: 'Gold',
    check: (ctx) => {
      const rates = ctx.sprintCorrectRates;
      if (rates.length < 2) return false;
      const halfIndex = Math.ceil(rates.length * FIRST_HALF_RATIO);
      const firstHalfAvg = rates.slice(0, halfIndex).reduce((a, b) => a + b, 0) / halfIndex;
      return firstHalfAvg < COMEBACK_FIRST_HALF_THRESHOLD && ctx.result.correctRate >= COMEBACK_FINAL_THRESHOLD;
    },
  },
  {
    id: 'night-owl',
    name: '深夜のエンジニア',
    description: '深夜0-5時にプレイ',
    rarity: 'Bronze',
    check: (ctx) => {
      const hour = ctx.now.getHours();
      return hour >= NIGHT_HOUR_START && hour < NIGHT_HOUR_END;
    },
  },
  // ── 継続系実績 ──
  {
    id: 'play-3',
    name: 'リピーター',
    description: '3回プレイ',
    rarity: 'Bronze',
    check: (ctx) => ctx.history.length + 1 >= PLAY_COUNT_3,
  },
  {
    id: 'play-10',
    name: '常連プレイヤー',
    description: '10回プレイ',
    rarity: 'Silver',
    check: (ctx) => ctx.history.length + 1 >= PLAY_COUNT_10,
  },
  {
    id: 'total-correct-100',
    name: '百問道場',
    description: '累計100問正解',
    rarity: 'Silver',
    check: (ctx) => {
      const pastTotal = ctx.history.reduce((sum, h) => sum + h.totalCorrect, 0);
      return pastTotal + ctx.result.totalCorrect >= TOTAL_CORRECT_100;
    },
  },
  {
    id: 'total-correct-500',
    name: '知識の泉',
    description: '累計500問正解',
    rarity: 'Gold',
    check: (ctx) => {
      const pastTotal = ctx.history.reduce((sum, h) => sum + h.totalCorrect, 0);
      return pastTotal + ctx.result.totalCorrect >= TOTAL_CORRECT_500;
    },
  },
  {
    id: 'improving',
    name: '成長の証',
    description: '過去3回の平均より正答率10%以上向上',
    rarity: 'Silver',
    check: (ctx) => {
      if (ctx.history.length < 3) return false;
      const recent3 = ctx.history.slice(-3);
      const avg = recent3.reduce((sum, h) => sum + h.correctRate, 0) / recent3.length;
      return ctx.result.correctRate >= avg + IMPROVEMENT_THRESHOLD;
    },
  },
];

/**
 * 現在のコンテキストで新たに達成された実績を返す
 */
export function checkAchievements(ctx: AchievementContext): AchievementDefinition[] {
  return ACHIEVEMENTS.filter(
    a => !ctx.unlockedIds.includes(a.id) && a.check(ctx)
  );
}
