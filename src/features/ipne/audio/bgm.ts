/**
 * IPNE BGMモジュール
 *
 * Web Audio APIを使用してシンプルなBGMパターンを生成・再生
 */

import {
  BgmType,
  BgmTypeValue,
  AudioSettings,
  DEFAULT_AUDIO_SETTINGS,
  MelodyNote,
} from '../types';
import { getAudioContext, isAudioInitialized } from './audioContext';

/** タイトル画面BGM - 神秘的で落ち着いた雰囲気 */
const TITLE_BGM: MelodyNote[] = [
  [262, 0.4],  // C4
  [0, 0.1],
  [330, 0.4],  // E4
  [0, 0.1],
  [392, 0.4],  // G4
  [0, 0.1],
  [330, 0.4],  // E4
  [0, 0.1],
  [262, 0.4],  // C4
  [0, 0.1],
  [294, 0.4],  // D4
  [0, 0.1],
  [330, 0.4],  // E4
  [0, 0.1],
  [294, 0.4],  // D4
  [0, 0.1],
];

/** ゲーム中BGM - 緊張感のあるダークファンタジー風 */
const GAME_BGM: MelodyNote[] = [
  [165, 0.15],  // E3
  [0, 0.1],
  [196, 0.15],  // G3
  [0, 0.1],
  [220, 0.15],  // A3
  [0, 0.1],
  [196, 0.15],  // G3
  [0, 0.1],
  [165, 0.15],  // E3
  [0, 0.1],
  [147, 0.15],  // D3
  [0, 0.1],
  [131, 0.2],   // C3
  [0, 0.15],
  [147, 0.15],  // D3
  [0, 0.1],
];

/** クリアジングル - 壮大で達成感のある */
const CLEAR_JINGLE: MelodyNote[] = [
  [523, 0.15],  // C5
  [659, 0.15],  // E5
  [784, 0.15],  // G5
  [1047, 0.25], // C6
  [0, 0.1],
  [988, 0.15],  // B5
  [1047, 0.15], // C6
  [1175, 0.15], // D6
  [1319, 0.35], // E6
  [0, 0.1],
  [1047, 0.15], // C6
  [1175, 0.15], // D6
  [1319, 0.15], // E6
  [1568, 0.5],  // G6
];

/** ゲームオーバージングル - 哀しみと静寂 */
const GAME_OVER_JINGLE: MelodyNote[] = [
  [330, 0.35],  // E4
  [311, 0.35],  // Eb4
  [294, 0.35],  // D4
  [277, 0.45],  // Db4
  [0, 0.2],
  [262, 0.3],   // C4
  [247, 0.3],   // B3
  [220, 0.4],   // A3
  [0, 0.15],
  [196, 0.2],   // G3
  [0, 0.1],
  [196, 0.2],   // G3
  [0, 0.1],
  [131, 0.8],   // C3
];

/** ステージ1 BGM - 探索的（穏やかな冒険） */
const STAGE_1_BGM: MelodyNote[] = [
  [165, 0.4],  // E3
  [0, 0.05],
  [196, 0.4],  // G3
  [0, 0.05],
  [220, 0.4],  // A3
  [0, 0.05],
  [247, 0.6],  // B3
  [0, 0.05],
  [220, 0.4],  // A3
  [0, 0.05],
  [196, 0.4],  // G3
  [0, 0.05],
  [165, 0.4],  // E3
  [0, 0.05],
  [147, 0.6],  // D3
  [0, 0.1],
];

/** ステージ2 BGM - 神秘的 */
const STAGE_2_BGM: MelodyNote[] = [
  [220, 0.5],  // A3
  [0, 0.05],
  [262, 0.5],  // C4
  [0, 0.05],
  [330, 0.5],  // E4
  [0, 0.05],
  [294, 0.7],  // D4
  [0, 0.05],
  [247, 0.5],  // B3
  [0, 0.05],
  [220, 0.5],  // A3
  [0, 0.05],
  [196, 0.5],  // G3
  [0, 0.05],
  [220, 0.7],  // A3
  [0, 0.1],
];

/** ステージ3 BGM - 不安を煽る短調 */
const STAGE_3_BGM: MelodyNote[] = [
  [147, 0.35],  // D3
  [0, 0.05],
  [175, 0.35],  // F3
  [0, 0.05],
  [208, 0.35],  // Ab3
  [0, 0.05],
  [196, 0.5],   // G3
  [0, 0.05],
  [165, 0.35],  // E3
  [0, 0.05],
  [147, 0.35],  // D3
  [0, 0.05],
  [131, 0.35],  // C3
  [0, 0.05],
  [147, 0.5],   // D3
  [0, 0.1],
];

