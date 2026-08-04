/**
 * 敵定義とウェーブ構成のテスト
 *
 * 設計書 §6 の数値がデータになっていること、および
 * カウンター要求3軸（属性・位置・テンポ）が敵として存在することを検証する。
 */
import { getEnemySpec, ENEMY_IDS } from './enemies';
import { PLAINS_WAVES, totalEnemyCount, totalEnemyHp } from './waves';
import { LIFE_INITIAL } from './combat-state';

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

  it('開始 tick は 0/260/540/820 で単調増加する', () => {
    expect(PLAINS_WAVES.map((w) => w.startTick)).toEqual([0, 260, 540, 820]);
  });

  it('敵の総HPは反復3 の較正値 648 と一致する（2レーン化に伴う再較正）', () => {
    expect(totalEnemyHp(PLAINS_WAVES)).toBe(648);
  });

  it('総体数は 45 体', () => {
    expect(totalEnemyCount(PLAINS_WAVES)).toBe(45);
  });

  it('両レーンが使われている（2レーンにした意味が構成に現れている）', () => {
    const lanes = new Set(PLAINS_WAVES.flatMap((w) => w.entries).map((e) => e.laneIndex));
    expect([...lanes].sort()).toEqual([0, 1]);
  });

  it('ウェーブ1は片側だけ、ウェーブ2以降は両レーンに敵が現れる', () => {
    // 導入は1レーンだけを見ればよく、2ウェーブ目で初めて配分の判断が要る、という段階付け
    const lanesOf = (index: number): number[] => [
      ...new Set((PLAINS_WAVES[index]?.entries ?? []).map((e) => e.laneIndex)),
    ];
    expect(lanesOf(0)).toEqual([0]);
    const laterLanes = new Set([...lanesOf(1), ...lanesOf(2), ...lanesOf(3)]);
    expect([...laterLanes].sort()).toEqual([0, 1]);
  });

  it('飛行の総体数が初期ライフを上回る（対空なしでは漏れだけで敗北する形式）', () => {
    const flying = PLAINS_WAVES.flatMap((w) => w.entries)
      .filter((e) => getEnemySpec(e.enemyId).flying)
      .reduce((sum, e) => sum + e.count, 0);
    expect(flying).toBeGreaterThan(LIFE_INITIAL);
  });

  it('全ウェーブが既知の敵だけで構成される', () => {
    PLAINS_WAVES.flatMap((w) => w.entries).forEach((entry) => {
      expect(() => getEnemySpec(entry.enemyId)).not.toThrow();
    });
  });
});
