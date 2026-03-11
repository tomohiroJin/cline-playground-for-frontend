/**
 * constants/event.ts のテスト
 */
import { RANDOM_EVENTS, EVENT_CHANCE, EVENT_MIN_BATTLES } from '../../constants/event';

describe('constants/event', () => {
  describe('RANDOM_EVENTS（ランダムイベント）', () => {
    it('8種類のイベントが定義されている', () => {
      expect(RANDOM_EVENTS).toHaveLength(8);
    });

    it('各イベントにid, name, choices が揃っている', () => {
      RANDOM_EVENTS.forEach(ev => {
        expect(ev).toHaveProperty('id');
        expect(ev).toHaveProperty('name');
        expect(ev.choices.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('EVENT_CHANCE', () => {
    it('イベント発生確率が0.3である', () => {
      expect(EVENT_CHANCE).toBe(0.3);
    });
  });

  describe('EVENT_MIN_BATTLES', () => {
    it('最低バトル数が1である', () => {
      expect(EVENT_MIN_BATTLES).toBe(1);
    });
  });
});
