// プレイヤー移動ロジック（純粋関数・副作用なし）

import type { Player } from './types';
import type { Point } from '../shared/types';
import type { TrackInfo } from '../track/types';
import { DRIFT, PLAYER } from './constants';
import { startDrift, updateDrift, endDrift, cancelDrift, getDriftBoost, getDriftSpeedRetain } from './drift';
import { getTrackInfo } from '../track/track';
import { getCardMultiplier } from '../card/card-effect';
import {
  calculateWallPenalty,
  shouldWarp,
  calculateWarpDestination,
  calculateSlideVector,
  calculateSlideAngle,
  calculateWallSlidePosition,
} from '../track/wall-physics';

/** dt はフレームレートから推定（60fps 想定） */
const FRAME_DT = 1 / 60;

/** 壁接触中の速度回復率（30% に制限） */
const WALL_RECOVERY_RATE = 0.3;

/** ワープ後の速度 */
const WARP_SPEED = 0.3;

/** 最低速度（壁接触後） */
const MIN_SPEED_AFTER_WALL = 0.1;

/** 移動入力パラメータ */
export interface MoveInput {
  readonly handbrake?: boolean;
  readonly steering?: number;
  readonly accelMultiplier?: number;
  readonly driftBoostMultiplier?: number;
}

/** 移動結果 */
export interface MoveResult {
  readonly player: Player;
  readonly trackInfo: TrackInfo;
  readonly velocity: number;
  readonly wallHit: boolean;
  readonly wallStage: number;
}

/** プレイヤーを移動させる（純粋関数） */
export const movePlayer = (
  p: Player,
  baseSpeed: number,
  trackPoints: readonly Point[],
  trackWidth: number,
  input?: MoveInput,
): MoveResult => {
  const handbrake = input?.handbrake ?? false;
  const steering = input?.steering;
  const accelMul = input?.accelMultiplier ?? 1;
  const driftBoostMul = input?.driftBoostMultiplier ?? 1;

  const speedRecovery = PLAYER.SPEED_RECOVERY * accelMul;
  const dt = FRAME_DT;

  // ドリフト処理
  let driftState = p.drift;
  if (handbrake && steering !== undefined && steering !== 0) {
    if (!driftState.active) {
      driftState = startDrift(driftState, p.speed);
    }
    if (driftState.active) {
      driftState = updateDrift(driftState, steering, p.speed, dt);
    }
  } else if (driftState.active) {
    driftState = endDrift(driftState);
  } else {
    driftState = updateDrift(driftState, 0, p.speed, dt);
  }

  // 速度計算（壁接触中も一部回復で脱出可能に）
  let spd = p.wallStuck > 0
    ? Math.min(1, p.speed + speedRecovery * WALL_RECOVERY_RATE)
    : Math.min(1, p.speed + speedRecovery);

  // ドリフト中の速度維持
  if (driftState.active) {
    spd = Math.min(1, spd * getDriftSpeedRetain());
  }

  // ドリフトブースト適用
  const driftBoost = getDriftBoost(driftState) * driftBoostMul;

  const vel = baseSpeed * (spd + driftBoost);
  let nx: number, ny: number;
  if (driftState.active && driftState.slipAngle !== 0) {
    // ドリフト中: 進行方向 + 横滑り方向のブレンド移動
    const moveAngle = p.angle + driftState.slipAngle * DRIFT.LATERAL_FORCE;
    nx = p.x + Math.cos(moveAngle) * vel;
    ny = p.y + Math.sin(moveAngle) * vel;
  } else {
    nx = p.x + Math.cos(p.angle) * vel;
    ny = p.y + Math.sin(p.angle) * vel;
  }

  const info = getTrackInfo(nx, ny, trackPoints, trackWidth);

  // トラック上: 正常移動
  if (info.onTrack) {
    return {
      player: { ...p, x: nx, y: ny, speed: spd, wallStuck: 0, drift: driftState },
      trackInfo: info,
      velocity: vel,
      wallHit: false,
      wallStage: 0,
    };
  }

  // 壁接触 → ドリフト強制終了（ブーストなし）
  if (driftState.active) {
    driftState = cancelDrift(driftState);
  }

  const stuck = p.wallStuck + 1;

  // ワープ判定
  if (shouldWarp(stuck)) {
    const warp = calculateWarpDestination(info.seg, trackPoints);
    return {
      player: {
        ...p,
        x: warp.x,
        y: warp.y,
        angle: warp.angle,
        speed: WARP_SPEED,
        wallStuck: 0,
        drift: driftState,
      },
      trackInfo: info,
      velocity: vel,
      wallHit: true,
      wallStage: 3,
    };
  }

  // スライドベクトル計算
  const { slideX, slideY, slideMag } = calculateSlideVector(p.angle, vel, info.seg, trackPoints);

  // 段階的減速 + シールド + カード効果
  const wallDmgMul = getCardMultiplier(p.activeCards, 'wallDamageMultiplier');
  const penalty = calculateWallPenalty(stuck, p.shieldCount, wallDmgMul);
  const adjustedSpeed = spd * penalty.factor;

  // スライド角度計算
  const slideAngle = calculateSlideAngle(
    slideX, slideY, slideMag,
    p.x, p.y, info.pt.x, info.pt.y,
    stuck, info.seg, trackPoints,
  );

  // 最終位置計算
  const finalPos = calculateWallSlidePosition(info.pt.x, info.pt.y, info.seg, trackPoints, vel, stuck);

  return {
    player: {
      ...p,
      x: finalPos.x,
      y: finalPos.y,
      angle: slideAngle,
      speed: Math.max(MIN_SPEED_AFTER_WALL, adjustedSpeed),
      wallStuck: stuck,
      drift: driftState,
      shieldCount: penalty.newShieldCount,
    },
    trackInfo: info,
    velocity: vel,
    wallHit: true,
    wallStage: penalty.wallStage,
  };
};
