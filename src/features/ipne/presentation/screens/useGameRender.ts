/**
 * Canvas描画フック
 *
 * Game.tsx の Canvas描画 useEffect を移設したもの。
 * canvas/ctx ガード後に renderGameFrame で1フレームを描画する。
 * 依存配列・描画ロジックは元 effect と完全に同一。
 */
import React, { useEffect } from 'react';
import { renderGameFrame } from './render/renderGameFrame';
import type { RenderContext } from './render/renderContext';

/**
 * useGameRender に渡すパラメータ。
 * RenderContext の生入力から導出する（ctx/canvas/now はフック内で canvasRef/renderTime から導出）。
 */
export type UseGameRenderParams = Omit<RenderContext, 'ctx' | 'canvas' | 'now'> & {
  /** canvas 要素の ref（フック内で .current から canvas/ctx を導出） */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** 描画タイムスタンプ（RenderContext.now の供給元） */
  renderTime: number;
};

export function useGameRender(params: UseGameRenderParams): void {
  const { canvasRef, renderTime, ...rest } = params;
  // 依存配列用に reactive 値を明示分割代入（可読性のため）
  const {
    map, player, enemies, items, traps, walls, mapState, goalPos, debugState,
    attackEffect, lastDamageAt, effectQueueRef, floatingTextManagerRef, comboStateRef,
    spriteRenderer, isDying,
  } = params;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderGameFrame({ ...rest, ctx, canvas, now: renderTime });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    map, player, enemies, items, traps, walls, mapState, goalPos, debugState, renderTime,
    attackEffect, lastDamageAt, effectQueueRef, floatingTextManagerRef, comboStateRef,
    spriteRenderer, isDying,
  ]);
}
