/**
 * Agile Quiz Sugoroku - 音声システム
 * Tone.js を使用した BGM・効果音の管理
 */
import * as Tone from 'tone';

/** 音声システムの初期化状態 */
let isAudioInitialized = false;

/** シンセサイザーインスタンス */
let bgmSynth: Tone.PolySynth | null = null;
let sfxSynth: Tone.Synth | null = null;
let tickSynth: Tone.Synth | null = null;

/** BGMループ */
let bgmLoop: Tone.Loop | null = null;

/**
 * 音声システムを初期化
 * ユーザー操作後に呼び出す必要がある
 */
export function initAudio(): void {
  if (isAudioInitialized) return;

  isAudioInitialized = true;
  Tone.start();

  // BGM用ポリシンセ
  bgmSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: {
      attack: 0.02,
      decay: 0.3,
      sustain: 0.2,
      release: 0.5,
    },
    volume: -18,
  }).toDestination();

  // 効果音用シンセ
  sfxSynth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: {
      attack: 0.01,
      decay: 0.15,
      sustain: 0,
      release: 0.1,
    },
    volume: -10,
  }).toDestination();

  // タイマー音用シンセ
  tickSynth = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: {
      attack: 0.005,
      decay: 0.05,
      sustain: 0,
      release: 0.05,
    },
    volume: -20,
  }).toDestination();
}

/** BGMのメロディシーケンス */
const BGM_NOTES: [string, string][] = [
  ['E4', '8n'], ['G4', '8n'], ['A4', '8n'], ['B4', '8n'],
  ['A4', '8n'], ['G4', '8n'], ['E4', '8n'], ['D4', '8n'],
  ['C4', '8n'], ['D4', '8n'], ['E4', '8n'], ['G4', '8n'],
  ['A4', '4n'], ['G4', '4n'],
  ['E4', '8n'], ['D4', '8n'], ['C4', '8n'], ['D4', '8n'],
  ['E4', '4n'], ['E4', '4n'],
];

/**
 * BGMを再生開始
 */
export function playBgm(): void {
  if (!isAudioInitialized) return;
  stopBgm();

  let noteIndex = 0;
  bgmLoop = new Tone.Loop((time) => {
    const note = BGM_NOTES[noteIndex % BGM_NOTES.length];
    if (bgmSynth) {
      bgmSynth.triggerAttackRelease(note[0], note[1], time);
    }
    noteIndex++;
  }, '8n').start(0);

  Tone.Transport.bpm.value = 130;
  Tone.Transport.start();
}

/**
 * BGMを停止
 */
export function stopBgm(): void {
  if (bgmLoop) {
    bgmLoop.stop();
    bgmLoop.dispose();
    bgmLoop = null;
  }
  Tone.Transport.stop();
  Tone.Transport.cancel();
}

/**
 * 正解効果音を再生
 */
export function playSfxCorrect(): void {
  if (!sfxSynth) return;
  const time = Tone.now();
  sfxSynth.triggerAttackRelease('C5', '16n', time);
  sfxSynth.triggerAttackRelease('E5', '16n', time + 0.08);
  sfxSynth.triggerAttackRelease('G5', '16n', time + 0.16);
}

/**
 * 不正解効果音を再生
 */
export function playSfxIncorrect(): void {
  if (!sfxSynth) return;
  const time = Tone.now();
  sfxSynth.triggerAttackRelease('C3', '8n', time);
  sfxSynth.triggerAttackRelease('B2', '8n', time + 0.15);
}

/**
 * タイマーティック音を再生
 */
export function playSfxTick(): void {
  if (tickSynth) {
    tickSynth.triggerAttackRelease('A5', '32n', Tone.now());
  }
}

/**
 * ゲーム開始効果音を再生
 */
export function playSfxStart(): void {
  if (!sfxSynth) return;
  const time = Tone.now();
  sfxSynth.triggerAttackRelease('C4', '16n', time);
  sfxSynth.triggerAttackRelease('E4', '16n', time + 0.1);
  sfxSynth.triggerAttackRelease('G4', '16n', time + 0.2);
  sfxSynth.triggerAttackRelease('C5', '8n', time + 0.3);
}

/**
 * 結果表示効果音を再生
 */
export function playSfxResult(): void {
  if (!sfxSynth) return;
  const time = Tone.now();
  const notes = ['C4', 'E4', 'G4', 'C5', 'E5', 'G5'];
  notes.forEach((note, i) => {
    sfxSynth!.triggerAttackRelease(note, '8n', time + i * 0.12);
  });
}

/**
 * コンボ効果音を再生
 */
export function playSfxCombo(): void {
  if (!sfxSynth) return;
  const time = Tone.now();
  sfxSynth.triggerAttackRelease('E5', '16n', time);
  sfxSynth.triggerAttackRelease('A5', '16n', time + 0.06);
  sfxSynth.triggerAttackRelease('B5', '16n', time + 0.12);
}
