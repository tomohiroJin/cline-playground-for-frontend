import { createEventDispatcher, GameEvent } from './game-events';

describe('EventDispatcher', () => {
  describe('subscribe と dispatch', () => {
    it('イベントを購読してハンドラが呼ばれる', () => {
      const dispatcher = createEventDispatcher();
      const handler = jest.fn();
      dispatcher.subscribe(handler);

      const event: GameEvent = { type: 'GOAL_SCORED', scorer: 'player', speed: 5 };
      dispatcher.dispatch(event);

      expect(handler).toHaveBeenCalledWith(event);
    });

    it('複数のハンドラが呼ばれる', () => {
      const dispatcher = createEventDispatcher();
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      dispatcher.subscribe(handler1);
      dispatcher.subscribe(handler2);

      const event: GameEvent = { type: 'WALL_BOUNCE', x: 0, y: 100 };
      dispatcher.dispatch(event);

      expect(handler1).toHaveBeenCalledWith(event);
      expect(handler2).toHaveBeenCalledWith(event);
    });
  });

  describe('エラーハンドリング', () => {
    it('ハンドラが例外を投げても後続ハンドラが実行される', () => {
      const dispatcher = createEventDispatcher();
      const errorHandler = jest.fn(() => { throw new Error('テストエラー'); });
      const normalHandler = jest.fn();
      dispatcher.subscribe(errorHandler);
      dispatcher.subscribe(normalHandler);

      // console.error を抑制
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      dispatcher.dispatch({ type: 'FEVER_ACTIVATED' });

      expect(errorHandler).toHaveBeenCalled();
      expect(normalHandler).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('unsubscribe', () => {
    it('購読解除後はハンドラが呼ばれない', () => {
      const dispatcher = createEventDispatcher();
      const handler = jest.fn();
      const unsubscribe = dispatcher.subscribe(handler);

      unsubscribe();

      dispatcher.dispatch({ type: 'FEVER_ACTIVATED' });
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
