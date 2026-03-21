// Bullet 値オブジェクト — 弾丸の位置・方向・貫通属性を管理する不変オブジェクト

import type { Position, Direction } from '../types';
import type { BulletData } from '../../types';
import { uid } from '../../utils';

/** BulletModel 生成パラメータ */
interface BulletCreateParams {
  id?: string;
  x: number;
  y: number;
  dx?: number;
  dy?: number;
  pierce?: boolean;
}

/** Bullet 値オブジェクト */
export class BulletModel {
  readonly id: string;
  readonly position: Position;
  readonly direction: Direction;
  readonly isPiercing: boolean;

  private constructor(
    id: string,
    position: Position,
    direction: Direction,
    isPiercing: boolean
  ) {
    this.id = id;
    this.position = position;
    this.direction = direction;
    this.isPiercing = isPiercing;
  }

  /** 弾丸を生成する */
  static create(params: BulletCreateParams): BulletModel {
    return new BulletModel(
      params.id ?? uid(),
      { x: params.x, y: params.y },
      { dx: params.dx ?? 0, dy: params.dy ?? -1 },
      params.pierce ?? false
    );
  }

  /** 旧 BulletData から BulletModel を生成する */
  static fromBulletData(data: BulletData): BulletModel {
    return new BulletModel(
      data.id,
      { x: data.x, y: data.y },
      { dx: data.dx, dy: data.dy },
      data.pierce
    );
  }

  /** 3方向に弾丸を生成する */
  static createSpread(x: number, y: number, pierce: boolean): BulletModel[] {
    return [
      BulletModel.create({ x, y, dx: 0, dy: -1, pierce }),
      BulletModel.create({ x, y, dx: -1, dy: -1, pierce }),
      BulletModel.create({ x, y, dx: 1, dy: -1, pierce }),
    ];
  }

  /** 上方+下方の弾丸を生成する */
  static createWithDownshot(x: number, y: number, pierce: boolean): BulletModel[] {
    return [
      BulletModel.create({ x, y, dx: 0, dy: -1, pierce }),
      BulletModel.create({ x, y: y + 1, dx: 0, dy: 1, pierce }),
    ];
  }

  /** 3方向+下方の弾丸を生成する */
  static createSpreadWithDownshot(x: number, y: number, pierce: boolean): BulletModel[] {
    return [
      BulletModel.create({ x, y, dx: 0, dy: -1, pierce }),
      BulletModel.create({ x, y, dx: -1, dy: -1, pierce }),
      BulletModel.create({ x, y, dx: 1, dy: -1, pierce }),
      BulletModel.create({ x, y: y + 1, dx: 0, dy: 1, pierce }),
    ];
  }

  /** 弾丸を移動し、新しいインスタンスを返す */
  move(): BulletModel {
    return new BulletModel(
      this.id,
      { x: this.position.x + this.direction.dx, y: this.position.y + this.direction.dy },
      this.direction,
      this.isPiercing
    );
  }

  /** 弾丸が指定範囲内にあるか判定する */
  isInBounds(width: number, height: number): boolean {
    return (
      this.position.y >= 0 &&
      this.position.y < height &&
      this.position.x >= 0 &&
      this.position.x < width
    );
  }

  /** 旧 BulletData 形式に変換する */
  toBulletData(): BulletData {
    return {
      id: this.id,
      x: this.position.x,
      y: this.position.y,
      dx: this.direction.dx,
      dy: this.direction.dy,
      pierce: this.isPiercing,
    };
  }
}
