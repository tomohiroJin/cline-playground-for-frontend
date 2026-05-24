// Canvas の表示サイズ確定時に内部解像度を再適用するフック。
//
// 背景（フィードバック「バックすると小さい枠で囲まれ、デモ開始まで小さいまま」）:
// Canvas は CSS `width:100%` だが、親 CanvasContainer に明示幅が無いため、
// Canvas の表示幅は intrinsic サイズ（width 属性）に依存する。キャンペーンから
// 通常モードへ戻った直後はレイアウトが未確定で小さい枠のまま固定され、
// デモ開始（8 秒後）に描画 useEffect が再実行され canvas.width を再設定するまで
// 直らなかった。本フックは表示サイズが確定/変化した時点で内部解像度を再適用し、
// ブラウザにレイアウトの再評価を促す。内部解像度は固定値なので座標系・当たり判定に
// 影響しない。

import { useEffect } from 'react';

/** 再適用すべき表示幅変化とみなす閾値（px） */
const RESIZE_THRESHOLD_PX = 1;

/**
 * 表示幅の変化が内部解像度の再適用を要するかを判定する純粋関数。
 * - 0（レイアウト未確定）から正の値に確定した
 * - もしくは表示幅が有意（閾値超）に変化した
 */
export const shouldRedrawOnResize = (prevWidth: number, nextWidth: number): boolean =>
  nextWidth > 0 && (prevWidth <= 0 || Math.abs(nextWidth - prevWidth) > RESIZE_THRESHOLD_PX);

/**
 * Canvas の表示サイズが確定/変化したら内部解像度（internalWidth × internalHeight）を
 * 再適用する。ResizeObserver 非対応環境では何もしない。
 */
export const useCanvasAutoFit = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  internalWidth: number,
  internalHeight: number,
): void => {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === 'undefined') return;

    let prevWidth = 0;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const nextWidth = entry.contentRect.width;
      if (shouldRedrawOnResize(prevWidth, nextWidth)) {
        // 内部解像度を再適用（同値でも代入でバッファがリセットされ再レイアウトを促す）。
        // 連続フレーム描画（requestAnimationFrame）が次フレームで描き直すため空白は一瞬。
        canvas.width = internalWidth;
        canvas.height = internalHeight;
      }
      prevWidth = nextWidth;
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [canvasRef, internalWidth, internalHeight]);
};
