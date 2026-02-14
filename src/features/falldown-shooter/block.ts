// 落ち物シューティング ブロックモジュール

import type { BlockData, Cell, PowerType } from './types';
import { CONFIG, BLOCK_SHAPES, BLOCK_COLORS, POWER_TYPES } from './constants';
import { uid, pick } from './utils';
import { Grid } from './grid';

export const Block = {
  getCells: (block: BlockData): Cell[] => {
    const cells: Cell[] = [];
    block.shape.forEach((row, dy) =>
      row.forEach((val, dx) => {
        if (val) cells.push({ x: block.x + dx, y: block.y + dy });
      })
    );
    return cells;
  },

  getFutureCells: (block: BlockData, extraRows: number = CONFIG.spawn.safeZone): Cell[] => {
    const cells: Cell[] = [];
    for (let futureY = block.y; futureY <= block.y + extraRows; futureY++) {
      block.shape.forEach((row, dy) =>
        row.forEach((val, dx) => {
          if (val) cells.push({ x: block.x + dx, y: futureY + dy });
        })
      );
    }
    return cells;
  },

  toSingleCells: (block: BlockData): BlockData[] =>
    Block.getCells(block).map((cell, i) => ({
      id: uid(),
      x: cell.x,
      y: cell.y,
      shape: [[1]],
      color: block.color,
      power: i === 0 ? block.power : null,
    })),

  create: (gridWidth: number, existingBlocks: BlockData[] = []): BlockData => {
    const shape = pick(BLOCK_SHAPES);
    const power =
      Math.random() < CONFIG.powerUp.chance ? pick(Object.keys(POWER_TYPES) as PowerType[]) : null;
    const shapeWidth = shape[0].length;
    const shapeHeight = shape.length;

    const occupiedCells = new Set<string>();
    existingBlocks.forEach(existing => {
      Block.getFutureCells(existing, CONFIG.spawn.safeZone).forEach(cell => {
        occupiedCells.add(`${cell.x},${cell.y}`);
      });
    });

    const possibleX = Array.from({ length: gridWidth - shapeWidth + 1 }, (_, i) => i);
    for (let i = possibleX.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [possibleX[i], possibleX[j]] = [possibleX[j], possibleX[i]];
    }

    const possibleY = [-shapeHeight - 3, -shapeHeight - 2, -shapeHeight - 1, -shapeHeight];

    for (const startY of possibleY) {
      for (const x of possibleX) {
        const block: BlockData = {
          id: uid(),
          x,
          y: startY,
          shape,
          color: pick(BLOCK_COLORS),
          power,
        };

        const newBlockFutureCells = Block.getFutureCells(block, CONFIG.spawn.safeZone);
        const hasOverlap = newBlockFutureCells.some(cell =>
          occupiedCells.has(`${cell.x},${cell.y}`)
        );

        if (!hasOverlap) {
          return block;
        }
      }
    }

    let bestX = Math.floor(gridWidth / 2);
    let maxDistance = -1;

    for (let x = 0; x <= gridWidth - shapeWidth; x++) {
      let minDistToExisting = Infinity;
      existingBlocks.forEach(existing => {
        const dist = Math.abs(x - existing.x);
        minDistToExisting = Math.min(minDistToExisting, dist);
      });
      if (minDistToExisting > maxDistance) {
        maxDistance = minDistToExisting;
        bestX = x;
      }
    }

    return {
      id: uid(),
      x: bestX,
      y: -shapeHeight - 4,
      shape,
      color: pick(BLOCK_COLORS),
      power,
    };
  },

  canMoveTo: (
    block: BlockData,
    targetY: number,
    grid: (string | null)[][],
    height: number,
    others: BlockData[]
  ): boolean =>
    Block.getCells({ ...block, y: targetY }).every(
      ({ x, y }) =>
        y < height &&
        !(y >= 0 && grid[y]?.[x]) &&
        !others.some(o => o.id !== block.id && Block.getCells(o).some(c => c.x === x && c.y === y))
    ),

  placeOnGrid: (blocks: BlockData[], grid: (string | null)[][]): (string | null)[][] =>
    blocks.reduce((g, block) => {
      let newGrid = g;
      Block.getCells(block).forEach(({ x, y }) => {
        newGrid = Grid.setCell(newGrid, x, y, block.color);
      });
      return newGrid;
    }, grid),
};
