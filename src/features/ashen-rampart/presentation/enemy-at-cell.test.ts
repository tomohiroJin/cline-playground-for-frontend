/**
 * そのセルにいる敵の種類（反復7 段階2・設計書 §4.3 #4）
 */
import { PLAINS_MAP } from '../domain/board/stage-map';
import type { ActiveEnemy } from '../domain/combat/combat-state';
import { enemyIdAtCell } from './enemy-at-cell';

const enemy = (id: number, enemyId: string, progress: number, overrides: Partial<ActiveEnemy> = {}): ActiveEnemy => ({
  id, enemyId, hp: 10, maxHp: 10, progress, spawnTick: 0,
  laneIndex: 0, alive: true, leaked: false, groundedUntilTick: 0,
  ...overrides,
});

describe('enemyIdAtCell', () => {
  it('マーカーの中心が入っているセル（座標の四捨五入）の敵を返す', () => {
    // 北レーンは y=2 を x=0→8 へ進む。progress 2.4 は x=2.4 で (2,2)、2.6 は x=2.6 で (3,2)
    expect(enemyIdAtCell([enemy(1, 'grunt', 2.4)], PLAINS_MAP, { x: 2, y: 2 })).toBe('grunt');
    expect(enemyIdAtCell([enemy(1, 'grunt', 2.6)], PLAINS_MAP, { x: 2, y: 2 })).toBeUndefined();
    expect(enemyIdAtCell([enemy(1, 'grunt', 2.6)], PLAINS_MAP, { x: 3, y: 2 })).toBe('grunt');
  });

  it('同じセルに複数いれば、state.enemies の並びで最初の生存個体の種類を返す', () => {
    const enemies = [
      enemy(1, 'brute', 2, { alive: false }),
      enemy(2, 'warden', 2.2),
      enemy(3, 'mender', 1.8),
    ];

    expect(enemyIdAtCell(enemies, PLAINS_MAP, { x: 2, y: 2 })).toBe('warden');
  });

  it('レーンごとに座標を解く（南レーンの progress 4 は (3,5)）', () => {
    expect(enemyIdAtCell([enemy(1, 'mender', 4, { laneIndex: 1 })], PLAINS_MAP, { x: 3, y: 5 })).toBe('mender');
  });

  it('敵のいないセルでは undefined', () => {
    expect(enemyIdAtCell([enemy(1, 'grunt', 2)], PLAINS_MAP, { x: 4, y: 0 })).toBeUndefined();
    expect(enemyIdAtCell([], PLAINS_MAP, { x: 2, y: 2 })).toBeUndefined();
  });
});
