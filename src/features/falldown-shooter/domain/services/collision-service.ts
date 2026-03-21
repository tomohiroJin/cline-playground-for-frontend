// CollisionService — 衝突判定ドメインサービス

import type { Cell, CollisionTarget, CollisionMap, CollisionResult } from '../types';
import type { GridModel } from '../models/grid';
import type { BlockModel } from '../models/block';

/** 衝突判定サービス */
export const CollisionService = {
  /**
   * 衝突マップを構築する
   * グリッドセルと落下中ブロックの両方を含むマップを生成
   */
  buildCollisionMap(blocks: ReadonlyArray<BlockModel>, grid: GridModel): CollisionMap {
    const map = new Map<string, CollisionTarget>();

    // グリッドセルを登録
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        if (grid.getCell(x, y)) {
          map.set(`${x},${y}`, { type: 'grid', x, y });
        }
      }
    }

    // ブロックセルを登録
    blocks.forEach(block => {
      block.getCells().forEach((cell, i) => {
        if (cell.y >= 0) {
          map.set(`${cell.x},${cell.y}`, {
            type: 'block',
            blockId: block.id,
            x: cell.x,
            y: cell.y,
            power: i === 0 ? block.power : null,
          });
        }
      });
    });

    return map;
  },

  /**
   * 指定座標で衝突があるか判定する
   * @returns 衝突があれば CollisionResult、なければ null
   */
  detectCollision(x: number, y: number, collisionMap: CollisionMap): CollisionResult | null {
    const key = `${x},${y}`;
    const target = collisionMap.get(key);
    if (!target) return null;
    return { target, position: { x, y } };
  },

  /**
   * 爆発範囲（3x3）のセル座標を取得する
   * グリッド範囲外のセルは除外される
   */
  getExplosionArea(cx: number, cy: number, width: number, height: number): ReadonlyArray<Cell> {
    const cells: Cell[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < width && y >= 0 && y < height) {
          cells.push({ x, y });
        }
      }
    }
    return cells;
  },
} as const;
