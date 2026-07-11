import { MinimapRenderer, MinimapData } from '../minimap-renderer';
import { GameStateBuilder } from './helpers/game-state-builder';

/** arc 呼び出し座標を記録する CanvasRenderingContext2D スタブ */
const createCtxStub = () => {
  const arcs: Array<{ x: number; y: number }> = [];
  const ctx = {
    clearRect: jest.fn(), fillRect: jest.fn(), beginPath: jest.fn(), fill: jest.fn(),
    arc: jest.fn((x: number, y: number) => arcs.push({ x, y })),
    globalAlpha: 1, fillStyle: '', shadowColor: '', shadowBlur: 0,
  } as unknown as CanvasRenderingContext2D;
  return { ctx, arcs };
};

/** 未探索セル (5,5) に敵を1体配置した MinimapData を生成する */
const makeData = (overrides: Partial<MinimapData>): MinimapData => {
  const g = GameStateBuilder.create()
    .withEnemy('wanderer', { x: 5.5, y: 5.5, active: true })
    .build();
  return {
    maze: g.maze, player: g.player, exit: g.exit, items: [], enemies: g.enemies,
    keys: 0, reqKeys: 2, explored: { '1,1': true }, time: 0, enemyReveal: false,
    ...overrides,
  };
};

describe('MinimapRenderer 敵表示', () => {
  test('通常時: 未探索セルの敵は描画されない', () => {
    const { ctx, arcs } = createCtxStub();
    MinimapRenderer.render(ctx, makeData({ enemyReveal: false }));
    // プレイヤー分の arc のみ（敵の arc = 5.5*CELL(4) = 22 が存在しない）
    expect(arcs.some(a => a.x === 22 && a.y === 22)).toBe(false);
  });

  test('地図効果中: 未探索セルの敵も描画される', () => {
    const { ctx, arcs } = createCtxStub();
    MinimapRenderer.render(ctx, makeData({ enemyReveal: true }));
    expect(arcs.some(a => a.x === 22 && a.y === 22)).toBe(true);
  });

  test('通常時でも探索済みセルの敵は描画される', () => {
    const { ctx, arcs } = createCtxStub();
    MinimapRenderer.render(ctx, makeData({ enemyReveal: false, explored: { '5,5': true } }));
    expect(arcs.some(a => a.x === 22 && a.y === 22)).toBe(true);
  });
});
