import { createEventBus } from '../../domain/shared/event-bus';
import {
  createStageEventEmitter,
  subscribeSfxTriggers,
  subscribeTransitionHandler,
} from '../../domain/shared/stage-event-integration';

describe('StageEventIntegration', () => {
  describe('createStageEventEmitter', () => {
    it('scoreAdd でスコア加算イベントを発火する', () => {
      // Arrange
      const bus = createEventBus();
      const emitter = createStageEventEmitter(bus);
      const handler = jest.fn();
      bus.on('score:add', handler);

      // Act
      emitter.scoreAdd(500, 'gem');

      // Assert
      expect(handler).toHaveBeenCalledWith({
        type: 'score:add',
        payload: { points: 500, source: 'gem' },
      });
    });

    it('stageClear でステージクリアイベントを発火する', () => {
      // Arrange
      const bus = createEventBus();
      const emitter = createStageEventEmitter(bus);
      const handler = jest.fn();
      bus.on('stage:clear', handler);

      // Act
      emitter.stageClear('CAVE', 2000);

      // Assert
      expect(handler).toHaveBeenCalledWith({
        type: 'stage:clear',
        payload: { stage: 'CAVE', bonusPoints: 2000 },
      });
    });

    it('stageTransition でステージ遷移イベントを発火する', () => {
      // Arrange
      const bus = createEventBus();
      const emitter = createStageEventEmitter(bus);
      const handler = jest.fn();
      bus.on('stage:transition', handler);

      // Act
      emitter.stageTransition('CAVE', 'PRAIRIE', 'DEFEAT ENEMIES');

      // Assert
      expect(handler).toHaveBeenCalledWith({
        type: 'stage:transition',
        payload: { from: 'CAVE', to: 'PRAIRIE', subtitle: 'DEFEAT ENEMIES' },
      });
    });

    it('bossDefeat でボス撃破イベントを発火する', () => {
      // Arrange
      const bus = createEventBus();
      const emitter = createStageEventEmitter(bus);
      const handler = jest.fn();
      bus.on('boss:defeat', handler);

      // Act
      emitter.bossDefeat(2, false);

      // Assert
      expect(handler).toHaveBeenCalledWith({
        type: 'boss:defeat',
        payload: { loop: 2, noDamage: false },
      });
    });
  });

  describe('subscribeSfxTriggers', () => {
    it('イベントタイプに応じた SFX ハンドラーを呼び出す', () => {
      // Arrange
      const bus = createEventBus();
      const clearSfx = jest.fn();
      subscribeSfxTriggers(bus, { 'stage:clear': clearSfx });

      // Act
      bus.emit({ type: 'stage:clear', payload: { stage: 'CAVE', bonusPoints: 2000 } });

      // Assert
      expect(clearSfx).toHaveBeenCalledTimes(1);
    });

    it('アンサブスクライブ後はハンドラーが呼ばれない', () => {
      // Arrange
      const bus = createEventBus();
      const clearSfx = jest.fn();
      const unsubscribe = subscribeSfxTriggers(bus, { 'stage:clear': clearSfx });

      // Act
      unsubscribe();
      bus.emit({ type: 'stage:clear', payload: { stage: 'CAVE', bonusPoints: 2000 } });

      // Assert
      expect(clearSfx).not.toHaveBeenCalled();
    });
  });

  describe('subscribeTransitionHandler', () => {
    it('stage:transition イベントで transTo を呼び出す', () => {
      // Arrange
      const bus = createEventBus();
      const transTo = jest.fn();
      const cavInit = jest.fn();
      subscribeTransitionHandler(bus, transTo, { CAVE: cavInit });

      // Act
      bus.emit({
        type: 'stage:transition',
        payload: { from: 'PRAIRIE', to: 'CAVE', subtitle: 'FIND 3 KEYS' },
      });

      // Assert
      expect(transTo).toHaveBeenCalledWith('CAVE', cavInit, 'FIND 3 KEYS');
    });

    it('未登録のステージには transTo を呼ばない', () => {
      // Arrange
      const bus = createEventBus();
      const transTo = jest.fn();
      subscribeTransitionHandler(bus, transTo, {});

      // Act
      bus.emit({
        type: 'stage:transition',
        payload: { from: 'CAVE', to: 'UNKNOWN', subtitle: '' },
      });

      // Assert
      expect(transTo).not.toHaveBeenCalled();
    });
  });
});
