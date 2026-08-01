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
  /** 高台: 火力ボーナスを得る設置スロット（buildSlots の部分集合） */
  highGround?: CellPos[];
  /** 滞留セル: 敵の移動が遅くなる経路セル（path の部分集合） */
  slowCells?: CellPos[];
}

/**
 * 設置スロットを経路からの距離で決める上限
 *
 * 塔の射程は 火砲台1.5 / 弓兵1.6 / 徹甲弩1.8 / 弩砲2.2 / 投石機3.0。
 * 主力の下限が1.5 なので、この距離までなら**どのマスからも主力2種が届く**。
 * 距離2.0（33マス）にすると弓兵・火砲台が届かないマスが生まれ、
 * 死にマスを別の形で再生産してしまう（設計書 §6.1）。
 */
export const BUILD_SLOT_MAX_DISTANCE = 1.5;

/** 経路から maxDistance 以内にある非経路セルを列挙する（左上から行優先） */
export const buildSlotsNearPath = (
  width: number,
  height: number,
  path: readonly CellPos[],
  maxDistance: number
): CellPos[] => {
  const slots: CellPos[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (path.some((c) => c.x === x && c.y === y)) continue;
      if (path.some((c) => Math.hypot(c.x - x, c.y - y) <= maxDistance)) slots.push({ x, y });
    }
  }
  return slots;
};

const PLAINS_WIDTH = 9;
const PLAINS_HEIGHT = 7;

const PLAINS_PATH: CellPos[] = [
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
];

/** P1 ステージ: 平原（9×7、S字経路） */
export const PLAINS_MAP: StageMap = {
  id: 'plains',
  name: '平原',
  width: PLAINS_WIDTH,
  height: PLAINS_HEIGHT,
  path: PLAINS_PATH,
  buildSlots: buildSlotsNearPath(
    PLAINS_WIDTH,
    PLAINS_HEIGHT,
    PLAINS_PATH,
    BUILD_SLOT_MAX_DISTANCE
  ),
  highGround: [
    { x: 3, y: 4 },
    { x: 7, y: 2 },
  ],
  slowCells: [
    { x: 4, y: 3 },
    { x: 4, y: 2 },
    { x: 4, y: 1 },
  ],
};

const samePos = (a: CellPos, b: CellPos): boolean => a.x === b.x && a.y === b.y;

/** 指定セルが高台か */
export const isHighGround = (map: StageMap, pos: CellPos): boolean =>
  (map.highGround ?? []).some((c) => samePos(c, pos));

/** 指定セルが滞留セルか */
export const isSlowCell = (map: StageMap, pos: CellPos): boolean =>
  (map.slowCells ?? []).some((c) => samePos(c, pos));

/** 敵が出現する経路の始端（入口） */
export const entranceCell = (map: StageMap): CellPos | undefined => map.path[0];

/** 敵が到達したら漏れとなる経路の終端（砦） */
export const fortressCell = (map: StageMap): CellPos | undefined =>
  map.path[map.path.length - 1];

/** 経路上の進行方向 */
export type PathDirection = 'right' | 'left' | 'up' | 'down';

/**
 * 経路セルにおける進行方向を返す（終端セルは undefined）
 *
 * 盤面に方向を描くための情報。経路の並び順から算出するため、
 * マップ定義に方向を持たせる必要がない。
 */
export const pathDirectionAt = (
  map: StageMap,
  pos: CellPos
): PathDirection | undefined => {
  const index = map.path.findIndex((c) => samePos(c, pos));
  if (index < 0) return undefined;
  const next = map.path[index + 1];
  const current = map.path[index];
  if (!next || !current) return undefined;
  if (next.x > current.x) return 'right';
  if (next.x < current.x) return 'left';
  if (next.y > current.y) return 'down';
  if (next.y < current.y) return 'up';
  return undefined;
};

/**
 * 指定位置から砦までの残り経路セル数
 *
 * 敵はセル間を補間した座標を持つため、最も近い経路セルを現在地とみなす。
 * 「あとどれだけで砦に届くか」を盤面に出すための概算。
 */
export const remainingPathCells = (
  map: StageMap,
  pos: { x: number; y: number }
): number => {
  if (map.path.length === 0) return 0;
  let nearestIndex = 0;
  let nearestDistance = Infinity;
  map.path.forEach((cell, index) => {
    const distance = Math.hypot(cell.x - pos.x, cell.y - pos.y);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });
  return map.path.length - 1 - nearestIndex;
};

/** from からユークリッド距離 range 以内の経路セルを返す（射程オーバーレイ用） */
export const coveredPathCells = (
  map: StageMap,
  from: CellPos,
  range: number
): CellPos[] =>
  map.path.filter((c) => Math.hypot(c.x - from.x, c.y - from.y) <= range);
