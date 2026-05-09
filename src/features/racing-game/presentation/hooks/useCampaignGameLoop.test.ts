// useCampaignGameLoop の純粋関数 shouldRunCampaignTick の境界テスト。
//
// 本テストの主目的は、修正コミット cfb4989 で対応した
// 「ゴール瞬間に race-handler が即時 state.phase='result' に切り替えるため、
//  campaign-tick が呼ばれず stage_clear が出ないバグ」の再発防止。

import { shouldRunCampaignTick } from './useCampaignGameLoop';

describe('shouldRunCampaignTick', () => {
  describe('race フェーズ', () => {
    it('lap 据え置きでも常に true（毎フレーム残時間管理が必要）', () => {
      expect(shouldRunCampaignTick('race', 1, 1)).toBe(true);
    });

    it('複数ラップステージで lap 増加フレームでも true', () => {
      expect(shouldRunCampaignTick('race', 2, 1)).toBe(true);
    });
  });

  describe('result フェーズ（race-handler が lap > maxLaps で即時切替）', () => {
    it('lap 増加フレームでは true（**本バグ再発防止の核**）', () => {
      // race-handler 直後: phase='result', lap=2, lastLap=1
      // この瞬間に campaign-tick で hasCrossedFinishLine=true → cleared 判定
      expect(shouldRunCampaignTick('result', 2, 1)).toBe(true);
    });

    it('lap 据え置きなら false（result 連続フレームで無駄に呼ばない安全弁）', () => {
      // 既に lastLap が更新された後の result フレーム
      expect(shouldRunCampaignTick('result', 2, 2)).toBe(false);
    });
  });

  describe('countdown フェーズ', () => {
    it('lap 据え置きなら false（カウントダウン中は時間管理しない）', () => {
      expect(shouldRunCampaignTick('countdown', 1, 1)).toBe(false);
    });

    it('countdown 中に lap が増えるのは異常だが、検出する側として true', () => {
      expect(shouldRunCampaignTick('countdown', 2, 1)).toBe(true);
    });
  });

  describe('その他のフェーズ', () => {
    it('menu フェーズ + lap 据え置きは false', () => {
      expect(shouldRunCampaignTick('menu', 1, 1)).toBe(false);
    });

    it('draft フェーズ + lap 据え置きは false', () => {
      expect(shouldRunCampaignTick('draft', 1, 1)).toBe(false);
    });

    it('stage_clear フェーズ + lap 据え置きは false', () => {
      expect(shouldRunCampaignTick('stage_clear', 1, 1)).toBe(false);
    });
  });
});
