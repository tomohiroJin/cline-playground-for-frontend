import { CONTENT } from './constants';
import type { SoundName } from './types';

// ==================== AUDIO SERVICE ====================
export const AudioService = {
  ctx: null as AudioContext | null,

  play(type: SoundName, vol = 0.3) {
    try {
      if (!this.ctx)
        this.ctx = new (
          window.AudioContext ||
          (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        )();
      const sound = CONTENT.sounds[type] || CONTENT.sounds.footstep;
      const [freq, wave, dur] = sound;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.frequency.value = freq + (Math.random() - 0.5) * 10;
      osc.type = wave;
      gain.gain.setValueAtTime(vol * 0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
      osc.start();
      osc.stop(this.ctx.currentTime + dur);
    } catch {}
  },
};
