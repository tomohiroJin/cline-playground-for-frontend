import { getEnemySpec } from './enemies';
import { PLAINS_WAVES } from './waves';

describe('enemies', () => {
  it('雑兵・俊足・重装の3種が定義されている', () => {
    expect(getEnemySpec('grunt').name).toBe('雑兵');
    expect(getEnemySpec('runner').speed).toBeGreaterThan(getEnemySpec('grunt').speed);
    expect(getEnemySpec('brute').hp).toBeGreaterThan(getEnemySpec('grunt').hp);
  });

  it('未知の敵IDは例外を投げる', () => {
    expect(() => getEnemySpec('dragon')).toThrow();
  });
});

describe('PLAINS_WAVES', () => {
  it('3ウェーブ定義され、全エントリの敵IDが解決できる', () => {
    expect(PLAINS_WAVES).toHaveLength(3);
    for (const wave of PLAINS_WAVES) {
      for (const entry of wave.entries) {
        expect(() => getEnemySpec(entry.enemyId)).not.toThrow();
        expect(entry.count).toBeGreaterThan(0);
        expect(entry.spawnIntervalTicks).toBeGreaterThan(0);
      }
    }
  });

  it('後のウェーブほど総HP量が増える（難易度曲線）', () => {
    const totalHp = (waveIndex: number) =>
      PLAINS_WAVES[waveIndex].entries.reduce(
        (sum, e) => sum + getEnemySpec(e.enemyId).hp * e.count,
        0
      );
    expect(totalHp(1)).toBeGreaterThan(totalHp(0));
    expect(totalHp(2)).toBeGreaterThan(totalHp(1));
  });
});
