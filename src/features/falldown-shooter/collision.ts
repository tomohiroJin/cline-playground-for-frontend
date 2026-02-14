// 落ち物シューティング 衝突判定モジュール

import type { BlockData, Cell, CollisionTarget } from './types';
import { Block } from './block';

export const Collision = {
  buildMap: (blocks: BlockData[], grid: (string | null)[][]): Map<string, CollisionTarget> => {
    const map = new Map<string, CollisionTarget>();

    grid.forEach((row, y) =>
      row.forEach((cell, x) => {
        if (cell) map.set(`${x},${y}`, { type: 'grid', x, y });
      })
    );

    blocks.forEach(block =>
      Block.getCells(block).forEach((cell, i) => {
        if (cell.y >= 0) {
          map.set(`${cell.x},${cell.y}`, {
            type: 'block',
            blockId: block.id,
            x: cell.x,
            y: cell.y,
            power: i === 0 ? block.power : null,
          });
        }
      })
    );

    return map;
  },

  getArea3x3: (cx: number, cy: number, width: number, height: number): Cell[] => {
    const cells: Cell[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = cx + dx,
          y = cy + dy;
        if (x >= 0 && x < width && y >= 0 && y < height) {
          cells.push({ x, y });
        }
      }
    }
    return cells;
  },
};
