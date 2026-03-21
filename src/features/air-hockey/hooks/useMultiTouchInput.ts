/**
 * マルチタッチ入力フック
 * 画面を上下に分割し、1P（下半分）と 2P（上半分）のタッチを独立追跡する
 * 2P 対戦モードで Canvas 要素にタッチリスナーを登録する
 */
import { useEffect, useRef, useCallback } from 'react';
import { CONSTANTS } from '../core/constants';
import {
  createMultiTouchState,
  processTouchStart,
  processTouchMove,
  processTouchEnd,
  type MultiTouchState,
} from '../core/multi-touch';

type UseMultiTouchInputReturn = {
  /** マルチタッチ状態の Ref（ゲームループから毎フレーム参照可能） */
  stateRef: React.RefObject<MultiTouchState>;
};

/**
 * マルチタッチ入力フック
 * @param canvasRef Canvas 要素の Ref
 * @param enabled 有効フラグ（2P モード + ゲーム画面時のみ true）
 */
export function useMultiTouchInput(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  enabled: boolean
): UseMultiTouchInputReturn {
  const stateRef = useRef<MultiTouchState>(createMultiTouchState());

  // Canvas 座標変換ヘルパー
  const toCanvasCoords = useCallback((touch: Touch, rect: DOMRect) => {
    const { WIDTH: W, HEIGHT: H } = CONSTANTS.CANVAS;
    return {
      canvasX: ((touch.clientX - rect.left) / rect.width) * W,
      canvasY: ((touch.clientY - rect.top) / rect.height) * H,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const pos = toCanvasCoords(touch, rect);
        stateRef.current = processTouchStart(stateRef.current, touch.identifier, pos, CONSTANTS);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const pos = toCanvasCoords(touch, rect);
        stateRef.current = processTouchMove(stateRef.current, touch.identifier, pos, CONSTANTS);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        stateRef.current = processTouchEnd(stateRef.current, e.changedTouches[i].identifier);
      }
    };

    // タッチアクション無効化（ブラウザジェスチャー防止）
    canvas.style.touchAction = 'none';

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
      stateRef.current = createMultiTouchState();
    };
  }, [canvasRef, enabled, toCanvasCoords]);

  return { stateRef };
}
