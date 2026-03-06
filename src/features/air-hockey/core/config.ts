import { FieldConfig, ItemType } from './types';

// 障害物座標は 450x900 解像度基準（旧 standard の x1.5 スケール）
export const FIELDS: readonly FieldConfig[] = [
  { id: 'classic', name: 'Original', goalSize: 120, color: '#00d4ff', obstacles: [] },
  { id: 'wide', name: 'Wide', goalSize: 180, color: '#00ff88', obstacles: [] },
  {
    id: 'pillars',
    name: 'Pillars',
    goalSize: 120,
    color: '#ff00ff',
    obstacles: [
      { x: 113, y: 300, r: 27 },
      { x: 338, y: 300, r: 27 },
      { x: 225, y: 450, r: 33 },
      { x: 113, y: 600, r: 27 },
      { x: 338, y: 600, r: 27 },
    ],
  },
  {
    id: 'zigzag',
    name: 'Zigzag',
    goalSize: 135,
    color: '#ffaa00',
    obstacles: [
      { x: 113, y: 270, r: 24 },
      { x: 338, y: 450, r: 24 },
      { x: 113, y: 630, r: 24 },
    ],
  },
  {
    id: 'fortress',
    name: 'Fortress',
    goalSize: 105,
    color: '#ff4488',
    destructible: true,
    obstacleHp: 3,
    obstacleRespawnMs: 5000,
    obstacles: [
      { x: 165, y: 90, r: 21 },
      { x: 285, y: 90, r: 21 },
      { x: 165, y: 810, r: 21 },
      { x: 285, y: 810, r: 21 },
    ],
  },
  {
    id: 'bastion',
    name: 'Bastion',
    goalSize: 120,
    color: '#ff8800',
    destructible: true,
    obstacleHp: 3,
    obstacleRespawnMs: 5000,
    obstacles: [
      // 上段の壁
      { x: 150, y: 240, r: 23 },
      { x: 300, y: 240, r: 23 },
      // 中央ブロック
      { x: 120, y: 450, r: 30 },
      { x: 225, y: 420, r: 24 },
      { x: 330, y: 450, r: 30 },
      // 下段の壁
      { x: 150, y: 660, r: 23 },
      { x: 300, y: 660, r: 23 },
    ],
  },
] as const;

export const ITEMS = [
  { id: 'split' as ItemType, name: 'Split', color: '#FF6B6B', icon: '◆' },
  { id: 'speed' as ItemType, name: 'Speed', color: '#4ECDC4', icon: '⚡' },
  { id: 'invisible' as ItemType, name: 'Hide', color: '#9B59B6', icon: '👻' },
] as const;

export const DIFFICULTY_OPTIONS = ['easy', 'normal', 'hard'] as const;
export const DIFFICULTY_LABELS = { easy: 'Easy', normal: 'Normal', hard: 'Hard' };
export const WIN_SCORE_OPTIONS = [3, 7, 15];
