// 落ち物シューティング ゲームロジックモジュール

import type { BlockData, BulletData, BulletProcessResult, PowerType } from './types';
import { CONFIG } from './constants';
import { calcTiming } from './utils';
import { Grid } from './grid';
import { Block } from './block';
import { Bullet } from './bullet';
import { Collision } from './collision';

export const GameLogic = {
  processBullets: (
    bullets: BulletData[],
    blocks: BlockData[],
    grid: (string | null)[][],
    width: number,
    height: number,
    onPowerUp: (type: PowerType, x: number, y: number) => void
  ): BulletProcessResult => {
    const result: BulletProcessResult = {
      bullets: [],
      blocks: [...blocks],
      grid: Grid.clone(grid),
      score: 0,
      hitCount: 0,
      pendingBombs: [],
    };

    bullets.forEach(bullet => {
      const moved = Bullet.move(bullet);
      if (!Bullet.isValid(moved, width, height)) return;

      const map = Collision.buildMap(result.blocks, result.grid);
      const positions = [`${bullet.x},${bullet.y}`, `${moved.x},${moved.y}`];
      let hit = false;

      for (const pos of positions) {
        const target = map.get(pos);
        if (!target) continue;

        hit = true;
        result.score += CONFIG.score.block;
        result.hitCount++;

        if (target.power) {
          if (target.power === 'bomb') {
            result.pendingBombs.push({ x: target.x, y: target.y });
          } else {
            onPowerUp(target.power, target.x, target.y);
          }
        }

        if (target.type === 'block' && target.blockId) {
          const idx = result.blocks.findIndex(b => b.id === target.blockId);
          if (idx >= 0) {
            const cells = Block.toSingleCells(result.blocks[idx]).filter(
              c => !(c.x === target.x && c.y === target.y)
            );
            result.blocks.splice(idx, 1, ...cells);
          }
        } else {
          result.grid[target.y][target.x] = null;
        }

        if (!bullet.pierce) break;
        hit = false;
      }

      if (!hit) result.bullets.push(moved);
    });

    return result;
  },

  applyExplosion: (
    cx: number,
    cy: number,
    blocks: BlockData[],
    grid: (string | null)[][],
    width: number,
    height: number
  ) => {
    const area = Collision.getArea3x3(cx, cy, width, height);
    const newBlocks = [...blocks];
    const newGrid = Grid.clone(grid);
    let score = 0;

    area.forEach(({ x, y }) => {
      if (newGrid[y]?.[x]) {
        newGrid[y][x] = null;
        score += CONFIG.score.block;
      }

      for (let i = newBlocks.length - 1; i >= 0; i--) {
        const block = newBlocks[i];
        if (Block.getCells(block).some(c => c.x === x && c.y === y)) {
          const remaining = Block.toSingleCells(block).filter(c => !(c.x === x && c.y === y));
          newBlocks.splice(i, 1, ...remaining);
          score += CONFIG.score.block;
        }
      }
    });

    return { blocks: newBlocks, grid: newGrid, score };
  },

  applyLaserColumn: (colX: number, blocks: BlockData[], grid: (string | null)[][]) => {
    const { grid: clearedGrid, score: gridScore } = Grid.clearColumn(grid, colX);
    const newBlocks = [...blocks];
    let score = gridScore;

    for (let i = newBlocks.length - 1; i >= 0; i--) {
      const block = newBlocks[i];
      const hitCells = Block.getCells(block).filter(c => c.x === colX);

      if (hitCells.length > 0) {
        const remaining = Block.toSingleCells(block).filter(c => c.x !== colX);
        newBlocks.splice(i, 1, ...remaining);
        score += hitCells.length * CONFIG.score.block;
      }
    }

    return { blocks: newBlocks, grid: clearedGrid, score };
  },

  applyBlastAll: (blocks: BlockData[]) => ({
    blocks: [] as BlockData[],
    score: blocks.reduce((s, b) => s + Block.getCells(b).length * CONFIG.score.block, 0),
  }),

  applyClearBottom: (grid: (string | null)[][]) => {
    const bottomRow = grid.length - 1;
    if (!grid[bottomRow].some(c => c !== null)) {
      return { grid, score: 0, cleared: false };
    }
    const score = grid[bottomRow].filter(c => c !== null).length * CONFIG.score.block;
    return { grid: Grid.clearRow(grid, bottomRow), score, cleared: true };
  },

  processBlockFalling: (blocks: BlockData[], grid: (string | null)[][], height: number) => {
    const sorted = [...blocks].sort((a, b) => b.y + b.shape.length - (a.y + a.shape.length));
    const falling: BlockData[] = [];
    const landing: BlockData[] = [];

    sorted.forEach(block => {
      const nextY = block.y + 1;
      const canMove = Block.canMoveTo(block, nextY, grid, height, [...landing, ...falling]);

      if (canMove) {
        falling.push({ ...block, y: nextY });
      } else {
        landing.push(block);
      }
    });

    return { falling, landing };
  },

  calculatePlayerY: (grid: (string | null)[][]): number =>
    Math.max(CONFIG.dangerLine, Grid.findHighestRow(grid) - 1),

  isGameOver: (grid: (string | null)[][]): boolean => {
    for (let y = 0; y <= CONFIG.dangerLine; y++) {
      if (grid[y]?.some(cell => cell !== null)) return true;
    }
    return false;
  },

  canSpawnBlock: (existingBlocks: BlockData[]): boolean => {
    const blocksNearTop = existingBlocks.filter(block => {
      const cells = Block.getCells(block);
      return cells.some(cell => cell.y < 2);
    });
    return blocksNearTop.length < 3;
  },

  getSpawnInterval: (time: number, stage: number, spawnMultiplier = 1.0): number =>
    calcTiming(CONFIG.timing.spawn, time, stage) * spawnMultiplier,
  getFallSpeed: (time: number, stage: number, slow: boolean, fallMultiplier = 1.0): number =>
    calcTiming(CONFIG.timing.fall, time, stage) * (slow ? 2 : 1) * fallMultiplier,
};
