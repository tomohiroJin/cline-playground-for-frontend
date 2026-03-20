// ゲームフェーズ遷移のテスト

import { canTransition, transition, VALID_TRANSITIONS } from '../../../domain/race/game-phase';
import type { GamePhase } from '../../../domain/race/types';

describe('game-phase', () => {
  describe('VALID_TRANSITIONS', () => {
    it('有効な遷移マップが定義されている', () => {
      expect(VALID_TRANSITIONS.menu).toContain('countdown');
      expect(VALID_TRANSITIONS.countdown).toContain('race');
      expect(VALID_TRANSITIONS.race).toContain('draft');
      expect(VALID_TRANSITIONS.race).toContain('result');
      expect(VALID_TRANSITIONS.draft).toContain('race');
      expect(VALID_TRANSITIONS.result).toContain('menu');
    });
  });

  describe('canTransition', () => {
    it('有効な遷移は true を返す', () => {
      expect(canTransition('menu', 'countdown')).toBe(true);
      expect(canTransition('countdown', 'race')).toBe(true);
      expect(canTransition('race', 'draft')).toBe(true);
      expect(canTransition('race', 'result')).toBe(true);
      expect(canTransition('draft', 'race')).toBe(true);
      expect(canTransition('result', 'menu')).toBe(true);
    });

    it('無効な遷移は false を返す', () => {
      expect(canTransition('menu', 'race')).toBe(false);
      expect(canTransition('menu', 'result')).toBe(false);
      expect(canTransition('countdown', 'menu')).toBe(false);
      expect(canTransition('draft', 'result')).toBe(false);
    });
  });

  describe('transition', () => {
    it('有効な遷移では遷移先のフェーズを返す', () => {
      expect(transition('menu', 'countdown')).toBe('countdown');
      expect(transition('race', 'result')).toBe('result');
    });

    it('無効な遷移ではアサーションエラーになる', () => {
      expect(() => transition('menu', 'race')).toThrow();
      expect(() => transition('menu' as GamePhase, 'menu' as GamePhase)).toThrow();
    });
  });
});
