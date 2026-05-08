// 8 ステージのカタログデータ
//
// 数値は spec.md §2.2（2026-05-08 暫定）。プレイテストで微調整予定。
// コース index は domain/track/course.ts の COURSES に対応:
//   0=Forest, 1=City, 2=Mountain, 3=Beach, 4=Night, 5=Snow

import type { Stage, StageId } from './stage';
import { assertValidStage } from './stage';

const STAGES: readonly Stage[] = [
  {
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
  },
  {
    id: 2,
    title: 'BEACHSIDE RALLY',
    numberLabel: 'STAGE 2',
    intro: '潮風が頬を撫でた。朝の光が砂を金色に染めていく。',
    courseIndex: 3,
    difficulty: 'easy',
    initialTimeSec: 72,
    checkpointBonusSec: 11,
    goldRankTimeSec: 48,
    silverRankTimeSec: 62,
    lapsToClear: 1,
  },
  {
    id: 3,
    title: 'NEON STREET',
    numberLabel: 'STAGE 3',
    intro: '街の灯りが滲む。夜明け前のネオンは、いつも少しだけ眩しい。',
    branch: {
      a: { label: '大通りルート', courseIndex: 1 },
      b: { label: '路地裏ショート', courseIndex: 0 },  // Forest を路地裏に流用
    },
    difficulty: 'normal',
    initialTimeSec: 66,
    checkpointBonusSec: 10,
    goldRankTimeSec: 44,
    silverRankTimeSec: 58,
    lapsToClear: 1,
  },
  {
    id: 4,
    title: 'MOUNTAIN PASS',
    numberLabel: 'STAGE 4',
    intro: '稜線の影が長く伸びる。光と闇の境界を縫って走る。',
    courseIndex: 2,
    difficulty: 'normal',
    initialTimeSec: 70,
    checkpointBonusSec: 10,
    goldRankTimeSec: 56,
    silverRankTimeSec: 68,
    lapsToClear: 1,
  },
  {
    id: 5,
    title: 'WHITE OUT',
    numberLabel: 'STAGE 5',
    intro: '雪の白が視界を覆う。夜明けの色は、ここではまだ見えない。',
    branch: {
      a: { label: '凍結ロング', courseIndex: 5 },
      b: { label: '雪原ショート', courseIndex: 3 },  // Beach を雪原に流用
    },
    difficulty: 'hard',
    initialTimeSec: 60,
    checkpointBonusSec: 9,
    goldRankTimeSec: 50,
    silverRankTimeSec: 62,
    lapsToClear: 1,
  },
  {
    id: 6,
    title: 'MIDNIGHT CHASE',
    numberLabel: 'STAGE 6',
    intro: '星はまだ落ちない。夜の底をエンジンの音だけが切り裂く。',
    courseIndex: 4,
    difficulty: 'hard',
    initialTimeSec: 58,
    checkpointBonusSec: 8,
    goldRankTimeSec: 52,
    silverRankTimeSec: 64,
    lapsToClear: 1,
  },
  {
    id: 7,
    title: 'GRAND PRIX FINAL',
    numberLabel: 'STAGE 7',
    intro: '空の端がわずかに白んだ。決着は、夜が明けるまでに。',
    // Stage 7 は Forest コース（index 0）の高難度バリアント。
    // 現実装ではコース修飾子は未対応のため Phase 1 では既存 Forest をそのまま使う。
    courseIndex: 0,
    difficulty: 'extreme',
    initialTimeSec: 50,
    checkpointBonusSec: 7,
    goldRankTimeSec: 38,
    silverRankTimeSec: 50,
    lapsToClear: 1,
  },
  {
    id: 8,
    title: 'OVERDRIVE',
    numberLabel: 'STAGE 8',
    intro: '夜明けまで、あとひと走りだ。',
    branch: {
      a: { label: '標準ルート', courseIndex: 2 },
      b: { label: 'ショートカット & 障害物多', courseIndex: 4 },  // Night を流用
    },
    difficulty: 'extreme',
    initialTimeSec: 46,
    checkpointBonusSec: 6,
    goldRankTimeSec: 50,
    silverRankTimeSec: 60,
    lapsToClear: 1,
  },
];

// ロード時に全ステージの不変条件を検証
STAGES.forEach(assertValidStage);

const STAGE_BY_ID: ReadonlyMap<StageId, Stage> = new Map(STAGES.map((s) => [s.id, s]));

/** ステージ ID から Stage を取得 */
export const getStage = (id: StageId): Stage => {
  const stage = STAGE_BY_ID.get(id);
  if (!stage) throw new Error(`Stage not found: ${id}`);
  return stage;
};

/** 次のステージを取得（ステージ 8 の次は undefined） */
export const getNextStage = (id: StageId): Stage | undefined => {
  if (id >= 8) return undefined;
  return getStage((id + 1) as StageId);
};

/** 全ステージのリスト */
export const getAllStages = (): readonly Stage[] => STAGES;
