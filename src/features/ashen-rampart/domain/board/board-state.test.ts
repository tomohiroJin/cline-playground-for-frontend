import { PLAINS_MAP } from './stage-map';
import {
  createBoard,
  canPlaceTower,
  canPlaceTrap,
  placeTower,
  placeTrap,
} from './board-state';

describe('PLAINS_MAP', () => {
  it('経路は連結している（隣接セル同士）', () => {
    for (let i = 1; i < PLAINS_MAP.path.length; i++) {
      const a = PLAINS_MAP.path[i - 1];
      const b = PLAINS_MAP.path[i];
      const dist = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
      expect(dist).toBe(1);
    }
  });

  it('設置マスは経路と重ならない', () => {
    for (const slot of PLAINS_MAP.buildSlots) {
      const onPath = PLAINS_MAP.path.some((p) => p.x === slot.x && p.y === slot.y);
      expect(onPath).toBe(false);
    }
  });
});

describe('board-state', () => {
  const board = createBoard(PLAINS_MAP);
  const slot = PLAINS_MAP.buildSlots[0];
  const pathCell = PLAINS_MAP.path[3];

  it('設置マスにはタワーを置ける', () => {
    expect(canPlaceTower(board, slot)).toBe(true);
    const next = placeTower(board, 'arrow-tower', slot);
    expect(next.towers).toHaveLength(1);
  });

  it('同じマスに二重にタワーは置けない', () => {
    const next = placeTower(board, 'arrow-tower', slot);
    expect(canPlaceTower(next, slot)).toBe(false);
    expect(() => placeTower(next, 'arrow-tower', slot)).toThrow();
  });

  it('経路マスにはタワーを置けない', () => {
    expect(canPlaceTower(board, pathCell)).toBe(false);
  });

  it('罠は経路マスにのみ置ける（usesLeft はカード定義から）', () => {
    expect(canPlaceTrap(board, pathCell)).toBe(true);
    expect(canPlaceTrap(board, slot)).toBe(false);
    const next = placeTrap(board, 'spike-trap', pathCell);
    expect(next.traps[0].usesLeft).toBe(3);
  });

  it('同じ経路マスに二重に罠は置けない', () => {
    const next = placeTrap(board, 'spike-trap', pathCell);
    expect(() => placeTrap(next, 'pitfall', pathCell)).toThrow();
  });

  it('元の盤面は変更されない（イミュータブル）', () => {
    placeTower(board, 'arrow-tower', slot);
    expect(board.towers).toHaveLength(0);
  });
});
