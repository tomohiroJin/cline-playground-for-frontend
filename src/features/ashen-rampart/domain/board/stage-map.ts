/**
 * 灰燼の城壁 - ステージマップ定義
 *
 * lanes: 敵の進軍経路（各レーンは入口→砦の順に並んだ隣接セル列）。
 * 終端（砦）は全レーンで共通。設置マスという概念は持たず、配置可否は
 * 経路セルか否かで判定する（反復3 で自由配置へ移行、設計書 §3.2）。
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
  /** 敵の進軍路。各レーンは入口→砦の順に並んだ隣接セル列。終端（砦）は全レーンで共通 */
  lanes: CellPos[][];
  /** 高台: 火力ボーナスを得るセル（経路外） */
  highGround?: CellPos[];
  /** 滞留セル: 敵の移動が遅くなる経路セル */
  slowCells?: CellPos[];
}

const samePos = (a: CellPos, b: CellPos): boolean => a.x === b.x && a.y === b.y;

/** 指定レーンのセル列。未知の index は空配列（呼び出し側で分岐させないため） */
export const laneOf = (map: StageMap, laneIndex: number): readonly CellPos[] =>
  map.lanes[laneIndex] ?? [];

/** 全レーンの経路セルを重複なく返す */
export const allPathCells = (map: StageMap): CellPos[] => {
  const seen = new Set<string>();
  const cells: CellPos[] = [];
  map.lanes.forEach((lane) =>
    lane.forEach((c) => {
      const key = `${c.x},${c.y}`;
      if (seen.has(key)) return;
      seen.add(key);
      cells.push(c);
    })
  );
  return cells;
};

/** 指定セルがいずれかのレーン上にあるか */
export const isPathCell = (map: StageMap, pos: CellPos): boolean =>
  map.lanes.some((lane) => lane.some((c) => samePos(c, pos)));

/** 敵が到達したら漏れとなる終端（砦）。全レーンで共通である前提 */
export const fortressCell = (map: StageMap): CellPos | undefined => {
  const first = map.lanes[0];
  return first?.[first.length - 1];
};

/** 指定レーンの入口 */
export const entranceCell = (map: StageMap, laneIndex: number): CellPos | undefined =>
  laneOf(map, laneIndex)[0];

/** 経路外の全セル（左上から行優先） */
export const offPathCells = (map: StageMap): CellPos[] => {
  const cells: CellPos[] = [];
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const pos = { x, y };
      if (!isPathCell(map, pos)) cells.push(pos);
    }
  }
  return cells;
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

/**
 * P1 ステージ: 平原（9×7、S字経路）
 *
 * この時点（反復3 Task 1）ではレーン構造への形の移行のみが目的のため、
 * 単一レーン（lanes = [PLAINS_PATH]）のままにする。2レーン化は Task 2 で行う。
 */
export const PLAINS_MAP: StageMap = {
  id: 'plains',
  name: '平原',
  width: PLAINS_WIDTH,
  height: PLAINS_HEIGHT,
  lanes: [PLAINS_PATH],
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

/** 指定セルが高台か */
export const isHighGround = (map: StageMap, pos: CellPos): boolean =>
  (map.highGround ?? []).some((c) => samePos(c, pos));

/** 指定セルが滞留セルか */
export const isSlowCell = (map: StageMap, pos: CellPos): boolean =>
  (map.slowCells ?? []).some((c) => samePos(c, pos));

/** 経路上の進行方向 */
export type PathDirection = 'right' | 'left' | 'up' | 'down';

/**
 * 経路セルにおける進行方向を返す（終端セルは undefined）
 *
 * 盤面に方向を描くための情報。経路の並び順から算出するため、
 * マップ定義に方向を持たせる必要がない。敵はレーンに所属するため、
 * 引数はマップ全体ではなく対象レーンのセル列を受け取る。
 */
export const pathDirectionAt = (
  lane: readonly CellPos[],
  pos: CellPos
): PathDirection | undefined => {
  const index = lane.findIndex((c) => samePos(c, pos));
  if (index < 0) return undefined;
  const next = lane[index + 1];
  const current = lane[index];
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
 * 「あとどれだけで砦に届くか」を盤面に出すための概算。敵は所属レーンを
 * 持つため、引数はマップ全体ではなく対象レーンのセル列を受け取る。
 */
export const remainingPathCells = (
  lane: readonly CellPos[],
  pos: { x: number; y: number }
): number => {
  if (lane.length === 0) return 0;
  let nearestIndex = 0;
  let nearestDistance = Infinity;
  lane.forEach((cell, index) => {
    const distance = Math.hypot(cell.x - pos.x, cell.y - pos.y);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });
  return lane.length - 1 - nearestIndex;
};

/** from からユークリッド距離 range 以内の経路セル（全レーン）を返す（射程オーバーレイ用） */
export const coveredPathCells = (
  map: StageMap,
  from: CellPos,
  range: number
): CellPos[] =>
  allPathCells(map).filter((c) => Math.hypot(c.x - from.x, c.y - from.y) <= range);
