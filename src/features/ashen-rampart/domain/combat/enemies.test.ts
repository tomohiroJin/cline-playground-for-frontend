/**
 * 敵定義の不変条件（反復5）
 *
 * 射程を持つ敵をレーンで分けたことを、コメントではなくテストで守る。
 * ここが崩れると群れ22体が盤面を溶かす（設計書 §4.3）。
 */
import { ENEMY_IDS, getEnemySpec } from './enemies';
import { PLAINS_WAVES } from './waves';

/** その敵が出現するレーン番号の集合 */
const lanesOf = (enemyId: string): Set<number> =>
  new Set(
    PLAINS_WAVES.flatMap((wave) =>
      wave.entries.filter((e) => e.enemyId === enemyId).map((e) => e.laneIndex)
    )
  );

describe('射程を持つ敵（反復5）', () => {
  it('射程を持つのは重装と雑兵だけ', () => {
    const withRange = ENEMY_IDS.filter((id) => getEnemySpec(id).attackRange > 0);
    expect(withRange.sort()).toEqual(['brute', 'grunt']);
  });

  it('射程を持つ敵はすべて北レーン（0）にしか出現しない', () => {
    // 南レーンは群れ22体と鴉13体。ここに射程を配ると盤面が溶ける
    ENEMY_IDS.filter((id) => getEnemySpec(id).attackRange > 0).forEach((id) => {
      expect([...lanesOf(id)]).toEqual([0]);
    });
  });

  it('射程を持たない敵は南レーンに出現する（レーンの性格分けが成立している）', () => {
    const southOnly = ENEMY_IDS.filter(
      (id) => getEnemySpec(id).attackRange === 0 && lanesOf(id).size > 0
    );
    expect(southOnly.length).toBeGreaterThan(0);
    southOnly.forEach((id) => {
      expect([...lanesOf(id)]).toEqual([1]);
    });
  });
});
