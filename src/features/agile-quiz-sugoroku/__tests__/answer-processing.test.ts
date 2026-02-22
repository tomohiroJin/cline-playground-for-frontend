/**
 * 回答処理の純粋計算ロジックのテスト
 *
 * answer-processor.ts の関数をテスト。
 */
import {
  computeAnswerResult,
  computeDebtDelta,
  nextGameStats,
} from '../answer-processor';
import { INITIAL_GAME_STATS } from '../constants';
import { GameStats } from '../types';

describe('回答処理の純粋計算ロジック', () => {
  // ── computeAnswerResult ──────────────────────

  describe('computeAnswerResult - 回答結果計算', () => {
    it('正解時にcorrect=trueを返す', () => {
      const result = computeAnswerResult({
        optionIndex: 1,
        correctAnswer: 1,
        speed: 3.0,
        eventId: 'planning',
      });
      expect(result.correct).toBe(true);
      expect(result.speed).toBe(3.0);
      expect(result.eventId).toBe('planning');
    });

    it('不正解時にcorrect=falseを返す', () => {
      const result = computeAnswerResult({
        optionIndex: 0,
        correctAnswer: 1,
        speed: 5.0,
        eventId: 'impl1',
      });
      expect(result.correct).toBe(false);
    });
  });

  // ── computeDebtDelta ─────────────────────────

  describe('computeDebtDelta - 負債増分計算', () => {
    it('正解時はどのイベントでもdebt=0', () => {
      expect(computeDebtDelta(true, 'impl1')).toBe(0);
      expect(computeDebtDelta(true, 'test1')).toBe(0);
      expect(computeDebtDelta(true, 'refinement')).toBe(0);
    });

    it('不正解+impl系で負債5pt', () => {
      expect(computeDebtDelta(false, 'impl1')).toBe(5);
      expect(computeDebtDelta(false, 'impl2')).toBe(5);
    });

    it('不正解+test系で負債3pt', () => {
      expect(computeDebtDelta(false, 'test1')).toBe(3);
      expect(computeDebtDelta(false, 'test2')).toBe(3);
    });

    it('不正解+refinementで負債4pt', () => {
      expect(computeDebtDelta(false, 'refinement')).toBe(4);
    });

    it('不正解+planning/review/emergencyで負債0pt', () => {
      expect(computeDebtDelta(false, 'planning')).toBe(0);
      expect(computeDebtDelta(false, 'review')).toBe(0);
      expect(computeDebtDelta(false, 'emergency')).toBe(0);
    });
  });

  // ── nextGameStats ────────────────────────────

  describe('nextGameStats - コンボ計算', () => {
    it('正解でコンボが1増加', () => {
      const result = nextGameStats(
        { ...INITIAL_GAME_STATS },
        { correct: true, speed: 3.0, eventId: 'planning' },
        0
      );
      expect(result.combo).toBe(1);
    });

    it('連続正解でコンボが積み上がる', () => {
      let stats: GameStats = { ...INITIAL_GAME_STATS };
      stats = nextGameStats(stats, { correct: true, speed: 3.0, eventId: 'planning' }, 0);
      stats = nextGameStats(stats, { correct: true, speed: 4.0, eventId: 'impl1' }, 0);
      stats = nextGameStats(stats, { correct: true, speed: 2.0, eventId: 'test1' }, 0);
      expect(stats.combo).toBe(3);
    });

    it('不正解でコンボがリセット', () => {
      let stats = nextGameStats(
        { ...INITIAL_GAME_STATS },
        { correct: true, speed: 3.0, eventId: 'planning' },
        0
      );
      stats = nextGameStats(stats, { correct: true, speed: 3.0, eventId: 'impl1' }, 0);
      expect(stats.combo).toBe(2);

      stats = nextGameStats(stats, { correct: false, speed: 5.0, eventId: 'test1' }, 3);
      expect(stats.combo).toBe(0);
    });

    it('maxComboは最大値を保持', () => {
      let stats: GameStats = { ...INITIAL_GAME_STATS };
      // 3連続正解
      stats = nextGameStats(stats, { correct: true, speed: 3.0, eventId: 'planning' }, 0);
      stats = nextGameStats(stats, { correct: true, speed: 3.0, eventId: 'impl1' }, 0);
      stats = nextGameStats(stats, { correct: true, speed: 3.0, eventId: 'test1' }, 0);
      expect(stats.maxCombo).toBe(3);

      // 不正解でリセット
      stats = nextGameStats(stats, { correct: false, speed: 5.0, eventId: 'refinement' }, 4);
      expect(stats.combo).toBe(0);
      expect(stats.maxCombo).toBe(3);

      // 2連続正解（maxを超えない）
      stats = nextGameStats(stats, { correct: true, speed: 3.0, eventId: 'impl2' }, 0);
      stats = nextGameStats(stats, { correct: true, speed: 3.0, eventId: 'test2' }, 0);
      expect(stats.combo).toBe(2);
      expect(stats.maxCombo).toBe(3);
    });

    it('新しいmaxComboが達成されると更新', () => {
      let stats: GameStats = { ...INITIAL_GAME_STATS, maxCombo: 2, combo: 2 };
      stats = nextGameStats(stats, { correct: true, speed: 3.0, eventId: 'planning' }, 0);
      expect(stats.combo).toBe(3);
      expect(stats.maxCombo).toBe(3);
    });
  });

  describe('nextGameStats - 速度計算', () => {
    it('回答速度がspeeds配列に記録される', () => {
      const result = nextGameStats(
        { ...INITIAL_GAME_STATS },
        { correct: true, speed: 3.5, eventId: 'planning' },
        0
      );
      expect(result.speeds).toEqual([3.5]);
    });

    it('複数回答で速度が蓄積される', () => {
      let stats: GameStats = { ...INITIAL_GAME_STATS };
      stats = nextGameStats(stats, { correct: true, speed: 3.0, eventId: 'planning' }, 0);
      stats = nextGameStats(stats, { correct: false, speed: 7.0, eventId: 'impl1' }, 5);
      expect(stats.speeds).toEqual([3.0, 7.0]);
    });
  });

  describe('nextGameStats - 緊急対応カウント', () => {
    it('emergencyイベントでemergencyCountが増加', () => {
      const result = nextGameStats(
        { ...INITIAL_GAME_STATS },
        { correct: true, speed: 3.0, eventId: 'emergency' },
        0
      );
      expect(result.emergencyCount).toBe(1);
    });

    it('emergency正解でemergencySuccessも増加', () => {
      const result = nextGameStats(
        { ...INITIAL_GAME_STATS },
        { correct: true, speed: 3.0, eventId: 'emergency' },
        0
      );
      expect(result.emergencySuccess).toBe(1);
    });

    it('emergency不正解ではemergencySuccessは増えない', () => {
      const result = nextGameStats(
        { ...INITIAL_GAME_STATS },
        { correct: false, speed: 5.0, eventId: 'emergency' },
        0
      );
      expect(result.emergencyCount).toBe(1);
      expect(result.emergencySuccess).toBe(0);
    });

    it('通常イベントではemergencyCount/emergencySuccessは変わらない', () => {
      const result = nextGameStats(
        { ...INITIAL_GAME_STATS },
        { correct: true, speed: 3.0, eventId: 'planning' },
        0
      );
      expect(result.emergencyCount).toBe(0);
      expect(result.emergencySuccess).toBe(0);
    });
  });

  describe('nextGameStats - 正答数・回答数・負債', () => {
    it('正解でtotalCorrectが増加', () => {
      const result = nextGameStats(
        { ...INITIAL_GAME_STATS },
        { correct: true, speed: 3.0, eventId: 'planning' },
        0
      );
      expect(result.totalCorrect).toBe(1);
      expect(result.totalQuestions).toBe(1);
    });

    it('不正解でtotalCorrectは増えないがtotalQuestionsは増える', () => {
      const result = nextGameStats(
        { ...INITIAL_GAME_STATS },
        { correct: false, speed: 5.0, eventId: 'planning' },
        0
      );
      expect(result.totalCorrect).toBe(0);
      expect(result.totalQuestions).toBe(1);
    });

    it('負債は累積される', () => {
      let stats: GameStats = { ...INITIAL_GAME_STATS };
      stats = nextGameStats(stats, { correct: false, speed: 5.0, eventId: 'impl1' }, 5);
      stats = nextGameStats(stats, { correct: false, speed: 5.0, eventId: 'test1' }, 3);
      expect(stats.debt).toBe(8);
    });
  });
});
