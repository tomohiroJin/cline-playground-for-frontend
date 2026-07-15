import { GameLogic } from '../game-logic';
import { Grid } from '../grid';

describe('GameLogic.resolveBoard（ハイブリッド: 同色グループ ∪ 完全行）', () => {
  describe('消去なし', () => {
    test('グループも完全行もなければ chainSteps 空・盤面は settle されること', () => {
      const grid = Grid.create(3, 3);
      grid[0][0] = 'r'; // 孤立した1セル
      const result = GameLogic.resolveBoard(grid, 4);
      expect(result.chainSteps).toHaveLength(0);
      expect(result.totalLines).toBe(0);
      expect(result.grid[2][0]).toBe('r'); // 落ちて settle
    });
  });

  describe('完全行の消去（デフォルト閾値ではグループ化しない）', () => {
    test('小さな完全行は line として消えること', () => {
      const grid = Grid.create(2, 2);
      grid[1] = ['x', 'x']; // 幅2の最下段 full（同色だが size2 < CHAIN_MATCH_SIZE(4)）
      const result = GameLogic.resolveBoard(grid); // デフォルト minGroupSize=4
      expect(result.chainSteps).toHaveLength(1);
      expect(result.chainSteps[0].clearedRows).toEqual([1]);
      expect(result.totalLines).toBe(1);
      expect(result.grid.every(row => row.every(c => c === null))).toBe(true);
    });
  });

  describe('同色グループの消去', () => {
    test('size 以上の同色グループが1連鎖で消えること', () => {
      const grid = Grid.create(3, 2);
      grid[1][0] = 'r';
      grid[1][1] = 'r';
      grid[1][2] = 'r'; // 横3連結の赤（完全行でもある: 幅3全埋め）
      const result = GameLogic.resolveBoard(grid, 3);
      expect(result.chainSteps).toHaveLength(1);
      expect(result.chainSteps[0].cellsCleared).toBe(3);
      expect(result.grid.every(row => row.every(c => c === null))).toBe(true);
    });
  });

  describe('本物の多段連鎖（同色グループ駆動・完全行なし）', () => {
    test('赤グループが消えて上の緑が落ち、緑グループが揃って2連鎖すること', () => {
      // 幅4・高さ4。col0 に縦3の赤、その上に緑1。col1 に緑2。cols2,3 は空（=完全行なし）。
      // 赤3が消えると col0 の緑が落ち、col1 の緑と連結して緑3グループ → 2連鎖。
      const grid = Grid.create(4, 4);
      grid[0][0] = 'G';
      grid[1][0] = 'R';
      grid[2][0] = 'R';
      grid[3][0] = 'R';
      grid[2][1] = 'G';
      grid[3][1] = 'G';
      const result = GameLogic.resolveBoard(grid, 3);
      expect(result.chainSteps).toHaveLength(2);
      expect(result.chainSteps[0].chain).toBe(1);
      expect(result.chainSteps[1].chain).toBe(2);
      expect(result.totalLines).toBe(0); // 完全行は一度も発生しない
      expect(result.totalCells).toBe(6); // 赤3 + 緑3
      expect(result.grid.every(row => row.every(c => c === null))).toBe(true); // 全消し
    });
  });

  test('元のグリッドを破壊しないこと', () => {
    const grid = Grid.create(2, 2);
    grid[1] = ['x', 'x'];
    GameLogic.resolveBoard(grid);
    expect(grid[1][0]).toBe('x');
  });
});
