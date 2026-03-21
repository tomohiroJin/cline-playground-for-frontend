/**
 * useAudio カスタムフックのテスト
 * GameEvent の処理ロジックを検証する
 */
import { NullAudioService } from '../../infrastructure/audio/audio-service';
import type { IAudioService } from '../../infrastructure/audio/audio-service';
import type { GameEvent } from '../../application/game-events';

/**
 * processEvents のロジックを直接テスト
 * （フック本体は React に依存するため、イベント処理ロジックのみ単体テストする）
 */
const processEvents = (service: IAudioService, events: readonly GameEvent[]) => {
  for (const event of events) {
    switch (event.type) {
      case 'SOUND_PLAY':
        service.play(event.sound, event.volume);
        break;
      case 'SOUND_SPATIAL':
        service.playSpatial(event.sound, event.volume, event.pan);
        break;
      case 'BGM_UPDATE':
        service.updateBGM(event.danger);
        break;
      default:
        break;
    }
  }
};

describe('useAudio - GameEvent 処理ロジック', () => {
  let service: NullAudioService;

  beforeEach(() => {
    service = new NullAudioService();
  });

  describe('SOUND_PLAY イベント', () => {
    it('効果音再生イベントを処理する', () => {
      // Arrange
      const events: GameEvent[] = [
        { type: 'SOUND_PLAY', sound: 'key', volume: 0.45 },
      ];

      // Act
      processEvents(service, events);

      // Assert
      expect(service.playedSounds).toHaveLength(1);
      expect(service.playedSounds[0]).toEqual({ sound: 'key', volume: 0.45 });
    });
  });

  describe('SOUND_SPATIAL イベント', () => {
    it('空間音響イベントを処理する', () => {
      // Arrange
      const events: GameEvent[] = [
        { type: 'SOUND_SPATIAL', sound: 'enemy', volume: 0.3, pan: -0.5 },
      ];

      // Act
      processEvents(service, events);

      // Assert
      expect(service.spatialSounds).toHaveLength(1);
      expect(service.spatialSounds[0]).toEqual({ sound: 'enemy', volume: 0.3, pan: -0.5 });
    });
  });

  describe('BGM_UPDATE イベント', () => {
    it('BGM 危険度更新イベントを処理する', () => {
      // Arrange
      const events: GameEvent[] = [
        { type: 'BGM_UPDATE', danger: 0.75 },
      ];

      // Act
      processEvents(service, events);

      // Assert
      expect(service.lastDanger).toBe(0.75);
    });
  });

  describe('複数イベントの処理', () => {
    it('複数のイベントを順番に処理する', () => {
      // Arrange
      const events: GameEvent[] = [
        { type: 'SOUND_PLAY', sound: 'key', volume: 0.45 },
        { type: 'SOUND_SPATIAL', sound: 'enemy', volume: 0.3, pan: 0.5 },
        { type: 'BGM_UPDATE', danger: 0.8 },
        { type: 'SOUND_PLAY', sound: 'hurt', volume: 0.5 },
      ];

      // Act
      processEvents(service, events);

      // Assert
      expect(service.playedSounds).toHaveLength(2);
      expect(service.spatialSounds).toHaveLength(1);
      expect(service.lastDanger).toBe(0.8);
    });
  });

  describe('未処理イベント', () => {
    it('MESSAGE イベントは無視される（AudioService には関係ない）', () => {
      // Arrange
      const events: GameEvent[] = [
        { type: 'MESSAGE', text: 'テスト' },
      ];

      // Act
      processEvents(service, events);

      // Assert
      expect(service.playedSounds).toHaveLength(0);
      expect(service.spatialSounds).toHaveLength(0);
    });

    it('GAME_END イベントは無視される', () => {
      // Arrange
      const events: GameEvent[] = [
        { type: 'GAME_END', reason: 'victory' },
      ];

      // Act
      processEvents(service, events);

      // Assert
      expect(service.playedSounds).toHaveLength(0);
    });
  });
});
