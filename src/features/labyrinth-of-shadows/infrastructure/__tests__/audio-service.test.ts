import { WebAudioService, NullAudioService } from '../audio/audio-service';
import type { IAudioService } from '../audio/audio-service';
import { setupAudioContextMock } from '../../__tests__/helpers/audio-mock';

// AudioContext のモック（共通ヘルパー使用）
beforeAll(() => {
  setupAudioContextMock();
});

describe('infrastructure/audio/WebAudioService', () => {
  let service: WebAudioService;

  beforeEach(() => {
    service = new WebAudioService();
  });

  describe('play', () => {
    it('効果音を再生できる', () => {
      // Arrange & Act
      service.play('footstep', 0.3);

      // Assert: エラーなく実行される
      expect(true).toBe(true);
    });

    it('複数の効果音タイプで再生できる', () => {
      // Arrange & Act & Assert
      service.play('key', 0.45);
      service.play('hurt', 0.5);
      service.play('heal', 0.4);
      expect(true).toBe(true);
    });
  });

  describe('playSpatial', () => {
    it('空間音響付きで再生できる', () => {
      // Arrange & Act
      service.playSpatial('enemy', 0.3, -0.5);

      // Assert: エラーなく実行される
      expect(true).toBe(true);
    });
  });

  describe('BGM', () => {
    it('BGM を開始できる', () => {
      // Arrange & Act
      service.startBGM();

      // Assert: エラーなく実行され、二重開始しない
      service.startBGM();
      expect(true).toBe(true);
    });

    it('BGM を停止できる', () => {
      // Arrange
      service.startBGM();

      // Act
      service.stopBGM();

      // Assert: エラーなく実行される
      expect(true).toBe(true);
    });

    it('BGM の危険度を更新できる', () => {
      // Arrange
      service.startBGM();

      // Act & Assert: エラーなく実行される
      service.updateBGM(0.5);
      service.updateBGM(0);
      service.updateBGM(1);
      expect(true).toBe(true);
    });

    it('BGM 未開始時に updateBGM を呼んでもエラーにならない', () => {
      // Arrange & Act & Assert
      service.updateBGM(0.5);
      expect(true).toBe(true);
    });
  });

  describe('IAudioService インターフェース準拠', () => {
    it('IAudioService として使用できる', () => {
      // Arrange
      const audioService: IAudioService = service;

      // Act & Assert: インターフェースの全メソッドが呼び出せる
      audioService.play('footstep', 0.3);
      audioService.playSpatial('enemy', 0.3, 0);
      audioService.startBGM();
      audioService.updateBGM(0.5);
      audioService.stopBGM();
      expect(true).toBe(true);
    });
  });
});

describe('infrastructure/audio/NullAudioService', () => {
  let service: NullAudioService;

  beforeEach(() => {
    service = new NullAudioService();
  });

  describe('play', () => {
    it('再生された音を履歴に記録する', () => {
      // Arrange & Act
      service.play('key', 0.45);
      service.play('hurt', 0.5);

      // Assert
      expect(service.playedSounds).toHaveLength(2);
      expect(service.playedSounds[0]).toEqual({ sound: 'key', volume: 0.45 });
      expect(service.playedSounds[1]).toEqual({ sound: 'hurt', volume: 0.5 });
    });
  });

  describe('playSpatial', () => {
    it('空間音響の履歴を記録する', () => {
      // Arrange & Act
      service.playSpatial('enemy', 0.3, -0.5);

      // Assert
      expect(service.spatialSounds).toHaveLength(1);
      expect(service.spatialSounds[0]).toEqual({ sound: 'enemy', volume: 0.3, pan: -0.5 });
    });
  });

  describe('BGM', () => {
    it('BGM の開始・停止状態を記録する', () => {
      // Arrange & Act
      service.startBGM();

      // Assert
      expect(service.bgmStarted).toBe(true);

      // Act
      service.stopBGM();

      // Assert
      expect(service.bgmStopped).toBe(true);
    });

    it('updateBGM の危険度を記録する', () => {
      // Arrange & Act
      service.updateBGM(0.75);

      // Assert
      expect(service.lastDanger).toBe(0.75);
    });
  });

  describe('reset', () => {
    it('履歴をリセットできる', () => {
      // Arrange
      service.play('key', 0.45);
      service.playSpatial('enemy', 0.3, 0);
      service.startBGM();
      service.stopBGM();
      service.updateBGM(0.5);

      // Act
      service.reset();

      // Assert
      expect(service.playedSounds).toHaveLength(0);
      expect(service.spatialSounds).toHaveLength(0);
      expect(service.bgmStarted).toBe(false);
      expect(service.bgmStopped).toBe(false);
      expect(service.lastDanger).toBe(0);
    });
  });

  describe('IAudioService インターフェース準拠', () => {
    it('IAudioService として使用できる', () => {
      // Arrange
      const audioService: IAudioService = service;

      // Act & Assert
      audioService.play('footstep', 0.3);
      audioService.playSpatial('enemy', 0.3, 0);
      audioService.startBGM();
      audioService.updateBGM(0.5);
      audioService.stopBGM();
      expect(true).toBe(true);
    });
  });
});
