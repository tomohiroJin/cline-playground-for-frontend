import { tryThrowStone, updateStoneProjectiles } from '../services/stone';
import { GAME_BALANCE } from '../constants';
import type { GameState } from '../../types';

// 横一直線の通路（y=1）
const maze = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const createState = (over: Partial<GameState> = {}): GameState =>
  ({
    maze,
    player: { x: 1.5, y: 1.5, angle: 0, stamina: 100 }, // +x を向く
    stones: 3,
    stoneProjectiles: [],
    hiding: false,
    ...over,
  }) as GameState;

describe('tryThrowStone', () => {
  it('所持数を減らして照準方向の弾を生成する', () => {
    const g = createState();
    expect(tryThrowStone(g)).toBe(true);
    expect(g.stones).toBe(2);
    expect(g.stoneProjectiles).toHaveLength(1);
    expect(g.stoneProjectiles[0].dirX).toBeCloseTo(1);
    expect(g.stoneProjectiles[0].dirY).toBeCloseTo(0);
  });

  it('所持数0では投げられない', () => {
    const g = createState({ stones: 0 });
    expect(tryThrowStone(g)).toBe(false);
    expect(g.stoneProjectiles).toHaveLength(0);
  });

  it('隠れ中は投げられない', () => {
    const g = createState({ hiding: true });
    expect(tryThrowStone(g)).toBe(false);
  });
});

describe('updateStoneProjectiles', () => {
  it('飛行中は位置が進み、音源は返さない', () => {
    const g = createState();
    tryThrowStone(g);
    const noise = updateStoneProjectiles(g, 16);
    expect(noise).toBeUndefined();
    expect(g.stoneProjectiles[0].x).toBeGreaterThan(1.5);
  });

  it('壁に当たると消えて着地点（音源）を返す', () => {
    const g = createState();
    tryThrowStone(g);
    // 通路長より十分大きい時間で必ず壁到達（x=9 が壁）
    let noise: { x: number; y: number } | undefined;
    for (let i = 0; i < 100 && !noise; i++) noise = updateStoneProjectiles(g, 16);
    expect(noise).toBeDefined();
    expect(noise!.x).toBeLessThan(9);
    expect(g.stoneProjectiles).toHaveLength(0);
  });

  it('最大飛距離 THROW_RANGE で着地する', () => {
    // 長い通路を用意して壁より先に飛距離切れさせる
    const longMaze = [
      Array(30).fill(1),
      [1, ...Array(28).fill(0), 1],
      Array(30).fill(1),
    ];
    const g = createState({ maze: longMaze });
    tryThrowStone(g);
    let noise: { x: number; y: number } | undefined;
    for (let i = 0; i < 200 && !noise; i++) noise = updateStoneProjectiles(g, 16);
    expect(noise).toBeDefined();
    expect(noise!.x - 1.5).toBeLessThanOrEqual(GAME_BALANCE.stone.THROW_RANGE + 0.3);
  });
});
