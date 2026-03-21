/**
 * オーディオ管理カスタムフック
 * GameEvent を処理して AudioService に委譲する
 */
import { useRef, useCallback } from 'react';
import type { IAudioService } from '../../infrastructure/audio/audio-service';
import { WebAudioService } from '../../infrastructure/audio/audio-service';
import type { GameEvent } from '../../application/game-events';

/**
 * オーディオサービスの管理と GameEvent の処理を行うカスタムフック
 */
export const useAudio = () => {
  const audioServiceRef = useRef<IAudioService>(new WebAudioService());

  /** GameEvent 配列を処理して音声を再生する */
  const processEvents = useCallback((events: readonly GameEvent[]) => {
    const service = audioServiceRef.current;
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
  }, []);

  return {
    audioService: audioServiceRef.current,
    processEvents,
  };
};
