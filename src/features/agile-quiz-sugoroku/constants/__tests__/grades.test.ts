/**
 * constants/grades.ts のテスト
 */
import {
  GRADES,
  getGrade,
  getSummaryText,
  STRENGTH_THRESHOLDS,
  CHALLENGE_EVALUATIONS,
  getStrengthText,
  getChallengeText,
  ENGINEER_TYPES,
} from '../grades';
import { ClassifyStats } from '../../types';

describe('constants/grades', () => {
  // ── GRADES ──────────────────────────────────────────
  describe('GRADES - グレード設定', () => {
    it('5つのグレードが定義されている', () => {
      expect(GRADES).toHaveLength(5);
    });

    it('降順にソートされている', () => {
      for (let i = 0; i < GRADES.length - 1; i++) {
        expect(GRADES[i].min).toBeGreaterThan(GRADES[i + 1].min);
      }
    });

    it('Object.freeze で凍結されている', () => {
      expect(Object.isFrozen(GRADES)).toBe(true);
    });
  });

  // ── getGrade ────────────────────────────────────────
  describe('getGrade - グレード計算', () => {
    it('高スコアでSグレードを返す', () => {
      const grade = getGrade(100, 100, 0);
      expect(grade.grade).toBe('S');
    });

    it('正答率50%、安定度30%、速度20%の重みで計算される', () => {
      const grade = getGrade(60, 50, 5);
      expect(grade.grade).toBe('C');
    });

    it('低スコアでDグレードを返す', () => {
      const grade = getGrade(10, 10, 15);
      expect(grade.grade).toBe('D');
    });

    it('各グレードにはラベルが設定されている', () => {
      const grade = getGrade(100, 100, 0);
      expect(grade.label).toBe('Dream Team');
      expect(grade.color).toBeDefined();
    });
  });

  // ── getSummaryText ──────────────────────────────────
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
      expect(text).toContain('緊急対応力');
    });
  });

  // ── STRENGTH_THRESHOLDS ─────────────────────────────
  describe('STRENGTH_THRESHOLDS - 強み評価の閾値', () => {
    it('4つの閾値が定義されている', () => {
      expect(STRENGTH_THRESHOLDS).toHaveLength(4);
    });

    it('Object.freeze で凍結されている', () => {
      expect(Object.isFrozen(STRENGTH_THRESHOLDS)).toBe(true);
    });
  });

  // ── getStrengthText ─────────────────────────────────
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

  // ── CHALLENGE_EVALUATIONS ───────────────────────────
  describe('CHALLENGE_EVALUATIONS - 課題評価', () => {
    it('5つの評価が定義されている', () => {
      expect(CHALLENGE_EVALUATIONS).toHaveLength(5);
    });
  });

  // ── getChallengeText ────────────────────────────────
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

  // ── ENGINEER_TYPES ──────────────────────────────────
  describe('ENGINEER_TYPES - エンジニアタイプ分類', () => {
    it('安定運用型: 安定度65以上、負債20以下、正答率60以上', () => {
      const stats: ClassifyStats = {
        stab: 70, debt: 15, emSuc: 0, sc: [60, 70], tp: 65, spd: 7,
      };
      const type = ENGINEER_TYPES.find(t => t.condition(stats));
      expect(type?.name).toBe('安定運用型エンジニア');
    });

    it('火消し職人: 緊急対応成功2回以上', () => {
      const stats: ClassifyStats = {
        stab: 30, debt: 40, emSuc: 2, sc: [40, 50], tp: 45, spd: 8,
      };
      const type = ENGINEER_TYPES.find(t => t.condition(stats));
      expect(type?.name).toBe('火消し職人エンジニア');
    });

    it('成長曲線型: 初回50%未満かつ最終65%以上', () => {
      const stats: ClassifyStats = {
        stab: 50, debt: 25, emSuc: 0, sc: [40, 55, 70], tp: 55, spd: 8,
      };
      const type = ENGINEER_TYPES.find(t => t.condition(stats));
      expect(type?.name).toBe('成長曲線型エンジニア');
    });

    it('高速レスポンス型: 速度5.5以下かつ正答率50%以上', () => {
      const stats: ClassifyStats = {
        stab: 50, debt: 25, emSuc: 0, sc: [60, 60], tp: 60, spd: 4.0,
      };
      const type = ENGINEER_TYPES.find(t => t.condition(stats));
      expect(type?.name).toBe('高速レスポンスエンジニア');
    });

    it('技術的負債と共に生きる人: 負債35以上', () => {
      const stats: ClassifyStats = {
        stab: 10, debt: 40, emSuc: 0, sc: [30, 30], tp: 30, spd: 10,
      };
      const type = ENGINEER_TYPES.find(t => t.condition(stats));
      expect(type?.name).toBe('技術的負債と共に生きる人');
    });

    it('どの条件にも当てはまらない場合は無難に回すエンジニア', () => {
      const stats: ClassifyStats = {
        stab: 50, debt: 25, emSuc: 0, sc: [55, 55], tp: 55, spd: 7,
      };
      const type = ENGINEER_TYPES.find(t => t.condition(stats));
      expect(type?.name).toBe('無難に回すエンジニア');
    });

    it('Object.freeze で凍結されている', () => {
      expect(Object.isFrozen(ENGINEER_TYPES)).toBe(true);
    });
  });
});
