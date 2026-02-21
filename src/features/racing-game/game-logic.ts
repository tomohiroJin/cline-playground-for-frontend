// Racing Game ゲームロジック（純粋関数）

import type { Point, Checkpoint, Player, DriftState } from './types';
import { Config, DRIFT, WALL } from './constants';
import { Utils } from './utils';
import { Track } from './track';
import { Drift } from './drift';

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
    if (skill < 0.4) return false; // 弱いCPUはドリフトしない
    const info = Track.getInfo(p.x, p.y, pts);
    // コーナーが近いとき（中心からの距離が大きい）かつ速度が十分
    const isCorner = info.dist / Config.game.trackWidth > 0.35;
    return isCorner && p.speed >= DRIFT.MIN_SPEED && Math.random() < skill * 0.3;
  },

  movePlayer: (p: Player, baseSpd: number, pts: Point[], handbrake?: boolean, steering?: number) => {
    const { speedRecovery } = Config.game;
    const warpThreshold = WALL.WARP_THRESHOLD;
    const dt = FRAME_DT;

    // ドリフト処理
    let driftState = p.drift;
    if (handbrake && steering !== undefined && steering !== 0) {
      // ドリフト開始/継続
      if (!driftState.active) {
        driftState = Drift.start(driftState, p.speed);
      }
      if (driftState.active) {
        driftState = Drift.update(driftState, steering, p.speed, dt);
      }
    } else if (driftState.active) {
      // ハンドブレーキ離し → ドリフト終了
      driftState = Drift.end(driftState);
    } else {
      // ドリフト中でない → ブースト減衰のみ
      driftState = Drift.update(driftState, 0, p.speed, dt);
    }

    // 速度計算（壁接触中は速度回復を凍結）
    let spd = p.wallStuck > 0 ? p.speed : Math.min(1, p.speed + speedRecovery);

    // ドリフト中の速度維持
    if (driftState.active) {
      spd = Math.min(1, spd * Drift.getSpeedRetain());
    }

    // ドリフトブースト適用
    const driftBoost = Drift.getBoost(driftState);

    const vel = baseSpd * (spd + driftBoost);
    const nx = p.x + Math.cos(p.angle) * vel;
    const ny = p.y + Math.sin(p.angle) * vel;
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
    if (stuck >= warpThreshold) {
      const wi = (info.seg + 3) % pts.length;
      const wp = pts[wi];
      const nwi = (wi + 1) % pts.length;
      const nwp = pts[nwi];
      return {
        p: {
          ...p,
          x: wp.x,
          y: wp.y,
          angle: Math.atan2(nwp.y - wp.y, nwp.x - wp.x),
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

    // スライドベクトル方式の壁処理
    const wallNormal = Track.getNormal(info.seg, pts);
    const vx = Math.cos(p.angle) * vel;
    const vy = Math.sin(p.angle) * vel;

    // 法線成分を除去してスライドベクトルを計算
    const dot = vx * wallNormal.nx + vy * wallNormal.ny;
    const slideX = vx - dot * wallNormal.nx;
    const slideY = vy - dot * wallNormal.ny;
    const slideMag = Math.hypot(slideX, slideY);

    // 段階的減速
    let factor: number;
    let wallStage: number;
    if (stuck === 1) {
      factor = WALL.LIGHT_FACTOR;
      wallStage = 1;
    } else if (stuck <= 3) {
      factor = WALL.MEDIUM_FACTOR;
      wallStage = 2;
    } else {
      factor = WALL.HEAVY_FACTOR;
      wallStage = 3;
    }

    // シールドによる壁ダメージ軽減
    let newShieldCount = p.shieldCount;
    if (p.shieldCount > 0) {
      factor = 1.0; // シールドで減速なし
      newShieldCount = p.shieldCount - 1;
    }

    // カード効果による壁ダメージ軽減
    // wallDamageMultiplier < 1 で減速量を軽減（例: 0.5 = 減速50%軽減）
    const wallDamageMultiplier = p.activeCards.reduce(
      (acc, c) => acc * (c.wallDamageMultiplier ?? 1),
      1
    );
    const speedLoss = (1 - factor) * wallDamageMultiplier;
    const adjustedSpeed = spd * (1 - speedLoss);

    // スライド方向に移動（完全停止しない）
    let slideAngle: number;
    if (slideMag > 0.01) {
      slideAngle = Math.atan2(slideY, slideX);
    } else {
      // スライドベクトルが0に近い場合はプレイヤー位置基準でセグメント方向へ（ルックアヘッド拡大）
      const off = Math.min(stuck, 5) + 3;
      const ti = (info.seg + off) % pts.length;
      const tp = pts[ti];
      slideAngle = Math.atan2(tp.y - p.y, tp.x - p.x);
    }

    // stuck >= 3 時にトラック内への強制押し出し（距離を速度に比例）
    let finalX = info.pt.x;
    let finalY = info.pt.y;
    if (stuck >= 3) {
      const pushDir = Math.atan2(info.pt.y - p.y, info.pt.x - p.x);
      const pushDist = Math.max(5, vel * 0.7);
      finalX = info.pt.x + Math.cos(pushDir) * pushDist;
      finalY = info.pt.y + Math.sin(pushDir) * pushDist;
    }

    return {
      p: {
        ...p,
        x: finalX,
        y: finalY,
        angle: slideAngle,
        speed: Math.max(0.1, adjustedSpeed),
        wallStuck: stuck,
        drift: driftState,
        shieldCount: newShieldCount,
      },
      info,
      vel,
      hit: true,
      wallStage,
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
