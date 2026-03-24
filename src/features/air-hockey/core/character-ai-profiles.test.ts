/**
 * キャラクター AI プロファイルのテスト
 */
import { CHARACTER_AI_PROFILES, DEFAULT_PLAY_STYLE, getCharacterAiProfile } from './character-ai-profiles';

describe('DEFAULT_PLAY_STYLE', () => {
  it('デフォルト値が正しい', () => {
    expect(DEFAULT_PLAY_STYLE.sidePreference).toBe(0);
    expect(DEFAULT_PLAY_STYLE.lateralOscillation).toBe(0);
    expect(DEFAULT_PLAY_STYLE.lateralPeriod).toBe(0);
    expect(DEFAULT_PLAY_STYLE.aggressiveness).toBe(0.5);
    expect(DEFAULT_PLAY_STYLE.adaptability).toBe(0);
  });
});

describe('CHARACTER_AI_PROFILES', () => {
  it('全キャラクターの AI プロファイルが定義されている', () => {
    const expectedCharacters = ['hiro', 'misaki', 'takuma', 'yuu', 'rookie', 'regular', 'ace'];
    for (const charId of expectedCharacters) {
      expect(CHARACTER_AI_PROFILES[charId]).toBeDefined();
    }
  });

  describe('パラメータの有効範囲', () => {
    it('全キャラの lateralOscillation が 0 以上', () => {
      for (const [, profile] of Object.entries(CHARACTER_AI_PROFILES)) {
        expect(profile.lateralOscillation).toBeGreaterThanOrEqual(0);
      }
    });

    it('全キャラの aggressiveness が 0-1 の範囲内', () => {
      for (const [, profile] of Object.entries(CHARACTER_AI_PROFILES)) {
        expect(profile.aggressiveness).toBeGreaterThanOrEqual(0);
        expect(profile.aggressiveness).toBeLessThanOrEqual(1);
      }
    });

    it('全キャラの adaptability が 0-1 の範囲内', () => {
      for (const [, profile] of Object.entries(CHARACTER_AI_PROFILES)) {
        expect(profile.adaptability).toBeGreaterThanOrEqual(0);
        expect(profile.adaptability).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('キャラクター固有の特性', () => {
    it('ヒロは揺さぶりなし（lateralOscillation === 0）', () => {
      expect(CHARACTER_AI_PROFILES['hiro'].lateralOscillation).toBe(0);
    });

    it('ミサキは大きな揺さぶり（lateralOscillation > 20）', () => {
      expect(CHARACTER_AI_PROFILES['misaki'].lateralOscillation).toBeGreaterThan(20);
    });

    it('タクマは守備的（aggressiveness < 0.3）', () => {
      expect(CHARACTER_AI_PROFILES['takuma'].aggressiveness).toBeLessThan(0.3);
    });

    it('ユウは高適応（adaptability > 0.5）', () => {
      expect(CHARACTER_AI_PROFILES['yuu'].adaptability).toBeGreaterThan(0.5);
    });
  });
});

describe('getCharacterAiProfile', () => {
  it('既知のキャラ ID でプロファイルを返す', () => {
    const profile = getCharacterAiProfile('hiro');
    expect(profile).toBe(CHARACTER_AI_PROFILES['hiro']);
  });

  it('未知のキャラ ID で DEFAULT_PLAY_STYLE を返す', () => {
    const profile = getCharacterAiProfile('unknown');
    expect(profile).toBe(DEFAULT_PLAY_STYLE);
  });
});
