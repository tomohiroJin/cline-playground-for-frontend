// キャンペーン用ゲームループフック
//
// 設計方針（M2 / R3 / R4 対応）:
// - runtime の真実は `runtimeRef`。React state には UI 更新に必要な
//   「秒単位スナップショット」だけ書き出して 60FPS の re-render を回避。
// - useEffect 内のループ処理を `stepCampaignFrame` 純粋関数に分離。

import { useEffect, useRef, useState, useCallback } from 'react';
import type { GameOrchestrator, GameOrchestratorConfig } from '../../application/game-orchestrator';
import { createOrchestrator } from '../../application/game-orchestrator';
import type { Stage } from '../../domain/race/stage';
import type { CampaignRuntime } from '../../application/campaign-runtime';
import { createCampaignRuntime } from '../../application/campaign-runtime';
import { executeCampaignTick } from '../../application/use-cases/campaign-tick';
import type { StageOutcome } from '../../domain/race/stage-progress';
import { decrementLives, isGameOver as isGameOverFn } from '../../domain/race/lives';
import type { GameOrchestratorState } from '../../application/orchestrator-state';
import type { GamePhase } from '../../domain/race/types';

const FRAME_DT_SEC = 1 / 60;

/**
 * campaign-tick を実行すべきフレームかを判定する純粋関数。
 *
 * 判定ルール（spec §1.1 + race-handler の挙動を踏まえた設計）:
 * - **race フェーズ中**: 毎フレーム実行（残時間管理のため）
 * - **lap 増加フレーム**: race-handler が `updated.lap > raceConfig.maxLaps` の
 *   瞬間に `state.phase = 'result'` へ即時切替するため、ゴールしたフレームでは
 *   既に phase が 'race' でなくなっている。`lap` の増加だけを別軸で検出して
 *   1 フレームだけ campaign-tick を呼ぶ。
 *
 * lap 増加フレーム以降は呼び出し側で `frame.lastLap` を更新するため、
 * 次フレームでは `currentLap === lastLap` になり result フェーズでの連続呼び出しは発生しない（安全弁）。
 *
 * 本判定の正しさが回帰しないよう、必ず `shouldRunCampaignTick.test.ts` の境界
 * テストを通すこと。
 */
export const shouldRunCampaignTick = (
  phase: GamePhase,
  currentLap: number,
  lastLap: number,
): boolean => phase === 'race' || currentLap > lastLap;

/**
 * 最終周のゴールラインを通過した（=ステージクリア条件を満たした）かを判定する純粋関数。
 *
 * race-handler は `updated.lap > raceConfig.maxLaps` の瞬間に result へ遷移する
 * （race-handler.ts:85）。campaign のクリア判定もこれに揃え、`player.lap > maxLaps`
 * を基準にする。
 *
 * 旧実装は `player.lap > frame.lastLap`（lastLap 初期値 1）で、1 周目を終えた瞬間
 * （lap=2）に即クリアしてしまい、`stage.lapsToClear` を 2 以上にしても 1 周で終わる
 * バグがあった（フィードバック「一周では少なすぎる」の原因）。境界は
 * `hasCrossedFinalFinishLine.test` で保証する。
 */
export const hasCrossedFinalFinishLine = (
  playerLap: number,
  maxLaps: number,
): boolean => playerLap > maxLaps;

/** キャンペーン走行中のフェーズ */
export type CampaignRacePhase =
  | 'countdown'
  | 'race'
  | 'cleared'
  | 'time_up'
  | 'game_over';

/** UI 表示用の秒単位スナップショット */
export interface CampaignDisplay {
  readonly timeRemainingSec: number;  // 整数秒
  readonly elapsedSec: number;        // 0.1 秒精度
  /** 現在の周回（1 始まり、maxLaps で上限クランプ）。HUD の LAP 表示に使う */
  readonly currentLap: number;
}

export interface BonusEvent {
  readonly sec: number;
  readonly key: number;
}

export interface UseCampaignGameLoopResult {
  readonly phase: CampaignRacePhase;
  readonly display: CampaignDisplay;
  readonly outcome: StageOutcome;
  readonly bonusEvent: BonusEvent | null;
  readonly togglePause: () => void;
  readonly paused: boolean;
}

interface FrameState {
  runtime: CampaignRuntime;
  prevFlags: number;
  lastLap: number;
  bonusKey: number;
}

interface FrameResult {
  readonly nextState: FrameState;
  readonly outcome: StageOutcome;
  readonly bonusSec?: number;
}

/**
 * 1 フレーム分の純粋ステップ。テストしやすいよう外部状態を持たない。
 */
