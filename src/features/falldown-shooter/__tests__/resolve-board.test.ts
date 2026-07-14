import { GameLogic } from '../game-logic';
import { Grid } from '../grid';

/** 幅 w のグリッドを作り、fullRowText の行を全埋めするヘルパー */
const fullRow = (w: number): (string | null)[] => Array(w).fill('x');

describe('GameLogic.resolveBoard', () => {
  describe('連鎖なし', () => {
    test('full 行がなければ chainSteps 空・盤面は重力で settle されること', () => {
      const grid = Grid.create(2, 3);
      grid[0][0] = 'a'; // 浮いたセル1個
      const result = GameLogic.resolveBoard(grid);
      expect(result.chainSteps).toHaveLength(0);
      expect(result.totalLines).toBe(0);
      expect(result.grid[2][0]).toBe('a'); // 落ちて settle
    });
  });

  describe('1連鎖', () => {
    test('full 行が1つ消え、上のセルが落ちること', () => {
      const grid = Grid.create(2, 3);
      grid[2] = fullRow(2); // 最下段 full
      grid[1][0] = 'top';   // その上に浮いたセル
      const result = GameLogic.resolveBoard(grid);
      expect(result.chainSteps).toHaveLength(1);
      expect(result.chainSteps[0].chain).toBe(1);
      expect(result.chainSteps[0].clearedRows).toEqual([2]);
      expect(result.totalLines).toBe(1);
      expect(result.totalCells).toBe(2); // 幅2の1行
      expect(result.grid[2][0]).toBe('top'); // top が最下段へ落下
    });
  });

  describe('多段連鎖', () => {
    test('複数の full 行が同時に消えて落下が起きること', () => {
      // 幅2・高さ3。最下段 full。上のセルが落ちると中段も full になり、同時消去
      const grid = Grid.create(2, 3);
      grid[2] = fullRow(2);      // 最下段 full
      grid[0][0] = 'a';          // 左列に浮いたセル
      grid[1][1] = 'b';          // 右列に浮いたセル
      // 重力で a,b が落ちると grid[1] が full になり、grid[1] と grid[2] が同時消去
      const result = GameLogic.resolveBoard(grid);
      expect(result.chainSteps).toHaveLength(1);
      expect(result.chainSteps[0].chain).toBe(1);
      expect(result.chainSteps[0].clearedRows).toEqual([1, 2]);
      expect(result.totalLines).toBe(2);
      expect(result.totalCells).toBe(4); // 幅2の2行
      expect(result.grid.every(row => row.every(c => c === null))).toBe(true); // 全消し
    });
  });

  test('元のグリッドを破壊しないこと', () => {
    const grid = Grid.create(2, 3);
    grid[2] = fullRow(2);
    GameLogic.resolveBoard(grid);
    expect(grid[2][0]).toBe('x');
  });
});
