import { useRef, useCallback } from 'react';

export const useSePlayer = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toneRef = useRef<any>(null);
  const initializedRef = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seGainRef = useRef<any>(null);

  const ensureInitialized = useCallback(async (): Promise<boolean> => {
    if (initializedRef.current) return true;
    try {
      const Tone = await import('tone');
      toneRef.current = Tone;
      // Tone.start() should already be called by useBgm or handleStartGame
      if (Tone.getContext().state !== 'running') {
        await Tone.start();
      }
      seGainRef.current = new Tone.Gain(1.0).toDestination();
      initializedRef.current = true;
      return true;
    } catch {
      return false;
    }
  }, []);

  const playSlideSe = useCallback(async () => {
    const ok = await ensureInitialized();
    if (!ok) return;
    const Tone = toneRef.current;
    const synth = new Tone.Synth({
      oscillator: { type: 'sine' as OscillatorType },
      envelope: { attack: 0.005, decay: 0.04, sustain: 0, release: 0.01 },
      volume: Tone.gainToDb(0.04),
    }).connect(seGainRef.current);
    synth.triggerAttackRelease(600, 0.05);
    setTimeout(() => synth.dispose(), 200);
  }, [ensureInitialized]);

  const playCorrectSe = useCallback(async () => {
    const ok = await ensureInitialized();
    if (!ok) return;
    const Tone = toneRef.current;
    const synth = new Tone.Synth({
      oscillator: { type: 'sine' as OscillatorType },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.02 },
      volume: Tone.gainToDb(0.06),
    }).connect(seGainRef.current);
    synth.triggerAttackRelease(880, 0.12);
    setTimeout(() => synth.dispose(), 300);
  }, [ensureInitialized]);

  const playCompleteSe = useCallback(async () => {
    const ok = await ensureInitialized();
    if (!ok) return;
    const Tone = toneRef.current;
    const synth = new Tone.Synth({
      oscillator: { type: 'triangle' as OscillatorType },
      envelope: { attack: 0.02, decay: 0.2, sustain: 0.1, release: 0.1 },
      volume: Tone.gainToDb(0.08),
    }).connect(seGainRef.current);
    synth.triggerAttackRelease(523, 0.3);
    setTimeout(() => synth.dispose(), 600);
  }, [ensureInitialized]);

  return { playSlideSe, playCorrectSe, playCompleteSe };
};
