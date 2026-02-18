/**
 * 原始進化録 - PRIMAL PATH - Web Audio SFX エンジン
 */
import { SFX_DEFS } from './constants';
import type { SfxType } from './types';

let ac: AudioContext | null = null;

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

export const AudioEngine = Object.freeze({
  init: () => initAudio(),
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
    g.gain.setValueAtTime(def.g, t);
    const step = def.fd / (def.f.length - 1 || 1);
    def.f.forEach((freq, i) => {
      if (i === 0) o.frequency.setValueAtTime(freq, t);
      else o.frequency.exponentialRampToValueAtTime(freq, t + step * i);
    });
    g.gain.exponentialRampToValueAtTime(0.001, t + def.gd);
    o.start(t);
    o.stop(t + def.gd + 0.02);
  },
});
