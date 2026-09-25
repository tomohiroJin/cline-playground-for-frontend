/**
 * 敵の射程が届く経路外セル（反復7 段階2・設計書 §4.3 #5）
 *
 * `maxRangeByLane` の `spec.flying ||` の除外（enemy-reach.ts）は、現行の敵定義に
 * 「射程を持つが飛行」の組み合わせが無いため直接には検査できない（鴉は attackRange: 0）。
 * そこで `getEnemySpec` を差し替え、実在しないテスト専用 ID にだけ合成の定義（射程1.5・飛行）を
 * 返す（他の ID は実物のまま通すので、このファイル以外・このファイル内の他のテストへの
 * 影響はない）。差し替え方は `counterfactual-confound.test.ts` の
 * `jest.mock` + `jest.requireActual` に合わせた（`jest.spyOn` はこの敵定義モジュールの
 * エクスポートに対して `Cannot redefine property` で失敗することを実測済み）。
 */
jest.mock('./enemies', () => {
  // jest.mock はファイル先頭へホイストされるため、外側の import・定数を直接参照できない
  // （ホイスト制約。下の FLYING_WITH_RANGE_ID が初期化される前にこの factory が走る）。
  const actual = jest.requireActual('./enemies') as typeof import('./enemies');
  const flyingWithRangeIdInFactory = 'test-flying-with-range';
  return {
    ...actual,
    getEnemySpec: (id: string) =>
      id === flyingWithRangeIdInFactory
        ? { ...actual.getEnemySpec('raven'), attackRange: 1.5, flying: true }
        : actual.getEnemySpec(id),
  };
});

import { PLAINS_MAP, isPathCell } from '../board/stage-map';
import { enemyReachCells } from './enemy-reach';
import { distanceToSegment } from './geometry';
import type { WaveDefinition } from './waves';

/** 上の jest.mock 内の複製と値を揃える（ホイスト制約のため別の定数） */
const FLYING_WITH_RANGE_ID = 'test-flying-with-range';

const waveOf = (enemyId: string, laneIndex: number): WaveDefinition[] => [
  { startTick: 0, entries: [{ enemyId, count: 1, spawnIntervalTicks: 1, laneIndex }] },
];

describe('enemyReachCells', () => {
  it('北レーンの雑兵（射程1.2）は、北レーンの上下1行の経路外17セルに届く', () => {
    const cells = enemyReachCells(PLAINS_MAP, waveOf('grunt', 0));

    expect(cells).toHaveLength(17);
    expect(new Set(cells.map((c) => c.y))).toEqual(new Set([1, 3]));
    cells.forEach((cell) => expect(isPathCell(PLAINS_MAP, cell)).toBe(false));
  });

  it('射程を持たない敵（俊足）や飛行（鴉）しか出ない台本では、どこにも届かない', () => {
    expect(enemyReachCells(PLAINS_MAP, waveOf('runner', 1))).toEqual([]);
    expect(enemyReachCells(PLAINS_MAP, waveOf('raven', 1))).toEqual([]);
  });

  it('射程を持つ敵でも飛行なら届かない（現行の敵定義に無い組み合わせなので合成の敵で検査する）', () => {
    expect(enemyReachCells(PLAINS_MAP, waveOf(FLYING_WITH_RANGE_ID, 1))).toEqual([]);
  });

  it('経路セルは返さない（経路は置いて塞ぐ場所で、射程の警告の対象外）', () => {
    const cells = enemyReachCells(PLAINS_MAP, waveOf('brute', 0));

    expect(cells.some((cell) => isPathCell(PLAINS_MAP, cell))).toBe(false);
  });

  it('台本に同じレーンの射程持ちが複数いれば、最大の射程で届く範囲を求める', () => {
    const both: WaveDefinition[] = [
      {
        startTick: 0,
        entries: [
          { enemyId: 'grunt', count: 1, spawnIntervalTicks: 1, laneIndex: 1 },
          { enemyId: 'brute', count: 1, spawnIntervalTicks: 1, laneIndex: 1 },
        ],
      },
    ];

    expect(enemyReachCells(PLAINS_MAP, both)).toEqual(enemyReachCells(PLAINS_MAP, waveOf('brute', 1)));
  });
});

describe('distanceToSegment', () => {
  it('線分への最短距離（端点の外は端点への距離）', () => {
    expect(distanceToSegment({ x: 1, y: 1 }, { x: 0, y: 0 }, { x: 2, y: 0 })).toBe(1);
    expect(distanceToSegment({ x: 3, y: 0 }, { x: 0, y: 0 }, { x: 2, y: 0 })).toBe(1);
    expect(distanceToSegment({ x: 0, y: 2 }, { x: 0, y: 0 }, { x: 0, y: 0 })).toBe(2);
  });
});
