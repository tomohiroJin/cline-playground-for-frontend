// 8 ステージのカタログデータ
//
// 数値は spec.md §2.2（2026-05-08 暫定）。プレイテストで微調整予定。
// コース index は domain/track/course.ts の COURSES に対応:
//   0=Forest, 1=City, 2=Mountain, 3=Beach, 4=Night, 5=Snow, 6=Canyon, 7=Highway
//
// 周回数（lapsToClear）は難易度別に段階化:
//   easy=1 / normal=2 / hard=2 / extreme=3。
//   複数周ステージは initialTimeSec / goldRankTimeSec / silverRankTimeSec を
//   周回数ぶん（×lapsToClear）スケールし、1 周あたりの難度を維持する。
// メイン 8 ステージ（通常ステージの courseIndex、分岐ステージは branch.a）は
//   全て異なるコースを使う（フィードバック「全く同じコースがつまらない」対応）。

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
      a: { label: '大通りルート', courseIndex: 1 },  // City
      b: { label: '路地裏ショート', courseIndex: 4 },  // Night（夜の路地裏）
    },
    difficulty: 'normal',
    initialTimeSec: 132,  // 66 × 2 周
    checkpointBonusSec: 10,
    goldRankTimeSec: 88,   // 44 × 2 周
    silverRankTimeSec: 116, // 58 × 2 周
    lapsToClear: 2,
  },
  {
    id: 4,
    title: 'MOUNTAIN PASS',
    numberLabel: 'STAGE 4',
    intro: '稜線の影が長く伸びる。光と闇の境界を縫って走る。',
    courseIndex: 2,  // Mountain
    difficulty: 'normal',
    initialTimeSec: 140,  // 70 × 2 周
    checkpointBonusSec: 10,
    goldRankTimeSec: 112,  // 56 × 2 周
    silverRankTimeSec: 136, // 68 × 2 周
    lapsToClear: 2,
  },
  {
    id: 5,
    title: 'WHITE OUT',
    numberLabel: 'STAGE 5',
    intro: '雪の白が視界を覆う。夜明けの色は、ここではまだ見えない。',
    branch: {
      a: { label: '凍結ロング', courseIndex: 5 },  // Snow
      b: { label: '雪原ショート', courseIndex: 3 },  // Beach を雪原に流用
    },
    difficulty: 'hard',
    initialTimeSec: 120,  // 60 × 2 周
    checkpointBonusSec: 9,
    goldRankTimeSec: 100,  // 50 × 2 周
    silverRankTimeSec: 124, // 62 × 2 周
    lapsToClear: 2,
  },
  {
    id: 6,
    title: 'MIDNIGHT CHASE',
    numberLabel: 'STAGE 6',
    intro: '星はまだ落ちない。夜の底をエンジンの音だけが切り裂く。',
    courseIndex: 4,  // Night
    difficulty: 'hard',
    initialTimeSec: 116,  // 58 × 2 周
    checkpointBonusSec: 8,
    goldRankTimeSec: 104,  // 52 × 2 周
    silverRankTimeSec: 128, // 64 × 2 周
    lapsToClear: 2,
  },
  {
    id: 7,
    title: 'GRAND PRIX FINAL',
    numberLabel: 'STAGE 7',
    intro: '空の端がわずかに白んだ。決着は、夜が明けるまでに。',
    // Stage 7 は専用コース「キャニオン」（index 6）。
    // S1 対応: difficultyModifiers で修飾子を宣言。orchestrator 統合は別フェーズ。
    courseIndex: 6,  // Canyon（専用）
    difficultyModifiers: {
      wallDensityMul: 1.4,
      decorationDensityMul: 1.2,
      cpuSpeedMul: 1.1,
    },
    difficulty: 'extreme',
    initialTimeSec: 150,  // 50 × 3 周
    checkpointBonusSec: 7,
    goldRankTimeSec: 114,  // 38 × 3 周
    silverRankTimeSec: 150, // 50 × 3 周
    lapsToClear: 3,
  },
  {
    id: 8,
    title: 'OVERDRIVE',
    numberLabel: 'STAGE 8',
    intro: '夜明けまで、あとひと走りだ。',
    branch: {
      a: { label: '標準ルート', courseIndex: 7 },  // Highway（専用）
      b: { label: 'ショートカット & 障害物多', courseIndex: 6 },  // Canyon を流用
    },
    // Stage 8 は専用コース「ハイウェイ」（index 7）ベースの最高難度バリアント
    difficultyModifiers: {
      wallDensityMul: 1.5,
      decorationDensityMul: 1.3,
      cpuSpeedMul: 1.15,
    },
    difficulty: 'extreme',
    // 原設計（1 周時 init=46 / gold=50）から gold > init。ランクは累計 elapsedSec 判定で
    // 制限時間とは独立し、CP ボーナスで持ち時間が延びるため GOLD は到達可能（意図的）。
    initialTimeSec: 138,  // 46 × 3 周
    checkpointBonusSec: 6,
    goldRankTimeSec: 150,  // 50 × 3 周
    silverRankTimeSec: 180, // 60 × 3 周
    lapsToClear: 3,
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
