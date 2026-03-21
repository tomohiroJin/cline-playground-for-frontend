// レースフェーズの更新ハンドラ

import type { Player } from '../domain/player/types';
import type { StartLine, CourseEffect } from '../domain/track/types';
import type { WallStage } from './ports/audio-port';
import type { CpuStrategy } from '../domain/player/cpu-strategy';
import type { GameOrchestratorConfig, GameOrchestratorState } from './orchestrator-state';
import { movePlayer } from '../domain/player/player';
import { processInput } from './input-processor';
import { getTrackInfo } from '../domain/track/track';
import { getSegmentFriction, getSegmentSpeedModifier } from '../domain/track/course-effect';
import { handleCollision } from '../domain/race/collision';
import { updateCheckpoints } from '../domain/race/checkpoint';
import { checkLapComplete } from '../domain/race/lap-counter';
import { clearActiveEffects } from '../domain/card/deck';
import { computeAllCardEffects } from '../domain/card/card-effect';
import { updateHeat, getHeatBoost } from '../domain/player/heat';
import { detectDriftBonus, detectHeatBoost, detectNearMiss, detectOvertake, detectFastestLap } from '../domain/highlight/event-detector';
import { GAME } from '../domain/race/constants';
import { distance } from '../domain/shared/math-utils';
import { processDraftQueue } from './draft-handler';
import type { HighlightTrackerState } from '../domain/highlight/highlight';

/** プレイヤー更新コンテキスト（パラメータオブジェクト） */
interface UpdateContext {
  readonly state: GameOrchestratorState;
  readonly config: GameOrchestratorConfig;
  readonly cpuStrategy: CpuStrategy | null;
  readonly courseEffect: CourseEffect;
  readonly sl: StartLine;
  readonly raceTime: number;
  readonly now: number;
}

/** ハイライト検出結果を state に適用する */
type DetectFn = (tracker: HighlightTrackerState) => { tracker: HighlightTrackerState };

/** 複数のハイライト検出を順次適用する */
const applyDetections = (tracker: HighlightTrackerState, detectors: DetectFn[]): HighlightTrackerState =>
  detectors.reduce((t, detect) => detect(t).tracker, tracker);

/** HEAT ブーストの計算と適用 */
const applyHeatBoost = (
  np: Player,
  i: number,
  state: GameOrchestratorState,
  trackDist: number,
  heatGainMul: number,
): Player => {
  const otherPlayer = state.players.length >= 2 ? state.players[1 - i] : undefined;
  const carDist = otherPlayer ? distance(np.x, np.y, otherPlayer.x, otherPlayer.y) : Infinity;
  const newHeat = updateHeat(np.heat, trackDist, carDist, 1 / 60, heatGainMul, GAME.TRACK_WIDTH, GAME.COLLISION_DIST);
  const heatBoost = getHeatBoost(newHeat);
  const speed = heatBoost > 0 ? Math.min(1, np.speed + heatBoost * 0.1) : np.speed;
  return { ...np, speed, heat: newHeat };
};

/** ラップ完了時の処理 */
const handleLapComplete = (
  np: Player,
  i: number,
  lapTime: number,
  ctx: UpdateContext,
): Player => {
  const { state, config, now } = ctx;
  const { raceConfig } = config;

  // ファステストラップ検出
  const flResult = detectFastestLap(state.highlightTracker, lapTime, i, np.lap, ctx.raceTime);
  state.highlightTracker = flResult.tracker;

  // ラップ進行
  const updated: Player = {
    ...np,
    lap: np.lap + 1,
    checkpointFlags: 0,
    lapTimes: [...np.lapTimes, lapTime],
    lapStart: now,
    activeCards: [],
    shieldCount: 0,
  };
  state.decks[i] = clearActiveEffects(state.decks[i]);

  // レース終了判定
  if (updated.lap > raceConfig.maxLaps && !state.winner) {
    state.winner = np.name;
    state.phase = 'result';
    config.audio.stopEngine();
    config.audio.playSfx('finish');
  }
  if (updated.lap === raceConfig.maxLaps) {
    config.audio.playSfx('finalLap');
  }

  // ドラフトトリガー（カード有効 & 非ソロ & 最終ラップ以外）
  if (raceConfig.cardsEnabled && raceConfig.mode !== 'solo'
      && updated.lap <= raceConfig.maxLaps && raceConfig.maxLaps > 1) {
    const draftKey = `${i}-${updated.lap - 1}`;
    if (!state.draftedLaps.has(draftKey)) {
      state.draftedLaps.add(draftKey);
      state.draftQueue.push({ playerIndex: i, lap: updated.lap - 1 });
    }
  }

  return updated;
};

/** 単一プレイヤーの1フレーム更新 */
const updateSinglePlayer = (p: Player, i: number, ctx: UpdateContext): Player => {
  const { state, config, cpuStrategy, courseEffect, sl, raceTime, now } = ctx;
  const { course, raceConfig } = config;
  const pts = course.points;

  // 入力 → コマンド変換
  const inputState = config.input.getPlayerInput(i);
  const cmd = processInput(p, inputState, p.isCpu ? cpuStrategy : null, pts, GAME.TRACK_WIDTH);

  // コース効果 → 実効速度
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

  // 壁ヒット音
  if (result.wallHit) {
    config.audio.playWallHit(Math.min(3, result.wallStage) as WallStage);
    state.shake = result.wallStage;
  }

  // HEAT 計算
  np = applyHeatBoost(np, i, state, result.trackInfo.dist, ce.heatGainMul);

  // ハイライト検出（DRY: 同パターンの3検出を一括適用）
  state.highlightTracker = applyDetections(state.highlightTracker, [
    (t) => detectDriftBonus(t, np.drift, i, np.lap, raceTime),
    (t) => detectHeatBoost(t, np.heat, i, np.lap, raceTime),
    (t) => detectNearMiss(t, result.trackInfo.dist, GAME.TRACK_WIDTH, 1 / 60, i, np.lap, raceTime),
  ]);

  // チェックポイント判定
  np = updateCheckpoints(np, course.checkpointCoords, GAME.CHECKPOINT_RADIUS).player;

  // ラップ判定
  const lapResult = checkLapComplete(np, sl, result.trackInfo.seg, p.lastSeg, pts.length, course.checkpointCoords.length, GAME.TRACK_WIDTH, now);
  if (lapResult.completed) {
    np = handleLapComplete(np, i, lapResult.lapTime, ctx);
  }

  // セグメント・進行度更新
  const lastSeg = result.trackInfo.seg !== p.lastSeg ? result.trackInfo.seg : np.lastSeg;
  return { ...np, lastSeg, progress: (np.lap - 1) * pts.length + result.trackInfo.seg };
};

/** レースフェーズの更新 */
export const updateRacePhase = (
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
  const ctx: UpdateContext = { state, config, cpuStrategy, courseEffect, sl, raceTime, now };

  // 各プレイヤー更新
  state.players = state.players.map((p, i) => updateSinglePlayer(p, i, ctx));

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
    state.highlightTracker = applyDetections(state.highlightTracker, [
      (t) => detectOvertake(t, positions, 0, state.players[0].lap, raceTime),
      (t) => detectOvertake(t, positions, 1, state.players[1].lap, raceTime),
    ]);
  }

  // エンジン音更新
  const avgSpeed = state.players.length >= 2
    ? (state.players[0].speed + state.players[1].speed) / 2
    : state.players[0].speed;
  config.audio.updateEngine(avgSpeed);

  // ドラフト遷移（勝者未決定時のみ）
  if (state.draftQueue.length > 0 && !state.winner) {
    processDraftQueue(state, config, now);
  }
};
