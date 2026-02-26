// 落ち物シューティング 難易度定義

import type { Difficulty, DifficultyConfig } from './types';

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: 'Easy',
    color: '#22c55e',
    spawnMultiplier: 1.5,
    fallMultiplier: 1.3,
    scoreMultiplier: 0.8,
    powerUpChance: 0.2,
    skillChargeMultiplier: 1.2,
  },
  normal: {
    label: 'Normal',
    color: '#3b82f6',
    spawnMultiplier: 1.0,
    fallMultiplier: 1.0,
    scoreMultiplier: 1.0,
    powerUpChance: 0.15,
    skillChargeMultiplier: 1.0,
  },
  hard: {
    label: 'Hard',
    color: '#ef4444',
    spawnMultiplier: 0.7,
    fallMultiplier: 0.8,
    scoreMultiplier: 1.5,
    powerUpChance: 0.1,
    skillChargeMultiplier: 0.8,
  },
};

export const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'normal', 'hard'];
