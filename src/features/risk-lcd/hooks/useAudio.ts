import { useRef, useCallback } from 'react';
import type { Note } from '../interfaces/audio';
import {
  SE_MV, SE_TICK, SE_WR, SE_ER,
  SE_SEL, SE_DIE, SE_NEAR, SE_SS, SE_UL, SE_SH, SE_PK, SE_MOD,
  SE_FALL, SE_OK, SE_COMBO, SE_CLR,
} from '../constants/audio-config';

type OscType = OscillatorType;

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
    (notes: readonly Note[]) => {
      notes.forEach(([f, d, t, v, dl]) =>
        setTimeout(() => beep(f, d, t || 'square', v || 0.1), dl || 0),
      );
    },
    [beep],
  );

  // 各種 SE（定数参照）
  const mv = useCallback(
    () => beep(SE_MV.freq, SE_MV.dur, SE_MV.type, SE_MV.vol),
    [beep],
  );
  const sel = useCallback(
    () => seq(SE_SEL.notes),
    [seq],
  );
  const tick = useCallback(
    () => beep(SE_TICK.freq, SE_TICK.dur, SE_TICK.type, SE_TICK.vol),
    [beep],
  );
  const fall = useCallback(
    (row: number) =>
      beep(
        SE_FALL.baseFreq - row * SE_FALL.freqStep,
        SE_FALL.dur,
        SE_FALL.type,
        SE_FALL.baseVol + row * SE_FALL.volStep,
      ),
    [beep],
  );
  const wr = useCallback(
    () => beep(SE_WR.freq, SE_WR.dur, SE_WR.type, SE_WR.vol),
    [beep],
  );
  const die = useCallback(
    () => seq(SE_DIE.notes),
    [seq],
  );
  const ok = useCallback(
    (mult: number) => {
      const v = Math.min(mult, SE_OK.maxMult);
      seq([
        [SE_OK.baseFreq1 + v * SE_OK.freqMult1, SE_OK.dur1, SE_OK.type, SE_OK.vol, 0],
        [SE_OK.baseFreq2 + v * SE_OK.freqMult2, SE_OK.dur2, SE_OK.type, SE_OK.vol, SE_OK.delay2],
      ]);
    },
    [seq],
  );
  const combo = useCallback(
    (n: number) =>
      beep(
        SE_COMBO.baseFreq + n * SE_COMBO.freqStep,
        SE_COMBO.dur,
        SE_COMBO.type,
        SE_COMBO.vol,
      ),
    [beep],
  );
  const near = useCallback(
    () => seq(SE_NEAR.notes),
    [seq],
  );
  const clr = useCallback(
    () =>
      Array.from({ length: SE_CLR.count }, (_, i) => i).forEach((i) =>
        setTimeout(
          () => beep(
            SE_CLR.baseFreq + i * SE_CLR.freqStep,
            SE_CLR.dur,
            SE_CLR.type,
            SE_CLR.vol,
          ),
          i * SE_CLR.delayStep,
        ),
      ),
    [beep],
  );
  const ss = useCallback(
    () => seq(SE_SS.notes),
    [seq],
  );
  const ul = useCallback(
    () => seq(SE_UL.notes),
    [seq],
  );
  const er = useCallback(
    () => beep(SE_ER.freq, SE_ER.dur, SE_ER.type, SE_ER.vol),
    [beep],
  );
  const sh = useCallback(
    () => seq(SE_SH.notes),
    [seq],
  );
  const pk = useCallback(
    () => seq(SE_PK.notes),
    [seq],
  );
  const mod = useCallback(
    () => seq(SE_MOD.notes),
    [seq],
  );

  return { mv, sel, tick, fall, wr, die, ok, combo, near, clr, ss, ul, er, sh, pk, mod };
}
