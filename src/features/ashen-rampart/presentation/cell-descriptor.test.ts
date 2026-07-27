import { describeCell } from './cell-descriptor';
import { createBoard, placeTower } from '../domain/board/board-state';
import { PLAINS_MAP } from '../domain/board/stage-map';

const board = createBoard(PLAINS_MAP);

describe('describeCell 経路と目的地', () => {
  it('経路の終端は砦として示される', () => {
    const cell = describeCell(board, { x: 8, y: 1 });

    expect(cell.isFortress).toBe(true);
    expect(cell.label).toBe('砦');
    expect(cell.ariaLabel).toContain('砦');
  });

  it('砦セルは残ライフを説明に含む', () => {
    const cell = describeCell(board, { x: 8, y: 1 }, 4);

    expect(cell.ariaLabel).toContain('残りライフ4');
  });

  it('経路の始端は入口として示される', () => {
    const cell = describeCell(board, { x: 0, y: 3 });

    expect(cell.isEntrance).toBe(true);
    expect(cell.label).toBe('入口');
    expect(cell.ariaLabel).toContain('敵の入口');
  });

  it('経路セルは進行方向の矢印を持つ', () => {
    // (1,3) → (2,3) は右向き
    expect(describeCell(board, { x: 1, y: 3 }).arrow).toBe('→');
    // (4,3) → (4,2) は上向き
    expect(describeCell(board, { x: 4, y: 3 }).arrow).toBe('↑');
  });

  it('経路セルは aria-label に「経路」を含む', () => {
    expect(describeCell(board, { x: 1, y: 3 }).ariaLabel).toContain('経路');
  });
});

describe('describeCell 設置スロット', () => {
  it('設置スロットは slot として区別される', () => {
    const cell = describeCell(board, { x: 1, y: 2 });

    expect(cell.kind).toBe('slot');
    expect(cell.ariaLabel).toContain('設置可能');
  });

  it('経路でもスロットでもないセルは empty になる', () => {
    expect(describeCell(board, { x: 0, y: 0 }).kind).toBe('empty');
  });
});

describe('describeCell 地形', () => {
  it('高台はテキストラベルと aria-label で示される（記号に頼らない）', () => {
    const cell = describeCell(board, { x: 3, y: 4 });

    expect(cell.terrain).toBe('highground');
    expect(cell.label).toBe('高台');
    expect(cell.ariaLabel).toContain('高台');
  });

  it('滞留はテキストラベルと aria-label で示される', () => {
    const cell = describeCell(board, { x: 4, y: 2 });

    expect(cell.terrain).toBe('slow');
    expect(cell.label).toBe('滞留');
    expect(cell.ariaLabel).toContain('滞留');
  });
});

describe('describeCell 設置済みカード', () => {
  it('タワーを置いたセルはアイコンと名前を持つ', () => {
    const withTower = placeTower(board, 'arrow-tower', { x: 1, y: 2 });

    const cell = describeCell(withTower, { x: 1, y: 2 });

    expect(cell.icon).toBe('🏹');
    expect(cell.ariaLabel).toContain('弓兵の塔');
  });
});