/** ステージ4 BGM - 重厚で威圧的 */
const STAGE_4_BGM: MelodyNote[] = [
  [131, 0.5],   // C3
  [0, 0.05],
  [156, 0.5],   // Eb3
  [0, 0.05],
  [175, 0.5],   // F3
  [0, 0.05],
  [196, 0.7],   // G3
  [0, 0.05],
  [208, 0.5],   // Ab3
  [0, 0.05],
  [196, 0.5],   // G3
  [0, 0.05],
  [175, 0.5],   // F3
  [0, 0.05],
  [156, 0.7],   // Eb3
  [0, 0.1],
];

/** ステージ5 BGM - 激しいクライマックス */
const STAGE_5_BGM: MelodyNote[] = [
  [330, 0.3],   // E4
  [0, 0.03],
  [392, 0.3],   // G4
  [0, 0.03],
  [494, 0.3],   // B4
  [0, 0.03],
  [440, 0.4],   // A4
  [0, 0.03],
  [392, 0.3],   // G4
  [0, 0.03],
  [370, 0.3],   // F#4
  [0, 0.03],
  [330, 0.3],   // E4
  [0, 0.03],
  [294, 0.4],   // D4
  [0, 0.08],
];

/** ボス戦BGM - 緊迫 */
const BOSS_BGM: MelodyNote[] = [
  [220, 0.25],  // A3
  [0, 0.03],
  [262, 0.25],  // C4
  [0, 0.03],
  [220, 0.25],  // A3
  [0, 0.03],
  [233, 0.35],  // Bb3
  [0, 0.03],
  [220, 0.25],  // A3
  [0, 0.03],
  [196, 0.25],  // G3
  [0, 0.03],
  [220, 0.25],  // A3
  [0, 0.03],
  [330, 0.35],  // E4
  [0, 0.05],
];

/** BGM設定 */
interface BgmConfig {
  melody: MelodyNote[];
  oscillatorType: OscillatorType;
  loop: boolean;
  gain: number;
}

/** ステージ別BGM設定（テスト公開用） */
export const STAGE_BGM_CONFIGS: BgmConfig[] = [
  { melody: STAGE_1_BGM, oscillatorType: 'triangle', loop: true, gain: 0.06 },
  { melody: STAGE_2_BGM, oscillatorType: 'triangle', loop: true, gain: 0.06 },
  { melody: STAGE_3_BGM, oscillatorType: 'sawtooth', loop: true, gain: 0.05 },
  { melody: STAGE_4_BGM, oscillatorType: 'sawtooth', loop: true, gain: 0.05 },
  { melody: STAGE_5_BGM, oscillatorType: 'square', loop: true, gain: 0.06 },
];

/**
 * ステージ番号に対応するBGMタイプを返す
 */
export function getStageGameBgmType(stageNumber: number): BgmTypeValue {
  switch (stageNumber) {
    case 1: return BgmType.GAME_STAGE1;
    case 2: return BgmType.GAME_STAGE2;
    case 3: return BgmType.GAME_STAGE3;
    case 4: return BgmType.GAME_STAGE4;
    case 5: return BgmType.GAME_STAGE5;
    default: return BgmType.GAME;
  }
}

/** BGM設定マップ */
const BGM_CONFIGS: Record<BgmTypeValue, BgmConfig> = {
  [BgmType.TITLE]: {
    melody: TITLE_BGM,
    oscillatorType: 'sine',
    loop: true,
    gain: 0.08,
  },
  [BgmType.GAME]: {
    melody: GAME_BGM,
    oscillatorType: 'triangle',
    loop: true,
    gain: 0.06,
  },
  [BgmType.GAME_STAGE1]: STAGE_BGM_CONFIGS[0],
  [BgmType.GAME_STAGE2]: STAGE_BGM_CONFIGS[1],
  [BgmType.GAME_STAGE3]: STAGE_BGM_CONFIGS[2],
  [BgmType.GAME_STAGE4]: STAGE_BGM_CONFIGS[3],
  [BgmType.GAME_STAGE5]: STAGE_BGM_CONFIGS[4],
  [BgmType.BOSS]: {
    melody: BOSS_BGM,
    oscillatorType: 'square',
    loop: true,
    gain: 0.07,
  },
  [BgmType.CLEAR]: {
    melody: CLEAR_JINGLE,
    oscillatorType: 'square',
    loop: false,
    gain: 0.12,
  },
  [BgmType.GAME_OVER]: {
    melody: GAME_OVER_JINGLE,
    oscillatorType: 'sawtooth',
    loop: false,
    gain: 0.1,
  },
};

/** BGM再生状態 */
interface BgmState {
  currentType: BgmTypeValue | null;
  intervalId: number | undefined;
  isPlaying: boolean;
}

/** 現在の状態 */
const bgmState: BgmState = {
  currentType: null,
  intervalId: undefined,
  isPlaying: false,
};

/** 現在の音声設定 */
let currentSettings: AudioSettings = { ...DEFAULT_AUDIO_SETTINGS };

