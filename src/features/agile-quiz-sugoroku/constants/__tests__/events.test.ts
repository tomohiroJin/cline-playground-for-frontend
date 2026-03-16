/**
 * constants/events.ts のテスト
 */
import { EVENTS, EMERGENCY_EVENT } from '../events';

describe('constants/events', () => {
  // ── EVENTS ──────────────────────────────────────────
  describe('EVENTS - スプリントイベント', () => {
    it('7つのイベントを含む', () => {
      expect(EVENTS).toHaveLength(7);
    });

    it('各イベントに必須プロパティが存在する', () => {
      EVENTS.forEach(event => {
        expect(event.id).toBeDefined();
        expect(event.name).toBeDefined();
        expect(event.icon).toBeDefined();
        expect(event.description).toBeDefined();
        expect(event.color).toBeDefined();
      });
    });

    it('planningが最初のイベント', () => {
      expect(EVENTS[0].id).toBe('planning');
    });

    it('reviewが最後のイベント', () => {
      expect(EVENTS[EVENTS.length - 1].id).toBe('review');
    });

    it('Object.freeze で凍結されている', () => {
      expect(Object.isFrozen(EVENTS)).toBe(true);
    });
  });

  // ── EMERGENCY_EVENT ─────────────────────────────────
  describe('EMERGENCY_EVENT - 緊急対応イベント', () => {
    it('idはemergency', () => {
      expect(EMERGENCY_EVENT.id).toBe('emergency');
    });

    it('必須プロパティが存在する', () => {
      expect(EMERGENCY_EVENT.name).toBe('緊急対応');
      expect(EMERGENCY_EVENT.icon).toBe('🚨');
      expect(EMERGENCY_EVENT.description).toBe('障害対応');
      expect(EMERGENCY_EVENT.color).toBeDefined();
    });

    it('Object.freeze で凍結されている', () => {
      expect(Object.isFrozen(EMERGENCY_EVENT)).toBe(true);
    });
  });
});
