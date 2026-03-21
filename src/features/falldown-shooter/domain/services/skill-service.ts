// SkillService — スキル発動ドメインサービス（Strategy パターン）

import type { SkillType } from '../types';
import type { GridModel } from '../models/grid';
import type { BlockModel } from '../models/block';
import { CONFIG } from '../../constants';

/** スキル発動パラメータ */
export interface SkillExecuteParams {
  blocks: ReadonlyArray<BlockModel>;
  grid: GridModel;
  playerX: number;
}

/** スキル発動結果 */
export interface SkillExecuteResult {
  blocks: ReadonlyArray<BlockModel>;
  grid: GridModel;
  score: number;
}

/** スキル Strategy インターフェース */
interface SkillStrategy {
  execute(params: SkillExecuteParams): SkillExecuteResult;
}

/** 縦レーザー: 指定列の全セルとブロックを消去 */
const laserStrategy: SkillStrategy = {
  execute({ blocks, grid, playerX }) {
    // グリッドの列を消去
    const { grid: clearedGrid, clearedCount: gridCleared } = grid.clearColumn(playerX);
    let score = gridCleared * CONFIG.score.block;

    // ブロックの列を消去
    const newBlocks: BlockModel[] = [];
    blocks.forEach(block => {
      const hitCells = block.getCells().filter(c => c.x === playerX);
      if (hitCells.length > 0) {
        const remaining = block.toSingleCells().filter(c => c.position.x !== playerX);
        newBlocks.push(...remaining);
        score += hitCells.length * CONFIG.score.block;
      } else {
        newBlocks.push(block as BlockModel);
      }
    });

    return { blocks: newBlocks, grid: clearedGrid, score };
  },
};

/** 全画面爆破: 落下中ブロック全破壊 */
const blastStrategy: SkillStrategy = {
  execute({ blocks, grid }) {
    const score = blocks.reduce(
      (s, b) => s + b.getCells().length * CONFIG.score.block,
      0
    );
    return { blocks: [], grid, score };
  },
};

/** ライン消去: 最下行を消去 */
const clearStrategy: SkillStrategy = {
  execute({ blocks, grid }) {
    const bottomRow = grid.height - 1;
    let cellCount = 0;

    // 最下行のセル数を数える
    for (let x = 0; x < grid.width; x++) {
      if (grid.getCell(x, bottomRow) !== null) {
        cellCount++;
      }
    }

    if (cellCount === 0) {
      return { blocks: [...blocks], grid, score: 0 };
    }

    const score = cellCount * CONFIG.score.block;
    const clearedGrid = grid.clearRow(bottomRow);
    return { blocks: [...blocks], grid: clearedGrid, score };
  },
};

/** スキル Strategy マップ */
const strategies: Record<SkillType, SkillStrategy> = {
  laser: laserStrategy,
  blast: blastStrategy,
  clear: clearStrategy,
};

/** スキルサービス */
export const SkillService = {
  /**
   * スキルを発動する
   * @param skillType スキル種類
   * @param params 発動パラメータ
   * @returns スキル発動結果
   */
  activate(skillType: SkillType, params: SkillExecuteParams): SkillExecuteResult {
    return strategies[skillType].execute(params);
  },
} as const;
