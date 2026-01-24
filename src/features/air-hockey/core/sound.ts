export const createSoundSystem = () => {
  let audioCtx: AudioContext | null = null;
  const getContext = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!audioCtx)
      audioCtx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
    return audioCtx;
  };
  const playTone = (freq: number, type: OscillatorType, duration: number, volume = 0.3) => {
    try {
      const ctx = getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      /* Audio not supported */
    }
  };
  const playSequence = (notes: any[]) => {
    notes.forEach(([freq, type, dur, vol], i) => {
      setTimeout(() => playTone(freq, type, dur, vol), i * 100);
    });
  };
  return {
    hit: () => playTone(800, 'square', 0.05, 0.2),
    wall: () => playTone(400, 'triangle', 0.05, 0.15),
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
  };
};
