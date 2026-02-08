import { useRef, useCallback } from 'react';

type OscType = OscillatorType;
type Note = [number, number, OscType?, number?, number?]; // freq, dur, type, vol, delay

// Web Audio API サウンド生成フック
export function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);

  // AudioContext 取得（遅延初期化）
  const getCtx = useCallback((): AudioContext => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  // 単音ビープ
  const beep = useCallback(
    (freq: number, dur: number, type: OscType = 'square', vol = 0.1) => {
      try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + dur);
      } catch {
        // オーディオ未対応環境では無視
      }
    },
    [getCtx],
  );

  // シーケンス再生
  const seq = useCallback(
    (notes: Note[]) => {
      notes.forEach(([f, d, t, v, dl]) =>
        setTimeout(() => beep(f, d, t || 'square', v || 0.1), dl || 0),
      );
    },
    [beep],
  );

  // 各種 SE
  const mv = useCallback(() => beep(1100, 0.04, 'square', 0.06), [beep]);
  const sel = useCallback(
    () =>
      seq([
        [880, 0.05, 'square', 0.1, 0],
        [1320, 0.06, 'square', 0.1, 45],
      ]),
    [seq],
  );
  const tick = useCallback(() => beep(660, 0.025, 'square', 0.03), [beep]);
  const fall = useCallback(
    (row: number) => beep(500 - row * 35, 0.04, 'square', 0.025 + row * 0.006),
    [beep],
  );
  const wr = useCallback(() => beep(280, 0.12, 'sawtooth', 0.07), [beep]);
  const die = useCallback(
    () =>
      seq([
        [220, 0.25, 'sawtooth', 0.14, 0],
        [110, 0.35, 'sawtooth', 0.11, 170],
        [70, 0.4, 'sawtooth', 0.08, 350],
      ]),
    [seq],
  );
  const ok = useCallback(
    (mult: number) => {
      const v = Math.min(mult, 4);
      seq([
        [550 + v * 90, 0.06, 'square', 0.1, 0],
        [700 + v * 110, 0.08, 'square', 0.1, 50],
      ]);
    },
    [seq],
  );
  const combo = useCallback(
    (n: number) => beep(800 + n * 45, 0.06, 'triangle', 0.08),
    [beep],
  );
  const near = useCallback(
    () =>
      seq([
        [900, 0.03, 'triangle', 0.04, 0],
        [1200, 0.04, 'triangle', 0.05, 40],
      ]),
    [seq],
  );
  const clr = useCallback(
    () =>
      [0, 1, 2, 3, 4].forEach((i) =>
        setTimeout(() => beep(500 + i * 110, 0.1, 'square', 0.09), i * 80),
      ),
    [beep],
  );
  const ss = useCallback(
    () =>
      seq([
        [440, 0.07, 'square', 0.1, 0],
        [550, 0.07, 'square', 0.1, 90],
        [660, 0.1, 'square', 0.1, 180],
      ]),
    [seq],
  );
  const ul = useCallback(
    () =>
      seq([
        [660, 0.07, 'square', 0.1, 0],
        [990, 0.07, 'square', 0.1, 70],
        [1320, 0.1, 'square', 0.1, 140],
      ]),
    [seq],
  );
  const er = useCallback(() => beep(180, 0.12, 'sawtooth', 0.06), [beep]);
  const sh = useCallback(
    () =>
      seq([
        [440, 0.07, 'triangle', 0.08, 0],
        [880, 0.12, 'triangle', 0.1, 70],
      ]),
    [seq],
  );
  const pk = useCallback(
    () =>
      seq([
        [550, 0.06, 'triangle', 0.07, 0],
        [770, 0.08, 'triangle', 0.08, 60],
        [990, 0.1, 'triangle', 0.09, 130],
      ]),
    [seq],
  );
  const mod = useCallback(
    () =>
      seq([
        [330, 0.1, 'sawtooth', 0.05, 0],
        [440, 0.1, 'sawtooth', 0.06, 100],
      ]),
    [seq],
  );

  return { mv, sel, tick, fall, wr, die, ok, combo, near, clr, ss, ul, er, sh, pk, mod };
}
