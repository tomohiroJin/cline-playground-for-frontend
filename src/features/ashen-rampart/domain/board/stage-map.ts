/**
 * 灰燼の城壁 - ステージマップ定義
 *
 * path: 敵の進軍経路（入口→砦の順、隣接セルの連結列）
 * buildSlots: タワー設置可能マス（経路とは重ならない）
 */
export interface CellPos {
  x: number;
  y: number;
}

export interface StageMap {
  id: string;
  name: string;
  width: number;
  height: number;
  path: CellPos[];
  buildSlots: CellPos[];
}

/** P1 ステージ: 平原（9×7、S字経路） */
export const PLAINS_MAP: StageMap = {
  id: 'plains',
  name: '平原',
  width: 9,
  height: 7,
  path: [
    { x: 0, y: 3 },
    { x: 1, y: 3 },
    { x: 2, y: 3 },
    { x: 3, y: 3 },
    { x: 4, y: 3 },
    { x: 4, y: 2 },
    { x: 4, y: 1 },
    { x: 5, y: 1 },
    { x: 6, y: 1 },
    { x: 7, y: 1 },
    { x: 8, y: 1 },
  ],
  buildSlots: [
    { x: 1, y: 2 },
    { x: 2, y: 2 },
    { x: 3, y: 2 },
    { x: 1, y: 4 },
    { x: 2, y: 4 },
    { x: 3, y: 4 },
    { x: 5, y: 2 },
    { x: 6, y: 2 },
    { x: 7, y: 2 },
    { x: 5, y: 0 },
    { x: 6, y: 0 },
    { x: 7, y: 0 },
  ],
};
