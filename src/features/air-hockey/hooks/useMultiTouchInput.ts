/**
 * マルチタッチ入力フック
 * 画面を上下に分割し、1P（下半分）と 2P（上半分）のタッチを独立追跡する
 * 2P 対戦モードで Canvas 要素にタッチリスナーを登録する
 */
import { useEffect, useRef } from 'react';
import { CONSTANTS, screenToCanvas } from '../core/constants';
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
 * @param enabled 有効フラグ（2P/2v2 モード + ゲーム画面時のみ true）
 * @param is4Zone true=4分割ゾーン（2v2）、false=上下2分割（2P）
 */
export function useMultiTouchInput(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  enabled: boolean,
  is4Zone = false
): UseMultiTouchInputReturn {
  const stateRef = useRef<MultiTouchState>(createMultiTouchState());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const pos = screenToCanvas(touch.clientX, touch.clientY, rect, CONSTANTS);
        stateRef.current = processTouchStart(stateRef.current, touch.identifier, pos, CONSTANTS, is4Zone);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const pos = screenToCanvas(touch.clientX, touch.clientY, rect, CONSTANTS);
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
  }, [canvasRef, enabled, is4Zone]);

  return { stateRef };
}
