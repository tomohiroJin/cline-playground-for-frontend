import { SoundSystem } from './types';

export const createSoundSystem = (): SoundSystem => {
  let audioCtx: AudioContext | null = null;
  let bgmInterval: ReturnType<typeof setInterval> | null = null;
  let bgmGain: GainNode | null = null;
  let bgmTempo = 1.0;
  let bgmNoteIndex = 0;
  let bgmVolume = 0.15;
  let seVolume = 1.0;
  let isMuted = false;

  const getContext = () => {
    const w = window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };
    const AudioContextClass = w.AudioContext || w.webkitAudioContext;
    if (!audioCtx && AudioContextClass) audioCtx = new AudioContextClass();
    // ブラウザの autoplay policy 対応: suspended 状態なら resume
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  };

  const playTone = (freq: number, type: OscillatorType, duration: number, volume = 0.3) => {
    try {
      if (isMuted) return;
      const ctx = getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.value = freq;
      const adjustedVolume = volume * seVolume;
      gain.gain.setValueAtTime(adjustedVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      /* Audio not supported */
    }
  };

  const playSequence = (notes: [number, OscillatorType, number, number][]) => {
    notes.forEach(([freq, type, dur, vol], i) => {
      setTimeout(() => playTone(freq, type, dur, vol), i * 100);
    });
  };

  // BGM メロディパターン
  const BGM_NOTES = [
    262, 330, 392, 330, 349, 392, 440, 392,
    330, 349, 392, 330, 262, 330, 392, 440,
  ];

  // BGM の1ノート再生（共通ロジック）
  const playBgmNote = () => {
    const ctx = getContext();
    if (!ctx || !bgmGain) return;
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();
    osc.connect(noteGain);
    noteGain.connect(bgmGain);
    osc.type = 'triangle';
    osc.frequency.value = BGM_NOTES[bgmNoteIndex % BGM_NOTES.length];
    const noteDuration = 0.19 / bgmTempo;
    noteGain.gain.setValueAtTime(0.3, ctx.currentTime);
    noteGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + noteDuration);
    osc.start();
    osc.stop(ctx.currentTime + noteDuration);
    bgmNoteIndex++;
  };

  // BGM インターバルを（再）開始
  const startBgmInterval = () => {
    if (bgmInterval) clearInterval(bgmInterval);
    bgmInterval = setInterval(playBgmNote, 200 / bgmTempo);
  };

  const startBgm = () => {
    try {
      if (isMuted) return;
      const ctx = getContext();
      if (!ctx || bgmInterval) return;

      bgmGain = ctx.createGain();
      bgmGain.connect(ctx.destination);
      bgmGain.gain.value = bgmVolume;
      bgmNoteIndex = 0;

      playBgmNote();
      startBgmInterval();
    } catch {
      /* Audio not supported */
    }
  };

  const stopBgm = () => {
    if (bgmInterval) {
      clearInterval(bgmInterval);
      bgmInterval = null;
    }
    bgmGain = null;
  };

  const setBgmTempo = (tempo: number) => {
    bgmTempo = tempo;
    if (bgmInterval) {
      startBgmInterval();
    }
  };

  return {
    // 速度に応じたヒット音
    hit: (speed = 0) => {
      const freq = 800 + Math.min(speed, 10) * 40;
      const vol = 0.15 + Math.min(speed, 10) * 0.02;
      playTone(freq, 'square', 0.05, vol);
    },
    // 角度に応じた壁バウンス音
    wall: (angle = 0) => {
      const freq = 400 + Math.abs(angle) * 50;
      playTone(freq, 'triangle', 0.05, 0.15);
    },
    item: () => playTone(1000, 'sine', 0.1, 0.25),
    goal: () =>
      playSequence([
        [523, 'sine', 0.15, 0.3],
        [659, 'sine', 0.15, 0.3],
        [784, 'sine', 0.2, 0.3],
      ]),
    lose: () =>
      playSequence([
        [400, 'sine', 0.2, 0.3],
        [300, 'sine', 0.3, 0.3],
      ]),
    start: () =>
      playSequence([
        [440, 'sine', 0.1, 0.2],
        [554, 'sine', 0.1, 0.2],
        [659, 'sine', 0.15, 0.2],
      ]),
    countdown: () => playTone(600, 'sine', 0.15, 0.25),
    go: () =>
      playSequence([
        [523, 'sine', 0.1, 0.3],
        [784, 'sine', 0.2, 0.35],
      ]),
    bgmStart: startBgm,
    bgmStop: stopBgm,
    bgmSetTempo: setBgmTempo,
    // 音量制御メソッド（0〜100 のパーセンテージ）
    setBgmVolume: (volume: number) => {
      bgmVolume = (volume / 100) * 0.8;
      if (bgmGain) bgmGain.gain.value = bgmVolume;
    },
    setSeVolume: (volume: number) => {
      seVolume = volume / 100;
    },
    setMuted: (muted: boolean) => {
      isMuted = muted;
      if (muted && bgmInterval) stopBgm();
    },
  };
};
