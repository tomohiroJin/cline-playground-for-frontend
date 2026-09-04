/**
 * 灰燼の城壁 - 平原フィクスチャの凍結ガード（反復6 段階A0）
 *
 * PLAINS_MAP / PLAINS_WAVES は33ファイル・326箇所から参照され、
 * step-tick-*.test.ts の26箇所が平原の座標を直書きしている。
 * 反復6 は6つの新マップを追加するが、**平原そのものは改変しない**
 * （設計書 §5.2・§12 段階A0）。新マップは別名で追加すること。
 *
 * このテストが赤くなったら、平原を改変しようとしている。
 * 意図的に改変するなら、その前に上記26箇所の座標直書きを移行すること。
 */
import { PLAINS_MAP } from '../board/stage-map';
import { PLAINS_WAVES, totalEnemyCount, totalEnemyHp } from './waves';

describe('平原フィクスチャの凍結（反復6 段階A0）', () => {
  it('マップの寸法・レーン・高台・滞留が変わっていない', () => {
    expect(PLAINS_MAP.id).toBe('plains');
    expect(PLAINS_MAP.width).toBe(9);
    expect(PLAINS_MAP.height).toBe(7);
    expect(PLAINS_MAP.lanes).toHaveLength(2);
    expect(PLAINS_MAP.lanes[0]).toHaveLength(10);
    expect(PLAINS_MAP.lanes[1]).toHaveLength(12);
    // 砦は全レーン共通の終端
    expect(PLAINS_MAP.lanes[0]?.[9]).toEqual({ x: 8, y: 3 });
    expect(PLAINS_MAP.lanes[1]?.[11]).toEqual({ x: 8, y: 3 });
    expect(PLAINS_MAP.highGround).toEqual([{ x: 2, y: 3 }, { x: 6, y: 3 }]);
    expect(PLAINS_MAP.slowCells).toEqual([{ x: 4, y: 5 }, { x: 5, y: 5 }]);
  });

  it('ウェーブ台本の開始tick・体数・総HPが変わっていない', () => {
    expect(PLAINS_WAVES.map((w) => w.startTick)).toEqual([0, 260, 540, 820]);
    // 2 / (2+2) / 22 / (4+13+4) = 49体
    expect(totalEnemyCount(PLAINS_WAVES)).toBe(49);
    expect(totalEnemyHp(PLAINS_WAVES)).toBe(808);
  });
});
