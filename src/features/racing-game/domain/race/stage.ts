// キャンペーンステージ定義（型 + バリデーション）

import { assertPositive, assertNonNegative, assert } from '../shared/assertions';

export type StageId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type StageDifficultyHint = 'easy' | 'normal' | 'hard' | 'extreme';

export type Branch = {
  /** プレイヤーに見せる選択肢のラベル（例: "海岸線ルート"） */
  readonly label: string;
  /** 採用する既存コース index（COURSES 配列のインデックス） */
  readonly courseIndex: number;
};

export type Stage = {
  readonly id: StageId;
  /** ステージタイトル（英大文字想定） */
  readonly title: string;
  /** ステージ番号表記（"STAGE 1" 等） */
  readonly numberLabel: string;
  /** intro テキスト（1〜2 行 / 最大全角 56 字） */
  readonly intro: string;
  /** 既存の courseIndex。分岐ステージでは未定義（branch を見る） */
  readonly courseIndex?: number;
  /** 分岐ステージのみ */
  readonly branch?: { readonly a: Branch; readonly b: Branch };
  /** 難易度ヒント */
  readonly difficulty: StageDifficultyHint;
  /** ステージ開始時の残り時間（秒） */
  readonly initialTimeSec: number;
  /** チェックポイント 1 個通過で増える時間（秒） */
  readonly checkpointBonusSec: number;
  /** GOLD ランク到達タイム（秒）。 goalTime ≤ goldRankTimeSec で GOLD */
  readonly goldRankTimeSec: number;
  /** SILVER ランク到達タイム（秒）。 goldRankTimeSec < goalTime ≤ silverRankTimeSec で SILVER */
  readonly silverRankTimeSec: number;
  /** クリア必須のラップ数。本キャンペーンは原則 1 */
  readonly lapsToClear: number;
};

/**
 * ステージ定義の不変条件チェック（DbC）
 *
 * 不変条件:
 * - initialTimeSec > 0
 * - checkpointBonusSec >= 0
 * - 0 < goldRankTimeSec < silverRankTimeSec
 * - lapsToClear >= 1
 * - courseIndex か branch のいずれかが定義されている
 */
export const assertValidStage = (stage: Stage): void => {
  assertPositive(stage.initialTimeSec, `stage[${stage.id}].initialTimeSec`);
  assertPositive(stage.lapsToClear, `stage[${stage.id}].lapsToClear`);
  assertPositive(stage.goldRankTimeSec, `stage[${stage.id}].goldRankTimeSec`);
  assertNonNegative(stage.checkpointBonusSec, `stage[${stage.id}].checkpointBonusSec`);
  assert(
    stage.silverRankTimeSec > stage.goldRankTimeSec,
    `stage[${stage.id}]: silverRankTimeSec (${stage.silverRankTimeSec}) must be > goldRankTimeSec (${stage.goldRankTimeSec})`,
  );
  assert(
    stage.courseIndex !== undefined || stage.branch !== undefined,
    `stage[${stage.id}] must have courseIndex or branch`,
  );
};
