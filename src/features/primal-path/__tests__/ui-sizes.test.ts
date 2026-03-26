/**
 * 原始進化録 - PRIMAL PATH - UI コンポーネントサイズテスト
 *
 * 仕様書に基づく UI パーツのサイズ検証。
 */
import {
  ENEMY_PANEL_NORMAL, ENEMY_PANEL_BOSS,
  BUTTON_PADDING, TAB_MIN_HEIGHT,
} from '../constants/ui';

describe('UI コンポーネントサイズ', () => {
  describe('EnemyPanel', () => {
    it('通常敵表示枠は 80×80 である', () => {
      expect(ENEMY_PANEL_NORMAL).toEqual({ w: 80, h: 80 });
    });

    it('ボス表示枠は 104×104 である', () => {
      expect(ENEMY_PANEL_BOSS).toEqual({ w: 104, h: 104 });
    });
  });

  describe('ボタンパディング', () => {
    it('GameButton のパディングは 10px 20px である', () => {
      expect(BUTTON_PADDING.gameButton).toBe('10px 20px');
    });

    it('SkillBtn のパディングは 8px 14px である', () => {
      expect(BUTTON_PADDING.skillBtn).toBe('8px 14px');
    });

    it('SpeedBtn のパディングは 4px 10px である', () => {
      expect(BUTTON_PADDING.speedBtn).toBe('4px 10px');
    });

    it('SurrenderBtn のパディングは 4px 12px である', () => {
      expect(BUTTON_PADDING.surrenderBtn).toBe('4px 12px');
    });
  });

  describe('タブ UI', () => {
    it('タブの最小高さは 36px である', () => {
      expect(TAB_MIN_HEIGHT).toBe(36);
    });
  });
});
