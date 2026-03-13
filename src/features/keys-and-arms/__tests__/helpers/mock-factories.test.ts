/**
 * KEYS & ARMS — モックファクトリテスト
 */
import {
  createMockCanvasContext,
  createMockDrawingAPI,
  createMockAudioModule,
  createMockAudioContext,
} from './mock-factories';

describe('モックファクトリ', () => {
  describe('createMockCanvasContext', () => {
    it('Canvas 2D コンテキストのモックを返す', () => {
      // Arrange & Act
      const ctx = createMockCanvasContext();

      // Assert
      expect(ctx.fillRect).toBeDefined();
      expect(ctx.fillText).toBeDefined();
      expect(ctx.beginPath).toBeDefined();
      expect(typeof ctx.fillRect).toBe('function');
    });

    it('描画メソッドがモック関数である', () => {
      // Arrange & Act
      const ctx = createMockCanvasContext();
      ctx.fillRect(0, 0, 100, 100);

      // Assert
      expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 100, 100);
    });
  });

  describe('createMockDrawingAPI', () => {
    it('DrawingAPI のモックを返す', () => {
      // Arrange & Act
      const draw = createMockDrawingAPI();

      // Assert
      expect(draw.$).toBeDefined();
      expect(draw.R).toBeDefined();
      expect(draw.txt).toBeDefined();
      expect(draw.px).toBeDefined();
    });

    it('カスタム ctx を注入できる', () => {
      // Arrange
      const ctx = createMockCanvasContext();

      // Act
      const draw = createMockDrawingAPI(ctx);

      // Assert
      expect(draw.$).toBe(ctx);
    });

    it('描画メソッドがモック関数である', () => {
      // Arrange
      const draw = createMockDrawingAPI();

      // Act
      draw.R(10, 20, 30, 40, true);

      // Assert
      expect(draw.R).toHaveBeenCalledWith(10, 20, 30, 40, true);
    });
  });

  describe('createMockAudioModule', () => {
    it('AudioModule のモックを返す', () => {
      // Arrange & Act
      const audio = createMockAudioModule();

      // Assert
      expect(audio.ea).toBeDefined();
      expect(audio.tn).toBeDefined();
      expect(audio.bgmTick).toBeDefined();
      expect(audio.S).toBeDefined();
    });

    it('SFX メソッドがモック関数である', () => {
      // Arrange
      const audio = createMockAudioModule();

      // Act
      audio.S.hit();

      // Assert
      expect(audio.S.hit).toHaveBeenCalled();
    });
  });

  describe('createMockAudioContext', () => {
    it('AudioContext のモックを返す', () => {
      // Arrange & Act
      const ac = createMockAudioContext();

      // Assert
      expect(ac.createOscillator).toBeDefined();
      expect(ac.createGain).toBeDefined();
      expect(ac.sampleRate).toBe(44100);
    });

    it('内部オブジェクトにアクセスできる', () => {
      // Arrange & Act
      const ac = createMockAudioContext();

      // Assert
      expect(ac._oscillator).toBeDefined();
      expect(ac._gain).toBeDefined();
      expect(ac._bufferSource).toBeDefined();
    });
  });
});
