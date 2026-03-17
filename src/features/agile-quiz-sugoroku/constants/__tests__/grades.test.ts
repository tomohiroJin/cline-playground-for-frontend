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
} from '../grades';

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

});
