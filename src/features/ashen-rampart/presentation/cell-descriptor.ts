/**
 * 灰燼の城壁 - 盤面セルの表示記述（純粋）
 *
 * ベースライン観察で「経路と設置スロットの区別がつかない」「砦がどこか分からない」
 * 「地形の絵文字 ⛰ が方向記号 ▲ と誤読される」ことが判明したため、
 * 曖昧さが致命的な要素は絵文字ではなく**日本語テキスト**で示す。
 */
import type { BoardState } from '../domain/board/board-state';
import type { CellPos, PathDirection } from '../domain/board/stage-map';
import {
  isHighGround,
  isSlowCell,
  entranceCell,
  fortressCell,
  pathDirectionAt,
} from '../domain/board/stage-map';
import { getCardDefinition } from '../domain/cards/card-pool';

export type CellKind = 'path' | 'slot' | 'empty';
export type CellTerrain = 'highground' | 'slow' | 'none';

export interface CellDescriptor {
  kind: CellKind;
  terrain: CellTerrain;
  /** 経路の終端（敵の目的地） */
  isFortress: boolean;
  /** 経路の始端（敵の出現地点） */
  isEntrance: boolean;
  /** セルに描くテキスト（砦・入口・地形名）。無ければ空文字 */
  label: string;
  /** 経路の進行方向を示す矢印。無ければ空文字 */
  arrow: string;
  /** 設置済みのタワー／罠のアイコン。無ければ空文字 */
  icon: string;
  /** スクリーンリーダーと自動テストが読む完全な説明 */
  ariaLabel: string;
}

const ARROWS: Readonly<Record<PathDirection, string>> = {
  right: '→',
  left: '←',
  up: '↑',
  down: '↓',
};

const samePos = (a: CellPos, b: CellPos): boolean => a.x === b.x && a.y === b.y;

/** タワー・罠のアイコン。判別できていた記号はそのまま活かす */
const iconOf = (board: BoardState, pos: CellPos): string => {
  const tower = board.towers.find((t) => samePos(t.pos, pos));
  if (tower) {
    const spec = getCardDefinition(tower.cardId).tower;
    if (spec?.aura) return '🔥';
    if (spec?.splashRadius) return '💣';
    return '🏹';
  }
  return board.traps.some((t) => samePos(t.pos, pos)) ? '🕳' : '';
};

/** 設置済みカードの名前（aria-label 用） */
const placedCardName = (board: BoardState, pos: CellPos): string => {
  const tower = board.towers.find((t) => samePos(t.pos, pos));
  if (tower) return getCardDefinition(tower.cardId).name;
  const trap = board.traps.find((t) => samePos(t.pos, pos));
  return trap ? getCardDefinition(trap.cardId).name : '';
};

/**
 * セルの表示情報を組み立てる
 *
 * @param life 砦の残ライフ。渡すと砦セルの説明に含める
 */
export const describeCell = (
  board: BoardState,
  pos: CellPos,
  life?: number
): CellDescriptor => {
  const map = board.map;
  const isPath = map.path.some((p) => samePos(p, pos));
  const isSlot = map.buildSlots.some((s) => samePos(s, pos));
  const kind: CellKind = isPath ? 'path' : isSlot ? 'slot' : 'empty';

  const terrain: CellTerrain = isHighGround(map, pos)
    ? 'highground'
    : isSlowCell(map, pos)
      ? 'slow'
      : 'none';

  const fortress = fortressCell(map);
  const entrance = entranceCell(map);
  const isFortress = !!fortress && samePos(fortress, pos);
  const isEntrance = !!entrance && samePos(entrance, pos);

  const label = isFortress
    ? '砦'
    : isEntrance
      ? '入口'
      : terrain === 'highground'
        ? '高台'
        : terrain === 'slow'
          ? '滞留'
          : '';

  const direction = isPath ? pathDirectionAt(map, pos) : undefined;
  const arrow = direction ? ARROWS[direction] : '';

  const cardName = placedCardName(board, pos);
  const parts = [`マス (${pos.x}, ${pos.y})`];
  if (isPath) parts.push('経路');
  if (kind === 'slot') parts.push('設置可能');
  if (isEntrance) parts.push('敵の入口');
  if (isFortress) {
    parts.push(life === undefined ? '砦' : `砦・残りライフ${life}`);
  }
  if (terrain === 'highground') parts.push('高台');
  if (terrain === 'slow') parts.push('滞留');
  if (cardName) parts.push(cardName);

  return {
    kind,
    terrain,
    isFortress,
    isEntrance,
    label,
    arrow,
    icon: iconOf(board, pos),
    ariaLabel: parts.join('・'),
  };
};
