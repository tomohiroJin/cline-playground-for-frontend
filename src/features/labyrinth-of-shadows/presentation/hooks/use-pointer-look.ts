import { useEffect, useRef } from 'react';

/** マウス感度（1px あたりのラジアン。既存 CONFIG.player.rotSpeed に近い値） */
export const LOOK_SENSITIVITY = 0.0022;

/** 上下視点の可動域（±ラジアン、約26°）。演出のみでゲームロジックには影響しない */
export const MAX_PITCH = 0.45;

/** 未消費のマウス移動量（ラジアン換算）を保持する。dy は上下視点用 */
export interface LookRef {
  dx: number;
  dy: number;
}

/** 現在の蓄積量にマウス移動量(px)を感度換算して加算する（純粋関数） */
export function accumulateLook(current: number, movementX: number): number {
  return current + movementX * LOOK_SENSITIVITY;
}

/** ピッチ角を可動域 ±MAX_PITCH に収める（純粋関数） */
export function clampPitch(pitch: number): number {
  return Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch));
}

/**
 * ポインタロックを管理し、マウス水平移動量を lookRef.dx に蓄積するフック。
 * bindTargetRef の要素クリックでロック要求、mousemove で蓄積する。
 * 蓄積値は毎フレーム消費側（GameController）が 0 にリセットする。
 */
export function usePointerLook(enabled: boolean): {
  lookRef: React.MutableRefObject<LookRef>;
  bindTargetRef: React.RefObject<HTMLElement | null>;
} {
  const lookRef = useRef<LookRef>({ dx: 0, dy: 0 });
  const bindTargetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const target = bindTargetRef.current;
    if (!enabled || !target) return;

    const requestLock = () => {
      if (document.pointerLockElement !== target) {
        // 未対応環境（ヘッドレス等）では拒否されるため、失敗は無視する
        const result = target.requestPointerLock() as unknown;
        if (result instanceof Promise) result.catch(() => undefined);
      }
    };
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== target) return;
      lookRef.current.dx = accumulateLook(lookRef.current.dx, e.movementX);
      // マウス下移動(movementY正)で視線を下げるため符号を反転して蓄積する
      lookRef.current.dy = accumulateLook(lookRef.current.dy, -e.movementY);
    };

    target.addEventListener('click', requestLock);
    document.addEventListener('mousemove', onMouseMove);
    return () => {
      target.removeEventListener('click', requestLock);
      document.removeEventListener('mousemove', onMouseMove);
    };
  }, [enabled]);

  return { lookRef, bindTargetRef };
}
