import { useEffect } from 'react';

type Direction = 'up' | 'down' | 'left' | 'right';

interface UseKeyboardHandlers {
  onMove: (direction: Direction) => void;
  onToggleHint: () => void;
  onReset: () => void;
  enabled: boolean;
}

export const useKeyboard = ({
  onMove,
  onToggleHint,
  onReset,
  enabled,
}: UseKeyboardHandlers) => {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (e.key) {
        case 'ArrowUp':
        case 'W':
        case 'w':
          e.preventDefault();
          onMove('up');
          break;
        case 'ArrowDown':
        case 'S':
        case 's':
          e.preventDefault();
          onMove('down');
          break;
        case 'ArrowLeft':
        case 'A':
        case 'a':
          e.preventDefault();
          onMove('left');
          break;
        case 'ArrowRight':
        case 'D':
        case 'd':
          e.preventDefault();
          onMove('right');
          break;
        case 'H':
        case 'h':
          onToggleHint();
          break;
        case 'R':
        case 'r':
          onReset();
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, onMove, onToggleHint, onReset]);
};
