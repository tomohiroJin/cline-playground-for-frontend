/**
 * 原始進化録 - PRIMAL PATH - ゲーム画面スケーリングフック
 *
 * ビューポートサイズに応じて GameShell のスケール係数を計算する。
 * ResizeObserver でビューポート変化を監視し、アスペクト比 2:3 を維持。
 */
import { useState, useEffect } from 'react';
import { GAME_WIDTH, GAME_HEIGHT, MIN_SCALE, MAX_SCALE } from '../constants/ui';

/** ビューポートサイズから適切なスケール係数を計算 */
export const computeScale = (viewportWidth: number, viewportHeight: number): number => {
  const scaleX = viewportWidth / GAME_WIDTH;
  const scaleY = viewportHeight / GAME_HEIGHT;
  const raw = Math.min(scaleX, scaleY, MAX_SCALE);
  return Math.max(raw, MIN_SCALE);
};

/** ゲーム画面のレスポンシブスケーリングフック */
export const useGameScale = (): number => {
  const [scale, setScale] = useState(MAX_SCALE);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setScale(computeScale(width, height));
    });
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);

  return scale;
};
