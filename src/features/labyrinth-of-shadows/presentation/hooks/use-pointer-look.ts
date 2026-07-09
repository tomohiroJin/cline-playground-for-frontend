import { useEffect, useRef } from 'react';

/** マウス感度（1px あたりのラジアン。既存 CONFIG.player.rotSpeed に近い値） */
export const LOOK_SENSITIVITY = 0.0022;

/** 未消費のマウス水平移動量（ラジアン換算）を保持する */
export interface LookRef {
  dx: number;
}

/** 現在の蓄積量にマウス移動量(px)を感度換算して加算する（純粋関数） */
export function accumulateLook(current: number, movementX: number): number {
  return current + movementX * LOOK_SENSITIVITY;
}

/**
 * ポインタロックを管理し、マウス水平移動量を lookRef.dx に蓄積するフック。
 * bindTargetRef の要素クリックでロック要求、mousemove で蓄積する。
 * 蓄積値は毎フレーム消費側（GameController）が 0 にリセットする。
 */
export function usePointerLook(enabled: boolean): {
  lookRef: React.MutableRefObject<LookRef>;
  bindTargetRef: React.RefObject<HTMLElement>;
} {
  const lookRef = useRef<LookRef>({ dx: 0 });
  const bindTargetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const target = bindTargetRef.current;
    if (!enabled || !target) return;

    const requestLock = () => {
      if (document.pointerLockElement !== target) target.requestPointerLock();
    };
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== target) return;
      lookRef.current.dx = accumulateLook(lookRef.current.dx, e.movementX);
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
