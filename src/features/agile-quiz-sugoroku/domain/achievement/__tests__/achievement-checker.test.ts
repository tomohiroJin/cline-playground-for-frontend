/**
 * 実績システム - 単体テスト
 */
import {
  ACHIEVEMENTS,
  checkAchievements,
} from '../achievement-checker';
import {
  createSavedGameResult,
  createAchievementContext,
  createHistoryEntry,
  createSprintSummaryData,
} from '../../testing/test-factories';

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
      const ctx = createAchievementContext();
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('first-clear');
    });

    it('すでに獲得済みの実績は再度獲得しない', () => {
      const ctx = createAchievementContext({ unlockedIds: ['first-clear'] });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).not.toContain('first-clear');
    });

    it('全問正解で「完璧主義者」を獲得', () => {
      const ctx = createAchievementContext({
        result: createSavedGameResult({ totalCorrect: 21, totalQuestions: 21, correctRate: 100 }),
        sprintCorrectRates: [100, 100, 100],
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('all-correct');
    });

    it('1スプリント全問正解で「パーフェクトスプリント」を獲得', () => {
      const ctx = createAchievementContext({
        sprintCorrectRates: [100, 60, 70],
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('perfect-sprint');
    });

    it('5コンボ達成で「コンボマスター」を獲得', () => {
      const ctx = createAchievementContext({
        result: createSavedGameResult({ maxCombo: 5 }),
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('combo-5');
    });

    it('10コンボ達成で「コンボレジェンド」を獲得', () => {
      const ctx = createAchievementContext({
        result: createSavedGameResult({ maxCombo: 10 }),
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('combo-10');
    });

    it('平均回答時間3秒以内で「高速回答」を獲得', () => {
      const ctx = createAchievementContext({
        result: createSavedGameResult({ averageSpeed: 2.8 }),
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('speed-demon');
    });

    it('緊急対応3回成功で「火消しの達人」を獲得', () => {
      const ctx = createAchievementContext({
        result: createSavedGameResult({
          sprintLog: [
            createSprintSummaryData({ sprintNumber: 1, hadEmergency: true, emergencySuccessCount: 2 }),
            createSprintSummaryData({ sprintNumber: 2, hadEmergency: true, emergencySuccessCount: 1 }),
          ],
        }),
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('firefighter');
    });

    it('負債0でクリアで「クリーンコード」を獲得', () => {
      const ctx = createAchievementContext({
        result: createSavedGameResult({ debt: 0 }),
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('zero-debt');
    });

    it('Sグレード獲得で「Sランカー」を獲得', () => {
      const ctx = createAchievementContext({
        result: createSavedGameResult({ grade: 'S' }),
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('grade-s');
    });

    it('全6チームタイプ獲得で「タイプコレクター」を獲得', () => {
      const history = [
        createHistoryEntry({ teamTypeId: 'synergy', timestamp: 1 }),
        createHistoryEntry({ teamTypeId: 'resilient', timestamp: 2 }),
        createHistoryEntry({ teamTypeId: 'evolving', timestamp: 3 }),
        createHistoryEntry({ teamTypeId: 'agile', timestamp: 4 }),
        createHistoryEntry({ teamTypeId: 'struggling', timestamp: 5 }),
      ];
      const ctx = createAchievementContext({
        result: createSavedGameResult({ teamTypeId: 'forming' }),
        history,
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('all-types');
    });

    it('ジャンルマスター: 任意ジャンル正答率100%', () => {
      const ctx = createAchievementContext({
        result: createSavedGameResult({
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
      const sprintLog = Array.from({ length: 8 }, (_, i) =>
        createSprintSummaryData({ sprintNumber: i + 1 }),
      );
      const ctx = createAchievementContext({
        result: createSavedGameResult({ sprintLog }),
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('sprint-8');
    });

    it('逆転劇: 前半50%未満→最終70%以上', () => {
      const ctx = createAchievementContext({
        result: createSavedGameResult({ correctRate: 75 }),
        sprintCorrectRates: [40, 45, 80, 85],
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('comeback');
    });

    it('深夜0-5時プレイで「深夜のエンジニア」を獲得', () => {
      const ctx = createAchievementContext({
        now: new Date('2025-06-15T02:30:00'),
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('night-owl');
    });

    it('深夜でない時間帯では「深夜のエンジニア」を獲得しない', () => {
      const ctx = createAchievementContext({
        now: new Date('2025-06-15T14:00:00'),
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).not.toContain('night-owl');
    });

    // ── 継続系実績テスト ──

    it('3回プレイで「リピーター」を獲得', () => {
      const history = Array.from({ length: 2 }, (_, i) =>
        createHistoryEntry({ timestamp: i * 1000 }),
      );
      const ctx = createAchievementContext({ history });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('play-3');
    });

    it('2回ではまだ「リピーター」を獲得しない', () => {
      const history = [createHistoryEntry()];
      const ctx = createAchievementContext({ history });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).not.toContain('play-3');
    });

    it('10回プレイで「常連プレイヤー」を獲得', () => {
      const history = Array.from({ length: 9 }, (_, i) =>
        createHistoryEntry({ timestamp: i * 1000 }),
      );
      const ctx = createAchievementContext({ history });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('play-10');
    });

    it('累計正解100問で「百問道場」を獲得', () => {
      const history = Array.from({ length: 9 }, (_, i) =>
        createHistoryEntry({ totalCorrect: 10, timestamp: i * 1000 }),
      );
      const ctx = createAchievementContext({
        result: createSavedGameResult({ totalCorrect: 10 }),
        history,
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('total-correct-100');
    });

    it('累計99問正解ではまだ「百問道場」を獲得しない', () => {
      const history = Array.from({ length: 9 }, (_, i) =>
        createHistoryEntry({ totalCorrect: 10, timestamp: i * 1000 }),
      );
      const ctx = createAchievementContext({
        result: createSavedGameResult({ totalCorrect: 9 }),
        history,
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).not.toContain('total-correct-100');
    });

    it('正答率の向上で「成長の証」を獲得', () => {
      const history = [
        createHistoryEntry({ correctRate: 50, timestamp: 1000 }),
        createHistoryEntry({ correctRate: 55, timestamp: 2000 }),
        createHistoryEntry({ correctRate: 60, timestamp: 3000 }),
      ];
      const ctx = createAchievementContext({
        result: createSavedGameResult({ correctRate: 72 }),
        history,
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('improving');
    });

    it('正答率が向上していない場合「成長の証」を獲得しない', () => {
      const history = [
        createHistoryEntry({ correctRate: 70, timestamp: 1000 }),
        createHistoryEntry({ correctRate: 72, timestamp: 2000 }),
        createHistoryEntry({ correctRate: 71, timestamp: 3000 }),
      ];
      const ctx = createAchievementContext({
        result: createSavedGameResult({ correctRate: 72 }),
        history,
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).not.toContain('improving');
    });

    it('累計正解500問で「知識の泉」を獲得', () => {
      const history = Array.from({ length: 24 }, (_, i) =>
        createHistoryEntry({ totalCorrect: 20, timestamp: i * 1000 }),
      );
      const ctx = createAchievementContext({
        result: createSavedGameResult({ totalCorrect: 20 }),
        history,
      });
      const newlyUnlocked = checkAchievements(ctx);
      expect(newlyUnlocked.map(a => a.id)).toContain('total-correct-500');
    });
  });
});
