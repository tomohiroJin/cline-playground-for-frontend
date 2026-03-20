// ゲームオーケストレーター（Application 層のコア）
// RacingGame.tsx のゲームループロジックを純粋なオーケストレーターとして再構成

import type { Player } from '../domain/player/types';
import type { Course } from '../domain/track/types';
import type { DeckState } from '../domain/card/types';
import type { GamePhase, RaceConfig } from '../domain/race/types';
import type { Particle, Spark, Confetti } from '../types';
import type { RendererPort } from './ports/renderer-port';
import type { AudioPort } from './ports/audio-port';
import type { StoragePort } from './ports/storage-port';
import type { InputPort } from './ports/input-port';
import type { WallStage } from './ports/audio-port';
import type { HighlightTrackerState } from '../domain/highlight/highlight';
import type { CpuStrategy } from '../domain/player/cpu-strategy';
import type { StartLine } from '../domain/track/types';
import type { CourseEffect } from '../domain/track/types';
import { createPlayers } from '../domain/player/player-factory';
import { createCpuStrategy } from '../domain/player/cpu-strategy';
import { movePlayer } from '../domain/player/player';
import { processInput } from './input-processor';
import { getTrackInfo } from '../domain/track/track';
import { calculateStartLine } from '../domain/track/track';
import { getCourseEffect, getSegmentFriction, getSegmentSpeedModifier } from '../domain/track/course-effect';
import { handleCollision } from '../domain/race/collision';
import { updateCheckpoints } from '../domain/race/checkpoint';
import { checkLapComplete } from '../domain/race/lap-counter';
import { createDeck, clearActiveEffects } from '../domain/card/deck';
import { computeAllCardEffects } from '../domain/card/card-effect';
import { updateHeat, getHeatBoost } from '../domain/player/heat';
import { createTracker } from '../domain/highlight/highlight';
import { detectDriftBonus, detectHeatBoost, detectNearMiss, detectOvertake, detectFastestLap } from '../domain/highlight/event-detector';
import { RACE_TIMING, GAME } from '../domain/race/constants';
import { distance } from '../domain/shared/math-utils';

/** オーケストレーター設定 */
export interface GameOrchestratorConfig {
  readonly renderer: RendererPort;
  readonly audio: AudioPort;
  readonly storage: StoragePort;
  readonly input: InputPort;
  readonly raceConfig: RaceConfig;
  readonly course: Course;
  /** プレイヤーの色（Presentation 層から注入） */
  readonly playerColors: readonly [string, string];
  /** プレイヤーの名前（Presentation 層から注入） */
  readonly playerNames: readonly [string, string];
}

/** オーケストレーター状態 */
export interface GameOrchestratorState {
  phase: GamePhase;
  players: Player[];
  particles: Particle[];
  sparks: Spark[];
  confetti: Confetti[];
  shake: number;
  decks: DeckState[];
  highlightTracker: HighlightTrackerState;
  raceStartTime: number;
  countdownStartTime: number;
  winner: string | null;
  paused: boolean;
  engineOn: boolean;
}

/** オーケストレーターインターフェース */
export interface GameOrchestrator {
  update(now: number): void;
  draw(): void;
  getState(): Readonly<GameOrchestratorState>;
  togglePause(): void;
  reset(): void;
}

/** 初期状態の生成 */
const createInitialState = (config: GameOrchestratorConfig): GameOrchestratorState => {
  const { course, raceConfig, playerColors, playerNames } = config;
  const pts = course.points;
  const startAngle = pts.length >= 2 ? Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x) : 0;

  const players = createPlayers(raceConfig.mode, pts[0], startAngle, playerColors, playerNames);

  return {
    phase: 'countdown',
    players,
    particles: [],
    sparks: [],
    confetti: [],
    shake: 0,
    decks: players.map(() => createDeck()),
    highlightTracker: createTracker(players.length),
    raceStartTime: 0,
    countdownStartTime: Date.now(),
    winner: null,
    paused: false,
    engineOn: false,
  };
};

