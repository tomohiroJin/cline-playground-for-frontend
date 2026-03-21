// Block 値オブジェクト — ブロックの形状・位置・パワーアップ情報を管理する不変オブジェクト

import type { Cell, Position, ReadonlyShape, PowerType } from '../types';
import type { GridModel } from './grid';
import { uid } from '../../utils';
import type { BlockData } from '../../types';

/** BlockModel 生成パラメータ */
export interface BlockCreateParams {
  id: string;
  x: number;
  y: number;
  shape: number[][];
  color: string;
  power: PowerType | null;
}

/** Block 値オブジェクト */
export class BlockModel {
  readonly id: string;
  readonly position: Position;
  readonly shape: ReadonlyShape;
  readonly color: string;
  readonly power: PowerType | null;

  private constructor(
    id: string,
    position: Position,
    shape: ReadonlyShape,
    color: string,
    power: PowerType | null
  ) {
    this.id = id;
    this.position = position;
    this.shape = shape;
    this.color = color;
    this.power = power;
  }

  /** BlockModel を生成する */
  static create(params: BlockCreateParams): BlockModel {
    return new BlockModel(
      params.id,
      { x: params.x, y: params.y },
      params.shape,
      params.color,
      params.power
    );
  }

  /** 旧 BlockData から BlockModel を生成する */
  static fromBlockData(data: BlockData): BlockModel {
    return new BlockModel(
      data.id,
      { x: data.x, y: data.y },
      data.shape,
      data.color,
      data.power
    );
  }

  /** ブロックが占有するセル座標を返す */
  getCells(): ReadonlyArray<Cell> {
    const cells: Cell[] = [];
    this.shape.forEach((row, dy) =>
      row.forEach((val, dx) => {
        if (val) cells.push({ x: this.position.x + dx, y: this.position.y + dy });
      })
    );
    return cells;
  }

  /** 未来の落下先を含むセル座標を返す */
  getFutureCells(extraRows: number): ReadonlyArray<Cell> {
    const cells: Cell[] = [];
    for (let futureY = this.position.y; futureY <= this.position.y + extraRows; futureY++) {
      this.shape.forEach((row, dy) =>
        row.forEach((val, dx) => {
          if (val) cells.push({ x: this.position.x + dx, y: futureY + dy });
        })
      );
    }
    return cells;
  }

  /** 指定の y 位置に移動した新しい BlockModel を返す */
  moveTo(y: number): BlockModel {
    return new BlockModel(this.id, { x: this.position.x, y }, this.shape, this.color, this.power);
  }

  /** 指定位置に移動可能かを判定する */
  canMoveTo(
    targetY: number,
    grid: GridModel,
    others: ReadonlyArray<BlockModel>
  ): boolean {
    const movedCells = this._getCellsAt(targetY);
    return movedCells.every(({ x, y }) => {
      // グリッドの底を超えていないか
      if (y >= grid.height) return false;
      // グリッドセルとの衝突チェック（画面内のみ）
      if (y >= 0 && grid.getCell(x, y)) return false;
      // 他のブロックとの衝突チェック
      return !others.some(
        o => o.id !== this.id && o.getCells().some(c => c.x === x && c.y === y)
      );
    });
  }

  /** ブロックを単一セルに分解する */
  toSingleCells(): BlockModel[] {
    return this.getCells().map((cell, i) =>
      new BlockModel(
        uid(),
        { x: cell.x, y: cell.y },
        [[1]],
        this.color,
        i === 0 ? this.power : null
      )
    );
  }

  /** 旧 BlockData 形式に変換する */
  toBlockData(): BlockData {
    return {
      id: this.id,
      x: this.position.x,
      y: this.position.y,
      shape: this.shape.map(row => [...row]),
      color: this.color,
      power: this.power,
    };
  }

  /** 内部ヘルパー: 指定 y でのセル座標を計算する */
  private _getCellsAt(targetY: number): Cell[] {
    const cells: Cell[] = [];
    this.shape.forEach((row, dy) =>
      row.forEach((val, dx) => {
        if (val) cells.push({ x: this.position.x + dx, y: targetY + dy });
      })
    );
    return cells;
  }
}
