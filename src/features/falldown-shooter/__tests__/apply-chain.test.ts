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

  test('同色グループのみの連鎖（完全行なし）でもセル点で加算され、onLineClear は呼ばれないこと', () => {
    // 幅4・高さ2に 2x2 の同色赤（4連結＝CHAIN_MATCH_SIZE 到達）。完全行は作らない。
    const grid = Grid.create(4, 2);
    grid[0][0] = 'r';
    grid[0][1] = 'r';
    grid[1][0] = 'r';
    grid[1][1] = 'r';
    const onLineClear = jest.fn();
    const r = applyChain(grid, { stage: 1 }, { scoreMultiplier: 1, comboMult: 1, onLineClear });
    expect(r.addedLines).toBe(0); // 完全行なし＝ステージ進行には数えない
    expect(r.addedScore).toBeGreaterThan(0); // だがセル点で加点される
    expect(onLineClear).not.toHaveBeenCalled(); // 完全行なし＝コンボ登録はしない
  });
});
