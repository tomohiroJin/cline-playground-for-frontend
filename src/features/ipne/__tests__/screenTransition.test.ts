/**
 * 画面遷移演出改善テスト（Phase 3-4）
 *
 * - ステージ開始演出（フェードイン + テキスト）
 * - ゲームオーバー遷移（暗転）
 * - ステージクリア遷移（フラッシュ + パーティクル）
 */

import {
  getStageIntroPhase,
  getStageIntroAlpha,
  getGameOverTransitionAlpha,
  STAGE_INTRO_DURATION,
  GAME_OVER_TRANSITION_DURATION,
} from '../presentation/effects/screenTransition';

describe('画面遷移演出改善（Phase 3-4）', () => {
  describe('ステージ開始演出', () => {
    it('STAGE_INTRO_DURATION が 1500ms である', () => {
      expect(STAGE_INTRO_DURATION).toBe(1500);
    });

    it('0-500ms はフェードインフェーズ', () => {
      expect(getStageIntroPhase(0)).toBe('fadein');
      expect(getStageIntroPhase(250)).toBe('fadein');
      expect(getStageIntroPhase(499)).toBe('fadein');
    });

    it('200-1500ms はテキスト表示フェーズ', () => {
      expect(getStageIntroPhase(500)).toBe('text');
      expect(getStageIntroPhase(1000)).toBe('text');
      expect(getStageIntroPhase(1499)).toBe('text');
    });

    it('1500ms 以降は完了フェーズ', () => {
      expect(getStageIntroPhase(1500)).toBe('done');
      expect(getStageIntroPhase(2000)).toBe('done');
    });

    it('フェードインの alpha が 1.0→0.0 で変化する', () => {
      expect(getStageIntroAlpha(0)).toBeCloseTo(1.0);
      expect(getStageIntroAlpha(500)).toBeCloseTo(0.0);
    });

    it('テキスト表示中の alpha が 0.0 を返す', () => {
      expect(getStageIntroAlpha(750)).toBeCloseTo(0.0);
    });
  });

  describe('ゲームオーバー遷移', () => {
    it('GAME_OVER_TRANSITION_DURATION が 500ms である', () => {
      expect(GAME_OVER_TRANSITION_DURATION).toBe(500);
    });

    it('0ms で alpha は 0.0', () => {
      expect(getGameOverTransitionAlpha(0)).toBeCloseTo(0.0);
    });

    it('500ms で alpha は 0.7', () => {
      expect(getGameOverTransitionAlpha(500)).toBeCloseTo(0.7);
    });

    it('250ms で alpha は約 0.35', () => {
      expect(getGameOverTransitionAlpha(250)).toBeCloseTo(0.35);
    });
  });
});
