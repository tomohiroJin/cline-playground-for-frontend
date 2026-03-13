import type { LaneIndex } from '../types';
import { comboMult, computePoints, isAdjacentTo } from './scoring';

/** サイクルの判定結果 */
export interface CycleJudgment {
  /** 被弾したか */
  hit: boolean;
  /** ニアミスか（隣接レーンに障害物） */
  nearMiss: boolean;
  /** シェルターで防いだか */
  sheltered: boolean;
  /** シールドを使用したか */
  shieldUsed: boolean;
  /** フリーズ中か */
  frozen: boolean;
  /** 制限レーン or シェルター（×0得点）か */
  zeroed: boolean;
  /** 獲得スコア */
  scoreGained: number;
  /** 更新後のコンボ数 */
  comboCount: number;
  /** 更新後の最大コンボ */
  maxCombo: number;
  /** リスクスコア加算するか */
  riskPoint: boolean;
  /** リバイブを使用したか */
  reviveUsed: boolean;
  /** 死亡したか */
  dead: boolean;
}

/** judgeCycle のパラメータ */
export interface JudgeCycleParams {
  /** プレイヤーの現在レーン */
  playerLane: LaneIndex;
  /** 障害物のレーン配列 */
  obstacles: readonly number[];
  /** 残りシールド数 */
  shields: number;
  /** シェルターレーン配列 */
  shelterLanes: readonly number[];
  /** 制限レーン配列 */
  restrictedLanes: readonly number[];
  /** プレイヤーレーンの倍率 */
  laneMultiplier: number;
  /** 現在のコンボ数 */
  comboCount: number;
  /** コンボボーナス倍率 */
  comboBonus: number;
  /** スコア倍率（パーク累積） */
  scoreMult: number;
  /** ステージスコア修正値 */
  stageScoreMod: number;
  /** 基本ボーナス */
  baseBonus: number;
  /** フリーズ残サイクル数 */
  frozen: number;
  /** リバイブ残数 */
  revive: number;
  /** 現在の最大コンボ */
  maxCombo: number;
}

/**
 * サイクルの判定を行う純粋関数
 *
 * 事前条件: obstacles.length > 0
 * 事後条件: hit === true かつ dead === true のとき scoreGained === 0
 */
export function judgeCycle(params: JudgeCycleParams): CycleJudgment {
  const {
    playerLane,
    obstacles,
    shields,
    shelterLanes,
    restrictedLanes,
    laneMultiplier: mu,
    comboCount: prevCombo,
    comboBonus,
    scoreMult,
    stageScoreMod,
    baseBonus,
    frozen,
    revive,
    maxCombo: prevMaxCombo,
  } = params;

  const isSheltered = shelterLanes.includes(playerLane);
  const isHit = obstacles.includes(playerLane) && !isSheltered;
  const isRestricted = restrictedLanes.includes(playerLane);

  // シェルターで障害物を吸収
  const shelterAbsorbed = isSheltered && obstacles.includes(playerLane);

  // 被弾処理
  if (isHit) {
    // シールドブロック
    if (shields > 0) {
      return {
        hit: true,
        nearMiss: false,
        sheltered: false,
        shieldUsed: true,
        frozen: false,
        zeroed: false,
        scoreGained: 0,
        comboCount: 0,
        maxCombo: prevMaxCombo,
        riskPoint: false,
        reviveUsed: false,
        dead: false,
      };
    }

    // リバイブ
    if (revive > 0) {
      return {
        hit: true,
        nearMiss: false,
        sheltered: false,
        shieldUsed: false,
        frozen: false,
        zeroed: false,
        scoreGained: 0,
        comboCount: 0,
        maxCombo: prevMaxCombo,
        riskPoint: false,
        reviveUsed: true,
        dead: false,
      };
    }

    // 死亡
    return {
      hit: true,
      nearMiss: false,
      sheltered: false,
      shieldUsed: false,
      frozen: false,
      zeroed: false,
      scoreGained: 0,
      comboCount: 0,
      maxCombo: prevMaxCombo,
      riskPoint: false,
      reviveUsed: false,
      dead: true,
    };
  }

  // 生存処理
  const nearMiss = isAdjacentTo(obstacles as number[], playerLane);
  const newCombo = prevCombo + 1;
  const newMaxCombo = Math.max(newCombo, prevMaxCombo);
  const riskPoint = playerLane === 2 || mu >= 4;

  // フリーズ中は0点
  if (frozen > 0) {
    return {
      hit: false,
      nearMiss,
      sheltered: shelterAbsorbed,
      shieldUsed: false,
      frozen: true,
      zeroed: false,
      scoreGained: 0,
      comboCount: newCombo,
      maxCombo: newMaxCombo,
      riskPoint,
      reviveUsed: false,
      dead: false,
    };
  }

  // 倍率0、制限レーン、シェルター → 0点
  if (mu === 0 || isRestricted || isSheltered) {
    return {
      hit: false,
      nearMiss,
      sheltered: isSheltered,
      shieldUsed: false,
      frozen: false,
      zeroed: true,
      scoreGained: 0,
      comboCount: isSheltered ? 0 : newCombo,
      maxCombo: newMaxCombo,
      riskPoint,
      reviveUsed: false,
      dead: false,
    };
  }

  // 通常得点
  const cm = comboMult(newCombo, comboBonus);
  const pts = computePoints(mu, cm, scoreMult, stageScoreMod, baseBonus);

  return {
    hit: false,
    nearMiss,
    sheltered: false,
    shieldUsed: false,
    frozen: false,
    zeroed: false,
    scoreGained: pts,
    comboCount: newCombo,
    maxCombo: newMaxCombo,
    riskPoint,
    reviveUsed: false,
    dead: false,
  };
}
