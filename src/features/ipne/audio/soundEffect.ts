/**
 * IPNE 効果音モジュール
 *
 * Web Audio APIを使用して8bit風レトロサウンドを生成
 */

import {
  SoundEffectType,
  SoundEffectTypeValue,
  SoundConfig,
  AudioSettings,
  DEFAULT_AUDIO_SETTINGS,
} from '../types';
import { getAudioContext, isAudioInitialized } from './audioContext';

/** 効果音設定マップ */
const SOUND_CONFIGS: Record<SoundEffectTypeValue, SoundConfig> = {
  // ★★★ 高優先度
  [SoundEffectType.PLAYER_DAMAGE]: {
    frequency: 200,
    type: 'sawtooth',
    duration: 0.2,
    gain: 0.5,
    sweep: 80,
  },
  [SoundEffectType.ENEMY_KILL]: {
    frequency: 400,
    type: 'square',
    duration: 0.15,
    gain: 0.45,
    sweep: 800,
  },
  [SoundEffectType.BOSS_KILL]: {
    frequency: 523,
    type: 'square',
    duration: 0.5,
    gain: 0.5,
  },
  [SoundEffectType.GAME_CLEAR]: {
    frequency: 523,
    type: 'sine',
    duration: 0.5,
    gain: 0.5,
  },
  [SoundEffectType.GAME_OVER]: {
    frequency: 300,
    type: 'sawtooth',
    duration: 0.4,
    gain: 0.45,
    sweep: 100,
  },
  [SoundEffectType.LEVEL_UP]: {
    frequency: 440,
    type: 'sine',
    duration: 0.3,
    gain: 0.5,
  },
  // ★★ 中優先度
  [SoundEffectType.ATTACK_HIT]: {
    frequency: 600,
    type: 'square',
    duration: 0.08,
    gain: 0.4,
  },
  [SoundEffectType.ITEM_PICKUP]: {
    frequency: 800,
    type: 'sine',
    duration: 0.1,
    gain: 0.35,
    sweep: 1200,
  },
  [SoundEffectType.HEAL]: {
    frequency: 600,
    type: 'sine',
    duration: 0.15,
    gain: 0.35,
    sweep: 900,
  },
  // 罠発動音: 警告感のある不快な音
  [SoundEffectType.TRAP_TRIGGERED]: {
    frequency: 150,
    type: 'sawtooth',
    duration: 0.15,
    gain: 0.45,
    sweep: 300,
  },
};

/** ゲームクリア時のメロディ */
const CLEAR_MELODY: readonly [number, number][] = [
  [523, 0.12], // C5
  [587, 0.12], // D5
  [659, 0.12], // E5
  [698, 0.12], // F5
  [784, 0.2],  // G5
  [0, 0.08],   // 休符
  [784, 0.12], // G5
  [880, 0.12], // A5
  [988, 0.12], // B5
  [1047, 0.35], // C6
];

/** ゲームオーバー時のメロディ */
const GAME_OVER_MELODY: readonly [number, number][] = [
  [392, 0.25], // G4
  [349, 0.25], // F4
  [330, 0.25], // E4
  [294, 0.35], // D4
  [0, 0.15],   // 休符
  [262, 0.2],  // C4
  [247, 0.2],  // B3
  [220, 0.3],  // A3
  [0, 0.1],    // 休符
  [196, 0.5],  // G3
];

/** レベルアップ時のメロディ */
const LEVEL_UP_MELODY: readonly [number, number][] = [
  [523, 0.1],  // C5
  [659, 0.1],  // E5
  [784, 0.1],  // G5
  [1047, 0.15], // C6
  [0, 0.05],   // 休符
  [1047, 0.1], // C6
  [1175, 0.2], // D6
];

/** ボス撃破時のメロディ（勝利のファンファーレ風） */
const BOSS_KILL_MELODY: readonly [number, number][] = [
  [523, 0.12],  // C5
  [659, 0.12],  // E5
  [784, 0.12],  // G5
  [1047, 0.25], // C6
  [0, 0.05],    // 休符
  [784, 0.1],   // G5
  [1047, 0.3],  // C6
];

/** 現在の音声設定 */
let currentSettings: AudioSettings = { ...DEFAULT_AUDIO_SETTINGS };

/**
 * 単音を再生する
 * @param config 音設定
 * @param startTime 再生開始時間
 * @param volumeMultiplier 音量倍率
 */
