// Racing Game サウンドエンジン

import { Config } from './constants';
import { Utils } from './utils';

export const SoundEngine = (() => {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let volume = Config.audio.defaultVolume;
  let muted = false;
  let engineOsc: OscillatorNode | null = null;
  let engineGain: GainNode | null = null;
  const pendingTimeouts = new Set<NodeJS.Timeout>();

  const getCtx = () => {
    if (!ctx) {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return null;
        ctx = new AudioContextClass();
        master = ctx!.createGain();
        master.connect(ctx!.destination);
        master.gain.value = volume;
      } catch {
        return null;
      }
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  };

  const tone = (freq: number, dur: number, type: OscillatorType = 'square', vol = 1) => {
    if (muted) return;
    const c = getCtx();
    if (!c) return;
    try {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.value = Utils.clamp(freq, 20, 20000);
      g.gain.value = Utils.clamp(volume * vol, 0, 1);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      o.connect(g);
      g!.connect(master!);
      o.start(c.currentTime);
      o.stop(c.currentTime + dur);
    } catch {}
  };

  const sequence = (
    freqs: number[],
    interval: number,
    type: OscillatorType = 'square',
    vol = 1
  ) => {
    if (!Array.isArray(freqs)) return;
    freqs.forEach((f, i) => {
      const id = setTimeout(
        () => {
          tone(f, interval * 0.9, type, vol);
          pendingTimeouts.delete(id);
        },
        i * interval * 1000
      );
      pendingTimeouts.add(id);
    });
  };

  const noise = (dur: number, vol = 0.3) => {
    if (muted) return;
    const c = getCtx();
    if (!c) return;
    try {
      const size = Math.min(c.sampleRate * dur, c.sampleRate * 2);
      const buf = c.createBuffer(1, size, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource();
      const g = c.createGain();
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 500;
      src.buffer = buf;
      g.gain.value = Utils.clamp(volume * vol, 0, 1);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      src.connect(f);
      f.connect(g);
      g.connect(master!);
      src.start();
    } catch {}
  };

  const F = Config.audio.freq;

  return {
    collision: () => {
      tone(F.collision[0], 0.1, 'sawtooth', 0.4);
      setTimeout(() => tone(F.collision[1], 0.15, 'sawtooth', 0.3), 50);
      noise(0.15, 0.2);
    },
    wall: () => {
      tone(F.wall[0], 0.08, 'square', 0.3);
      noise(0.1, 0.15);
    },
    lap: () => sequence(F.lap, 0.12, 'sine', 0.5),
    finalLap: () => {
      sequence(F.finalLap, 0.15, 'sine', 0.6);
      setTimeout(() => sequence(F.finalLap, 0.15, 'sine', 0.4), 500);
    },
    countdown: () => tone(F.countdown[0], 0.15, 'sine', 0.5),
    go: () => sequence(F.go, 0.1, 'sine', 0.6),
    finish: () => {
      sequence(F.finish, 0.2, 'sine', 0.5);
      setTimeout(() => sequence([...F.finish].reverse(), 0.15, 'triangle', 0.4), 800);
    },
    checkpoint: () => sequence(F.checkpoint, 0.08, 'sine', 0.3),

    // ドリフト音
    driftStart: () => noise(0.3, 0.25),
    driftBoost: () => {
      tone(600, 0.15, 'sawtooth', 0.4);
      setTimeout(() => tone(800, 0.15, 'sawtooth', 0.3), 80);
    },

    // HEAT 音
    heatMax: () => sequence([880, 1100, 1320], 0.08, 'sine', 0.5),
    heatBoost: () => {
      tone(400, 0.2, 'sawtooth', 0.4);
      setTimeout(() => tone(600, 0.2, 'sawtooth', 0.3), 100);
      setTimeout(() => tone(800, 0.15, 'sawtooth', 0.3), 200);
    },

    // 段階的壁ヒット音（wallStage: 1=軽 / 2=中 / 3=強）
    wallStaged: (stage: number) => {
      const vol = stage === 1 ? 0.15 : stage === 2 ? 0.25 : 0.4;
      tone(F.wall[0], 0.08, 'square', vol);
      noise(0.1, vol * 0.5);
    },

    startEngine: () => {
      if (muted || engineOsc) return;
      const c = getCtx();
      if (!c) return;
      try {
        engineOsc = c.createOscillator();
        engineGain = c.createGain();
        engineOsc.type = 'sawtooth';
        engineOsc.frequency.value = F.engine[0];
        engineGain.gain.value = volume * 0.08;
        engineOsc.connect(engineGain);
        engineGain.connect(master!);
        engineOsc.start();
      } catch {}
    },

    updateEngine: (spd: number) => {
      if (engineOsc && engineGain) {
        engineOsc.frequency.value = F.engine[0] + Utils.clamp(spd, 0, 2) * 60;
        engineGain.gain.value = volume * (0.05 + Utils.clamp(spd, 0, 2) * 0.05);
      }
    },

    stopEngine: () => {
      try {
        engineOsc?.stop();
      } catch {}
      engineOsc = null;
      engineGain = null;
    },

    setVolume: (v: number) => {
      volume = Utils.clamp(v, Config.audio.minVolume, Config.audio.maxVolume);
      if (master) master.gain.value = muted ? 0 : volume;
      if (engineGain) engineGain.gain.value = volume * 0.08;
    },

    getVolume: () => volume,
    toggleMute: () => {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : volume;
      return muted;
    },
    isMuted: () => muted,

    cleanup: () => {
      pendingTimeouts.forEach(id => clearTimeout(id));
      pendingTimeouts.clear();
      try {
        engineOsc?.stop();
      } catch {}
      engineOsc = null;
      engineGain = null;
    },
  };
})();
