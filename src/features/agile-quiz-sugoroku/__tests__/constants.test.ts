/**
 * Agile Quiz Sugoroku - 定数とユーティリティのテスト
 */
import {
  CONFIG,
  getDebtPoints,
  getColorByThreshold,
  getInverseColorByThreshold,
  getGrade,
  ENGINEER_TYPES,
  getSummaryText,
  getStrengthText,
  getChallengeText,
  COLORS,
  EVENTS,
  EMERGENCY_EVENT,
  DEBT_EVENTS,
  GRADES,
  INITIAL_GAME_STATS,
  CATEGORY_NAMES,
} from '../constants';
import { ClassifyStats } from '../types';

describe('Agile Quiz Sugoroku - 定数とユーティリティ', () => {
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

  // ── getColorByThreshold ──────────────────────────────

  describe('getColorByThreshold - 閾値に応じた色', () => {
    it('上限以上で緑を返す', () => {
      expect(getColorByThreshold(80, 70, 40)).toBe(COLORS.green);
    });

    it('上限と下限の間で黄色を返す', () => {
      expect(getColorByThreshold(50, 70, 40)).toBe(COLORS.yellow);
    });

    it('下限未満で赤を返す', () => {
      expect(getColorByThreshold(30, 70, 40)).toBe(COLORS.red);
    });

    it('境界値（上限ちょうど）で緑を返す', () => {
      expect(getColorByThreshold(70, 70, 40)).toBe(COLORS.green);
    });

    it('境界値（下限ちょうど）で黄色を返す', () => {
      expect(getColorByThreshold(40, 70, 40)).toBe(COLORS.yellow);
    });
  });

  // ── getInverseColorByThreshold ───────────────────────

  describe('getInverseColorByThreshold - 逆閾値の色（低いほど良い）', () => {
    it('低値で緑を返す', () => {
      expect(getInverseColorByThreshold(5, 10, 20)).toBe(COLORS.green);
    });

    it('中間値で黄色を返す', () => {
      expect(getInverseColorByThreshold(15, 10, 20)).toBe(COLORS.yellow);
    });

    it('高値で赤を返す', () => {
      expect(getInverseColorByThreshold(25, 10, 20)).toBe(COLORS.red);
    });
  });

  // ── getGrade ─────────────────────────────────────────

  describe('getGrade - グレード計算', () => {
    it('高スコアでSグレードを返す', () => {
      // score = 100*0.5 + 100*0.3 + max(0,min(100,100-0*8))*0.2 = 50+30+20 = 100
      const grade = getGrade(100, 100, 0);
      expect(grade.grade).toBe('S');
    });

    it('正答率50%、安定度30%、速度20%の重みで計算される', () => {
      // tp=60 → 30, stab=50 → 15, spd=5 → (100-40)*0.2 = 12 → total=57 → C
      const grade = getGrade(60, 50, 5);
      expect(grade.grade).toBe('C');
    });

    it('低スコアでDグレードを返す', () => {
      // tp=10 → 5, stab=10 → 3, spd=15 → max(0,-20)*0.2 = 0 → total=8 → D
      const grade = getGrade(10, 10, 15);
      expect(grade.grade).toBe('D');
    });

    it('各グレードにはラベルが設定されている', () => {
      const grade = getGrade(100, 100, 0);
      expect(grade.label).toBe('Legendary');
      expect(grade.color).toBeDefined();
    });
  });

  // ── ENGINEER_TYPES ───────────────────────────────────

  describe('ENGINEER_TYPES - エンジニアタイプ分類', () => {
    it('安定運用型: 安定度65以上、負債20以下、正答率60以上', () => {
      const stats: ClassifyStats = {
        stab: 70, debt: 15, emSuc: 0, sc: [60, 70], tp: 65, spd: 7,
      };
      const type = ENGINEER_TYPES.find((t) => t.condition(stats));
      expect(type?.name).toBe('安定運用型エンジニア');
    });

    it('火消し職人: 緊急対応成功2回以上', () => {
      const stats: ClassifyStats = {
        stab: 30, debt: 40, emSuc: 2, sc: [40, 50], tp: 45, spd: 8,
      };
      const type = ENGINEER_TYPES.find((t) => t.condition(stats));
      expect(type?.name).toBe('火消し職人エンジニア');
    });

    it('成長曲線型: 初回50%未満かつ最終65%以上', () => {
      const stats: ClassifyStats = {
        stab: 50, debt: 25, emSuc: 0, sc: [40, 55, 70], tp: 55, spd: 8,
      };
      const type = ENGINEER_TYPES.find((t) => t.condition(stats));
      expect(type?.name).toBe('成長曲線型エンジニア');
    });

    it('高速レスポンス型: 速度5.5以下かつ正答率50%以上', () => {
      const stats: ClassifyStats = {
        stab: 50, debt: 25, emSuc: 0, sc: [60, 60], tp: 60, spd: 4.0,
      };
      const type = ENGINEER_TYPES.find((t) => t.condition(stats));
      expect(type?.name).toBe('高速レスポンスエンジニア');
    });

    it('技術的負債と共に生きる人: 負債35以上', () => {
      const stats: ClassifyStats = {
        stab: 10, debt: 40, emSuc: 0, sc: [30, 30], tp: 30, spd: 10,
      };
      const type = ENGINEER_TYPES.find((t) => t.condition(stats));
      expect(type?.name).toBe('技術的負債と共に生きる人');
    });

    it('どの条件にも当てはまらない場合は無難に回すエンジニア', () => {
      const stats: ClassifyStats = {
        stab: 50, debt: 25, emSuc: 0, sc: [55, 55], tp: 55, spd: 7,
      };
      const type = ENGINEER_TYPES.find((t) => t.condition(stats));
      expect(type?.name).toBe('無難に回すエンジニア');
    });
  });

  // ── getSummaryText ───────────────────────────────────

  describe('getSummaryText - サマリーテキスト生成', () => {
    it('正答率70%以上で高評価テキストを返す', () => {
      const text = getSummaryText(75, 5, 10, 0);
      expect(text).toContain('素晴らしい');
    });

    it('正答率70%以上かつ速度6以下で速度の言及がある', () => {
      const text = getSummaryText(75, 5, 10, 0);
      expect(text).toContain('意思決定のスピード');
    });

    it('正答率70%以上かつ速度7で速度の言及がない', () => {
      const text = getSummaryText(75, 7, 10, 0);
      expect(text).not.toContain('回答速度も優秀');
    });

    it('正答率50-69%で基礎力テキストを返す', () => {
      const text = getSummaryText(55, 7, 10, 0);
      expect(text).toContain('基礎力');
    });

    it('正答率50-69%かつ負債21以上で負債警告を含む', () => {
      const text = getSummaryText(55, 7, 25, 0);
      expect(text).toContain('技術的負債');
    });

    it('正答率50%未満で走り抜いたテキストを返す', () => {
      const text = getSummaryText(40, 8, 5, 0);
      expect(text).toContain('走り抜いた');
    });

    it('正答率50%未満かつ緊急対応成功ありでその言及がある', () => {
      const text = getSummaryText(40, 8, 5, 1);
      expect(text).toContain('緊急時の対応力');
    });
  });

  // ── getStrengthText ──────────────────────────────────

  describe('getStrengthText - 強み評価テキスト', () => {
    it('80%以上で非常に高い精度のテキスト', () => {
      expect(getStrengthText(85)).toContain('非常に高い精度');
    });

    it('60%以上で安定したテキスト', () => {
      expect(getStrengthText(65)).toContain('安定');
    });

    it('40%以上で基礎知識のテキスト', () => {
      expect(getStrengthText(45)).toContain('基礎知識');
    });

    it('40%未満で伸びる余地のテキスト', () => {
      expect(getStrengthText(20)).toContain('伸びる余地');
    });
  });

  // ── getChallengeText ─────────────────────────────────

  describe('getChallengeText - 課題評価テキスト', () => {
    it('負債30以上で深刻化テキスト', () => {
      expect(getChallengeText(35, 5, 60)).toContain('深刻化');
    });

    it('負債15以上で注意テキスト', () => {
      expect(getChallengeText(20, 5, 60)).toContain('注意');
    });

    it('速度10超で速度改善テキスト', () => {
      expect(getChallengeText(10, 12, 60)).toContain('回答速度');
    });

    it('正答率50%未満で正答率向上テキスト', () => {
      expect(getChallengeText(10, 8, 40)).toContain('正答率');
    });

    it('問題がない場合は高水準テキスト', () => {
      expect(getChallengeText(5, 5, 80)).toContain('高水準');
    });
  });

  // ── 定数データの構造検証 ─────────────────────────────

  describe('定数データの構造検証', () => {
    it('EVENTSは7つのイベントを含む', () => {
      expect(EVENTS).toHaveLength(7);
    });

    it('各イベントに必須プロパティが存在する', () => {
      EVENTS.forEach((event) => {
        expect(event.id).toBeDefined();
        expect(event.name).toBeDefined();
        expect(event.icon).toBeDefined();
        expect(event.description).toBeDefined();
        expect(event.color).toBeDefined();
      });
    });

    it('EMERGENCY_EVENTのidはemergency', () => {
      expect(EMERGENCY_EVENT.id).toBe('emergency');
    });

    it('INITIAL_GAME_STATSの初期値がゼロ', () => {
      expect(INITIAL_GAME_STATS.totalCorrect).toBe(0);
      expect(INITIAL_GAME_STATS.totalQuestions).toBe(0);
      expect(INITIAL_GAME_STATS.debt).toBe(0);
      expect(INITIAL_GAME_STATS.speeds).toEqual([]);
    });

    it('GRADESは降順にソートされている', () => {
      for (let i = 0; i < GRADES.length - 1; i++) {
        expect(GRADES[i].min).toBeGreaterThan(GRADES[i + 1].min);
      }
    });

    it('CATEGORY_NAMESに全イベントIDのマッピングが存在する', () => {
      EVENTS.forEach((event) => {
        expect(CATEGORY_NAMES[event.id]).toBeDefined();
      });
      expect(CATEGORY_NAMES['emergency']).toBeDefined();
    });
  });
});
