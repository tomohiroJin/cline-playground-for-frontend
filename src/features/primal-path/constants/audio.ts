/**
 * オーディオ関連の定数
 */
import type { BgmType, BgmPattern } from '../types';

/** BGM パターン定義（バイオーム別ペンタトニックスケール） */
export const BGM_PATTERNS: Readonly<Record<BgmType, BgmPattern>> = Object.freeze({
  title: Object.freeze({
    notes: Object.freeze([262, 294, 330, 392, 440, 392, 330, 294]),
    tempo: 400,
    wave: 'triangle' as const,
    gain: 0.04,
  }),
  grassland: Object.freeze({
    notes: Object.freeze([330, 392, 440, 523, 440, 392, 330, 294]),
    tempo: 350,
    wave: 'sine' as const,
    gain: 0.04,
  }),
  glacier: Object.freeze({
    notes: Object.freeze([262, 330, 392, 330, 262, 220, 262, 330]),
    tempo: 500,
    wave: 'triangle' as const,
    gain: 0.03,
  }),
  volcano: Object.freeze({
    notes: Object.freeze([196, 262, 294, 392, 294, 262, 196, 165]),
    tempo: 300,
    wave: 'sawtooth' as const,
    gain: 0.03,
  }),
});

/** 音量設定 localStorage キー */
export const VOLUME_KEY = 'primal-path-volume';
