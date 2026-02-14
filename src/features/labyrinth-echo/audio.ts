// @ts-nocheck
/**
 * 迷宮の残響 - オーディオエンジン
 *
 * LabyrinthEchoGame.tsx §2 から抽出。
 * Web Audio API による効果音の生成・再生を担当。
 */
import { safeSync } from './contracts';

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export const AudioEngine = (() => {
  let ctx = null;

  const getCtx = () => {
    if (!ctx) safeSync(() => { ctx = new (window.AudioContext || window.webkitAudioContext)(); }, "Audio.init");
    return ctx;
  };

  const resume = () => safeSync(() => { if (ctx?.state === "suspended") ctx.resume(); }, "Audio.resume");

  /** 共通パターン: AudioContext 上にノードを作成して再生 */
  const play = (setup, tag) => safeSync(() => { const c = getCtx(); if (c) setup(c); }, `Audio.${tag}`);

  const noise = (dur, vol = 0.08) => play(c => {
    const src = c.createBufferSource(), buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    src.buffer = buf;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 600;
    src.connect(f); f.connect(g); g.connect(c.destination);
    src.start(); src.stop(c.currentTime + dur);
  }, "noise");

  const tone = (freq, dur, type = "sine", vol = 0.06) => play(c => {
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + dur);
  }, "tone");

  const sweep = (sf, ef, dur, type = "sine", vol = 0.04) => play(c => {
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(sf, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(ef, 0.01), c.currentTime + dur);
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + dur);
  }, "sweep");

  /** 固定間隔でトーンのシーケンスを再生 */
  const seq = (freqs, gap, dur, type, vol) =>
    freqs.forEach((f, i) => setTimeout(() => tone(f, dur, type, vol), i * gap));

  return Object.freeze({
    init: getCtx, resume,
    sfx: Object.freeze({
      tick:     () => tone(600 + Math.random() * 300, 0.025, "sine", 0.012),
      hit:      () => { noise(0.2, 0.12); tone(80, 0.15, "sawtooth", 0.08); },
      bigHit:   () => { noise(0.4, 0.18); tone(50, 0.3, "sawtooth", 0.12); sweep(200, 40, 0.3, "square", 0.06); },
      heal:     () => seq([440, 554, 659], 80, 0.15, "sine", 0.05),
      status:   () => { tone(200, 0.3, "sawtooth", 0.06); setTimeout(() => tone(150, 0.3, "sawtooth", 0.05), 100); },
      clear:    () => seq([523, 659, 784], 60, 0.1, "sine", 0.04),
      floor:    () => { sweep(100, 400, 1.2, "sine", 0.04); setTimeout(() => sweep(150, 500, 0.8, "sine", 0.03), 300); noise(1.5, 0.03); },
      over:     () => { tone(220, 0.4, "sawtooth", 0.06); setTimeout(() => tone(185, 0.4, "sawtooth", 0.06), 300); setTimeout(() => tone(147, 0.8, "sawtooth", 0.07), 600); noise(1.5, 0.04); },
      victory:  () => seq([523, 659, 784, 1047], 120, 0.3, "sine", 0.06),
      choice:   () => { tone(800, 0.06, "sine", 0.03); setTimeout(() => tone(1000, 0.06, "sine", 0.03), 40); },
      drain:    () => sweep(300, 150, 0.3, "sine", 0.025),
      levelUp:  () => seq([523, 659, 784, 880, 1047], 60, 0.15, "sine", 0.04),
      ambient:  (fl) => play(c => {
        const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
        f.type = "lowpass"; f.frequency.value = 200 + fl * 30;
        o.type = "sine"; o.frequency.value = 30 + fl * 8;
        g.gain.setValueAtTime(0, c.currentTime);
        g.gain.linearRampToValueAtTime(0.025, c.currentTime + 1);
        g.gain.linearRampToValueAtTime(0, c.currentTime + 4);
        o.connect(f); f.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + 4);
      }, "ambient"),
    }),
  });
})();
