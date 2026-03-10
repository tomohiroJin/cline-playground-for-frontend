/**
 * 実績システム - 単体テスト
 */
import {
  ACHIEVEMENTS,
  checkAchievements,
} from '../achievements';
import { AchievementContext, GameHistoryEntry, SavedGameResult } from '../types';

/** テスト用のデフォルト結果データ */
const makeResult = (overrides: Partial<SavedGameResult> = {}): SavedGameResult => ({
  totalCorrect: 15,
  totalQuestions: 21,
  correctRate: 71,
  averageSpeed: 6.5,
  stability: 75,
  debt: 10,
  maxCombo: 4,
  tagStats: {},
  incorrectQuestions: [],
  sprintLog: [
    { sprintNumber: 1, correctRate: 70, correctCount: 5, totalCount: 7, averageSpeed: 6, debt: 5, hadEmergency: false, emergencySuccessCount: 0, categoryStats: {} },
    { sprintNumber: 2, correctRate: 75, correctCount: 5, totalCount: 7, averageSpeed: 6, debt: 5, hadEmergency: false, emergencySuccessCount: 0, categoryStats: {} },
    { sprintNumber: 3, correctRate: 70, correctCount: 5, totalCount: 7, averageSpeed: 7, debt: 0, hadEmergency: false, emergencySuccessCount: 0, categoryStats: {} },
  ],
  grade: 'A',
  gradeLabel: 'High-Performing',
  teamTypeId: 'synergy',
  teamTypeName: 'シナジーチーム',
  timestamp: Date.now(),
  ...overrides,
});

/** テスト用のデフォルトコンテキスト */
const makeContext = (overrides: Partial<AchievementContext> = {}): AchievementContext => ({
  result: makeResult(),
  sprintCorrectRates: [70, 75, 70],
  unlockedIds: [],
  history: [],
  now: new Date('2025-06-15T14:00:00'),
  ...overrides,
});

/** テスト用の履歴エントリ生成 */
const makeHistoryEntry = (overrides: Partial<GameHistoryEntry> = {}): GameHistoryEntry => ({
  totalCorrect: 15, totalQuestions: 21, correctRate: 71,
  averageSpeed: 6.5, stability: 75, debt: 10, maxCombo: 4,
  grade: 'A', gradeLabel: 'High-Performing',
  teamTypeId: 'synergy', teamTypeName: 'シナジーチーム',
  timestamp: Date.now(),
  ...overrides,
});

