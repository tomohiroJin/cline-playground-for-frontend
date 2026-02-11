import { createInputController } from './input';

describe('keys-and-arms input', () => {
  it('キーボード入力のjust pressedを消費できる', () => {
    const controller = createInputController(window);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));

    const first = controller.consumePressed();
    const second = controller.consumePressed();

    expect(first.left).toBe(true);
    expect(second.left).toBe(false);

    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft' }));
    expect(controller.getHeld().left).toBe(false);
    controller.destroy();
  });

  it('仮想ボタン入力を押下/解放できる', () => {
    const controller = createInputController(window);

    controller.pressVirtual('act');
    expect(controller.consumePressed().act).toBe(true);
    expect(controller.getHeld().act).toBe(true);

    controller.releaseVirtual('act');
    expect(controller.getHeld().act).toBe(false);
    controller.destroy();
  });
});
