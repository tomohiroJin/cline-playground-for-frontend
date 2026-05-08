// stage.ts のバリデーションテスト

import type { Stage } from './stage';
import { assertValidStage } from './stage';

const validStage: Stage = {
  id: 1,
  title: 'FOREST CALLING',
  numberLabel: 'STAGE 1',
  intro: '霧の向こうで、東の空がうっすらと白んでいる。',
  courseIndex: 0,
  difficulty: 'easy',
  initialTimeSec: 80,
  checkpointBonusSec: 12,
  goldRankTimeSec: 50,
  silverRankTimeSec: 65,
  lapsToClear: 1,
};

describe('assertValidStage', () => {
  it('正常な値はスルーする', () => {
    expect(() => assertValidStage(validStage)).not.toThrow();
  });

  it('initialTimeSec が 0 以下なら例外', () => {
    expect(() => assertValidStage({ ...validStage, initialTimeSec: 0 })).toThrow();
    expect(() => assertValidStage({ ...validStage, initialTimeSec: -1 })).toThrow();
  });

  it('checkpointBonusSec が負なら例外', () => {
    expect(() => assertValidStage({ ...validStage, checkpointBonusSec: -1 })).toThrow();
  });

  it('checkpointBonusSec が 0 は許可（最終ステージ等で 0 もありうる）', () => {
    expect(() => assertValidStage({ ...validStage, checkpointBonusSec: 0 })).not.toThrow();
  });

  it('goldRankTimeSec >= silverRankTimeSec なら例外', () => {
    expect(() =>
      assertValidStage({ ...validStage, goldRankTimeSec: 70, silverRankTimeSec: 70 }),
    ).toThrow();
    expect(() =>
      assertValidStage({ ...validStage, goldRankTimeSec: 70, silverRankTimeSec: 60 }),
    ).toThrow();
  });

  it('lapsToClear が 0 以下なら例外', () => {
    expect(() => assertValidStage({ ...validStage, lapsToClear: 0 })).toThrow();
  });

  it('courseIndex も branch も無いなら例外', () => {
    const { courseIndex: _, ...withoutCourse } = validStage;
    expect(() => assertValidStage(withoutCourse as Stage)).toThrow();
  });

  it('branch のみあれば許可', () => {
    const { courseIndex: _, ...rest } = validStage;
    const branched: Stage = {
      ...rest,
      branch: {
        a: { label: 'ルート A', courseIndex: 1 },
        b: { label: 'ルート B', courseIndex: 2 },
      },
    };
    expect(() => assertValidStage(branched)).not.toThrow();
  });
});
