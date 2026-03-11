/**
 * 原始進化録 - PRIMAL PATH - event-reducer テスト
 */
import { eventReducer } from '../../../hooks/reducers/event-reducer';
import { makeRun, makeGameState } from '../../test-helpers';
import { RANDOM_EVENTS } from '../../../constants';

describe('eventReducer', () => {
  describe('TRIGGER_EVENT', () => {
    it('イベントフェーズに遷移しイベントが設定される', () => {
      // Arrange
      const run = makeRun();
      const event = RANDOM_EVENTS[0];
      const state = makeGameState({ run });

      // Act
      const next = eventReducer(state, { type: 'TRIGGER_EVENT', event });

      // Assert
      expect(next.phase).toBe('event');
      expect(next.currentEvent).toBe(event);
    });

    it('run が null の場合は状態が変化しない', () => {
      const state = makeGameState({ run: null });
      const event = RANDOM_EVENTS[0];
      const next = eventReducer(state, { type: 'TRIGGER_EVENT', event });
      expect(next).toEqual(state);
    });
  });

  describe('CHOOSE_EVENT', () => {
    it('event フェーズ以外では状態が変化しない', () => {
      const run = makeRun();
      const state = makeGameState({ run, phase: 'battle' });
      const choice = RANDOM_EVENTS[0].choices[0];
      const next = eventReducer(state, { type: 'CHOOSE_EVENT', choice });
      expect(next).toEqual(state);
    });

    it('イベント選択後に evo フェーズに遷移する', () => {
      const run = makeRun({ bE: 100 });
      const event = RANDOM_EVENTS[0];
      const state = makeGameState({ run, phase: 'event', currentEvent: event });
      const choice = event.choices[event.choices.length - 1]; // 最後の選択肢（通常は「立ち去る」）
      const next = eventReducer(state, { type: 'CHOOSE_EVENT', choice });
      expect(next.phase).toBe('evo');
      expect(next.currentEvent).toBeUndefined();
    });
  });

  describe('APPLY_EVENT_RESULT', () => {
    it('event フェーズ以外では状態が変化しない', () => {
      const run = makeRun();
      const state = makeGameState({ run, phase: 'battle' });
      const next = eventReducer(state, { type: 'APPLY_EVENT_RESULT', nextRun: run });
      expect(next).toEqual(state);
    });

    it('事前計算済みの nextRun で evo フェーズに遷移する', () => {
      const run = makeRun();
      const nextRun = makeRun({ hp: 50 });
      const state = makeGameState({ run, phase: 'event' });
      const next = eventReducer(state, { type: 'APPLY_EVENT_RESULT', nextRun });
      expect(next.phase).toBe('evo');
      expect(next.run!.hp).toBe(50);
      expect(next.currentEvent).toBeUndefined();
    });
  });
});
