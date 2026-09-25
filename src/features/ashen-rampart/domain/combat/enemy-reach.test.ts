/**
 * 敵の射程が届く経路外セル（反復7 段階2・設計書 §4.3 #5）
 */
import { PLAINS_MAP, isPathCell } from '../board/stage-map';
import { enemyReachCells } from './enemy-reach';
import { distanceToSegment } from './geometry';
import type { WaveDefinition } from './waves';

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
