import React, { useCallback, RefObject } from 'react';
import { clamp } from '../../../utils/math-utils';
import { CONSTANTS, screenToCanvas, getPlayerXBounds, getPlayerYBounds } from '../core/constants';

/** プレイヤーマレットの目標位置 */
export type PlayerTargetPosition = { x: number; y: number } | null;

/**
 * マウス/タッチ入力を処理し、目標位置を ref に保存するフック
 * 実際のマレット移動はゲームループ内で行う（フレーム同期）
 */
export function useInput(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  lastInputRef: React.MutableRefObject<number>,
  playerTargetRef: React.MutableRefObject<PlayerTargetPosition>,
  screen: string,
  showHelp: boolean,
  setShowHelp: (v: boolean) => void
) {
  return useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (screen !== 'game') return;

      const now = Date.now();
      lastInputRef.current = now;

      if (showHelp) {
        setShowHelp(false);
        return;
      }

      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      let clientX, clientY;

      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
      }

      const canvas = screenToCanvas(clientX, clientY, rect, CONSTANTS);
      const { minX, maxX } = getPlayerXBounds(CONSTANTS);
      const { minY, maxY } = getPlayerYBounds('player1', CONSTANTS);
      const newX = clamp(canvas.canvasX, minX, maxX);
      const newY = clamp(canvas.canvasY, minY, maxY);

      // 目標位置を ref に保存（ゲームループで適用）
      playerTargetRef.current = { x: newX, y: newY };
    },
    [screen, showHelp, canvasRef, lastInputRef, playerTargetRef, setShowHelp]
  );
}
