// 音声設定定数
// useAudio で使用するマジックナンバーを定数化

import type { Note } from '../interfaces/audio';

type OscType = OscillatorType;

/** SE 設定の型 */
interface SeConfig {
  readonly freq: number;
  readonly dur: number;
  readonly type: OscType;
  readonly vol: number;
}

/** シーケンス SE 設定の型 */
interface SeqConfig {
  readonly notes: readonly Note[];
}

/** パラメトリック SE 設定の型（行数・倍率等に依存） */
interface FallConfig {
  readonly baseFreq: number;
  readonly freqStep: number;
  readonly dur: number;
  readonly type: OscType;
  readonly baseVol: number;
  readonly volStep: number;
}

interface OkConfig {
  readonly baseFreq1: number;
  readonly freqMult1: number;
  readonly baseFreq2: number;
  readonly freqMult2: number;
  readonly dur1: number;
  readonly dur2: number;
  readonly type: OscType;
  readonly vol: number;
  readonly delay2: number;
  readonly maxMult: number;
}

interface ComboConfig {
  readonly baseFreq: number;
  readonly freqStep: number;
  readonly dur: number;
  readonly type: OscType;
  readonly vol: number;
}

interface ClrConfig {
  readonly baseFreq: number;
  readonly freqStep: number;
  readonly dur: number;
  readonly type: OscType;
  readonly vol: number;
  readonly delayStep: number;
  readonly count: number;
}

// --- 単音 SE ---

export const SE_MV: SeConfig = {
  freq: 1100,
  dur: 0.04,
  type: 'square',
  vol: 0.06,
};

export const SE_TICK: SeConfig = {
  freq: 660,
  dur: 0.025,
  type: 'square',
  vol: 0.03,
};

export const SE_WR: SeConfig = {
  freq: 280,
  dur: 0.12,
  type: 'sawtooth',
  vol: 0.07,
};

export const SE_ER: SeConfig = {
  freq: 180,
  dur: 0.12,
  type: 'sawtooth',
  vol: 0.06,
};

// --- シーケンス SE ---

export const SE_SEL: SeqConfig = {
  notes: [
    [880, 0.05, 'square', 0.1, 0],
    [1320, 0.06, 'square', 0.1, 45],
  ],
};

export const SE_DIE: SeqConfig = {
  notes: [
    [220, 0.25, 'sawtooth', 0.14, 0],
    [110, 0.35, 'sawtooth', 0.11, 170],
    [70, 0.4, 'sawtooth', 0.08, 350],
  ],
};

export const SE_NEAR: SeqConfig = {
  notes: [
    [900, 0.03, 'triangle', 0.04, 0],
    [1200, 0.04, 'triangle', 0.05, 40],
  ],
};

export const SE_SS: SeqConfig = {
  notes: [
    [440, 0.07, 'square', 0.1, 0],
    [550, 0.07, 'square', 0.1, 90],
    [660, 0.1, 'square', 0.1, 180],
  ],
};

export const SE_UL: SeqConfig = {
  notes: [
    [660, 0.07, 'square', 0.1, 0],
    [990, 0.07, 'square', 0.1, 70],
    [1320, 0.1, 'square', 0.1, 140],
  ],
};

export const SE_SH: SeqConfig = {
  notes: [
    [440, 0.07, 'triangle', 0.08, 0],
    [880, 0.12, 'triangle', 0.1, 70],
  ],
};

export const SE_PK: SeqConfig = {
  notes: [
    [550, 0.06, 'triangle', 0.07, 0],
    [770, 0.08, 'triangle', 0.08, 60],
    [990, 0.1, 'triangle', 0.09, 130],
  ],
};

export const SE_MOD: SeqConfig = {
  notes: [
    [330, 0.1, 'sawtooth', 0.05, 0],
    [440, 0.1, 'sawtooth', 0.06, 100],
  ],
};

// --- パラメトリック SE ---

export const SE_FALL: FallConfig = {
  baseFreq: 500,
  freqStep: 35,
  dur: 0.04,
  type: 'square',
  baseVol: 0.025,
  volStep: 0.006,
};

export const SE_OK: OkConfig = {
  baseFreq1: 550,
  freqMult1: 90,
  baseFreq2: 700,
  freqMult2: 110,
  dur1: 0.06,
  dur2: 0.08,
  type: 'square',
  vol: 0.1,
  delay2: 50,
  maxMult: 4,
};

export const SE_COMBO: ComboConfig = {
  baseFreq: 800,
  freqStep: 45,
  dur: 0.06,
  type: 'triangle',
  vol: 0.08,
};

export const SE_CLR: ClrConfig = {
  baseFreq: 500,
  freqStep: 110,
  dur: 0.1,
  type: 'square',
  vol: 0.09,
  delayStep: 80,
  count: 5,
};
