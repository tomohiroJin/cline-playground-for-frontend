// プレイヤー移動ロジック（純粋関数・副作用なし）

import type { Player } from './types';
import type { DriftState } from './types';
import type { Point } from '../shared/types';
import type { TrackInfo } from '../track/types';
import { DRIFT, PLAYER, PLAYER_PHYSICS } from './constants';
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

const { FRAME_DT, WALL_RECOVERY_RATE, WARP_SPEED, MIN_SPEED_AFTER_WALL } = PLAYER_PHYSICS;

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

/** ドリフト状態を入力に基づいて更新する */
const updatePlayerDrift = (
  drift: DriftState,
  speed: number,
  handbrake: boolean,
  steering: number | undefined,
): DriftState => {
  if (handbrake && steering !== undefined && steering !== 0) {
    const started = drift.active ? drift : startDrift(drift, speed);
    return started.active ? updateDrift(started, steering, speed, FRAME_DT) : started;
  }
  if (drift.active) return endDrift(drift);
  return updateDrift(drift, 0, speed, FRAME_DT);
};

/** 速度と位置を計算する */
const calculateMovement = (
  p: Player,
  baseSpeed: number,
  driftState: DriftState,
  speedRecovery: number,
  driftBoostMul: number,
): { speed: number; velocity: number; nx: number; ny: number } => {
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

  // 位置計算
  let nx: number, ny: number;
  if (driftState.active && driftState.slipAngle !== 0) {
    const moveAngle = p.angle + driftState.slipAngle * DRIFT.LATERAL_FORCE;
    nx = p.x + Math.cos(moveAngle) * vel;
    ny = p.y + Math.sin(moveAngle) * vel;
  } else {
    nx = p.x + Math.cos(p.angle) * vel;
    ny = p.y + Math.sin(p.angle) * vel;
  }

  return { speed: spd, velocity: vel, nx, ny };
};

/** 壁衝突時の処理を行う */
const handleWallContact = (
  p: Player,
  driftState: DriftState,
  spd: number,
  vel: number,
  info: TrackInfo,
  trackPoints: readonly Point[],
): MoveResult => {
  // ドリフト強制終了（ブーストなし）
  const drift = driftState.active ? cancelDrift(driftState) : driftState;
  const stuck = p.wallStuck + 1;

  // ワープ判定
  if (shouldWarp(stuck)) {
    const warp = calculateWarpDestination(info.seg, trackPoints);
    return {
      player: { ...p, x: warp.x, y: warp.y, angle: warp.angle, speed: WARP_SPEED, wallStuck: 0, drift },
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

  // スライド角度・最終位置計算
  const slideAngle = calculateSlideAngle(
    slideX, slideY, slideMag,
    p.x, p.y, info.pt.x, info.pt.y,
    stuck, info.seg, trackPoints,
  );
  const finalPos = calculateWallSlidePosition(info.pt.x, info.pt.y, info.seg, trackPoints, vel, stuck);

  return {
    player: {
      ...p,
      x: finalPos.x,
      y: finalPos.y,
      angle: slideAngle,
      speed: Math.max(MIN_SPEED_AFTER_WALL, spd * penalty.factor),
      wallStuck: stuck,
      drift,
      shieldCount: penalty.newShieldCount,
    },
    trackInfo: info,
    velocity: vel,
    wallHit: true,
    wallStage: penalty.wallStage,
  };
};

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

  const driftState = updatePlayerDrift(p.drift, p.speed, handbrake, steering);
  const speedRecovery = PLAYER.SPEED_RECOVERY * accelMul;
  const { speed: spd, velocity: vel, nx, ny } = calculateMovement(p, baseSpeed, driftState, speedRecovery, driftBoostMul);
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

  // 壁接触処理
  return handleWallContact(p, driftState, spd, vel, info, trackPoints);
};
