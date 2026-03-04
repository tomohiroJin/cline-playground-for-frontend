import { useState, useEffect } from 'react';

/** マウス位置（ビューポート中心基準、-1.0〜+1.0 に正規化） */
interface MousePosition {
  x: number;
  y: number;
}

/**
 * マウス追従パララックスフック
 *
 * ビューポート中心を原点として、マウス位置を -1.0 〜 +1.0 に正規化して返す。
 * タッチデバイスでは { x: 0, y: 0 } を返し続ける（自動ドリフトのみ使用）。
 */
export const useMouseParallax = (): MousePosition => {
  const [mousePos, setMousePos] = useState<MousePosition>({ x: 0, y: 0 });

  useEffect(() => {
    // タッチデバイスではマウス追従しない
    if ('ontouchstart' in window) return;

    const handleMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      setMousePos({
        x: (e.clientX - cx) / cx,
        y: (e.clientY - cy) / cy,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return mousePos;
};
