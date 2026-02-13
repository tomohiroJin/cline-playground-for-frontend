/**
 * Agile Quiz Sugoroku - ゲームロジックのテスト
 */
import {
  shuffle,
  average,
  percentage,
  clamp,
  pickQuestion,
  makeEvents,
  createSprintSummary,
} from '../game-logic';
import { EVENTS } from '../constants';
import { AnswerResult } from '../types';

describe('Agile Quiz Sugoroku - ゲームロジック', () => {
  // ── average ──────────────────────────────────────────

  describe('average - 平均値の計算', () => {
    it('空配列の場合は0を返す', () => {
      expect(average([])).toBe(0);
    });

    it('単一要素はそのまま返す', () => {
      expect(average([5])).toBe(5);
    });

    it('複数要素の平均を正しく計算する', () => {
      expect(average([2, 4, 6])).toBe(4);
      expect(average([10, 20, 30, 40])).toBe(25);
    });

    it('小数を含む場合も正しく計算する', () => {
      expect(average([1.5, 2.5])).toBe(2);
    });
  });

  // ── percentage ───────────────────────────────────────

  describe('percentage - パーセンテージの計算', () => {
    it('分母が0の場合は0を返す', () => {
      expect(percentage(5, 0)).toBe(0);
    });

    it('全問正解で100%を返す', () => {
      expect(percentage(7, 7)).toBe(100);
    });

    it('3問中2問正解で67%を返す', () => {
      expect(percentage(2, 3)).toBe(67);
    });

    it('0問正解で0%を返す', () => {
      expect(percentage(0, 5)).toBe(0);
    });
  });

  // ── clamp ────────────────────────────────────────────

  describe('clamp - 値の範囲制限', () => {
    it('範囲内の値はそのまま返す', () => {
      expect(clamp(50, 0, 100)).toBe(50);
    });

    it('下限未満の値は下限にクランプされる', () => {
      expect(clamp(-10, 0, 100)).toBe(0);
    });

    it('上限超過の値は上限にクランプされる', () => {
      expect(clamp(150, 0, 100)).toBe(100);
    });

    it('境界値の場合はそのまま返す', () => {
      expect(clamp(0, 0, 100)).toBe(0);
      expect(clamp(100, 0, 100)).toBe(100);
    });
  });

  // ── shuffle ──────────────────────────────────────────

  describe('shuffle - 配列のシャッフル', () => {
    it('元の配列を変更しない', () => {
      const original = [1, 2, 3, 4, 5];
      const copy = [...original];
      shuffle(original);
      expect(original).toEqual(copy);
    });

    it('シャッフル結果は同じ要素を含む', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = shuffle(arr);
      expect(result.sort()).toEqual(arr.sort());
    });

    it('空配列はそのまま返す', () => {
      expect(shuffle([])).toEqual([]);
    });

    it('単一要素はそのまま返す', () => {
      expect(shuffle([42])).toEqual([42]);
    });
  });

  // ── pickQuestion ─────────────────────────────────────

  describe('pickQuestion - 問題の選択', () => {
    beforeEach(() => {
      jest.spyOn(Math, 'random').mockReturnValue(0);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('指定カテゴリから問題を選択する', () => {
      const { question, index } = pickQuestion('planning');
      expect(question).toBeDefined();
      expect(question.q).toBeDefined();
      expect(question.o).toHaveLength(4);
      expect(typeof question.a).toBe('number');
      expect(index).toBe(0);
    });

    it('存在しないカテゴリはplanningから選択する', () => {
      const fromUnknown = pickQuestion('nonexistent');
      const fromPlanning = pickQuestion('planning');
      expect(fromUnknown.question.q).toBe(fromPlanning.question.q);
    });

    it('使用済みインデックスを避けて未使用の問題を選ぶ', () => {
      // インデックス0を使用済みにする
      const used = new Set([0]);
      const { index } = pickQuestion('planning', used);
      expect(index).not.toBe(0);
    });

    it('全問題が使用済みの場合でもランダムに選択する', () => {
      // 十分な数のインデックスを使用済みにする
      const used = new Set(Array.from({ length: 100 }, (_, i) => i));
      const { question } = pickQuestion('planning', used);
      expect(question).toBeDefined();
    });
  });

  // ── makeEvents ───────────────────────────────────────

  describe('makeEvents - スプリントイベントの生成', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('7つの標準イベントが返される', () => {
      const events = makeEvents(0, 0);
      expect(events).toHaveLength(7);
    });

    it('最初のスプリントでは緊急対応が発生しない', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0);
      const events = makeEvents(0, 0);
      const hasEmergency = events.some((e) => e.id === 'emergency');
      expect(hasEmergency).toBe(false);
    });

    it('2スプリント目以降で確率条件を満たすと緊急対応が挿入される', () => {
      // Math.random が常に 0 → probability > 0 なので必ず挿入
      jest.spyOn(Math, 'random').mockReturnValue(0);
      const events = makeEvents(1, 0);
      const hasEmergency = events.some((e) => e.id === 'emergency');
      expect(hasEmergency).toBe(true);
    });

    it('緊急対応は位置1〜3のいずれかに挿入される', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0);
      const events = makeEvents(1, 0);
      // position = minPosition(1) + floor(0 * 3) = 1
      expect(events[1].id).toBe('emergency');
    });

    it('確率が低く乱数が高い場合は緊急対応が発生しない', () => {
      // probability = min(0.5, 0.1 + 0*0.004) = 0.1 < 0.99
      jest.spyOn(Math, 'random').mockReturnValue(0.99);
      const events = makeEvents(1, 0);
      const hasEmergency = events.some((e) => e.id === 'emergency');
      expect(hasEmergency).toBe(false);
    });

    it('負債が高いと緊急対応の確率が上がる', () => {
      // debt=100 → probability = min(0.5, 0.1 + 100*0.004) = 0.5
      jest.spyOn(Math, 'random').mockReturnValue(0.49);
      const events = makeEvents(1, 100);
      const hasEmergency = events.some((e) => e.id === 'emergency');
      expect(hasEmergency).toBe(true);
    });
  });

  // ── createSprintSummary ──────────────────────────────

  describe('createSprintSummary - スプリント集計', () => {
    it('全問正解時の正答率は100%になる', () => {
      const answers: AnswerResult[] = [
        { c: true, s: 3.0, e: 'planning' },
        { c: true, s: 4.0, e: 'impl1' },
        { c: true, s: 5.0, e: 'test1' },
      ];
      const summary = createSprintSummary(answers, 0, 0);
      expect(summary.pct).toBe(100);
      expect(summary.cor).toBe(3);
      expect(summary.tot).toBe(3);
    });

    it('全問不正解時の正答率は0%になる', () => {
      const answers: AnswerResult[] = [
        { c: false, s: 3.0, e: 'planning' },
        { c: false, s: 4.0, e: 'impl1' },
      ];
      const summary = createSprintSummary(answers, 0, 0);
      expect(summary.pct).toBe(0);
      expect(summary.cor).toBe(0);
    });

    it('カテゴリ別の正答数と出題数が正しく集計される', () => {
      const answers: AnswerResult[] = [
        { c: true, s: 3.0, e: 'planning' },
        { c: false, s: 4.0, e: 'planning' },
        { c: true, s: 5.0, e: 'impl1' },
      ];
      const summary = createSprintSummary(answers, 0, 0);
      expect(summary.cats['planning']).toEqual({ c: 1, t: 2 });
      expect(summary.cats['impl1']).toEqual({ c: 1, t: 1 });
    });

    it('平均回答速度が正しく計算される', () => {
      const answers: AnswerResult[] = [
        { c: true, s: 2.0, e: 'planning' },
        { c: true, s: 4.0, e: 'impl1' },
      ];
      const summary = createSprintSummary(answers, 0, 0);
      expect(summary.spd).toBe(3.0);
    });

    it('スプリント番号は1始まりで記録される', () => {
      const answers: AnswerResult[] = [{ c: true, s: 3.0, e: 'planning' }];
      const summary = createSprintSummary(answers, 0, 0);
      expect(summary.sp).toBe(1);
    });

    it('緊急対応の有無と成功数が正しく記録される', () => {
      const answers: AnswerResult[] = [
        { c: true, s: 3.0, e: 'emergency' },
        { c: false, s: 4.0, e: 'emergency' },
        { c: true, s: 5.0, e: 'planning' },
      ];
      const summary = createSprintSummary(answers, 0, 10);
      expect(summary.em).toBe(true);
      expect(summary.emOk).toBe(1);
      expect(summary.debt).toBe(10);
    });

    it('緊急対応がない場合はem=false, emOk=0', () => {
      const answers: AnswerResult[] = [
        { c: true, s: 3.0, e: 'planning' },
      ];
      const summary = createSprintSummary(answers, 0, 0);
      expect(summary.em).toBe(false);
      expect(summary.emOk).toBe(0);
    });
  });
});