const stepCampaignFrame = (
  state: GameOrchestratorState,
  frame: FrameState,
  maxLaps: number,
): FrameResult => {
  const player = state.players[0];
  const currentFlags = player.checkpointFlags;
  // クリア条件は「最終周のゴールを通過した瞬間」。race-handler と同じ maxLaps 基準。
  const hasCrossedFinishLine = hasCrossedFinalFinishLine(player.lap, maxLaps);

  const result = executeCampaignTick({
    runtime: frame.runtime,
    prevCheckpointFlags: frame.prevFlags,
    currentCheckpointFlags: currentFlags,
    hasCrossedFinishLine,
    dt: FRAME_DT_SEC,
  });

  return {
    nextState: {
      runtime: result.runtime,
      prevFlags: currentFlags,
      lastLap: player.lap,
      bonusKey: result.appliedBonusSec !== undefined ? frame.bonusKey + 1 : frame.bonusKey,
    },
    outcome: result.outcome,
    bonusSec: result.appliedBonusSec,
  };
};

const toDisplay = (runtime: CampaignRuntime, currentLap: number): CampaignDisplay => ({
  timeRemainingSec: Math.ceil(runtime.timeRemainingSec),
  elapsedSec: Math.floor(runtime.elapsedSec * 10) / 10,
  currentLap,
});

const displaysEqual = (a: CampaignDisplay, b: CampaignDisplay): boolean =>
  a.timeRemainingSec === b.timeRemainingSec &&
  a.elapsedSec === b.elapsedSec &&
  a.currentLap === b.currentLap;

/**
 * キャンペーンの 1 ステージを 1 回走らせるフック。
 */
export const useCampaignGameLoop = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  config: GameOrchestratorConfig | null,
  stage: Stage | null,
  livesRemaining: number,
): UseCampaignGameLoopResult => {
  const orchestratorRef = useRef<GameOrchestrator | null>(null);
  const frameRef = useRef<FrameState | null>(null);

  const [phase, setPhase] = useState<CampaignRacePhase>('countdown');
  const [display, setDisplay] = useState<CampaignDisplay>({
    timeRemainingSec: 0,
    elapsedSec: 0,
    currentLap: 1,
  });
  const [outcome, setOutcome] = useState<StageOutcome>({ kind: 'in_progress' });
  const [bonusEvent, setBonusEvent] = useState<BonusEvent | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!config || !canvasRef.current || !stage) return;

    const maxLaps = config.raceConfig.maxLaps;
    const orchestrator = createOrchestrator(config);
    orchestratorRef.current = orchestrator;
    const initialRuntime = createCampaignRuntime(stage, livesRemaining);
    frameRef.current = {
      runtime: initialRuntime,
      prevFlags: 0,
      lastLap: 1,
      bonusKey: 0,
    };
    const initialDisplay = toDisplay(initialRuntime, 1);
    setDisplay(initialDisplay);
    setOutcome({ kind: 'in_progress' });
    setPhase('countdown');

    let isRunning = true;
    let lastDisplay = initialDisplay;

    const loop = () => {
      if (!isRunning) return;
      try {
        orchestrator.update(Date.now());
        orchestrator.draw();
        const state = orchestrator.getState();

        if (state.paused) {
          setPaused(true);
          requestAnimationFrame(loop);
          return;
        }
        setPaused(false);

        // S2 対応: state.players が空の異常状態をガード
        const player = state.players[0];
        if (!player || !frameRef.current) {
          requestAnimationFrame(loop);
          return;
        }

        // 純粋関数 shouldRunCampaignTick で判定（テストで境界保証）
        if (shouldRunCampaignTick(state.phase, player.lap, frameRef.current.lastLap)) {
          const stepResult = stepCampaignFrame(state, frameRef.current, maxLaps);
          frameRef.current = stepResult.nextState;

          // UI 更新は秒単位 or 周回の変化があった場合のみ（M2 対応）
          const newDisplay = toDisplay(stepResult.nextState.runtime, Math.min(player.lap, maxLaps));
          if (!displaysEqual(newDisplay, lastDisplay)) {
            lastDisplay = newDisplay;
            setDisplay(newDisplay);
          }

          if (stepResult.bonusSec !== undefined) {
            setBonusEvent({
              sec: stepResult.bonusSec,
              key: stepResult.nextState.bonusKey,
            });
          }

          setPhase('race');
          setOutcome(stepResult.outcome);

          if (stepResult.outcome.kind === 'cleared') {
            setPhase('cleared');
            isRunning = false;
            return;
          }
          if (stepResult.outcome.kind === 'time_up') {
            // Q2 対応: ここでは「時間切れ」のみを表す。残機評価は
            // useCampaignSession 側で1度だけ行うため、game_over に
            // 直接遷移させない（責務の単一化）。
            const nextLives = decrementLives(livesRemaining);
            setPhase(isGameOverFn(nextLives) ? 'game_over' : 'time_up');
            isRunning = false;
            return;
          }
        } else if (state.phase === 'countdown') {
          setPhase('countdown');
        }
      } catch (e) {
        console.error('Campaign Loop Error:', e);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    return () => {
      isRunning = false;
      orchestratorRef.current = null;
    };
  }, [config, canvasRef, stage, livesRemaining]);

  const togglePause = useCallback(() => {
    orchestratorRef.current?.togglePause();
  }, []);

  return { phase, display, outcome, bonusEvent, togglePause, paused };
};
