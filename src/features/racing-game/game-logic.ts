// Racing Game ゲームロジック（純粋関数）

import type { Point, Checkpoint, Player } from './types';
import { Config } from './constants';
import { Utils } from './utils';
import { Track } from './track';

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

  movePlayer: (p: Player, baseSpd: number, pts: Point[]) => {
    const { speedRecovery, wallWarpThreshold } = Config.game;
    const spd = Math.min(1, p.speed + speedRecovery);
    const vel = baseSpd * spd;
    const nx = p.x + Math.cos(p.angle) * vel;
    const ny = p.y + Math.sin(p.angle) * vel;
    const info = Track.getInfo(nx, ny, pts);

    if (info.onTrack) {
      return { p: { ...p, x: nx, y: ny, speed: spd, wallStuck: 0 }, info, vel, hit: false };
    }

    const stuck = p.wallStuck + 1;
    if (stuck >= wallWarpThreshold) {
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
        },
        info,
        vel,
        hit: true,
      };
    }

    const off = stuck >= 2 ? 2 : 1;
    const ti = (info.seg + off) % pts.length;
    const tp = pts[ti];
    return {
      p: {
        ...p,
        x: info.pt.x,
        y: info.pt.y,
        angle: Math.atan2(tp.y - info.pt.y, tp.x - info.pt.x),
        speed: 0.5,
        wallStuck: stuck,
      },
      info,
      vel,
      hit: true,
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
    return {
      p1: { ...p1, x: p1.x - nx * ov, y: p1.y - ny * ov },
      p2: { ...p2, x: p2.x + nx * ov, y: p2.y + ny * ov },
      pt: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 },
    };
  },
};
