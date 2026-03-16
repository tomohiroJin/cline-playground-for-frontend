/**
 * constants/game-config.ts のテスト
 */
import {
  CONFIG,
  SPRINT_OPTIONS,
  INITIAL_GAME_STATS,
  DEBT_EVENTS,
  getDebtPoints,
  FONTS,
  OPTION_LABELS,
  CATEGORY_NAMES,
  PHASE_GENRE_MAP,
  EVENT_BACKGROUND_MAP,
} from '../game-config';

describe('constants/game-config', () => {
  // ── CONFIG ───────────────────────────────────────────
  describe('CONFIG - ゲーム設定', () => {
    it('スプリント数が3', () => {
      expect(CONFIG.sprintCount).toBe(3);
    });

    it('制限時間が15秒', () => {
      expect(CONFIG.timeLimit).toBe(15);
    });

    it('技術的負債の設定が含まれる', () => {
      expect(CONFIG.debt).toEqual({ impl: 5, test: 3, refinement: 4 });
    });

    it('緊急対応の設定が含まれる', () => {
      expect(CONFIG.emergency).toBeDefined();
      expect(CONFIG.emergency.base).toBe(0.1);
    });

    it('Object.freeze で凍結されている', () => {
      expect(Object.isFrozen(CONFIG)).toBe(true);
    });
  });

  // ── SPRINT_OPTIONS ───────────────────────────────────
  describe('SPRINT_OPTIONS - スプリント数の選択肢', () => {
    it('フィボナッチ数列の5つの選択肢', () => {
      expect(SPRINT_OPTIONS).toEqual([1, 2, 3, 5, 8]);
    });

    it('Object.freeze で凍結されている', () => {
      expect(Object.isFrozen(SPRINT_OPTIONS)).toBe(true);
    });
  });

  // ── getDebtPoints ────────────────────────────────────
  describe('getDebtPoints - イベント別の負債ポイント', () => {
    it('impl系イベントは負債5ポイント', () => {
      expect(getDebtPoints('impl1')).toBe(CONFIG.debt.impl);
      expect(getDebtPoints('impl2')).toBe(CONFIG.debt.impl);
    });

    it('test系イベントは負債3ポイント', () => {
      expect(getDebtPoints('test1')).toBe(CONFIG.debt.test);
      expect(getDebtPoints('test2')).toBe(CONFIG.debt.test);
    });

    it('refinementは負債4ポイント', () => {
      expect(getDebtPoints('refinement')).toBe(CONFIG.debt.refinement);
    });

    it('planningは負債0ポイント', () => {
      expect(getDebtPoints('planning')).toBe(0);
    });

    it('reviewは負債0ポイント', () => {
      expect(getDebtPoints('review')).toBe(0);
    });

    it('不明なイベントは負債0ポイント', () => {
      expect(getDebtPoints('unknown')).toBe(0);
    });
  });

  // ── INITIAL_GAME_STATS ──────────────────────────────
  describe('INITIAL_GAME_STATS - 初期ゲーム状態', () => {
    it('全ての初期値がゼロまたは空', () => {
      expect(INITIAL_GAME_STATS.totalCorrect).toBe(0);
      expect(INITIAL_GAME_STATS.totalQuestions).toBe(0);
      expect(INITIAL_GAME_STATS.debt).toBe(0);
      expect(INITIAL_GAME_STATS.speeds).toEqual([]);
      expect(INITIAL_GAME_STATS.combo).toBe(0);
      expect(INITIAL_GAME_STATS.maxCombo).toBe(0);
    });

    it('Object.freeze で凍結されている', () => {
      expect(Object.isFrozen(INITIAL_GAME_STATS)).toBe(true);
    });
  });

  // ── DEBT_EVENTS ─────────────────────────────────────
  describe('DEBT_EVENTS - 負債が発生するイベント', () => {
    it('5つのイベントが含まれる', () => {
      expect(Object.keys(DEBT_EVENTS)).toEqual(
        expect.arrayContaining(['impl1', 'impl2', 'test1', 'test2', 'refinement'])
      );
    });
  });

  // ── FONTS ───────────────────────────────────────────
  describe('FONTS - フォント設定', () => {
    it('monoとjpが定義されている', () => {
      expect(FONTS.mono).toContain('monospace');
      expect(FONTS.jp).toContain('sans-serif');
    });

    it('Object.freeze で凍結されている', () => {
      expect(Object.isFrozen(FONTS)).toBe(true);
    });
  });

  // ── OPTION_LABELS ───────────────────────────────────
  describe('OPTION_LABELS - 選択肢ラベル', () => {
    it('A〜Dの4つ', () => {
      expect(OPTION_LABELS).toEqual(['A', 'B', 'C', 'D']);
    });
  });

  // ── CATEGORY_NAMES ──────────────────────────────────
  describe('CATEGORY_NAMES - カテゴリ名マッピング', () => {
    it('全イベントIDのマッピングが存在する', () => {
      const expectedKeys = ['planning', 'impl1', 'test1', 'refinement', 'impl2', 'test2', 'review', 'emergency'];
      expectedKeys.forEach(key => {
        expect(CATEGORY_NAMES[key]).toBeDefined();
      });
    });
  });

  // ── PHASE_GENRE_MAP ─────────────────────────────────
  describe('PHASE_GENRE_MAP - スプリント工程とジャンルのマッピング', () => {
    it('planningにscrumが含まれる', () => {
      expect(PHASE_GENRE_MAP['planning']).toContain('scrum');
    });

    it('全工程が定義されている', () => {
      const expectedKeys = ['planning', 'impl1', 'impl2', 'test1', 'test2', 'refinement', 'review', 'emergency'];
      expectedKeys.forEach(key => {
        expect(PHASE_GENRE_MAP[key]).toBeDefined();
      });
    });
  });

  // ── EVENT_BACKGROUND_MAP ────────────────────────────
  describe('EVENT_BACKGROUND_MAP - イベントと背景画像のマッピング', () => {
    it('planningはplanning背景', () => {
      expect(EVENT_BACKGROUND_MAP['planning']).toBe('planning');
    });

    it('emergencyはemergency背景', () => {
      expect(EVENT_BACKGROUND_MAP['emergency']).toBe('emergency');
    });
  });
});
