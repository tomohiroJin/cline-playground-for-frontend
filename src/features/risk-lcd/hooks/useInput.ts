import { useEffect, useRef } from 'react';
import type { InputAction } from '../types';

// キーボードマッピング
const KEY_MAP: Record<string, InputAction> = {
  ArrowLeft: 'left',
  a: 'left',
  A: 'left',
  ArrowRight: 'right',
  d: 'right',
  D: 'right',
  ArrowUp: 'up',
  w: 'up',
  W: 'up',
  ArrowDown: 'down',
  s: 'down',
  S: 'down',
  Enter: 'act',
  ' ': 'act',
  Escape: 'back',
  Backspace: 'back',
};

// キーボード/タッチ入力管理フック
export function useInput(
  onAction: (action: InputAction) => void,
  screenRef: React.RefObject<HTMLDivElement | null>,
) {
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;

  useEffect(() => {
    // キーボードイベント
    const handleKeyDown = (e: KeyboardEvent) => {
      const action = KEY_MAP[e.key];
      if (!action) return;
      e.preventDefault();
      onActionRef.current(action);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const el = screenRef.current;
    if (!el) return;

    // タッチスワイプ
    let touchStart = { x: 0, y: 0 };

    const handleTouchStart = (e: TouchEvent) => {
      touchStart = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStart.x;
      const dy = e.changedTouches[0].clientY - touchStart.y;
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 25) {
        onActionRef.current(dy < 0 ? 'up' : 'down');
      } else if (Math.abs(dx) > 25) {
        onActionRef.current(dx < 0 ? 'left' : 'right');
      } else {
        onActionRef.current('act');
      }
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [screenRef]);
}
