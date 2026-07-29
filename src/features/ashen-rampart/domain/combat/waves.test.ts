/**
 * 敵定義とウェーブ構成のテスト
 *
 * 設計書 §6 の数値がデータになっていること、および
 * カウンター要求3軸（属性・位置・テンポ）が敵として存在することを検証する。
 */
import { getEnemySpec, ENEMY_IDS } from './enemies';
import { PLAINS_WAVES, totalEnemyCount, totalEnemyHp } from './waves';

describe('敵定義', () => {
  it('敵は5種ある', () => {
    expect(ENEMY_IDS).toHaveLength(5);
  });

  it('飛行するのは鴉だけ（属性のカウンター要求）', () => {
    const flying = ENEMY_IDS.filter((id) => getEnemySpec(id).flying);
    expect(flying).toEqual(['raven']);
  });

  it('俊足は雑兵より速い（テンポのカウンター要求）', () => {
    expect(getEnemySpec('runner').speed).toBeGreaterThan(getEnemySpec('grunt').speed);
  });

  it('重装は最も硬く最も遅い', () => {
    const hps = ENEMY_IDS.map((id) => getEnemySpec(id).hp);
    expect(getEnemySpec('brute').hp).toBe(Math.max(...hps));
    const speeds = ENEMY_IDS.map((id) => getEnemySpec(id).speed);
    expect(getEnemySpec('brute').speed).toBe(Math.min(...speeds));
  });

  it('未知の敵IDは契約違反として例外', () => {
    expect(() => getEnemySpec('unknown')).toThrow('未知の敵IDです: unknown');
  });
});

describe('ウェーブ構成', () => {
  it('4ウェーブある', () => {
    expect(PLAINS_WAVES).toHaveLength(4);
  });

  it('開始 tick は 0/250/500/750 で単調増加する', () => {
    expect(PLAINS_WAVES.map((w) => w.startTick)).toEqual([0, 250, 500, 750]);
  });

  it('敵の総HPは設計書の較正値 964 と一致する（Task 9 較正: 詰み修正後に 1472 から再調整）', () => {
    expect(totalEnemyHp(PLAINS_WAVES)).toBe(964);
  });

  it('総体数は 52 体', () => {
    expect(totalEnemyCount(PLAINS_WAVES)).toBe(52);
  });

  it('鴉だけが経路の中盤から出現する（位置のカウンター要求）', () => {
    const entries = PLAINS_WAVES.flatMap((w) => w.entries);
    entries.forEach((entry) => {
      if (entry.enemyId === 'raven') {
        expect(entry.spawnPathIndex).toBe(5);
      } else {
        expect(entry.spawnPathIndex).toBe(0);
      }
    });
  });

  it('全ウェーブが既知の敵だけで構成される', () => {
    PLAINS_WAVES.flatMap((w) => w.entries).forEach((entry) => {
      expect(() => getEnemySpec(entry.enemyId)).not.toThrow();
    });
  });
});
