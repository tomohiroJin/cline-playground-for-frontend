import { useEffect } from 'react';

type Direction = 'up' | 'down' | 'left' | 'right';

interface UseKeyboardHandlers {
  onMove: (direction: Direction) => void;
  onToggleHint: () => void;
  onReset: () => void;
  onToggleBgm: () => void;
  enabled: boolean;
}

export const useKeyboard = ({
  onMove,
  onToggleHint,
  onReset,
  onToggleBgm,
  enabled,
}: UseKeyboardHandlers) => {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
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
        case 'M':
        case 'm':
          onToggleBgm();
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, onMove, onToggleHint, onReset, onToggleBgm]);
};
