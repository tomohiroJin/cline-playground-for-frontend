// 落ち物シューティング ステージモジュール

import type { GameState } from './types';
import { CONFIG } from './constants';
import { Grid } from './grid';

export const Stage = {
  create: (num: number, score: number, width: number, height: number): GameState => ({
    grid: Grid.create(width, height),
    blocks: [],
    bullets: [],
    score,
    stage: num,
    lines: 0,
    linesNeeded: CONFIG.stages[num - 1],
    playerY: height - 2,
    time: 0,
  }),

  isFinal: (stage: number): boolean => stage >= CONFIG.stages.length,
};
