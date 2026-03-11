/**
 * GamePhase ステートマシンのテスト
 *
 * フェーズ遷移の許可テーブルとバリデーション関数を検証する
 */
import {
  PHASE_TRANSITIONS,
  assertValidTransition,
  isValidTransition,
} from '../types/phase';
import type { GamePhase } from '../types';

describe('GamePhase ステートマシン', () => {
  describe('PHASE_TRANSITIONS テーブル', () => {
    it('すべてのフェーズが遷移テーブルにキーとして存在する', () => {
      // Arrange
      const allPhases: GamePhase[] = [
        'title', 'diff', 'how', 'tree', 'biome', 'evo', 'battle',
        'awakening', 'prefinal', 'endless_checkpoint', 'ally_revive',
        'event', 'over', 'stats', 'achievements', 'challenge',
      ];

      // Assert
      for (const phase of allPhases) {
        expect(PHASE_TRANSITIONS).toHaveProperty(phase);
      }
    });

    it('title から diff, how, tree, challenge に遷移できる', () => {
      expect(PHASE_TRANSITIONS.title).toContain('diff');
      expect(PHASE_TRANSITIONS.title).toContain('how');
      expect(PHASE_TRANSITIONS.title).toContain('tree');
      expect(PHASE_TRANSITIONS.title).toContain('challenge');
    });

    it('battle から複数のフェーズに遷移できる', () => {
      expect(PHASE_TRANSITIONS.battle).toContain('evo');
      expect(PHASE_TRANSITIONS.battle).toContain('awakening');
      expect(PHASE_TRANSITIONS.battle).toContain('prefinal');
      expect(PHASE_TRANSITIONS.battle).toContain('over');
      expect(PHASE_TRANSITIONS.battle).toContain('event');
      expect(PHASE_TRANSITIONS.battle).toContain('ally_revive');
      expect(PHASE_TRANSITIONS.battle).toContain('endless_checkpoint');
    });

    it('over から stats と title に遷移できる', () => {
      expect(PHASE_TRANSITIONS.over).toContain('stats');
      expect(PHASE_TRANSITIONS.over).toContain('title');
    });

    it('achievements から title にのみ遷移できる', () => {
      expect(PHASE_TRANSITIONS.achievements).toContain('title');
      expect(PHASE_TRANSITIONS.achievements).toHaveLength(1);
    });
  });

  describe('isValidTransition', () => {
    it('許可された遷移に対して true を返す', () => {
      expect(isValidTransition('title', 'diff')).toBe(true);
      expect(isValidTransition('battle', 'evo')).toBe(true);
      expect(isValidTransition('over', 'stats')).toBe(true);
    });

    it('許可されていない遷移に対して false を返す', () => {
      expect(isValidTransition('title', 'battle')).toBe(false);
      expect(isValidTransition('evo', 'title')).toBe(false);
      expect(isValidTransition('stats', 'battle')).toBe(false);
    });
  });

  describe('assertValidTransition', () => {
    it('許可された遷移では例外を投げない', () => {
      expect(() => assertValidTransition('title', 'diff')).not.toThrow();
      expect(() => assertValidTransition('battle', 'over')).not.toThrow();
    });

    it('許可されていない遷移では例外を投げる', () => {
      expect(() => assertValidTransition('title', 'battle')).toThrow();
      expect(() => assertValidTransition('evo', 'title')).toThrow();
    });
  });
});
