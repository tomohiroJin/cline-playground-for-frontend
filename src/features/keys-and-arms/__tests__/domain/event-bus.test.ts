/**
 * イベントバスのテスト
 */
import { createEventBus } from '../../domain/shared/event-bus';

describe('shared/event-bus', () => {
  it('イベントを発行しハンドラーが呼ばれる', () => {
    // Arrange
    const bus = createEventBus();
    const handler = jest.fn();
    bus.on('score:add', handler);

    // Act
    bus.emit({ type: 'score:add', payload: { points: 100 } });

    // Assert
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ type: 'score:add', payload: { points: 100 } });
  });

  it('購読していないイベントではハンドラーが呼ばれない', () => {
    // Arrange
    const bus = createEventBus();
    const handler = jest.fn();
    bus.on('score:add', handler);

    // Act
    bus.emit({ type: 'player:hurt' });

    // Assert
    expect(handler).not.toHaveBeenCalled();
  });

  it('同じイベントに複数のハンドラーを登録できる', () => {
    // Arrange
    const bus = createEventBus();
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    bus.on('enemy:kill', handler1);
    bus.on('enemy:kill', handler2);

    // Act
    bus.emit({ type: 'enemy:kill' });

    // Assert
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('on の戻り値でアンサブスクライブできる', () => {
    // Arrange
    const bus = createEventBus();
    const handler = jest.fn();
    const unsubscribe = bus.on('score:add', handler);

    // Act
    unsubscribe();
    bus.emit({ type: 'score:add' });

    // Assert
    expect(handler).not.toHaveBeenCalled();
  });

  it('off でハンドラーを解除できる', () => {
    // Arrange
    const bus = createEventBus();
    const handler = jest.fn();
    bus.on('combo:increment', handler);

    // Act
    bus.off('combo:increment', handler);
    bus.emit({ type: 'combo:increment' });

    // Assert
    expect(handler).not.toHaveBeenCalled();
  });

  it('未登録のイベントタイプに emit してもエラーにならない', () => {
    // Arrange
    const bus = createEventBus();

    // Act & Assert
    expect(() => bus.emit({ type: 'game:over' })).not.toThrow();
  });

  it('同期的にイベントが処理される', () => {
    // Arrange
    const bus = createEventBus();
    const order: number[] = [];
    bus.on('score:add', () => order.push(1));
    bus.on('score:add', () => order.push(2));

    // Act
    bus.emit({ type: 'score:add' });
    order.push(3);

    // Assert
    expect(order).toEqual([1, 2, 3]);
  });

  it('payload なしのイベントも発行できる', () => {
    // Arrange
    const bus = createEventBus();
    const handler = jest.fn();
    bus.on('game:complete', handler);

    // Act
    bus.emit({ type: 'game:complete' });

    // Assert
    expect(handler).toHaveBeenCalledWith({ type: 'game:complete' });
  });
});
