// 落ち物シューティング Audio システム（IIFE シングルトン）

import type { OscillatorType } from './types';

export const Audio = (() => {
  let ctx: AudioContext | null = null;

  const getContext = (): AudioContext | null => {
    if (!ctx) {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) ctx = new AudioContextClass();
      } catch {}
    }
    return ctx;
  };

  const playTone = (
    freq: number,
    duration: number,
    type: OscillatorType = 'square',
    volume: number = 0.2
  ): void => {
    const c = getContext();
    if (!c) return;
    try {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + duration);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + duration);
    } catch {}
  };

  const sequence = (
    notes: number[],
    interval: number,
    type: OscillatorType = 'sine',
    vol: number = 0.2
  ): void => {
    notes.forEach((f, i) => setTimeout(() => playTone(f, 0.1, type, vol), i * interval));
  };

  return {
    shoot: () => playTone(880, 0.08),
    hit: () => playTone(220, 0.08),
    land: () => playTone(120, 0.06, 'triangle'),
    line: () => sequence([523, 659, 784], 50),
    power: () => sequence([440, 660, 880], 30),
    bomb: () => playTone(80, 0.2, 'sawtooth', 0.3),
    over: () => sequence([400, 300, 200], 100, 'sawtooth'),
    win: () => sequence([523, 659, 784, 1047], 80),
    skill: () => sequence([880, 1100, 1320, 1760], 40, 'sine', 0.3),
    charge: () => playTone(660, 0.15, 'sine', 0.15),
  };
})();
