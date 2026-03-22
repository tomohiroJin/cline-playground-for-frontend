/**
 * オーディオ制御フック
 *
 * AudioPort 経由でオーディオを制御する。
 * GameEvent を受け取って適切な効果音・BGM を再生する。
 */
import { useCallback, useEffect, useRef } from 'react';
import type { AudioPort } from '../../infrastructure/audio/audio-port';
import type { GameEvent } from '../../domain/events/game-events';
import { createParticles, createScorePopup, createNearMissEffect } from '../../domain/entities';
import type { Particle, ScorePopup, NearMissEffect } from '../../types';

/** オーディオイベント処理の結果（UI パーティクル等の追加分） */
export interface AudioEventSideEffects {
  readonly particles: Particle[];
  readonly scorePopups: ScorePopup[];
  readonly nearMissEffects: NearMissEffect[];
}

/** オーディオフックの戻り値 */
export interface UseAudioResult {
  /** AudioPort を初期化する */
  readonly init: () => void;
  /** GameEvent 配列を処理し、オーディオ再生と UI エフェクト生成を行う */
  readonly processEvents: (events: readonly GameEvent[]) => AudioEventSideEffects;
  /** クリーンアップ */
  readonly cleanup: () => void;
}

/** AudioPort 経由のオーディオ制御フック */
export const useAudio = (audioPort: AudioPort): UseAudioResult => {
  const portRef = useRef(audioPort);
  portRef.current = audioPort;

  const init = useCallback(() => {
    portRef.current.init();
  }, []);

  const processEvents = useCallback(
    (events: readonly GameEvent[]): AudioEventSideEffects => {
      const particles: Particle[] = [];
      const scorePopups: ScorePopup[] = [];
      const nearMissEffects: NearMissEffect[] = [];

      for (const event of events) {
        switch (event.type) {
          case 'AUDIO':
            // コンボ効果音の処理
            if (event.sound.startsWith('combo_')) {
              const level = parseInt(event.sound.replace('combo_', ''), 10);
              portRef.current.playCombo(level);
            } else {
              portRef.current.play(event.sound);
            }
            break;
          case 'PARTICLE':
            particles.push(...createParticles(event.x, event.y, event.color, event.count));
            break;
          case 'SCORE_POPUP':
            scorePopups.push(createScorePopup(event.x, event.y, event.text, event.color));
            break;
          case 'NEAR_MISS':
            nearMissEffects.push(createNearMissEffect(event.position.x, event.position.y));
            break;
          default:
            break;
        }
      }

      return { particles, scorePopups, nearMissEffects };
    },
    []
  );

  const cleanup = useCallback(() => {
    portRef.current.cleanup();
  }, []);

  // コンポーネントアンマウント時にクリーンアップ
  useEffect(() => () => portRef.current.cleanup(), []);

  return { init, processEvents, cleanup };
};
