import { applyChain } from '../hooks/apply-chain';
import { Grid } from '../grid';

describe('applyChain', () => {
  test('連鎖なしなら加算0・grid は settle 済み', () => {
    const grid = Grid.create(2, 2);
    grid[0][0] = 'a';
    const r = applyChain(grid, { stage: 1 }, { scoreMultiplier: 1, comboMult: 1 });
    expect(r.addedLines).toBe(0);
    expect(r.addedScore).toBe(0);
    expect(r.grid[1][0]).toBe('a'); // 落ちている
  });

  test('full 行があれば onLineClear が呼ばれスコアが加算される', () => {
    const grid = Grid.create(2, 2);
    grid[1] = ['x', 'x'];
    const onLineClear = jest.fn();
    const r = applyChain(grid, { stage: 1 }, { scoreMultiplier: 1, comboMult: 1, onLineClear });
    expect(r.addedLines).toBe(1);
    expect(onLineClear).toHaveBeenCalledWith(1);
    expect(r.addedScore).toBeGreaterThan(0);
  });
});
