// ゲームオーケストレーター（Application 層のコア）
// フェーズ別ハンドラへの委譲とゲームループの制御

import type { CpuStrategy } from '../domain/player/cpu-strategy';
import type { StartLine, CourseEffect } from '../domain/track/types';
import { createCpuStrategy } from '../domain/player/cpu-strategy';
import { calculateStartLine } from '../domain/track/track';
import { getCourseEffect } from '../domain/track/course-effect';
import { RACE_TIMING } from '../domain/race/constants';
import {
  type GameOrchestratorConfig,
  type GameOrchestratorState,
  createInitialState,
} from './orchestrator-state';
import { updateRacePhase } from './race-handler';
import { updateDraftPhase } from './draft-handler';
import { GAME } from '../domain/race/constants';

// 型の re-export（既存の利用者向け）
export type { GameOrchestratorConfig, GameOrchestratorState } from './orchestrator-state';

/** オーケストレーターインターフェース */
export interface GameOrchestrator {
  update(now: number): void;
  draw(): void;
  getState(): Readonly<GameOrchestratorState>;
  togglePause(): void;
  reset(): void;
}

/** ゲームオーケストレーターの生成 */
export const createOrchestrator = (config: GameOrchestratorConfig): GameOrchestrator => {
  let state = createInitialState(config);
  const { course, raceConfig } = config;
  const pts = course.points;
  const sl: StartLine = calculateStartLine(pts, GAME.TRACK_WIDTH);
  const courseEffect: CourseEffect = getCourseEffect(course.deco);
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

      if (state.phase === 'draft') {
        updateDraftPhase(state, config, now);
        return;
      }

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
