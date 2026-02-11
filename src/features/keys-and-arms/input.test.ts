import { InputController } from './input';

describe('InputController', () => {
  it('同一キー押下中は justPressed が再発火しない', () => {
    const input = new InputController();
    input.attach([]);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', bubbles: true }));
    expect(input.isPressed('z')).toBe(true);
    expect(input.isJustPressed('z')).toBe(true);

    input.consumeJustPressed();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', bubbles: true }));
    expect(input.isPressed('z')).toBe(true);
    expect(input.isJustPressed('z')).toBe(false);

    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'z', bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', bubbles: true }));
    expect(input.isJustPressed('z')).toBe(true);

    input.detach();
  });

  it('touchcancel と blur で入力状態を解放する', () => {
    const input = new InputController();
    const button = document.createElement('button');
    document.body.appendChild(button);

    input.attach([{ element: button, key: 'arrowleft' }]);

    button.dispatchEvent(new Event('touchstart', { bubbles: true, cancelable: true }));
    expect(input.isPressed('arrowleft')).toBe(true);

    button.dispatchEvent(new Event('touchcancel', { bubbles: true, cancelable: true }));
    expect(input.isPressed('arrowleft')).toBe(false);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(input.isPressed('arrowright')).toBe(true);
    window.dispatchEvent(new Event('blur'));
    expect(input.isPressed('arrowright')).toBe(false);
    expect(input.isJustPressed('arrowright')).toBe(false);

    input.detach();
    button.remove();
  });
});
