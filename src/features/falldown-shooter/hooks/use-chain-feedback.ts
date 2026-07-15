// 連鎖の視覚・聴覚フィードバックを段階発火するフック（グリッドは触らない）
import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChainStep } from '../types';
import { Audio } from '../audio';
import { CHAIN_EFFECT } from '../constants';

/** 連鎖1段ごとの表示間隔（ms） */
const STEP_MS = 140;
/** 最大連鎖表示を保持してから消えるまで（ms） */
const HOLD_MS = 700;
/** シェイク持続（ms） */
const SHAKE_MS = 200;

interface UseChainFeedbackParams {
  soundEnabled: boolean;
  triggerShake?: (intensity: number, duration: number) => void;
}

interface UseChainFeedbackReturn {
  currentChain: number;
  celebrate: (chainSteps: ChainStep[]) => void;
}

/** 連鎖数に応じて N CHAIN! 表示・SE・シェイクを段階発火する */
export const useChainFeedback = ({
  soundEnabled,
  triggerShake,
}: UseChainFeedbackParams): UseChainFeedbackReturn => {
  const [currentChain, setCurrentChain] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  // アンマウント時にタイマーを掃除
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const celebrate = useCallback(
    (chainSteps: ChainStep[]) => {
      if (chainSteps.length < 2) return;
      clearTimers();
      const maxChain = chainSteps[chainSteps.length - 1].chain;

      // level 2..maxChain を段階表示（各段で SE とシェイクを発火）
      for (let level = 2; level <= maxChain; level++) {
        const timer = setTimeout(() => {
          setCurrentChain(level);
          if (soundEnabled) Audio.chain(level);
          triggerShake?.(CHAIN_EFFECT.shakeIntensity(level), SHAKE_MS);
        }, (level - 1) * STEP_MS);
        timersRef.current.push(timer);
      }

      // 最大連鎖を見せてから 0 に戻す
      const resetTimer = setTimeout(() => setCurrentChain(0), (maxChain - 1) * STEP_MS + HOLD_MS);
      timersRef.current.push(resetTimer);
    },
    [soundEnabled, triggerShake, clearTimers]
  );

  return { currentChain, celebrate };
};
