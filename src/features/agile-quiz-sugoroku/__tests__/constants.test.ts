/**
 * Agile Quiz Sugoroku - 定数バレルエクスポートの検証テスト
 *
 * 各定数・関数の詳細なテストは constants/__tests__/ 配下で行う。
 * このテストではバレルエクスポート（constants/index.ts）から
 * 全てのシンボルが正しくエクスポートされていることを確認する。
 */
import {
  CONFIG,
  getDebtPoints,
  getColorByThreshold,
  getInverseColorByThreshold,
  getGrade,
  getSummaryText,
  getStrengthText,
  getChallengeText,
  COLORS,
  EVENTS,
  EMERGENCY_EVENT,
  GRADES,
  INITIAL_GAME_STATS,
  CATEGORY_NAMES,
  STRENGTH_THRESHOLDS,
  CHALLENGE_EVALUATIONS,
  SPRINT_OPTIONS,
  DEBT_EVENTS,
  FONTS,
  OPTION_LABELS,
  PHASE_GENRE_MAP,
  EVENT_BACKGROUND_MAP,
} from '../constants';

describe('constants バレルエクスポートの検証', () => {
  // ── 定数オブジェクトのエクスポート確認 ──────────────────

  describe('定数オブジェクトがエクスポートされている', () => {
    it('CONFIG が定義されている', () => {
      expect(CONFIG).toBeDefined();
    });

    it('COLORS が定義されている', () => {
      expect(COLORS).toBeDefined();
    });

    it('EVENTS が定義されている', () => {
      expect(EVENTS).toBeDefined();
    });

    it('EMERGENCY_EVENT が定義されている', () => {
      expect(EMERGENCY_EVENT).toBeDefined();
    });

    it('GRADES が定義されている', () => {
      expect(GRADES).toBeDefined();
    });

    it('INITIAL_GAME_STATS が定義されている', () => {
      expect(INITIAL_GAME_STATS).toBeDefined();
    });

    it('CATEGORY_NAMES が定義されている', () => {
      expect(CATEGORY_NAMES).toBeDefined();
    });

    it('STRENGTH_THRESHOLDS が定義されている', () => {
      expect(STRENGTH_THRESHOLDS).toBeDefined();
    });

    it('CHALLENGE_EVALUATIONS が定義されている', () => {
      expect(CHALLENGE_EVALUATIONS).toBeDefined();
    });

    it('SPRINT_OPTIONS が定義されている', () => {
      expect(SPRINT_OPTIONS).toBeDefined();
    });

    it('DEBT_EVENTS が定義されている', () => {
      expect(DEBT_EVENTS).toBeDefined();
    });

    it('FONTS が定義されている', () => {
      expect(FONTS).toBeDefined();
    });

    it('OPTION_LABELS が定義されている', () => {
      expect(OPTION_LABELS).toBeDefined();
    });

    it('PHASE_GENRE_MAP が定義されている', () => {
      expect(PHASE_GENRE_MAP).toBeDefined();
    });

    it('EVENT_BACKGROUND_MAP が定義されている', () => {
      expect(EVENT_BACKGROUND_MAP).toBeDefined();
    });
  });

  // ── ユーティリティ関数のエクスポート確認 ──────────────────

  describe('ユーティリティ関数がエクスポートされている', () => {
    it('getDebtPoints が関数である', () => {
      expect(typeof getDebtPoints).toBe('function');
    });

    it('getColorByThreshold が関数である', () => {
      expect(typeof getColorByThreshold).toBe('function');
    });

    it('getInverseColorByThreshold が関数である', () => {
      expect(typeof getInverseColorByThreshold).toBe('function');
    });

    it('getGrade が関数である', () => {
      expect(typeof getGrade).toBe('function');
    });

    it('getSummaryText が関数である', () => {
      expect(typeof getSummaryText).toBe('function');
    });

    it('getStrengthText が関数である', () => {
      expect(typeof getStrengthText).toBe('function');
    });

    it('getChallengeText が関数である', () => {
      expect(typeof getChallengeText).toBe('function');
    });
  });
});
