// ============================================================================
// Deep Sea Interceptor - オーディオシステム
// ============================================================================

import type { SoundDef } from './types';

/** サウンド定義マップ */
const soundDefs: Record<string, SoundDef> = {
  shot: { f: 80, w: 'sine', g: 0.08, d: 0.06 },
  charged: { f: 60, w: 'triangle', g: 0.12, d: 0.2 },
  destroy: { f: 120, w: 'sawtooth', g: 0.07, d: 0.12, ef: 30 },
  hit: { f: 100, w: 'square', g: 0.1, d: 0.08 },
  item: { f: 440, w: 'sine', g: 0.1, d: 0.15 },
  bomb: { f: 60, w: 'sawtooth', g: 0.15, d: 0.4, ef: 20 },
  graze: { f: 600, w: 'sine', g: 0.05, d: 0.05 },
  bossPhaseChange: { f: 200, w: 'triangle', g: 0.1, d: 0.3, ef: 400 },
  warning: { f: 200, w: 'square', g: 0.12, d: 0.8, ef: 100 },
  warningSiren: { f: 200, w: 'sawtooth', g: 0.1, d: 0.6, ef: 800 },
  testModeActivated: { f: 440, w: 'sine', g: 0.12, d: 0.4, ef: 880 },
  bossAppear: { f: 80, w: 'sawtooth', g: 0.12, d: 0.4, ef: 40 },
  stageClear: { f: 440, w: 'sine', g: 0.1, d: 0.5, ef: 880 },
  achievement: { f: 660, w: 'sine', g: 0.08, d: 0.3, ef: 880 },
};

/** Web Audio API ベースのサウンドシステムを生成 */
export const createAudioSystem = () => {
  let ctx: AudioContext | null = null;

  const init = () => {
    if (ctx) return ctx;
    if (typeof window === 'undefined') return null;

    const Ctor =
      window.AudioContext ||
      (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctor) ctx = new Ctor();
    return ctx;
  };

  const play = (name: string) => {
    if (!ctx) return;
    const d = soundDefs[name];
    if (!d) return;
    try {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      const t = ctx.currentTime;
      o.frequency.value = d.f;
      o.type = d.w;
      g.gain.setValueAtTime(d.g, t);
      g.gain.exponentialRampToValueAtTime(0.01, t + d.d);
      if (d.ef) o.frequency.exponentialRampToValueAtTime(d.ef, t + d.d);
      o.start(t);
      o.stop(t + d.d);
    } catch {
      // オーディオ再生エラーは無視
    }
  };

  /** 警告サイレンシーケンスを再生（パルス3回 + スイープ） */
  const playWarningSiren = () => {
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      // パルス音×3
      for (let i = 0; i < 3; i++) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.value = 200;
        o.type = 'square';
        const start = t + i * 0.5;
        g.gain.setValueAtTime(0.1, start);
        g.gain.exponentialRampToValueAtTime(0.01, start + 0.3);
        o.start(start);
        o.stop(start + 0.3);
      }
      // スイープ音
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = 200;
      o.type = 'sawtooth';
      const sweepStart = t + 1.5;
      g.gain.setValueAtTime(0.1, sweepStart);
      g.gain.exponentialRampToValueAtTime(0.01, sweepStart + 0.5);
      o.frequency.exponentialRampToValueAtTime(800, sweepStart + 0.5);
      o.start(sweepStart);
      o.stop(sweepStart + 0.5);
    } catch {
      // オーディオ再生エラーは無視
    }
  };

  return { init, play, playWarningSiren };
};
