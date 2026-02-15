import { CanvasSize, FieldConfig, ItemType } from './types';

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
    id: 'zigzag',
    name: 'Zigzag',
    goalSize: 90,
    color: '#ffaa00',
    obstacles: [
      { x: 75, y: 180, r: 16 },
      { x: 225, y: 300, r: 16 },
      { x: 75, y: 420, r: 16 },
    ],
  },
  {
    id: 'fortress',
    name: 'Fortress',
    goalSize: 70,
    color: '#ff4488',
    obstacles: [
      { x: 110, y: 60, r: 14 },
      { x: 190, y: 60, r: 14 },
      { x: 110, y: 540, r: 14 },
      { x: 190, y: 540, r: 14 },
    ],
  },
] as const;

export const ITEMS = [
  { id: 'split' as ItemType, name: 'Split', color: '#FF6B6B', icon: '◆' },
  { id: 'speed' as ItemType, name: 'Speed', color: '#4ECDC4', icon: '⚡' },
  { id: 'invisible' as ItemType, name: 'Hide', color: '#9B59B6', icon: '👻' },
] as const;

export const SIZE_OPTIONS: { id: CanvasSize; name: string }[] = [
  { id: 'standard', name: 'Standard' },
  { id: 'large', name: 'Large' },
];

export const DIFFICULTY_OPTIONS = ['easy', 'normal', 'hard'] as const;
export const DIFFICULTY_LABELS = { easy: 'Easy', normal: 'Normal', hard: 'Hard' };
export const WIN_SCORE_OPTIONS = [3, 7, 15];
