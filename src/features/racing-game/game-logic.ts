// Racing Game ゲームロジック（純粋関数）

import type { Point, Checkpoint, Player, DriftState } from './types';
import { Config, DRIFT, WALL } from './constants';
import { Utils } from './utils';
import { Track } from './track';
import { Drift } from './drift';
import { getCardMultiplier } from './card-effects';
import {
  calculateWallPenalty,
  shouldWarp,
  calculateWarpDestination,
  calculateSlideVector,
  calculateSlideAngle,
  calculateWallSlidePosition,
} from './wall-physics';

// dt はフレームレートから推定（60fps想定）
const FRAME_DT = 1 / 60;

export const Logic = {
  cpuTurn: (p: Player, pts: Point[], skill: number, miss: number) => {
    const info = Track.getInfo(p.x, p.y, pts);
    const toCenter = Math.atan2(info.pt.y - p.y, info.pt.x - p.x);
    const nextIdx = (info.seg + 1) % pts.length;
    const toNext = Math.atan2(pts[nextIdx].y - p.y, pts[nextIdx].x - p.x);
    const target = info.dist / Config.game.trackWidth > 0.6 ? toCenter : toNext;
    let diff = Utils.normalizeAngle(target - p.angle);
    if (Math.random() < miss) diff += Utils.randRange(-0.4, 0.4);
    const rate = Config.game.turnRate * skill;
    return diff > 0.03 ? rate : diff < -0.03 ? -rate : 0;
  },

  /** CPU がドリフトを使うかどうかの判定 */
  cpuShouldDrift: (p: Player, pts: Point[], skill: number): boolean => {
    if (skill < 0.2) return false;           // よわいでも少し使える（0.4→0.2）
    const info = Track.getInfo(p.x, p.y, pts);
    const isCorner = info.dist / Config.game.trackWidth > 0.25; // 内側でも発動（0.35→0.25）
    return isCorner && p.speed >= DRIFT.MIN_SPEED && Math.random() < skill * 0.5; // 確率増加（0.3→0.5）
  },

  movePlayer: (p: Player, baseSpd: number, pts: Point[], handbrake?: boolean, steering?: number, accelMul?: number, driftBoostMul?: number) => {
    const baseRecovery = Config.game.speedRecovery;
    const speedRecovery = baseRecovery * (accelMul ?? 1);
    const dt = FRAME_DT;

    // ドリフト処理
    let driftState = p.drift;
    if (handbrake && steering !== undefined && steering !== 0) {
      if (!driftState.active) {
        driftState = Drift.start(driftState, p.speed);
      }
      if (driftState.active) {
        driftState = Drift.update(driftState, steering, p.speed, dt);
      }
    } else if (driftState.active) {
      driftState = Drift.end(driftState);
    } else {
      driftState = Drift.update(driftState, 0, p.speed, dt);
    }

    // 速度計算（壁接触中も30%の回復で脱出可能に）
    let spd = p.wallStuck > 0
      ? Math.min(1, p.speed + speedRecovery * 0.3)
      : Math.min(1, p.speed + speedRecovery);

    // ドリフト中の速度維持
    if (driftState.active) {
      spd = Math.min(1, spd * Drift.getSpeedRetain());
    }

    // ドリフトブースト適用
    const driftBoost = Drift.getBoost(driftState) * (driftBoostMul ?? 1);

    const vel = baseSpd * (spd + driftBoost);
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
    const info = Track.getInfo(nx, ny, pts);

    if (info.onTrack) {
      return {
        p: { ...p, x: nx, y: ny, speed: spd, wallStuck: 0, drift: driftState },
        info,
        vel,
        hit: false,
        wallStage: 0 as number,
      };
    }

    // 壁接触 → ドリフト強制終了（ブーストなし）
    if (driftState.active) {
      driftState = Drift.cancel(driftState);
    }

    const stuck = p.wallStuck + 1;

    // ワープ判定
    if (shouldWarp(stuck)) {
      const warp = calculateWarpDestination(info.seg, pts);
      return {
        p: {
          ...p,
          x: warp.x,
          y: warp.y,
          angle: warp.angle,
          speed: 0.3,
          wallStuck: 0,
          drift: driftState,
        },
        info,
        vel,
        hit: true,
        wallStage: 3 as number,
      };
    }

    // スライドベクトル計算
    const { slideX, slideY, slideMag } = calculateSlideVector(p.angle, vel, info.seg, pts);

    // 段階的減速 + シールド + カード効果
    const wallDmgMul = getCardMultiplier(p.activeCards, 'wallDamageMultiplier');
    const penalty = calculateWallPenalty(stuck, p.shieldCount, wallDmgMul);
    const adjustedSpeed = spd * penalty.factor;

    // スライド角度計算
    const slideAngle = calculateSlideAngle(
      slideX, slideY, slideMag,
      p.x, p.y, info.pt.x, info.pt.y,
      stuck, info.seg, pts
    );

    // 最終位置計算
    const finalPos = calculateWallSlidePosition(info.pt.x, info.pt.y, info.seg, pts, vel, stuck);

    return {
      p: {
        ...p,
        x: finalPos.x,
        y: finalPos.y,
        angle: slideAngle,
        speed: Math.max(0.1, adjustedSpeed),
        wallStuck: stuck,
        drift: driftState,
        shieldCount: penalty.newShieldCount,
      },
      info,
      vel,
      hit: true,
      wallStage: penalty.wallStage,
    };
  },

  updateCheckpoints: (p: Player, checkpointCoords: Checkpoint[], onNew?: () => void) => {
    let flags = p.checkpointFlags;
    const radius = Config.game.checkpointRadius;

    checkpointCoords.forEach((cp, i) => {
      if ((flags & (1 << i)) !== 0) return;
      if (i > 0 && (flags & (1 << (i - 1))) === 0) return;

      const dist = Utils.dist(p.x, p.y, cp.x, cp.y);
      if (dist < radius) {
        flags |= 1 << i;
        if (i > 0) onNew?.();
      }
    });

    return { ...p, checkpointFlags: flags };
  },

  allCheckpointsPassed: (flags: number, totalCheckpoints: number) => {
    const allFlags = (1 << totalCheckpoints) - 1;
    return (flags & allFlags) === allFlags;
  },

  handleCollision: (p1: Player, p2: Player) => {
    const dx = p2.x - p1.x,
      dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);
    if (dist >= Config.game.collisionDist || dist === 0) return null;
    const ov = (Config.game.collisionDist - dist) / 2;
    const nx = dx / dist,
      ny = dy / dist;

    // 衝突時、ドリフト中なら強制終了（ブーストなし）
    const p1Drift = p1.drift.active ? Drift.cancel(p1.drift) : p1.drift;
    const p2Drift = p2.drift.active ? Drift.cancel(p2.drift) : p2.drift;

    return {
      p1: { ...p1, x: p1.x - nx * ov, y: p1.y - ny * ov, drift: p1Drift },
      p2: { ...p2, x: p2.x + nx * ov, y: p2.y + ny * ov, drift: p2Drift },
      pt: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 },
    };
  },
};
