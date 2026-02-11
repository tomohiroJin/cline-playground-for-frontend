export interface AudioController {
  unlock(): void;
  tick(): void;
  hit(): void;
  clear(): void;
  destroy(): void;
}

function createTone(ctx: AudioContext, frequency: number, duration: number, volume: number): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'square';
  osc.frequency.value = frequency;

  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export function createAudioController(enabled = true): AudioController {
  let ctx: AudioContext | null = null;

  const ensureContext = (): AudioContext | null => {
    if (!enabled) {
      return null;
    }
    if (!ctx) {
      const Ctor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) {
        return null;
      }
      ctx = new Ctor();
    }
    return ctx;
  };

  return {
    unlock(): void {
      const audioContext = ensureContext();
      if (audioContext?.state === 'suspended') {
        void audioContext.resume();
      }
    },
    tick(): void {
      const audioContext = ensureContext();
      if (!audioContext) {
        return;
      }
      createTone(audioContext, 640, 0.03, 0.02);
    },
    hit(): void {
      const audioContext = ensureContext();
      if (!audioContext) {
        return;
      }
      createTone(audioContext, 180, 0.08, 0.05);
    },
    clear(): void {
      const audioContext = ensureContext();
      if (!audioContext) {
        return;
      }
      createTone(audioContext, 940, 0.06, 0.03);
    },
    destroy(): void {
      if (ctx) {
        void ctx.close();
      }
      ctx = null;
    },
  };
}
