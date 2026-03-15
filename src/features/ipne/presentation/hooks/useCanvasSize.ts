/**
 * コンテナサイズに応じて Canvas サイズと tileSize を動的に計算するフック
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { calculateTileSize, getCanvasSize } from '../services/viewportService';

/** デバウンスの待機時間（ms） */
const RESIZE_DEBOUNCE_MS = 200;

export interface CanvasSizeResult {
  tileSize: number;
  canvasWidth: number;
  canvasHeight: number;
}

/**
 * コンテナサイズに応じて Canvas サイズと tileSize を動的に計算するフック
 * @param containerRef - コンテナ要素の ref
 */
export function useCanvasSize(
  containerRef: React.RefObject<HTMLElement | null>
): CanvasSizeResult {
  const [size, setSize] = useState<CanvasSizeResult>(() => {
    // 初期値: デフォルトの48pxタイルサイズ
    const { width, height } = getCanvasSize(48);
    return { tileSize: 48, canvasWidth: width, canvasHeight: height };
  });

  const debounceTimerRef = useRef<number>(0);

  const recalculate = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const tileSize = calculateTileSize(el.clientWidth, el.clientHeight);
    const { width, height } = getCanvasSize(tileSize);
    setSize({ tileSize, canvasWidth: width, canvasHeight: height });
  }, [containerRef]);

  useEffect(() => {
    // 初回計算
    recalculate();

    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      // デバウンス処理
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = window.setTimeout(recalculate, RESIZE_DEBOUNCE_MS);
    });

    observer.observe(el);

    return () => {
      observer.disconnect();
      clearTimeout(debounceTimerRef.current);
    };
  }, [containerRef, recalculate]);

  return size;
}
