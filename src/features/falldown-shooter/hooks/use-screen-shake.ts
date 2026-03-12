// 画面シェイクエフェクトフック

import { useState, useCallback, useRef, useEffect } from 'react';

/** シェイク設定定数 */
const SHAKE_PRESETS = {
  bomb: { intensity: 4, duration: 300 },
  blast: { intensity: 6, duration: 400 },
  line: { intensity: 2, duration: 200 },
  gameOver: { intensity: 8, duration: 500 },
} as const;

interface UseScreenShakeReturn {
  isShaking: boolean;
  shakeStyle: React.CSSProperties;
  triggerShake: (intensity: number, duration: number) => void;
  bombShake: () => void;
  blastShake: () => void;
  lineShake: () => void;
  gameOverShake: () => void;
}

/** prefers-reduced-motion を確認する */
const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/** 画面シェイクエフェクトを管理するフック */
export const useScreenShake = (): UseScreenShakeReturn => {
  const [isShaking, setIsShaking] = useState(false);
  const [shakeStyle, setShakeStyle] = useState<React.CSSProperties>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // アンマウント時のタイマークリーンアップ
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const triggerShake = useCallback((intensity: number, duration: number) => {
    // アクセシビリティ: reduced-motion設定を尊重
    if (prefersReducedMotion()) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setIsShaking(true);
    setShakeStyle({
      animation: `shake-${intensity} ${duration}ms ease-in-out`,
    });

    timerRef.current = setTimeout(() => {
      setIsShaking(false);
      setShakeStyle({});
    }, duration);
  }, []);

  const bombShake = useCallback(() => {
    triggerShake(SHAKE_PRESETS.bomb.intensity, SHAKE_PRESETS.bomb.duration);
  }, [triggerShake]);

  const blastShake = useCallback(() => {
    triggerShake(SHAKE_PRESETS.blast.intensity, SHAKE_PRESETS.blast.duration);
  }, [triggerShake]);

  const lineShake = useCallback(() => {
    triggerShake(SHAKE_PRESETS.line.intensity, SHAKE_PRESETS.line.duration);
  }, [triggerShake]);

  const gameOverShake = useCallback(() => {
    triggerShake(SHAKE_PRESETS.gameOver.intensity, SHAKE_PRESETS.gameOver.duration);
  }, [triggerShake]);

  return {
    isShaking,
    shakeStyle,
    triggerShake,
    bombShake,
    blastShake,
    lineShake,
    gameOverShake,
  };
};
