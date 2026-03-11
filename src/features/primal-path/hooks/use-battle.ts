/**
 * 原始進化録 - PRIMAL PATH - useBattle フック
 *
 * バトルのティックループ管理（setInterval）
 */
import { useEffect, useRef, useCallback } from 'react';
import type { GameState, TickEvent } from '../types';
import { tick } from '../game-logic';
import type { GameAction } from './actions';

/** バトルティック管理フック */
export function useBattle(
  state: GameState,
  dispatch: React.Dispatch<GameAction>,
  onEvents?: (events: TickEvent[]) => void,
) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (delayRef.current) {
      clearTimeout(delayRef.current);
      delayRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearTimer();
    if (state.phase !== 'battle' || state.battleSpd === 0 || !state.run?.en) return;

    timerRef.current = setInterval(() => {
      const s = stateRef.current;
      if (s.phase !== 'battle' || !s.run?.en) {
        clearTimer();
        return;
      }
      const { nextRun, events } = tick(s.run, s.finalMode);

      // イベント処理 — 単一パス、SFX 重複なし
      let dead = false;
      let enemyKilled = false;
      let finalBossKilled = false;

      for (const ev of events) {
        if (ev.type === 'player_dead') dead = true;
        if (ev.type === 'enemy_killed') enemyKilled = true;
        if (ev.type === 'final_boss_killed') finalBossKilled = true;
      }
      onEvents?.(events);

      if (dead) {
        clearTimer();
        dispatch({ type: 'BATTLE_TICK', nextRun }); // HP=0 を表示
        delayRef.current = setTimeout(() => {
          dispatch({ type: 'GAME_OVER', won: false });
        }, 600);
        return;
      }
      if (finalBossKilled) {
        clearTimer();
        dispatch({ type: 'BATTLE_TICK', nextRun }); // ボスHP=0 を表示
        delayRef.current = setTimeout(() => {
          dispatch({ type: 'FINAL_BOSS_KILLED' });
        }, 800);
        return;
      }
      if (enemyKilled) {
        clearTimer();
        dispatch({ type: 'BATTLE_TICK', nextRun }); // 敵HP=0 を表示
        delayRef.current = setTimeout(() => {
          dispatch({ type: 'AFTER_BATTLE' });
        }, 800);
        return;
      }
      // 通常ティック — 状態同期
      dispatch({ type: 'BATTLE_TICK', nextRun });
    }, state.battleSpd);

    return clearTimer;
    // state.run?._fPhase: 最終ボス Phase 2 遷移時にタイマーを再起動するために必要
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.battleSpd, state.finalMode, state.run?._fPhase, clearTimer, dispatch, onEvents]);

  return { clearTimer };
}