/** 単一プレイヤーの1フレーム更新 */
const updateSinglePlayer = (
  p: Player,
  i: number,
  state: GameOrchestratorState,
  config: GameOrchestratorConfig,
  cpuStrategy: CpuStrategy | null,
  courseEffect: CourseEffect,
  sl: StartLine,
  raceTime: number,
  now: number,
): Player => {
  const { course, raceConfig } = config;
  const pts = course.points;

  // 入力処理
  const inputState = config.input.getPlayerInput(i);
  const cmd = processInput(p, inputState, p.isCpu ? cpuStrategy : null, pts, GAME.TRACK_WIDTH);

  // コース効果
  const trackInfo = getTrackInfo(p.x, p.y, pts, GAME.TRACK_WIDTH);
  const friction = getSegmentFriction(courseEffect, trackInfo.seg, pts.length, trackInfo.dist, GAME.TRACK_WIDTH);
  const spdMod = getSegmentSpeedModifier(courseEffect, trackInfo.seg, pts.length);
  const ce = computeAllCardEffects(p.activeCards);
  const effectiveBaseSpd = (raceConfig.baseSpeed * friction + spdMod) * ce.speedMul;

  // 移動
  const result = movePlayer(
    { ...p, angle: p.angle + cmd.turnRate },
    effectiveBaseSpd, pts, GAME.TRACK_WIDTH,
    { handbrake: cmd.handbrake, steering: cmd.steering, accelMultiplier: ce.accelMul, driftBoostMultiplier: ce.driftBoostMul },
  );
  let np = result.player;

  // 壁ヒット
  if (result.wallHit) {
    config.audio.playWallHit(Math.min(3, result.wallStage) as WallStage);
    state.shake = result.wallStage;
  }

  // HEAT 計算
  const otherPlayer = state.players.length >= 2 ? state.players[1 - i] : undefined;
  const carDist = otherPlayer ? distance(np.x, np.y, otherPlayer.x, otherPlayer.y) : Infinity;
  const newHeat = updateHeat(np.heat, result.trackInfo.dist, carDist, 1 / 60, ce.heatGainMul, GAME.TRACK_WIDTH, GAME.COLLISION_DIST);
  const heatBoost = getHeatBoost(newHeat);
  if (heatBoost > 0) {
    np = { ...np, speed: Math.min(1, np.speed + heatBoost * 0.1) };
  }
  np = { ...np, heat: newHeat };

  // ハイライト検出
  const driftResult = detectDriftBonus(state.highlightTracker, np.drift, i, np.lap, raceTime);
  state.highlightTracker = driftResult.tracker;
  const heatResult = detectHeatBoost(state.highlightTracker, np.heat, i, np.lap, raceTime);
  state.highlightTracker = heatResult.tracker;
  const nearResult = detectNearMiss(state.highlightTracker, result.trackInfo.dist, GAME.TRACK_WIDTH, 1 / 60, i, np.lap, raceTime);
  state.highlightTracker = nearResult.tracker;

  // チェックポイント判定
  const cpResult = updateCheckpoints(np, course.checkpointCoords, GAME.CHECKPOINT_RADIUS);
  np = cpResult.player;

  // ラップ判定
  const lapResult = checkLapComplete(np, sl, result.trackInfo.seg, p.lastSeg, pts.length, course.checkpointCoords.length, GAME.TRACK_WIDTH, now);
  if (lapResult.completed) {
    const flResult = detectFastestLap(state.highlightTracker, lapResult.lapTime, i, np.lap, raceTime);
    state.highlightTracker = flResult.tracker;

    np = { ...np, lap: np.lap + 1, checkpointFlags: 0, lapTimes: [...np.lapTimes, lapResult.lapTime], lapStart: now, activeCards: [], shieldCount: 0 };
    state.decks[i] = clearActiveEffects(state.decks[i]);

    if (np.lap > raceConfig.maxLaps && !state.winner) {
      state.winner = p.name;
      state.phase = 'result';
      config.audio.stopEngine();
      config.audio.playSfx('finish');
    }
    if (np.lap === raceConfig.maxLaps) {
      config.audio.playSfx('finalLap');
    }
  }

  // セグメント・進行度更新
  if (result.trackInfo.seg !== p.lastSeg) {
    np = { ...np, lastSeg: result.trackInfo.seg };
  }
  return { ...np, progress: (np.lap - 1) * pts.length + result.trackInfo.seg };
};

