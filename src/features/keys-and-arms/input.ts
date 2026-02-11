import { InputState, JustPressedState } from './types';

const EMPTY_INPUT: InputState = {
  up: false,
  down: false,
  left: false,
  right: false,
  act: false,
  reset: false,
};

function mapKey(key: string): keyof InputState | null {
  const normalized = key.toLowerCase();
  switch (normalized) {
    case 'arrowup':
    case 'w':
      return 'up';
    case 'arrowdown':
    case 's':
      return 'down';
    case 'arrowleft':
    case 'a':
      return 'left';
    case 'arrowright':
    case 'd':
      return 'right';
    case 'z':
    case ' ':
    case 'enter':
      return 'act';
    case 'escape':
      return 'reset';
    default:
      return null;
  }
}

export function createInputController(target: Window = window) {
  const held: InputState = { ...EMPTY_INPUT };
  const pressed: JustPressedState = { ...EMPTY_INPUT };

  const onKeyDown = (event: KeyboardEvent): void => {
    const action = mapKey(event.key);
    if (!action) {
      return;
    }
    if (!held[action]) {
      pressed[action] = true;
    }
    held[action] = true;
    event.preventDefault();
  };

  const onKeyUp = (event: KeyboardEvent): void => {
    const action = mapKey(event.key);
    if (!action) {
      return;
    }
    held[action] = false;
    event.preventDefault();
  };

  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('keyup', onKeyUp);

  return {
    getHeld(): InputState {
      return { ...held };
    },
    consumePressed(): JustPressedState {
      const snapshot = { ...pressed };
      (Object.keys(pressed) as Array<keyof JustPressedState>).forEach(key => {
        pressed[key] = false;
      });
      return snapshot;
    },
    pressVirtual(action: keyof InputState): void {
      if (!held[action]) {
        pressed[action] = true;
      }
      held[action] = true;
    },
    releaseVirtual(action: keyof InputState): void {
      held[action] = false;
    },
    destroy(): void {
      target.removeEventListener('keydown', onKeyDown);
      target.removeEventListener('keyup', onKeyUp);
    },
  };
}
