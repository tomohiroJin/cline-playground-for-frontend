/**
 * constants/audio.ts のテスト
 */
import { BGM_PATTERNS, VOLUME_KEY } from '../../constants/audio';

describe('constants/audio', () => {
  describe('BGM_PATTERNS', () => {
    it('タイトルと各バイオームのBGMが定義されている', () => {
      expect(BGM_PATTERNS).toHaveProperty('title');
      expect(BGM_PATTERNS).toHaveProperty('grassland');
      expect(BGM_PATTERNS).toHaveProperty('glacier');
      expect(BGM_PATTERNS).toHaveProperty('volcano');
    });

    it('各BGMにnotes, tempo, wave, gainが揃っている', () => {
      Object.values(BGM_PATTERNS).forEach(p => {
        expect(p).toHaveProperty('notes');
        expect(p).toHaveProperty('tempo');
        expect(p).toHaveProperty('wave');
        expect(p).toHaveProperty('gain');
      });
    });
  });

  describe('VOLUME_KEY', () => {
    it('音量キーが文字列として定義されている', () => {
      expect(typeof VOLUME_KEY).toBe('string');
    });
  });
});
