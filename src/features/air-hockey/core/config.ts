import { FieldConfig, ItemType } from './types';

// 障害物座標は 600x1200 解像度基準（450x900 から 1.33x スケール）
export const FIELDS: readonly FieldConfig[] = [
  { id: 'classic', name: 'Original', goalSize: 160, color: '#00d4ff', obstacles: [] },
  { id: 'wide', name: 'Wide', goalSize: 240, color: '#00ff88', obstacles: [] },
  {
    id: 'pillars',
    name: 'Pillars',
    goalSize: 160,
    color: '#ff00ff',
    obstacles: [
      { x: 150, y: 400, r: 27 },
      { x: 450, y: 400, r: 27 },
      { x: 300, y: 600, r: 33 },
      { x: 150, y: 800, r: 27 },
      { x: 450, y: 800, r: 27 },
    ],
  },
  {
    id: 'zigzag',
    name: 'Zigzag',
    goalSize: 180,
    color: '#ffaa00',
    obstacles: [
      { x: 150, y: 360, r: 24 },
      { x: 450, y: 600, r: 24 },
      { x: 150, y: 840, r: 24 },
    ],
  },
  {
    id: 'fortress',
    name: 'Fortress',
    goalSize: 140,
    color: '#ff4488',
    destructible: true,
    obstacleHp: 3,
    obstacleRespawnMs: 5000,
    obstacles: [
      { x: 220, y: 120, r: 21 },
      { x: 380, y: 120, r: 21 },
      { x: 220, y: 1080, r: 21 },
      { x: 380, y: 1080, r: 21 },
    ],
  },
  {
    id: 'bastion',
    name: 'Bastion',
    goalSize: 160,
    color: '#ff8800',
    destructible: true,
    obstacleHp: 3,
    obstacleRespawnMs: 5000,
    obstacles: [
      // 上段の壁
      { x: 200, y: 320, r: 23 },
      { x: 400, y: 320, r: 23 },
      // 中央ブロック
      { x: 160, y: 600, r: 30 },
      { x: 300, y: 560, r: 24 },
      { x: 440, y: 600, r: 30 },
      // 下段の壁
      { x: 200, y: 880, r: 23 },
      { x: 400, y: 880, r: 23 },
    ],
  },
] as const;

export const ITEMS = [
  { id: 'split' as ItemType, name: 'Split', color: '#FF6B6B', icon: '◆' },
  { id: 'speed' as ItemType, name: 'Speed', color: '#4ECDC4', icon: '⚡' },
  { id: 'invisible' as ItemType, name: 'Hide', color: '#9B59B6', icon: '👻' },
  { id: 'shield' as ItemType, name: 'Shield', color: '#FFD700', icon: '🛡' },
  { id: 'magnet' as ItemType, name: 'Magnet', color: '#FF6B35', icon: '🧲' },
  { id: 'big' as ItemType, name: 'Big', color: '#00FF88', icon: '⬆' },
] as const;

/** ペアマッチ（2v2）用ゴールサイズ固定値 */
export const PAIR_MATCH_GOAL_SIZES: Record<string, number> = {
  classic: 240,
  pillars: 240,
  zigzag: 240,
  fortress: 240,
  bastion: 240,
  wide: 280,
};

export const DIFFICULTY_OPTIONS = ['easy', 'normal', 'hard'] as const;
export const DIFFICULTY_LABELS = { easy: 'ルーキー', normal: 'レギュラー', hard: 'エース' };
export const WIN_SCORE_OPTIONS = [3, 7, 15];
/** フリー対戦のデフォルト勝利スコア */
export const DEFAULT_WIN_SCORE = 3;
