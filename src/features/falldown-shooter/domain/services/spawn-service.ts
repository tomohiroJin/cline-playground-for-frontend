// SpawnService — ブロック生成ドメインサービス

import type { PowerType } from '../types';
import { BlockModel } from '../models/block';
import { CONFIG, BLOCK_SHAPES, BLOCK_COLORS, POWER_TYPES } from '../../constants';
import { uid, pick } from '../../utils';

/** ブロック生成パラメータ */
interface SpawnBlockParams {
  gridWidth: number;
  existingBlocks: ReadonlyArray<BlockModel>;
  powerUpChance: number;
}

/** ブロック生成サービス */
export const SpawnService = {
  /**
   * ブロックをスポーン可能かどうか判定する
   * 上部（y < 2）に 3 つ以上のブロックがある場合はスポーン不可
   */
  canSpawn(existingBlocks: ReadonlyArray<BlockModel>): boolean {
    const blocksNearTop = existingBlocks.filter(block => {
      const cells = block.getCells();
      return cells.some(cell => cell.y < 2);
    });
    return blocksNearTop.length < 3;
  },

  /**
   * 新しいブロックを生成する
   * 既存ブロックとの衝突を回避しつつ、最適な位置に配置する
   */
  spawnBlock(params: SpawnBlockParams): BlockModel {
    const { gridWidth, existingBlocks, powerUpChance } = params;
    const shape = pick(BLOCK_SHAPES);
    const power =
      Math.random() < powerUpChance ? pick(Object.keys(POWER_TYPES) as PowerType[]) : null;
    const shapeWidth = shape[0].length;
    const shapeHeight = shape.length;

    // 既存ブロックの占有セルを計算
    const occupiedCells = new Set<string>();
    existingBlocks.forEach(existing => {
      existing.getFutureCells(CONFIG.spawn.safeZone).forEach(cell => {
        occupiedCells.add(`${cell.x},${cell.y}`);
      });
    });

    // X座標の候補をシャッフル
    const possibleX = Array.from({ length: gridWidth - shapeWidth + 1 }, (_, i) => i);
    for (let i = possibleX.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [possibleX[i], possibleX[j]] = [possibleX[j], possibleX[i]];
    }

    const possibleY = [-shapeHeight - 3, -shapeHeight - 2, -shapeHeight - 1, -shapeHeight];

    // 衝突しない位置を探す
    for (const startY of possibleY) {
      for (const x of possibleX) {
        const candidate = BlockModel.create({
          id: uid(),
          x,
          y: startY,
          shape,
          color: pick(BLOCK_COLORS),
          power,
        });

        const futureCells = candidate.getFutureCells(CONFIG.spawn.safeZone);
        const hasOverlap = futureCells.some(cell =>
          occupiedCells.has(`${cell.x},${cell.y}`)
        );

        if (!hasOverlap) {
          return candidate;
        }
      }
    }

    // フォールバック: 最も既存ブロックから離れた位置に配置
    let bestX = Math.floor(gridWidth / 2);
    let maxDistance = -1;

    for (let x = 0; x <= gridWidth - shapeWidth; x++) {
      let minDistToExisting = Infinity;
      existingBlocks.forEach(existing => {
        const dist = Math.abs(x - existing.position.x);
        minDistToExisting = Math.min(minDistToExisting, dist);
      });
      if (minDistToExisting > maxDistance) {
        maxDistance = minDistToExisting;
        bestX = x;
      }
    }

    return BlockModel.create({
      id: uid(),
      x: bestX,
      y: -shapeHeight - 4,
      shape,
      color: pick(BLOCK_COLORS),
      power,
    });
  },
} as const;
