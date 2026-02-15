import React, { useCallback, RefObject } from 'react';
import { clamp } from '../../../utils/math-utils';
import { getConstants } from '../core/constants';
import { GameState, CanvasSize } from '../core/types';

/**
 * マウス/タッチ入力を処理し、プレイヤーのマレット位置を更新するフック
 */
export function useInput(
  gameRef: RefObject<GameState | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  lastInputRef: React.MutableRefObject<number>,
  screen: string,
  showHelp: boolean,
  setShowHelp: (v: boolean) => void,
  canvasSize: CanvasSize = 'standard'
) {
  return useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const game = gameRef.current;
      if (!game || screen !== 'game') return;

      const consts = getConstants(canvasSize);
      const { WIDTH: W, HEIGHT: H } = consts.CANVAS;
      const { MALLET: MR } = consts.SIZES;

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

      const newX = clamp(((clientX - rect.left) / rect.width) * W, MR + 5, W - MR - 5);
      const newY = clamp(((clientY - rect.top) / rect.height) * H, H / 2 + MR + 10, H - MR - 5);

      game.player.vx = newX - game.player.x;
      game.player.vy = newY - game.player.y;
      game.player.x = newX;
      game.player.y = newY;
    },
    [screen, showHelp, gameRef, canvasRef, lastInputRef, setShowHelp, canvasSize]
  );
}
