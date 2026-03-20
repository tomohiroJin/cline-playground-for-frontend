// Racing Game 定数定義
// 移行期間中: 各ドメイン・インフラ定数モジュールから re-export
// 旧コードの後方互換のため Config / Colors / Options / Courses の旧形式を維持

import type { Course } from './types';
import { DRIFT as DRIFT_DOMAIN } from './domain/player/constants';
import { HEAT as HEAT_DOMAIN } from './domain/player/constants';
import { WALL as WALL_DOMAIN } from './domain/track/constants';
import { HIGHLIGHT as HIGHLIGHT_DOMAIN } from './domain/highlight/constants';
import { GAME, RACE_TIMING } from './domain/race/constants';
import { COURSES } from './domain/track/course';
import { CANVAS, COLORS as COLORS_DOMAIN, RENDER } from './infrastructure/renderer/constants';
import { AUDIO } from './infrastructure/audio/constants';
import { OPTIONS as OPTIONS_DOMAIN } from './presentation/constants';

// 旧形式の Config オブジェクト（後方互換）
export const Config = Object.freeze({
  canvas: { width: CANVAS.WIDTH, height: CANVAS.HEIGHT },
  game: {
    trackWidth: GAME.TRACK_WIDTH,
    turnRate: 0.065,
    collisionDist: GAME.COLLISION_DIST,
    wallWarpThreshold: 10,
    speedRecovery: 0.02,
    sparkThreshold: RENDER.sparkThreshold,
    particleCount: RENDER.particleCount,
    decoCount: RENDER.decoCount,
    confettiCount: RENDER.confettiCount,
    maxParticles: RENDER.maxParticles,
    maxSparks: RENDER.maxSparks,
    checkpointRadius: GAME.CHECKPOINT_RADIUS,
  },
  timing: {
    demo: RACE_TIMING.DEMO,
    idle: RACE_TIMING.IDLE,
    countdown: RACE_TIMING.COUNTDOWN,
    lapAnnounce: RACE_TIMING.LAP_ANNOUNCE,
  },
  startLine: { width: RENDER.startLine.width, squares: RENDER.startLine.squares },
  audio: {
    defaultVolume: AUDIO.defaultVolume,
    minVolume: AUDIO.minVolume,
    maxVolume: AUDIO.maxVolume,
    freq: AUDIO.freq,
  },
});

export const Colors = Object.freeze({
  car: COLORS_DOMAIN.car,
  particle: COLORS_DOMAIN.particle,
  confetti: COLORS_DOMAIN.confetti,
  firework: COLORS_DOMAIN.firework,
});

export const Options = Object.freeze({
  speed: OPTIONS_DOMAIN.speed,
  cpu: OPTIONS_DOMAIN.cpu,
  laps: OPTIONS_DOMAIN.laps,
});

// ドメイン定数の re-export
export const DRIFT = DRIFT_DOMAIN;
export const HEAT = HEAT_DOMAIN;
export const WALL = WALL_DOMAIN;
export const HIGHLIGHT = HIGHLIGHT_DOMAIN;

// コースデータ
export const Courses: Course[] = COURSES;
