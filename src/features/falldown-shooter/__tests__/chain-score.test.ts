import { GameLogic } from '../game-logic';
import type { ChainStep } from '../types';

/** テスト用 ChainStep 生成（cellsCleared 個のセル・rows 個の完全行） */
const step = (chain: number, cellsCleared: number, rows: number): ChainStep => ({
  chain,
  clearedCells: Array.from({ length: cellsCleared }, (_, i) => ({ x: i, y: 0 })),
  clearedRows: Array.from({ length: rows }, (_, i) => i),
  grid: [],
  cellsCleared,
});

describe('GameLogic.getChainMultiplier', () => {
  test.each([
    [1, 1.0],
    [2, 1.5],
    [3, 2.5],
    [4, 4.0],
    [5, 6.0],
    [6, 8.0],
    [10, 8.0], // 6以上は上限
  ])('連鎖%iで倍率%f', (chain, expected) => {
    expect(GameLogic.getChainMultiplier(chain)).toBe(expected);
  });

  test('連鎖0（=消去なし）は倍率1.0', () => {
    expect(GameLogic.getChainMultiplier(0)).toBe(1.0);
  });
});

describe('GameLogic.calcResolveScore', () => {
  test('同色グループのみ（行なし）: cellsCleared × block点', () => {
    // base = 4*10 = 40。stage2 × scoreMult1.5 × chain1(1.0) × combo2.0 = 40*6 = 240
    const score = GameLogic.calcResolveScore([step(1, 4, 0)], {
      stage: 2,
      scoreMultiplier: 1.5,
      comboMult: 2.0,
    });
    expect(score).toBe(240);
  });

  test('多段連鎖: 各ステップのセル点を積み、最大連鎖倍率を掛けること', () => {
    // step1=4セル(40), step2=4セル(40) → base=80。最大連鎖2 → chainMult1.5
    const score = GameLogic.calcResolveScore([step(1, 4, 0), step(2, 4, 0)], {
      stage: 1,
      scoreMultiplier: 1.0,
      comboMult: 1.0,
    });
    expect(score).toBe(120); // 80 * 1.5
  });

  test('完全行を含む: セル点＋行ボーナス（line点×同時消し）', () => {
    // step1=3セル+1行 → base = 3*10 + 1*100*1.0 = 130。stage1×mult1×chain1×combo1
    const score = GameLogic.calcResolveScore([step(1, 3, 1)], {
      stage: 1,
      scoreMultiplier: 1.0,
      comboMult: 1.0,
    });
    expect(score).toBe(130);
  });

  test('連鎖なし（空配列）は0点', () => {
    expect(GameLogic.calcResolveScore([], { stage: 1, scoreMultiplier: 1, comboMult: 1 })).toBe(0);
  });
});