function playTone(
  config: SoundConfig,
  startTime: number,
  volumeMultiplier: number
): void {
  const ctx = getAudioContext();
  if (!ctx || !isAudioInitialized()) return;

  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = config.type;
    osc.frequency.setValueAtTime(config.frequency, startTime);

    // スウィープがある場合は周波数を変化させる
    if (config.sweep !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        config.sweep,
        startTime + config.duration
      );
    }

    const volume = config.gain * volumeMultiplier;
    gainNode.gain.setValueAtTime(volume, startTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      startTime + config.duration * 0.9
    );

    osc.start(startTime);
    osc.stop(startTime + config.duration);
  } catch {
    // 音声再生エラーは無視
  }
}

/**
 * メロディを再生する
 * @param melody メロディノート配列
 * @param volumeMultiplier 音量倍率
 * @param oscillatorType 波形タイプ
 */
function playMelody(
  melody: readonly [number, number][],
  volumeMultiplier: number,
  oscillatorType: OscillatorType = 'sine'
): void {
  const ctx = getAudioContext();
  if (!ctx || !isAudioInitialized()) return;

  try {
    let time = ctx.currentTime;

    melody.forEach(([freq, dur]) => {
      if (freq > 0) {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.type = oscillatorType;
        osc.frequency.setValueAtTime(freq, time);

        gainNode.gain.setValueAtTime(volumeMultiplier * 0.25, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.9);

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
 * 実効音量を計算する
 * @returns SE用の実効音量
 */
function getEffectiveVolume(): number {
  if (currentSettings.isMuted) return 0;
  return currentSettings.masterVolume * currentSettings.seVolume;
}

/**
 * 効果音を再生する
 * @param type 効果音の種類
 */
export function playSoundEffect(type: SoundEffectTypeValue): void {
  const volume = getEffectiveVolume();
  if (volume <= 0) return;

  const ctx = getAudioContext();
  if (!ctx || !isAudioInitialized()) return;

  // 特殊なメロディを持つ効果音はメロディで再生
  if (type === SoundEffectType.GAME_CLEAR) {
    playMelody(CLEAR_MELODY, volume, 'square');
    return;
  }

  if (type === SoundEffectType.GAME_OVER) {
    playMelody(GAME_OVER_MELODY, volume, 'sawtooth');
    return;
  }

  if (type === SoundEffectType.LEVEL_UP) {
    playMelody(LEVEL_UP_MELODY, volume, 'sine');
    return;
  }

  if (type === SoundEffectType.BOSS_KILL) {
    playMelody(BOSS_KILL_MELODY, volume, 'square');
    return;
  }

  // 単音効果音
  const config = SOUND_CONFIGS[type];
  playTone(config, ctx.currentTime, volume);
}

/**
 * 音声設定を更新する
 * @param settings 新しい設定
 */
export function updateSoundSettings(settings: Partial<AudioSettings>): void {
  currentSettings = { ...currentSettings, ...settings };
}

/**
 * 現在の音声設定を取得する
 * @returns 現在の音声設定
 */
export function getSoundSettings(): AudioSettings {
  return { ...currentSettings };
}

/**
 * 音声設定をリセットする（主にテスト用）
 */
export function resetSoundSettings(): void {
  currentSettings = { ...DEFAULT_AUDIO_SETTINGS };
}

// 便利関数: 各効果音を直接呼び出すヘルパー
export const playPlayerDamageSound = () => playSoundEffect(SoundEffectType.PLAYER_DAMAGE);
export const playEnemyKillSound = () => playSoundEffect(SoundEffectType.ENEMY_KILL);
export const playBossKillSound = () => playSoundEffect(SoundEffectType.BOSS_KILL);
export const playGameClearSound = () => playSoundEffect(SoundEffectType.GAME_CLEAR);
export const playGameOverSound = () => playSoundEffect(SoundEffectType.GAME_OVER);
export const playLevelUpSound = () => playSoundEffect(SoundEffectType.LEVEL_UP);
export const playAttackHitSound = () => playSoundEffect(SoundEffectType.ATTACK_HIT);
export const playItemPickupSound = () => playSoundEffect(SoundEffectType.ITEM_PICKUP);
export const playHealSound = () => playSoundEffect(SoundEffectType.HEAL);
export const playTrapTriggeredSound = () => playSoundEffect(SoundEffectType.TRAP_TRIGGERED);
