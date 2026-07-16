/**
 * 灰燼の城壁 - 盤面状態（イミュータブル）
 */
import { getCardDefinition } from '../cards/card-pool';
import type { CellPos, StageMap } from './stage-map';

export interface PlacedTower {
  cardId: string;
  pos: CellPos;
}

export interface PlacedTrap {
  cardId: string;
  pos: CellPos;
  usesLeft: number;
}

export interface BoardState {
  map: StageMap;
  towers: PlacedTower[];
  traps: PlacedTrap[];
  /** 戦術カードによる全タワー攻撃倍率（初期値 1.0） */
  towerAttackMultiplier: number;
}

export const createBoard = (map: StageMap): BoardState => ({
  map,
  towers: [],
  traps: [],
  towerAttackMultiplier: 1,
});

const samePos = (a: CellPos, b: CellPos): boolean => a.x === b.x && a.y === b.y;

/** 設置マスかつ空きならタワーを置ける */
export const canPlaceTower = (board: BoardState, pos: CellPos): boolean => {
  const isSlot = board.map.buildSlots.some((s) => samePos(s, pos));
  const occupied = board.towers.some((t) => samePos(t.pos, pos));
  return isSlot && !occupied;
};

/** 経路マスかつ罠未設置なら罠を置ける */
export const canPlaceTrap = (board: BoardState, pos: CellPos): boolean => {
  const isPath = board.map.path.some((p) => samePos(p, pos));
  const occupied = board.traps.some((t) => samePos(t.pos, pos));
  return isPath && !occupied;
};

export const placeTower = (
  board: BoardState,
  cardId: string,
  pos: CellPos
): BoardState => {
  if (!canPlaceTower(board, pos)) {
    throw new Error(`タワーを設置できないマスです: (${pos.x}, ${pos.y})`);
  }
  const towerSpec = getCardDefinition(cardId).tower;
  if (!towerSpec) {
    throw new Error(`タワーカードではありません: ${cardId}`);
  }
  return { ...board, towers: [...board.towers, { cardId, pos }] };
};

export const placeTrap = (
  board: BoardState,
  cardId: string,
  pos: CellPos
): BoardState => {
  if (!canPlaceTrap(board, pos)) {
    throw new Error(`罠を設置できないマスです: (${pos.x}, ${pos.y})`);
  }
  const trapSpec = getCardDefinition(cardId).trap;
  if (!trapSpec) {
    throw new Error(`罠カードではありません: ${cardId}`);
  }
  return {
    ...board,
    traps: [...board.traps, { cardId, pos, usesLeft: trapSpec.uses }],
  };
};
