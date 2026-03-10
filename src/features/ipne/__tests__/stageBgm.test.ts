/**
 * ステージ別BGM + サウンド強化テスト（Phase 3-1）
 *
 * - ステージ別BGM設定が存在する
 * - ボス戦BGMが設定される
 * - コンボSEのピッチ変化
 * - BGM切り替えロジック
 */

import { BgmType } from '../types';
import {
  getStageGameBgmType,
  STAGE_BGM_CONFIGS,
} from '../audio/bgm';
import {
  getComboSePitchRate,
} from '../audio/soundEffect';

describe('ステージ別BGM + サウンド強化（Phase 3-1）', () => {
  describe('ステージ別BGM設定', () => {
    it('ステージ1〜5のBGM設定が存在する', () => {
      for (let stage = 1; stage <= 5; stage++) {
        const bgmType = getStageGameBgmType(stage);
        expect(bgmType).toBeDefined();
      }
    });

    it('ステージ1はGAME_STAGE1タイプを返す', () => {
      expect(getStageGameBgmType(1)).toBe(BgmType.GAME_STAGE1);
    });

    it('ステージ5はGAME_STAGE5タイプを返す', () => {
      expect(getStageGameBgmType(5)).toBe(BgmType.GAME_STAGE5);
    });

    it('範囲外のステージはデフォルトのGAMEを返す', () => {
      expect(getStageGameBgmType(0)).toBe(BgmType.GAME);
      expect(getStageGameBgmType(6)).toBe(BgmType.GAME);
    });

    it('STAGE_BGM_CONFIGS にステージ1〜5の設定がある', () => {
      expect(STAGE_BGM_CONFIGS).toHaveLength(5);
    });

    it('各ステージBGM設定にメロディが含まれる', () => {
      for (const config of STAGE_BGM_CONFIGS) {
        expect(config.melody.length).toBeGreaterThan(0);
        expect(config.oscillatorType).toBeDefined();
        expect(config.gain).toBeGreaterThan(0);
      }
    });
  });

  describe('ボス戦BGM', () => {
    it('BgmType.BOSS が定義されている', () => {
      expect(BgmType.BOSS).toBe('boss');
    });
  });

  describe('コンボSEピッチ変化', () => {
    it('コンボ数1でピッチ率1.0を返す', () => {
      expect(getComboSePitchRate(1)).toBe(1.0);
    });

    it('コンボ数2-3でピッチ率1.1を返す', () => {
      expect(getComboSePitchRate(2)).toBe(1.1);
      expect(getComboSePitchRate(3)).toBe(1.1);
    });

    it('コンボ数4-6でピッチ率1.2を返す', () => {
      expect(getComboSePitchRate(4)).toBe(1.2);
      expect(getComboSePitchRate(6)).toBe(1.2);
    });

    it('コンボ数7-9でピッチ率1.3を返す', () => {
      expect(getComboSePitchRate(7)).toBe(1.3);
      expect(getComboSePitchRate(9)).toBe(1.3);
    });

    it('コンボ数10+でピッチ率1.4を返す', () => {
      expect(getComboSePitchRate(10)).toBe(1.4);
      expect(getComboSePitchRate(20)).toBe(1.4);
    });
  });
});
