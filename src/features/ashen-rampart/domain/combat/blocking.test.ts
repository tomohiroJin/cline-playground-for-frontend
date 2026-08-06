import { blockerIndexFor, MAX_ATTACKERS_PER_BLOCKER, attackersFor, attackTargetIndexFor } from './blocking';
import { PLAINS_MAP, laneOf } from '../board/stage-map';
import type { CellPos } from '../board/stage-map';
import type { ActiveEnemy, PlacedUnit } from './combat-state';

const enemyAt = (progress: number, overrides: Partial<ActiveEnemy> = {}): ActiveEnemy => ({
  id: 1, enemyId: 'grunt', hp: 20, maxHp: 20, progress, spawnTick: 0,
  laneIndex: 0, alive: true, leaked: false,
  groundedUntilTick: 0, ...overrides,
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

describe('MAX_ATTACKERS_PER_BLOCKER', () => {
  const lane = laneOf(PLAINS_MAP, 0);
  const blockCell = lane[3]!;
  const units = [unitAt(blockCell.x, blockCell.y)];
  // 同じブロッカーの手前に 10 体を並べる
  const many = Array.from({ length: 10 }, (_, i) => enemyAt(2.9 - i * 0.01, { id: i }));

  it('上限は3である', () => {
    expect(MAX_ATTACKERS_PER_BLOCKER).toBe(3);
  });

  it('同一ブロッカーを殴れるのは先頭3体までである', () => {
    const attackers = attackersFor(ctxWith(units), many, 0);
    expect(attackers).toHaveLength(MAX_ATTACKERS_PER_BLOCKER);
  });

  it('選ばれるのは進行度が高い順（先頭）である', () => {
    const attackers = attackersFor(ctxWith(units), many, 0);
    const progresses = attackers.map((e) => e.progress);
    expect(progresses).toEqual([...progresses].sort((a, b) => b - a));
    expect(progresses[0]).toBe(Math.max(...many.map((e) => e.progress)));
  });

  it('上限より少ない敵しかいなければ全員が殴る', () => {
    const few = many.slice(0, 2);
    expect(attackersFor(ctxWith(units), few, 0)).toHaveLength(2);
  });
});

describe('attackTargetIndexFor（反復5: 射程内の守り手を撃つ）', () => {
  // PLAINS_MAP のレーン0 の3番目のセルを基準に、その隣接セルへ守り手を置く。
  // 座標をハードコードせず地図から取るのは、地図が変わってもテストの意味が保たれるようにするため。
  const lane0 = laneOf(PLAINS_MAP, 0);
  const cellAt = (index: number): CellPos => {
    const cell = lane0[index];
    if (!cell) throw new Error(`レーン0 に index ${index} のセルがありません`);
    return cell;
  };

  const enemyAt = (progress: number, enemyId: string): ActiveEnemy => ({
    id: 1, enemyId, hp: 60, maxHp: 60, progress,
    spawnTick: 0, laneIndex: 0, alive: true, leaked: false, groundedUntilTick: 0,
  });

  const unitAt = (pos: CellPos): PlacedUnit => ({
    cardId: 'arrow-tower', pos, hp: 8, maxHp: 8, cooldownLeft: 0,
  });

  it('射程0 の敵は、ブロックされていなければ誰も攻撃しない', () => {
    // 俊足は南レーン専属で attackRange 0 のまま（Task 5 でも変わらない）。
    // ここで雑兵を使うと Task 5 で射程1.2 が入った瞬間にこのテストが自壊する
    const beside = { x: cellAt(3).x, y: cellAt(3).y + 1 };
    const ctx = { units: [unitAt(beside)], map: PLAINS_MAP, tick: 100 };
    expect(attackTargetIndexFor(ctx, enemyAt(3, 'runner'))).toBeUndefined();
  });

  it('自分をブロックしている守り手を、射程内の他の守り手より優先する', () => {
    // 経路上の壁（ブロッカー）と、より近い経路外の塔を同時に置く。
    // 優先順位が壊れると壁が機能を失い、反復3 の中核（経路上でブロックする）が壊れる
    const blockerCell = cellAt(4);
    const nearbyOffPath = { x: cellAt(3).x, y: cellAt(3).y + 1 };
    const ctx = {
      units: [unitAt(nearbyOffPath), unitAt(blockerCell)],
      map: PLAINS_MAP,
      tick: 100,
    };
    // index 1 = ブロッカー。index 0 のほうが敵に近いが、ブロッカーが勝つ
    expect(attackTargetIndexFor(ctx, enemyAt(3, 'brute'))).toBe(1);
  });

  it('ブロッカーがいなければ、射程内で最も近い守り手を選ぶ', () => {
    const near = { x: cellAt(3).x, y: cellAt(3).y + 1 };
    const far = { x: cellAt(3).x, y: cellAt(3).y + 2 };
    const ctx = { units: [unitAt(far), unitAt(near)], map: PLAINS_MAP, tick: 100 };
    expect(attackTargetIndexFor(ctx, enemyAt(3, 'brute'))).toBe(1);
  });

  it('射程外の守り手は選ばない', () => {
    const farAway = { x: cellAt(3).x, y: cellAt(3).y + 5 };
    const ctx = { units: [unitAt(farAway)], map: PLAINS_MAP, tick: 100 };
    expect(attackTargetIndexFor(ctx, enemyAt(3, 'brute'))).toBeUndefined();
  });

  it('飛行中の敵は射程内でも攻撃しない', () => {
    const beside = { x: cellAt(3).x, y: cellAt(3).y + 1 };
    const ctx = { units: [unitAt(beside)], map: PLAINS_MAP, tick: 100 };
    // 鴉は飛行。groundedUntilTick 0 なので tick 100 では飛んでいる
    expect(attackTargetIndexFor(ctx, enemyAt(3, 'raven'))).toBeUndefined();
  });

  it('死んだ敵は攻撃しない', () => {
    const beside = { x: cellAt(3).x, y: cellAt(3).y + 1 };
    const ctx = { units: [unitAt(beside)], map: PLAINS_MAP, tick: 100 };
    expect(attackTargetIndexFor(ctx, { ...enemyAt(3, 'brute'), alive: false })).toBeUndefined();
  });
});
