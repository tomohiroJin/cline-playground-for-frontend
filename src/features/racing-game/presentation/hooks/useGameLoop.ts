// ゲームループ管理フック

import { useEffect, useRef, useState, useCallback } from 'react';
import type { GamePhase } from '../../domain/race/types';
import type { GameOrchestratorConfig, GameOrchestrator } from '../../application/game-orchestrator';
import { createOrchestrator } from '../../application/game-orchestrator';
import { getSummary } from '../../domain/highlight/highlight';
import type { HighlightType } from '../../domain/highlight/types';

/** ゲームループの結果 */
export interface UseGameLoopResult {
  readonly phase: GamePhase;
  readonly paused: boolean;
  readonly winner: string | null;
  readonly highlightSummary: { type: HighlightType; count: number; totalScore: number }[];
  readonly togglePause: () => void;
  readonly reset: () => void;
}

/** ゲームループフック */
export const useGameLoop = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  config: GameOrchestratorConfig | null,
): UseGameLoopResult => {
  const orchestratorRef = useRef<GameOrchestrator | null>(null);
  const winnerRef = useRef<string | null>(null);
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [paused, setPaused] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [highlightSummary, setHighlightSummary] = useState<{ type: HighlightType; count: number; totalScore: number }[]>([]);

  useEffect(() => {
    if (!config || !canvasRef.current) return;

    const orchestrator = createOrchestrator(config);
    orchestratorRef.current = orchestrator;
    winnerRef.current = null;
    setPhase('countdown');

    let isRunning = true;
    const loop = () => {
      if (!isRunning) return;
      try {
        orchestrator.update(Date.now());
        orchestrator.draw();
        const state = orchestrator.getState();
        setPhase(state.phase);
        setPaused(state.paused);
        if (state.winner && !winnerRef.current) {
          winnerRef.current = state.winner;
          setWinner(state.winner);
          setHighlightSummary(getSummary(state.highlightTracker));
        }
      } catch (e) {
        console.error('Game Loop Error:', e);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    return () => {
      isRunning = false;
      orchestratorRef.current = null;
    };
  }, [config, canvasRef]);

  const togglePause = useCallback(() => {
    orchestratorRef.current?.togglePause();
  }, []);

  const reset = useCallback(() => {
    orchestratorRef.current?.reset();
    winnerRef.current = null;
    setPhase('countdown');
    setPaused(false);
    setWinner(null);
    setHighlightSummary([]);
  }, []);

  return { phase, paused, winner, highlightSummary, togglePause, reset };
};
