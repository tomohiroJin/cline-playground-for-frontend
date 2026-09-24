/**
 * 敵定義の不変条件（反復5・反復7 段階2）
 *
 * 射程を持つ敵をレーンで分けたことを、コメントではなくテストで守る。
 * ここが崩れると群れ22体が盤面を溶かす（設計書 §4.3）。
 */
import { ENEMY_IDS, getEnemySpec } from './enemies';
import { PLAINS_WAVES, type WaveDefinition } from './waves';
import { PROVISIONAL_STAGES } from '../expedition/stage-pool';

/** 凍結台本と、暫定ステージの台本すべて（反復7 段階2 で新敵が暫定ステージに出る） */
const ALL_SCRIPTS: readonly (readonly WaveDefinition[])[] = [
  PLAINS_WAVES,
  ...PROVISIONAL_STAGES.map((stage) => stage.waves),
];

const lanesOf = (
  enemyId: string,
  scripts: readonly (readonly WaveDefinition[])[] = [PLAINS_WAVES]
): Set<number> =>
  new Set(
    scripts.flatMap((waves) =>
      waves.flatMap((wave) =>
        wave.entries.filter((e) => e.enemyId === enemyId).map((e) => e.laneIndex)
      )
    )
  );

describe('射程を持つ敵（反復5・反復7 段階2）', () => {
  it('射程を持つのは重装・雑兵・盾衛だけ', () => {
    const withRange = ENEMY_IDS.filter((id) => getEnemySpec(id).attackRange > 0);
    expect(withRange.sort()).toEqual(['brute', 'grunt', 'warden']);
  });

  it('射程を持つ敵は、凍結台本でも暫定ステージでも北レーン（0）以外に出ない', () => {
    // 南レーンは群れと鴉の道。ここに射程を配ると上限3 でも盤面が溶ける（反復5 §4.3）
    ENEMY_IDS.filter((id) => getEnemySpec(id).attackRange > 0).forEach((id) => {
      expect([...lanesOf(id, ALL_SCRIPTS)].filter((lane) => lane !== 0)).toEqual([]);
    });
  });

  it('凍結台本の射程持ち（雑兵・重装）は北レーンに出現する', () => {
    expect([...lanesOf('grunt')]).toEqual([0]);
    expect([...lanesOf('brute')]).toEqual([0]);
  });

  it('射程を持たない敵は、凍結台本では南レーンに出現する（レーンの性格分けが成立している）', () => {
    const southOnly = ENEMY_IDS.filter(
      (id) => getEnemySpec(id).attackRange === 0 && lanesOf(id).size > 0
    );
    expect(southOnly.length).toBeGreaterThan(0);
    southOnly.forEach((id) => {
      expect([...lanesOf(id)]).toEqual([1]);
    });
  });
});
