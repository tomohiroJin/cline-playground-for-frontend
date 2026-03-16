/**
 * マップテストデータビルダー
 * テストで使用するGameMapを流暢なAPIで構築する
 */
import { GameMap, TileType } from '../../types';

export class MapBuilder {
  private tiles: GameMap;

  constructor(width = 10, height = 10) {
    // 壁で囲まれた空の部屋を生成
    this.tiles = Array.from({ length: height }, (_, y) =>
      Array.from({ length: width }, (_, x) =>
        x === 0 || x === width - 1 || y === 0 || y === height - 1
          ? TileType.WALL
          : TileType.FLOOR
      )
    );
  }

  withWall(x: number, y: number): this {
    this.tiles[y][x] = TileType.WALL;
    return this;
  }

  withGoal(x: number, y: number): this {
    this.tiles[y][x] = TileType.GOAL;
    return this;
  }

  withStart(x: number, y: number): this {
    this.tiles[y][x] = TileType.START;
    return this;
  }

  withFloor(x: number, y: number): this {
    this.tiles[y][x] = TileType.FLOOR;
    return this;
  }

  build(): GameMap {
    return this.tiles.map(row => [...row]);
  }
}

/** MapBuilder のファクトリ関数 */
export const aMap = (width?: number, height?: number): MapBuilder =>
  new MapBuilder(width, height);
