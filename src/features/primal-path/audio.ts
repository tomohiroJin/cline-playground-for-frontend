/**
 * 原始進化録 - PRIMAL PATH - Web Audio SFX / BGM エンジン
 */
import { SFX_DEFS, BGM_PATTERNS, VOLUME_KEY } from './constants';
import type { SfxType, BgmType } from './types';

let ac: AudioContext | null = null;

/** SFX 音量（0〜1） */
let sfxVolume = 1.0;

function initAudio(): AudioContext | null {
  if (!ac) {
    try {
      ac = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  // suspended 状態の AudioContext を再開（ブラウザの自動再生ポリシー対応）
  if (ac.state === 'suspended') {
    ac.resume().catch(() => { /* ignore */ });
  }
  return ac;
}

/** localStorage から音量設定を読み込み */
function loadVolumes(): { sfx: number; bgm: number } {
  try {
    const raw = localStorage.getItem(VOLUME_KEY);
    if (raw) {
      const v = JSON.parse(raw) as { sfx?: number; bgm?: number };
      return { sfx: v.sfx ?? 1.0, bgm: v.bgm ?? 0.5 };
    }
  } catch { /* ignore */ }
  return { sfx: 1.0, bgm: 0.5 };
}

/** localStorage に音量設定を保存 */
function saveVolumes(sfx: number, bgm: number): void {
  try {
    localStorage.setItem(VOLUME_KEY, JSON.stringify({ sfx, bgm }));
  } catch { /* ignore */ }
}

/** 効果音エンジン（Web Audio API） */
export const AudioEngine = Object.freeze({
  /** AudioContext を初期化し、保存済みの音量設定を復元する */
  init: () => {
    const ctx = initAudio();
    const v = loadVolumes();
    sfxVolume = v.sfx;
    BgmEngine.setVolume(v.bgm);
    return ctx;
  },
  /** 指定タイプの効果音を再生する */
  play: (type: SfxType): void => {
    // 音量0なら再生をスキップ
    if (sfxVolume === 0) return;
    const ctx = initAudio();
    if (!ctx) return;
    const def = SFX_DEFS[type];
    if (!def) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const t = ctx.currentTime;
    o.connect(g);
    g.connect(ctx.destination);
    o.type = def.w;
    // exponentialRamp は 0 からの遷移が不定のため最小値を保証
    g.gain.setValueAtTime(Math.max(0.001, def.g * sfxVolume), t);
    const step = def.fd / (def.f.length - 1 || 1);
    def.f.forEach((freq, i) => {
      if (i === 0) o.frequency.setValueAtTime(freq, t);
      else o.frequency.exponentialRampToValueAtTime(freq, t + step * i);
    });
    g.gain.exponentialRampToValueAtTime(0.001, t + def.gd);
    o.start(t);
    o.stop(t + def.gd + 0.02);
    // 再生終了後にオーディオグラフから切断
    o.onended = () => { o.disconnect(); g.disconnect(); };
  },
  /** SFX 音量を設定し localStorage に永続化する（0〜1） */
  setSfxVolume: (v: number): void => {
    sfxVolume = Math.max(0, Math.min(1, v));
    saveVolumes(sfxVolume, bgmVolume);
  },
  /** 現在の SFX 音量を返す */
  getSfxVolume: (): number => sfxVolume,
});

/* ===== BGM エンジン ===== */

let bgmVolume = 0.5;
let bgmTimerId: ReturnType<typeof setInterval> | null = null;
let bgmPlaying = false;
let bgmOsc: OscillatorNode | null = null;
let bgmNoteIndex = 0;
let bgmCurrentType: BgmType | null = null;

/** BGM の1音を再生 */
function playBgmNote(ctx: AudioContext, freq: number, duration: number, wave: OscillatorType, gain: number): void {
  // 前の音を停止
  if (bgmOsc) {
    try { bgmOsc.stop(); } catch { /* already stopped */ }
  }

  const o = ctx.createOscillator();
  const g = ctx.createGain();
  const t = ctx.currentTime;

  o.connect(g);
  g.connect(ctx.destination);
  o.type = wave;
  o.frequency.setValueAtTime(freq, t);

  // フェードイン/アウトで滑らかに
  const noteDur = duration / 1000 * 0.8;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain * bgmVolume, t + 0.02);
  g.gain.linearRampToValueAtTime(0, t + noteDur);

  o.start(t);
  o.stop(t + noteDur + 0.05);
  // 再生終了後にオーディオグラフから切断
  o.onended = () => { o.disconnect(); g.disconnect(); };

  bgmOsc = o;
}

/** BGM エンジン（Web Audio API によるパターン再生） */
export const BgmEngine = Object.freeze({
  /** AudioContext を初期化する */
  init: () => initAudio(),

  /** 指定タイプの BGM をループ再生する（同タイプ再生中はスキップ） */
  play: (type: BgmType): void => {
    // 同じBGMなら何もしない
    if (bgmPlaying && bgmCurrentType === type) return;

    // 停止してから新しいBGMを開始
    BgmEngine.stop();

    const ctx = initAudio();
    if (!ctx) return;

    const pattern = BGM_PATTERNS[type];
    if (!pattern) return;

    bgmPlaying = true;
    bgmCurrentType = type;
    bgmNoteIndex = 0;

    // 最初の音を即再生
    playBgmNote(ctx, pattern.notes[0], pattern.tempo, pattern.wave, pattern.gain);

    // インターバルでループ再生
    bgmTimerId = setInterval(() => {
      if (!bgmPlaying) {
        if (bgmTimerId) clearInterval(bgmTimerId);
        bgmTimerId = null;
        return;
      }
      const c = initAudio();
      if (!c) return;
      bgmNoteIndex = (bgmNoteIndex + 1) % pattern.notes.length;
      playBgmNote(c, pattern.notes[bgmNoteIndex], pattern.tempo, pattern.wave, pattern.gain);
    }, pattern.tempo);
  },

  /** BGM を停止する */
  stop: (): void => {
    bgmPlaying = false;
    bgmCurrentType = null;
    if (bgmTimerId) {
      clearInterval(bgmTimerId);
      bgmTimerId = null;
    }
    if (bgmOsc) {
      try { bgmOsc.stop(); } catch { /* already stopped */ }
      bgmOsc = null;
    }
  },

  /** BGM 音量を設定し localStorage に永続化する（0〜1） */
  setVolume: (v: number): void => {
    bgmVolume = Math.max(0, Math.min(1, v));
    saveVolumes(sfxVolume, bgmVolume);
  },

  /** 現在の BGM 音量を返す */
  getVolume: (): number => bgmVolume,

  /** BGM が再生中かどうかを返す */
  isPlaying: (): boolean => bgmPlaying,

  /** 現在再生中の BGM タイプを返す（停止中は null） */
  getCurrentType: (): BgmType | null => bgmCurrentType,
});