/** レースフェーズの更新 */
const updateRacePhase = (
  state: GameOrchestratorState,
  config: GameOrchestratorConfig,
  cpuStrategy: CpuStrategy | null,
  courseEffect: CourseEffect,
  sl: StartLine,
  now: number,
): void => {
  if (!state.engineOn) {
    config.audio.startEngine();
    state.engineOn = true;
  }

  const raceTime = now - state.raceStartTime;

  // 各プレイヤー更新
  state.players = state.players.map((p, i) =>
    updateSinglePlayer(p, i, state, config, cpuStrategy, courseEffect, sl, raceTime, now),
  );

  // 衝突判定
  if (state.players.length >= 2) {
    const col = handleCollision(state.players[0], state.players[1], GAME.COLLISION_DIST);
    if (col) {
      config.audio.playSfx('collision');
      state.players[0] = col.player1;
      state.players[1] = col.player2;
    }
  }

  // 逆転検出
  if (state.players.length >= 2) {
    const positions = state.players.map(p => p.progress);
    for (let i = 0; i < 2; i++) {
      const otResult = detectOvertake(state.highlightTracker, positions, i, state.players[i].lap, raceTime);
      state.highlightTracker = otResult.tracker;
    }
  }

  // エンジン音更新
  const avgSpeed = state.players.length >= 2
    ? (state.players[0].speed + state.players[1].speed) / 2
    : state.players[0].speed;
  config.audio.updateEngine(avgSpeed);
};

/** ゲームオーケストレーターの生成 */
export const createOrchestrator = (config: GameOrchestratorConfig): GameOrchestrator => {
  let state = createInitialState(config);
  const { course, raceConfig } = config;
  const pts = course.points;
  const sl = calculateStartLine(pts, GAME.TRACK_WIDTH);
  const courseEffect = getCourseEffect(course.deco);
  const cpuStrategy: CpuStrategy | null = raceConfig.mode === 'cpu'
    ? createCpuStrategy(raceConfig.cpuDifficulty)
    : null;

  return {
    update(now: number): void {
      if (state.paused) return;

      if (state.phase === 'countdown') {
        if (now - state.countdownStartTime >= RACE_TIMING.COUNTDOWN) {
          state.phase = 'race';
          state.raceStartTime = now;
          state.players = state.players.map(p => ({ ...p, lapStart: now }));
          config.audio.playSfx('go');
        }
        return;
      }

      if (state.phase === 'draft') return;

      if (state.phase === 'race') {
        updateRacePhase(state, config, cpuStrategy, courseEffect, sl, now);
      }
    },

    draw(): void {
      config.renderer.beginFrame(state.shake);
      config.renderer.renderBackground(course);
      config.renderer.renderTrack(pts);
      state.players.forEach(p => config.renderer.renderKart(p));
      config.renderer.renderEffects(state.particles, state.sparks);
      if (state.phase === 'countdown') {
        config.renderer.renderCountdown(Date.now() - state.countdownStartTime);
      }
      config.renderer.renderHud(state.players, course.name, raceConfig.maxLaps, state.raceStartTime);
      if (state.phase === 'result') {
        config.renderer.renderResult(state.confetti);
      }
      config.renderer.endFrame();
      state.shake *= 0.8;
    },

    getState(): Readonly<GameOrchestratorState> {
      return state;
    },

    togglePause(): void {
      state.paused = !state.paused;
    },

    reset(): void {
      state = createInitialState(config);
    },
  };
};
