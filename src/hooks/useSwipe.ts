import { useRef, useCallback } from 'react';

type Direction = 'up' | 'down' | 'left' | 'right';

export const useSwipe = (
  onSwipe: (direction: Direction) => void,
  threshold: number = 30
) => {
  const startPos = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startPos.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    // preventDefault to avoid scrolling while swiping on the board
    e.preventDefault();
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!startPos.current) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - startPos.current.x;
    const dy = touch.clientY - startPos.current.y;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Below threshold — treat as a tap (let click handler work)
    if (absDx < threshold && absDy < threshold) {
      startPos.current = null;
      return;
    }

    let direction: Direction;
    if (absDx > absDy) {
      direction = dx > 0 ? 'right' : 'left';
    } else {
      direction = dy > 0 ? 'down' : 'up';
    }

    onSwipe(direction);
    startPos.current = null;
  }, [onSwipe, threshold]);

  return { onTouchStart, onTouchMove, onTouchEnd };
};