/**
 * メロディの総再生時間を計算する
 * @param melody メロディノート配列
 * @returns 総再生時間（秒）
 */
function getMelodyDuration(melody: MelodyNote[]): number {
  return melody.reduce((total, [, dur]) => total + dur, 0);
}

/**
 * BGMパターンを1回再生する
 * @param config BGM設定
 * @param volumeMultiplier 音量倍率
 */
function playBgmPattern(config: BgmConfig, volumeMultiplier: number): void {
  const ctx = getAudioContext();
  if (!ctx || !isAudioInitialized()) return;

  try {
    let time = ctx.currentTime;
    const volume = config.gain * volumeMultiplier;

    config.melody.forEach(([freq, dur]) => {
      if (freq > 0) {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.type = config.oscillatorType;
        osc.frequency.setValueAtTime(freq, time);

        gainNode.gain.setValueAtTime(volume, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.85);

        osc.start(time);
        osc.stop(time + dur);
      }
      time += dur;
    });
  } catch {
    // 音声再生エラーは無視
  }
}

/**
 * 実効BGM音量を計算する
 * @returns BGM用の実効音量
 */
function getEffectiveVolume(): number {
  if (currentSettings.isMuted) return 0;
  return currentSettings.masterVolume * currentSettings.bgmVolume;
}

/**
 * BGMを再生する
 * @param type BGMの種類
 */
export function playBgm(type: BgmTypeValue): void {
  // 同じBGMが既に再生中なら何もしない
  if (bgmState.currentType === type && bgmState.isPlaying) return;

  // 既存のBGMを停止
  stopBgm();

  const volume = getEffectiveVolume();
  if (volume <= 0) return;

  if (!isAudioInitialized()) return;

  const config = BGM_CONFIGS[type];

  bgmState.currentType = type;
  bgmState.isPlaying = true;

  // 最初のパターンを再生
  playBgmPattern(config, volume);

  // ループBGMの場合はインターバルで繰り返す
  if (config.loop) {
    const duration = getMelodyDuration(config.melody);
    bgmState.intervalId = window.setInterval(() => {
      const currentVolume = getEffectiveVolume();
      if (currentVolume > 0 && bgmState.isPlaying) {
        playBgmPattern(config, currentVolume);
      }
    }, duration * 1000);
  }
}

/**
 * BGMを停止する
 */
export function stopBgm(): void {
  if (bgmState.intervalId !== undefined) {
    window.clearInterval(bgmState.intervalId);
    bgmState.intervalId = undefined;
  }
  bgmState.currentType = null;
  bgmState.isPlaying = false;
}

/**
 * BGMを一時停止する
 */
export function pauseBgm(): void {
  if (bgmState.intervalId !== undefined) {
    window.clearInterval(bgmState.intervalId);
    bgmState.intervalId = undefined;
  }
  bgmState.isPlaying = false;
}

/**
 * BGMを再開する
 */
export function resumeBgm(): void {
  if (bgmState.currentType && !bgmState.isPlaying) {
    playBgm(bgmState.currentType);
  }
}

/**
 * 現在のBGMタイプを取得する
 * @returns 現在再生中のBGMタイプ、または再生中でない場合はnull
 */
export function getCurrentBgmType(): BgmTypeValue | null {
  return bgmState.isPlaying ? bgmState.currentType : null;
}

/**
 * BGMが再生中かどうかを取得する
 * @returns 再生中の場合true
 */
export function isBgmPlaying(): boolean {
  return bgmState.isPlaying;
}

/**
 * BGM用の音声設定を更新する
 * @param settings 新しい設定
 */
export function updateBgmSettings(settings: Partial<AudioSettings>): void {
  currentSettings = { ...currentSettings, ...settings };

  // ミュート状態が変わった場合の処理
  if (settings.isMuted !== undefined) {
    if (settings.isMuted && bgmState.isPlaying) {
      pauseBgm();
    } else if (!settings.isMuted && bgmState.currentType && !bgmState.isPlaying) {
      resumeBgm();
    }
  }
}

/**
 * BGM状態をリセットする（主にテスト用）
 */
export function resetBgmState(): void {
  stopBgm();
  currentSettings = { ...DEFAULT_AUDIO_SETTINGS };
}

// 便利関数: 各BGMを直接呼び出すヘルパー
export const playTitleBgm = () => playBgm(BgmType.TITLE);
export const playGameBgm = () => playBgm(BgmType.GAME);
export const playClearJingle = () => playBgm(BgmType.CLEAR);
export const playGameOverJingle = () => playBgm(BgmType.GAME_OVER);
export const playBossBgm = () => playBgm(BgmType.BOSS);

/**
 * ステージ番号に対応するゲームBGMを再生する
 * @param stageNumber ステージ番号（1〜5）
 */
export const playStageGameBgm = (stageNumber: number) => {
  const bgmType = getStageGameBgmType(stageNumber);
  playBgm(bgmType);
};
