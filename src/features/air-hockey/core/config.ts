import { FieldConfig, ItemType } from './types';

export const FIELDS: readonly FieldConfig[] = [
  { id: 'classic', name: 'Original', goalSize: 80, color: '#00d4ff', obstacles: [] },
  { id: 'wide', name: 'Wide', goalSize: 120, color: '#00ff88', obstacles: [] },
  {
    id: 'pillars',
    name: 'Pillars',
    goalSize: 80,
    color: '#ff00ff',
    obstacles: [
      { x: 75, y: 200, r: 18 },
      { x: 225, y: 200, r: 18 },
      { x: 150, y: 300, r: 22 },
      { x: 75, y: 400, r: 18 },
      { x: 225, y: 400, r: 18 },
    ],
  },
  {
    id: 'fortress',
    name: 'Fortress',
    goalSize: 80,
    color: '#ff8800',
    destructible: true,
    obstacleHp: 3,
    obstacleRespawnMs: 5000,
    obstacles: [
      // 上段の壁
      { x: 100, y: 160, r: 15 },
      { x: 200, y: 160, r: 15 },
      // 中央ブロック
      { x: 80, y: 300, r: 20 },
      { x: 150, y: 280, r: 16 },
      { x: 220, y: 300, r: 20 },
      // 下段の壁
      { x: 100, y: 440, r: 15 },
      { x: 200, y: 440, r: 15 },
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
