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
      /* audio not available */
    }
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

export const AudioEngine = Object.freeze({
  init: () => {
    const ctx = initAudio();
    const v = loadVolumes();
    sfxVolume = v.sfx;
    BgmEngine.setVolume(v.bgm);
    return ctx;
  },
  play: (type: SfxType): void => {
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
    g.gain.setValueAtTime(def.g * sfxVolume, t);
    const step = def.fd / (def.f.length - 1 || 1);
    def.f.forEach((freq, i) => {
      if (i === 0) o.frequency.setValueAtTime(freq, t);
      else o.frequency.exponentialRampToValueAtTime(freq, t + step * i);
    });
    g.gain.exponentialRampToValueAtTime(0.001, t + def.gd);
    o.start(t);
    o.stop(t + def.gd + 0.02);
  },
  setSfxVolume: (v: number): void => {
    sfxVolume = Math.max(0, Math.min(1, v));
    saveVolumes(sfxVolume, bgmVolume);
  },
  getSfxVolume: (): number => sfxVolume,
});

/* ===== BGM エンジン ===== */

let bgmVolume = 0.5;
let bgmTimerId: ReturnType<typeof setInterval> | null = null;
let bgmPlaying = false;
let bgmOsc: OscillatorNode | null = null;
let bgmGain: GainNode | null = null;
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

  bgmOsc = o;
  bgmGain = g;
}

export const BgmEngine = Object.freeze({
  init: () => initAudio(),

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
    bgmGain = null;
  },

  setVolume: (v: number): void => {
    bgmVolume = Math.max(0, Math.min(1, v));
    saveVolumes(sfxVolume, bgmVolume);
  },

  getVolume: (): number => bgmVolume,

  isPlaying: (): boolean => bgmPlaying,

  getCurrentType: (): BgmType | null => bgmCurrentType,
});
