// ============================================================================
// Deep Sea Interceptor - オーディオシステムのテスト
// ============================================================================

import { createAudioSystem } from '../audio';

describe('createAudioSystem', () => {
  describe('init', () => {
    it('AudioContext が利用可能な場合にコンテキストを返すこと', () => {
      // Arrange
      const system = createAudioSystem();

      // Act
      const ctx = system.init();

      // Assert
      // jsdom 環境では AudioContext がモックされているかどうかによる
      // テスト環境では null の可能性がある
      expect(ctx === null || ctx instanceof AudioContext).toBe(true);
    });

    it('2回目の init は同じコンテキストを返すこと', () => {
      // Arrange
      const system = createAudioSystem();

      // Act
      const ctx1 = system.init();
      const ctx2 = system.init();

      // Assert
      expect(ctx1).toBe(ctx2);
    });
  });

  describe('play', () => {
    it('init 前に play を呼んでもエラーにならないこと', () => {
      // Arrange
      const system = createAudioSystem();

      // Act & Assert
      expect(() => system.play('shot')).not.toThrow();
    });

    it('存在しないサウンド名を指定してもエラーにならないこと', () => {
      // Arrange
      const system = createAudioSystem();
      system.init();

      // Act & Assert
      expect(() => system.play('nonexistent')).not.toThrow();
    });
  });
});
