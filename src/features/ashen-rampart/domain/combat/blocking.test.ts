import { blockerIndexFor } from './blocking';
import { PLAINS_MAP, laneOf } from '../board/stage-map';
import type { ActiveEnemy, PlacedUnit } from './combat-state';

const enemyAt = (progress: number, overrides: Partial<ActiveEnemy> = {}): ActiveEnemy => ({
  id: 1, enemyId: 'grunt', hp: 20, maxHp: 20, progress, spawnTick: 0,
  laneIndex: 0, alive: true, leaked: false,
  groundedUntilTick: 0, stunnedUntilTick: 0, ...overrides,
});

const unitAt = (x: number, y: number): PlacedUnit => ({
  cardId: 'stone-wall', pos: { x, y }, hp: 60, maxHp: 60, cooldownLeft: 0,
});

const ctxWith = (units: PlacedUnit[], tick = 0) => ({ units, map: PLAINS_MAP, tick });

describe('blockerIndexFor', () => {
  it('次に進入するセルに守り手がいれば、その index を返す', () => {
    const next = laneOf(PLAINS_MAP, 0)[3]!;
    expect(blockerIndexFor(ctxWith([unitAt(next.x, next.y)]), enemyAt(2))).toBe(0);
  });

  it('次のセルに何もいなければ undefined を返す', () => {
    expect(blockerIndexFor(ctxWith([]), enemyAt(2))).toBeUndefined();
  });

  it('足元のセルに守り手が後から置かれた場合も止まる', () => {
    const here = laneOf(PLAINS_MAP, 0)[2]!;
    // progress 2.0 ちょうど = セル2 の上にいる
    expect(blockerIndexFor(ctxWith([unitAt(here.x, here.y)]), enemyAt(2))).toBe(0);
  });

  it('別レーンの守り手には止められない（レーンの独立）', () => {
    const southCell = laneOf(PLAINS_MAP, 1)[3]!;
    const units = [unitAt(southCell.x, southCell.y)];
    expect(blockerIndexFor(ctxWith(units), enemyAt(2, { laneIndex: 0 }))).toBeUndefined();
  });

  it('死んでいる敵は誰にも止められない', () => {
    const next = laneOf(PLAINS_MAP, 0)[3]!;
    const units = [unitAt(next.x, next.y)];
    expect(blockerIndexFor(ctxWith(units), enemyAt(2, { alive: false }))).toBeUndefined();
  });
});
