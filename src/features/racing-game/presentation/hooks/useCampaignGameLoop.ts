// キャンペーン用ゲームループフック
//
// 既存 useGameLoop と並列に存在する独立フック。
// orchestrator を内部で起動しつつ、毎フレームで campaign-tick を呼んで
// 残時間管理 / チェックポイント時間延長 / clear-or-game_over の判定を行う。

import { useEffect, useRef, useState, useCallback } from 'react';
import type { GameOrchestrator, GameOrchestratorConfig } from '../../application/game-orchestrator';
import { createOrchestrator } from '../../application/game-orchestrator';
import type { Stage } from '../../domain/race/stage';
import type { CampaignRuntime } from '../../application/campaign-runtime';
import { createCampaignRuntime } from '../../application/campaign-runtime';
import { executeCampaignTick } from '../../application/use-cases/campaign-tick';
import type { StageOutcome } from '../../domain/race/stage-progress';
import { decrementLives, isGameOver as isGameOverFn } from '../../domain/race/lives';

const FRAME_DT_SEC = 1 / 60;

/** キャンペーン走行中のフェーズ */
export type CampaignRacePhase =
  | 'countdown'
  | 'race'
  | 'cleared'
  | 'time_up'
  | 'game_over';

export interface UseCampaignGameLoopResult {
  readonly phase: CampaignRacePhase;
  readonly runtime: CampaignRuntime;
  readonly outcome: StageOutcome;
  readonly bonusEvent: { sec: number; key: number } | null;
  readonly togglePause: () => void;
  readonly paused: boolean;
}

/**
 * キャンペーンの 1 ステージを 1 回走らせるフック。
 * stage が変わると orchestrator を再生成して新規セッションを開始する。
 */
export const useCampaignGameLoop = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  config: GameOrchestratorConfig | null,
  stage: Stage | null,
  livesRemaining: number,
): UseCampaignGameLoopResult => {
  const orchestratorRef = useRef<GameOrchestrator | null>(null);
  const runtimeRef = useRef<CampaignRuntime | null>(null);
  const prevFlagsRef = useRef<number>(0);
  const lastLapRef = useRef<number>(1);
  const bonusKeyRef = useRef<number>(0);

  const [phase, setPhase] = useState<CampaignRacePhase>('countdown');
  const [runtime, setRuntime] = useState<CampaignRuntime>(() =>
    stage ? createCampaignRuntime(stage, livesRemaining) : ({} as CampaignRuntime),
  );
  const [outcome, setOutcome] = useState<StageOutcome>({ kind: 'in_progress' });
  const [bonusEvent, setBonusEvent] = useState<{ sec: number; key: number } | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!config || !canvasRef.current || !stage) return;

    const orchestrator = createOrchestrator(config);
    orchestratorRef.current = orchestrator;
    const initialRuntime = createCampaignRuntime(stage, livesRemaining);
    runtimeRef.current = initialRuntime;
    setRuntime(initialRuntime);
    prevFlagsRef.current = 0;
    lastLapRef.current = 1;
    setOutcome({ kind: 'in_progress' });
    setPhase('countdown');

    let isRunning = true;
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

        if (state.phase === 'race' && runtimeRef.current) {
          const player = state.players[0];
          const currentFlags = player.checkpointFlags;
          const hasCrossedFinishLine = player.lap > lastLapRef.current;

          const result = executeCampaignTick({
            runtime: runtimeRef.current,
            prevCheckpointFlags: prevFlagsRef.current,
            currentCheckpointFlags: currentFlags,
            hasCrossedFinishLine,
            dt: FRAME_DT_SEC,
          });

          runtimeRef.current = result.runtime;
          prevFlagsRef.current = currentFlags;
          lastLapRef.current = player.lap;

          setRuntime(result.runtime);
          if (result.appliedBonusSec !== undefined) {
            bonusKeyRef.current += 1;
            setBonusEvent({ sec: result.appliedBonusSec, key: bonusKeyRef.current });
          }

          setPhase('race');
          setOutcome(result.outcome);

          if (result.outcome.kind === 'cleared') {
            setPhase('cleared');
            isRunning = false;
            return;
          }
          if (result.outcome.kind === 'time_up') {
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

  return { phase, runtime, outcome, bonusEvent, togglePause, paused };
};