describe('achievements', () => {
  describe('ACHIEVEMENTS定義', () => {
    it('20個の実績が定義されている', () => {
      expect(ACHIEVEMENTS).toHaveLength(20);
    });

    it('全実績がユニークなIDを持つ', () => {
      const ids = ACHIEVEMENTS.map(a => a.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('全実績に必須フィールドがある', () => {
      ACHIEVEMENTS.forEach(a => {
        expect(a.id).toBeTruthy();
        expect(a.name).toBeTruthy();
        expect(a.description).toBeTruthy();
        expect(['Bronze', 'Silver', 'Gold', 'Platinum']).toContain(a.rarity);
        expect(typeof a.check).toBe('function');
      });
    });
  });

  describe('checkAchievements', () => {
    it('初回クリアで「はじめの一歩」を獲得', () => {
      const ctx = makeContext();
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('first-clear');
    });

    it('すでに獲得済みの実績は再度獲得しない', () => {
      const ctx = makeContext({ unlockedIds: ['first-clear'] });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).not.toContain('first-clear');
    });

    it('全問正解で「完璧主義者」を獲得', () => {
      const ctx = makeContext({
        result: makeResult({ totalCorrect: 21, totalQuestions: 21, correctRate: 100 }),
        sprintCorrectRates: [100, 100, 100],
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('all-correct');
    });

    it('1スプリント全問正解で「パーフェクトスプリント」を獲得', () => {
      const ctx = makeContext({
        sprintCorrectRates: [100, 60, 70],
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('perfect-sprint');
    });

    it('5コンボ達成で「コンボマスター」を獲得', () => {
      const ctx = makeContext({
        result: makeResult({ maxCombo: 5 }),
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('combo-5');
    });

    it('10コンボ達成で「コンボレジェンド」を獲得', () => {
      const ctx = makeContext({
        result: makeResult({ maxCombo: 10 }),
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('combo-10');
    });

    it('平均回答時間3秒以内で「高速回答」を獲得', () => {
      const ctx = makeContext({
        result: makeResult({ averageSpeed: 2.8 }),
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('speed-demon');
    });

    it('緊急対応3回成功で「火消しの達人」を獲得', () => {
      const ctx = makeContext({
        result: makeResult({
          sprintLog: [
            { sprintNumber: 1, correctRate: 70, correctCount: 5, totalCount: 7, averageSpeed: 6, debt: 5, hadEmergency: true, emergencySuccessCount: 2, categoryStats: {} },
            { sprintNumber: 2, correctRate: 70, correctCount: 5, totalCount: 7, averageSpeed: 6, debt: 5, hadEmergency: true, emergencySuccessCount: 1, categoryStats: {} },
          ],
        }),
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('firefighter');
    });

    it('負債0でクリアで「クリーンコード」を獲得', () => {
      const ctx = makeContext({
        result: makeResult({ debt: 0 }),
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('zero-debt');
    });

    it('Sグレード獲得で「Sランカー」を獲得', () => {
      const ctx = makeContext({
        result: makeResult({ grade: 'S' }),
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('grade-s');
    });

    it('全6チームタイプ獲得で「タイプコレクター」を獲得', () => {
      const history: GameHistoryEntry[] = [
        { totalCorrect: 10, totalQuestions: 20, correctRate: 50, averageSpeed: 7, stability: 50, debt: 0, maxCombo: 3, grade: 'C', gradeLabel: 'Developing', teamTypeId: 'synergy', teamTypeName: '', timestamp: 1 },
        { totalCorrect: 10, totalQuestions: 20, correctRate: 50, averageSpeed: 7, stability: 50, debt: 0, maxCombo: 3, grade: 'C', gradeLabel: 'Developing', teamTypeId: 'resilient', teamTypeName: '', timestamp: 2 },
        { totalCorrect: 10, totalQuestions: 20, correctRate: 50, averageSpeed: 7, stability: 50, debt: 0, maxCombo: 3, grade: 'C', gradeLabel: 'Developing', teamTypeId: 'evolving', teamTypeName: '', timestamp: 3 },
        { totalCorrect: 10, totalQuestions: 20, correctRate: 50, averageSpeed: 7, stability: 50, debt: 0, maxCombo: 3, grade: 'C', gradeLabel: 'Developing', teamTypeId: 'agile', teamTypeName: '', timestamp: 4 },
        { totalCorrect: 10, totalQuestions: 20, correctRate: 50, averageSpeed: 7, stability: 50, debt: 0, maxCombo: 3, grade: 'C', gradeLabel: 'Developing', teamTypeId: 'struggling', teamTypeName: '', timestamp: 5 },
      ];
      const ctx = makeContext({
        result: makeResult({ teamTypeId: 'forming' }),
        history,
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('all-types');
    });

    it('ジャンルマスター: 任意ジャンル正答率100%', () => {
      const ctx = makeContext({
        result: makeResult({
          tagStats: {
            scrum: { correct: 5, total: 5 },
            testing: { correct: 3, total: 5 },
          },
        }),
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('genre-master');
    });

    it('8スプリントモードクリアで「マラソンランナー」を獲得', () => {
      const sprintLog = Array.from({ length: 8 }, (_, i) => ({
        sprintNumber: i + 1, correctRate: 70, correctCount: 5, totalCount: 7,
        averageSpeed: 6, debt: 0, hadEmergency: false, emergencySuccessCount: 0, categoryStats: {},
      }));
      const ctx = makeContext({
        result: makeResult({ sprintLog }),
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('sprint-8');
    });

    it('逆転劇: 前半50%未満→最終70%以上', () => {
      const ctx = makeContext({
        result: makeResult({ correctRate: 75 }),
        sprintCorrectRates: [40, 45, 80, 85],
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('comeback');
    });

    it('深夜0-5時プレイで「深夜のエンジニア」を獲得', () => {
      const ctx = makeContext({
        now: new Date('2025-06-15T02:30:00'),
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('night-owl');
    });

    it('深夜でない時間帯では「深夜のエンジニア」を獲得しない', () => {
      const ctx = makeContext({
        now: new Date('2025-06-15T14:00:00'),
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).not.toContain('night-owl');
    });

    // ── 継続系実績テスト ──

    it('3回プレイで「リピーター」を獲得', () => {
      const history = Array.from({ length: 2 }, (_, i) =>
        makeHistoryEntry({ timestamp: i * 1000 })
      );
      const ctx = makeContext({ history });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('play-3');
    });

    it('2回ではまだ「リピーター」を獲得しない', () => {
      const history = [makeHistoryEntry()];
      const ctx = makeContext({ history });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).not.toContain('play-3');
    });

    it('10回プレイで「常連プレイヤー」を獲得', () => {
      const history = Array.from({ length: 9 }, (_, i) =>
        makeHistoryEntry({ timestamp: i * 1000 })
      );
      const ctx = makeContext({ history });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('play-10');
    });

    it('累計正解100問で「百問道場」を獲得', () => {
      // 過去の履歴で累計90問正解、今回10問正解 → 合計100
      const history = Array.from({ length: 9 }, (_, i) =>
        makeHistoryEntry({ totalCorrect: 10, timestamp: i * 1000 })
      );
      const ctx = makeContext({
        result: makeResult({ totalCorrect: 10 }),
        history,
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('total-correct-100');
    });

    it('累計99問正解ではまだ「百問道場」を獲得しない', () => {
      const history = Array.from({ length: 9 }, (_, i) =>
        makeHistoryEntry({ totalCorrect: 10, timestamp: i * 1000 })
      );
      const ctx = makeContext({
        result: makeResult({ totalCorrect: 9 }),
        history,
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).not.toContain('total-correct-100');
    });

    it('正答率の向上で「成長の証」を獲得', () => {
      // 過去3回が50%, 55%, 60%で今回70% → 直近が10%以上向上
      const history = [
        makeHistoryEntry({ correctRate: 50, timestamp: 1000 }),
        makeHistoryEntry({ correctRate: 55, timestamp: 2000 }),
        makeHistoryEntry({ correctRate: 60, timestamp: 3000 }),
      ];
      const ctx = makeContext({
        result: makeResult({ correctRate: 72 }),
        history,
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('improving');
    });

    it('正答率が向上していない場合「成長の証」を獲得しない', () => {
      const history = [
        makeHistoryEntry({ correctRate: 70, timestamp: 1000 }),
        makeHistoryEntry({ correctRate: 72, timestamp: 2000 }),
        makeHistoryEntry({ correctRate: 71, timestamp: 3000 }),
      ];
      const ctx = makeContext({
        result: makeResult({ correctRate: 72 }),
        history,
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).not.toContain('improving');
    });

    it('累計正解500問で「知識の泉」を獲得', () => {
      const history = Array.from({ length: 24 }, (_, i) =>
        makeHistoryEntry({ totalCorrect: 20, timestamp: i * 1000 })
      );
      const ctx = makeContext({
        result: makeResult({ totalCorrect: 20 }),
        history,
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('total-correct-500');
    });
  });
});
