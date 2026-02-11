import { KEYBOARD_KEYS } from './constants';
import type { VirtualKey } from './types';

interface ButtonBinding {
  element: HTMLElement;
  key: VirtualKey;
}

const normalizeKey = (key: string): VirtualKey | null => {
  const normalized = key.toLowerCase();
  if (normalized === 'arrowup') return 'arrowup';
  if (normalized === 'arrowdown') return 'arrowdown';
  if (normalized === 'arrowleft') return 'arrowleft';
  if (normalized === 'arrowright') return 'arrowright';
  if (normalized === 'z') return 'z';
  if (normalized === ' ') return ' ';
  if (normalized === 'spacebar') return ' ';
  if (normalized === 'space') return ' ';
  if (normalized === 'enter') return 'enter';
  if (normalized === 'escape') return 'escape';
  return null;
};

export class InputController {
  private readonly pressed = new Map<VirtualKey, boolean>();

  private readonly justPressed = new Map<VirtualKey, boolean>();

  private readonly handlers: Array<() => void> = [];

  constructor() {
    KEYBOARD_KEYS.forEach((key) => {
      this.pressed.set(key, false);
      this.justPressed.set(key, false);
    });
  }

  attach(bindings: ButtonBinding[]): void {
    const onKeyDown = (event: KeyboardEvent): void => {
      const key = normalizeKey(event.key);
      if (!key) {
        return;
      }
      if (!this.pressed.get(key)) {
        this.justPressed.set(key, true);
      }
      this.pressed.set(key, true);
      event.preventDefault();
    };

    const onKeyUp = (event: KeyboardEvent): void => {
      const key = normalizeKey(event.key);
      if (!key) {
        return;
      }
      this.pressed.set(key, false);
    };

    const releaseAll = (): void => {
      KEYBOARD_KEYS.forEach((key) => {
        this.pressed.set(key, false);
        this.justPressed.set(key, false);
      });
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', releaseAll);

    this.handlers.push(() => window.removeEventListener('keydown', onKeyDown));
    this.handlers.push(() => window.removeEventListener('keyup', onKeyUp));
    this.handlers.push(() => window.removeEventListener('blur', releaseAll));

    bindings.forEach(({ element, key }) => {
      const onPress = (event: Event): void => {
        event.preventDefault();
        if (!this.pressed.get(key)) {
          this.justPressed.set(key, true);
        }
        this.pressed.set(key, true);
      };
      const onRelease = (event: Event): void => {
        event.preventDefault();
        this.pressed.set(key, false);
      };

      element.addEventListener('pointerdown', onPress, { passive: false });
      element.addEventListener('pointerup', onRelease, { passive: false });
      element.addEventListener('pointercancel', onRelease, { passive: false });
      element.addEventListener('pointerleave', onRelease, { passive: false });
      element.addEventListener('touchstart', onPress, { passive: false });
      element.addEventListener('touchend', onRelease, { passive: false });
      element.addEventListener('touchcancel', onRelease, { passive: false });
      element.addEventListener('mousedown', onPress);
      element.addEventListener('mouseup', onRelease);

      this.handlers.push(() => element.removeEventListener('pointerdown', onPress));
      this.handlers.push(() => element.removeEventListener('pointerup', onRelease));
      this.handlers.push(() => element.removeEventListener('pointercancel', onRelease));
      this.handlers.push(() => element.removeEventListener('pointerleave', onRelease));
      this.handlers.push(() => element.removeEventListener('touchstart', onPress));
      this.handlers.push(() => element.removeEventListener('touchend', onRelease));
      this.handlers.push(() => element.removeEventListener('touchcancel', onRelease));
      this.handlers.push(() => element.removeEventListener('mousedown', onPress));
      this.handlers.push(() => element.removeEventListener('mouseup', onRelease));
    });
  }

  detach(): void {
    this.handlers.forEach((unsubscribe) => unsubscribe());
    this.handlers.length = 0;
    this.reset();
  }

  isPressed(key: VirtualKey): boolean {
    return this.pressed.get(key) ?? false;
  }

  isJustPressed(key: VirtualKey): boolean {
    return this.justPressed.get(key) ?? false;
  }

  consumeJustPressed(): void {
    this.justPressed.forEach((_, key) => {
      this.justPressed.set(key, false);
    });
  }

  reset(): void {
    KEYBOARD_KEYS.forEach((key) => {
      this.pressed.set(key, false);
      this.justPressed.set(key, false);
    });
  }
}
