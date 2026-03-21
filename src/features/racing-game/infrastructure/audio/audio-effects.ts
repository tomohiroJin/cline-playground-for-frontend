// 効果音定義（周波数・パターンの分離）

import { AUDIO } from './constants';

/** 効果音の周波数データ */
export const FREQUENCIES = AUDIO.freq;

/** 効果音のデフォルト設定 */
export const AUDIO_DEFAULTS = {
  defaultVolume: AUDIO.defaultVolume,
  minVolume: AUDIO.minVolume,
  maxVolume: AUDIO.maxVolume,
};

/** 各効果音のパターン定義 */
export interface SfxPattern {
  readonly frequencies: readonly number[];
  readonly duration: number;
  readonly type: OscillatorType;
  readonly volume: number;
}

/** 効果音パターン */
export const SFX_PATTERNS: Record<string, SfxPattern> = {
  collision: { frequencies: FREQUENCIES.collision, duration: 0.1, type: 'sawtooth', volume: 0.4 },
  wall: { frequencies: FREQUENCIES.wall, duration: 0.08, type: 'square', volume: 0.3 },
  lap: { frequencies: FREQUENCIES.lap, duration: 0.12, type: 'sine', volume: 0.5 },
  finalLap: { frequencies: FREQUENCIES.finalLap, duration: 0.15, type: 'sine', volume: 0.6 },
  countdown: { frequencies: FREQUENCIES.countdown, duration: 0.15, type: 'sine', volume: 0.5 },
  go: { frequencies: FREQUENCIES.go, duration: 0.1, type: 'sine', volume: 0.6 },
  finish: { frequencies: FREQUENCIES.finish, duration: 0.2, type: 'sine', volume: 0.5 },
  checkpoint: { frequencies: FREQUENCIES.checkpoint, duration: 0.08, type: 'sine', volume: 0.3 },
};
