type SoundConfig = {
  freq: number;
  type: OscillatorType;
  dur: number;
  gain: number;
  sweep?: number;
};

type MelodyNote = readonly [number, number];

type WebkitWindow = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

const getAudioContextConstructor = (): typeof AudioContext | undefined => {
  const w = window as WebkitWindow;
  return w.AudioContext ?? w.webkitAudioContext;
};

export const Audio = (() => {
  let ctx: AudioContext | undefined;
  let bgmIv: number | undefined;
  const sounds: Record<string, SoundConfig> = {
    jump: { freq: 440, type: 'square', dur: 0.1, gain: 0.15 },
    score: { freq: 880, type: 'sine', dur: 0.15, gain: 0.12 },
    hit: { freq: 220, type: 'sawtooth', dur: 0.2, gain: 0.15 },
    death: { freq: 150, type: 'sawtooth', dur: 0.4, gain: 0.2, sweep: 50 },
    enemyKill: { freq: 660, type: 'square', dur: 0.12, gain: 0.1 },
    rampChange: { freq: 330, type: 'triangle', dur: 0.08, gain: 0.08 },
    countdown: { freq: 440, type: 'square', dur: 0.15, gain: 0.12 },
    countdownGo: { freq: 880, type: 'square', dur: 0.3, gain: 0.15 },
    nearMiss: { freq: 1200, type: 'sine', dur: 0.08, gain: 0.1 },
  };
  const melodies: Record<string, MelodyNote[]> = {
    clear: [
      [523, 0.15],
      [587, 0.15],
      [659, 0.15],
      [698, 0.15],
      [784, 0.2],
      [0, 0.1],
      [784, 0.15],
      [880, 0.15],
      [988, 0.15],
      [1047, 0.4],
      [0, 0.1],
      [1047, 0.15],
      [988, 0.15],
      [1047, 0.5],
    ],
    gameOver: [
      [494, 0.25],
      [466, 0.25],
      [440, 0.25],
      [392, 0.35],
      [0, 0.15],
      [330, 0.2],
      [294, 0.2],
      [262, 0.3],
      [0, 0.1],
      [196, 0.15],
      [0, 0.05],
      [196, 0.15],
      [0, 0.1],
      [131, 0.6],
    ],
    gameOverScreen: [
      [262, 0.4],
      [247, 0.4],
      [220, 0.4],
      [196, 0.6],
      [0, 0.2],
      [131, 0.3],
      [165, 0.3],
      [131, 0.8],
    ],
    title: [
      [523, 0.12],
      [0, 0.03],
      [523, 0.12],
      [0, 0.1],
      [523, 0.12],
      [0, 0.1],
      [415, 0.12],
      [523, 0.25],
      [0, 0.1],
      [659, 0.35],
    ],
    start: [
      [523, 0.1],
      [659, 0.1],
      [784, 0.1],
      [1047, 0.2],
    ],
    rankReveal: [
      [392, 0.1],
      [0, 0.05],
      [494, 0.1],
      [0, 0.05],
      [587, 0.1],
      [0, 0.05],
      [784, 0.3],
    ],
  };
  const bgm: MelodyNote[] = [
    [131, 0.12],
    [0, 0.13],
    [165, 0.12],
    [0, 0.13],
    [196, 0.12],
    [0, 0.13],
    [165, 0.12],
    [0, 0.13],
  ];

  const getCtx = (): AudioContext | undefined => {
    const Ctx = getAudioContextConstructor();
    if (!Ctx) return undefined;
    if (!ctx) {
      ctx = new Ctx();
    }
    return ctx;
  };

  const playNote = (
    context: AudioContext,
    freq: number,
    type: OscillatorType,
    dur: number,
    gain: number,
    time: number
  ): void => {
    const osc = context.createOscillator();
    const g = context.createGain();
    osc.connect(g);
    g.connect(context.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    g.gain.setValueAtTime(gain, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.9);
    osc.start(time);
    osc.stop(time + dur);
  };

  return Object.freeze({
    init: () => getCtx(),
    play: (type: string): void => {
      try {
        const context = getCtx();
        if (!context) return;
        const sound = sounds[type] ?? sounds.hit;
        const osc = context.createOscillator();
        const g = context.createGain();
        osc.connect(g);
        g.connect(context.destination);
        osc.type = sound.type;
        osc.frequency.setValueAtTime(sound.freq, context.currentTime);
        if (sound.sweep !== undefined) {
          osc.frequency.exponentialRampToValueAtTime(sound.sweep, context.currentTime + sound.dur);
        }
        g.gain.setValueAtTime(sound.gain, context.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, context.currentTime + sound.dur);
        osc.start(context.currentTime);
        osc.stop(context.currentTime + sound.dur);
      } catch {
        return;
      }
    },
    playMelody: (name: string): void => {
      try {
        const context = getCtx();
        if (!context) return;
        const melody = melodies[name];
        if (!melody) return;
        let time = context.currentTime;
        melody.forEach(([note, duration]) => {
          if (note > 0) playNote(context, note, 'square', duration, 0.12, time);
          time += duration;
        });
      } catch {
        return;
      }
    },
    playCombo: (level: number): void => {
      try {
        const context = getCtx();
        if (!context) return;
        const base = 440 + level * 100;
        [0, 0.08].forEach((offset, index) =>
          playNote(context, base + index * 200, 'square', 0.12, 0.1, context.currentTime + offset)
        );
      } catch {
        return;
      }
    },
    startBGM: (): void => {
      try {
        const context = getCtx();
        if (!context) return;
        Audio.stopBGM();
        const beat = () => {
          let time = context.currentTime;
          bgm.forEach(([note, duration]) => {
            if (note > 0) playNote(context, note, 'triangle', duration, 0.05, time);
            time += duration;
          });
        };
        beat();
        bgmIv = window.setInterval(beat, 1000);
      } catch {
        return;
      }
    },
    stopBGM: (): void => {
      if (bgmIv !== undefined) {
        window.clearInterval(bgmIv);
        bgmIv = undefined;
      }
    },
    cleanup: (): void => {
      Audio.stopBGM();
      if (ctx) {
        ctx.close();
        ctx = undefined;
      }
    },
  });
})();
