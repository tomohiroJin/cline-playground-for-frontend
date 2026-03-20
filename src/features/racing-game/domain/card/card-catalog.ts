// カードマスターデータ（15枚）

import type { Card } from './types';

/** カードマスターデータの深いフリーズ */
const freezeCards = (cards: Card[]): readonly Card[] =>
  Object.freeze(cards.map(c => Object.freeze({ ...c, effect: Object.freeze(c.effect) })));

export const ALL_CARDS: readonly Card[] = freezeCards([
  // スピード系（5枚）
  { id: 'SPD_01', name: 'ニトロブースト', category: 'speed', rarity: 'R', description: '最高速度 +15%（1ラップ）', effect: { speedMultiplier: 1.15 }, icon: '🚀' },
  { id: 'SPD_02', name: 'ターボチャージ', category: 'speed', rarity: 'SR', description: '加速力 +25%（1ラップ）', effect: { accelMultiplier: 1.25 }, icon: '⚡' },
  { id: 'SPD_03', name: 'スリップストリーム', category: 'speed', rarity: 'R', description: '相手の後方で速度 +10%', effect: { speedMultiplier: 1.10, specialType: 'slipstream' }, icon: '💨' },
  { id: 'SPD_04', name: 'ロケットスタート', category: 'speed', rarity: 'SR', description: 'ラップ開始直後3秒間、速度 +30%', effect: { speedMultiplier: 1.30, duration: 3 }, icon: '🔥' },
  { id: 'SPD_05', name: 'オーバードライブ', category: 'speed', rarity: 'SSR', description: '最高速度 +10%、加速力 +10%、ドリフトブースト +20%', effect: { speedMultiplier: 1.10, accelMultiplier: 1.10, driftBoostMultiplier: 1.20 }, icon: '⭐' },
  // ハンドリング系（4枚）
  { id: 'HDL_01', name: 'グリップタイヤ', category: 'handling', rarity: 'R', description: '旋回速度 +20%', effect: { turnMultiplier: 1.20 }, icon: '🛞' },
  { id: 'HDL_02', name: 'ドリフトマスター', category: 'handling', rarity: 'SR', description: 'ドリフトブースト +50%、ドリフト最低速度条件 -20%', effect: { driftBoostMultiplier: 1.50, specialType: 'drift_master' }, icon: '🏎️' },
  { id: 'HDL_03', name: 'エアロパーツ', category: 'handling', rarity: 'R', description: 'コーナリング中の減速 -30%', effect: { specialType: 'aero' }, icon: '🪶' },
  { id: 'HDL_04', name: 'フルチューン', category: 'handling', rarity: 'SSR', description: '旋回速度 +15%、ドリフトブースト +30%、壁減速 -20%', effect: { turnMultiplier: 1.15, driftBoostMultiplier: 1.30, wallDamageMultiplier: 0.80 }, icon: '🔧' },
  // 防御系（3枚）
  { id: 'DEF_01', name: 'バンパーガード', category: 'defense', rarity: 'R', description: '壁ヒット減速を50%軽減', effect: { wallDamageMultiplier: 0.50 }, icon: '🛡️' },
  { id: 'DEF_02', name: 'シールド', category: 'defense', rarity: 'SR', description: '次の1回の衝突を完全無効化', effect: { shieldCount: 1 }, icon: '🔰' },
  { id: 'DEF_03', name: 'リカバリーブースト', category: 'defense', rarity: 'R', description: '壁ヒット後に小ブースト', effect: { specialType: 'recovery_boost' }, icon: '💫' },
  // 特殊系（2枚）
  { id: 'SPC_01', name: 'HEAT チャージャー', category: 'special', rarity: 'SR', description: 'HEAT 蓄積速度 ×2', effect: { heatGainMultiplier: 2.0 }, icon: '🌡️' },
  { id: 'SPC_03', name: 'ワイルドカード', category: 'special', rarity: 'SSR', description: 'ランダムに2枚のカード効果を同時発動', effect: { specialType: 'wildcard' }, icon: '🃏' },
]);
