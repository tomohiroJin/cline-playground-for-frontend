import { useEffect } from 'react';

type Direction = 'up' | 'down' | 'left' | 'right';

type Action =
  | { type: 'move'; direction: Direction }
  | { type: 'hint' }
  | { type: 'reset' };

const KEY_MAP = new Map<string, Action>([
  ['ArrowUp', { type: 'move', direction: 'up' }],
  ['W', { type: 'move', direction: 'up' }],
  ['w', { type: 'move', direction: 'up' }],
  ['ArrowDown', { type: 'move', direction: 'down' }],
  ['S', { type: 'move', direction: 'down' }],
  ['s', { type: 'move', direction: 'down' }],
  ['ArrowLeft', { type: 'move', direction: 'left' }],
  ['A', { type: 'move', direction: 'left' }],
  ['a', { type: 'move', direction: 'left' }],
  ['ArrowRight', { type: 'move', direction: 'right' }],
  ['D', { type: 'move', direction: 'right' }],
  ['d', { type: 'move', direction: 'right' }],
  ['H', { type: 'hint' }],
  ['h', { type: 'hint' }],
  ['R', { type: 'reset' }],
  ['r', { type: 'reset' }],
]);

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

      const action = KEY_MAP.get(e.key);
      if (!action) return;

      switch (action.type) {
        case 'move':
          e.preventDefault();
          onMove(action.direction);
          break;
        case 'hint':
          onToggleHint();
          break;
        case 'reset':
          onReset();
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, onMove, onToggleHint, onReset]);
};
