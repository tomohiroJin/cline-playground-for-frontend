/**
 * 迷宮の残響 - オーディオエンジン
 *
 * LabyrinthEchoGame.tsx §2 から抽出。
 * Web Audio API による効果音の生成・再生を担当。
 */
import { safeSync } from './contracts';

/** 音声設定の型 */
export interface AudioSettings {
  sfxEnabled: boolean;
  bgmEnabled: boolean;
  bgmVolume: number;
  sfxVolume: number;
}

/** デフォルト音声設定 */
export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  sfxEnabled: true,
  bgmEnabled: true,
  bgmVolume: 0.5,
  sfxVolume: 0.7,
};

const AUDIO_SETTINGS_KEY = 'labyrinth-echo-audio-settings';

/** localStorage から音声設定を読み込み */
export const loadAudioSettings = (): AudioSettings => {
  try {
    const raw = localStorage.getItem(AUDIO_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_AUDIO_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AudioSettings>;
    return { ...DEFAULT_AUDIO_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }
};

/** localStorage に音声設定を保存 */
export const saveAudioSettings = (settings: AudioSettings): void => {
  try {
    localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* localStorage が使えない環境では無視 */
  }
};

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

/** BGM の各ノードを保持する状態型 */
interface BgmState {
  base: OscillatorNode;
  pad: OscillatorNode;
  lfo: OscillatorNode;
  lpf: BiquadFilterNode;
  bpf: BiquadFilterNode;
  baseOut: GainNode;
  padOut: GainNode;
  lfoGain: GainNode;
}

/** フロア BGM パラメータの型 */
interface FloorBgmParams {
  baseFreq: number;
  baseType: OscillatorType;
  padFreq: number;
  padType: OscillatorType;
  lpfFreq: number;
  lfoFreq: number;
  lfoDepth: number;
  baseVol: number;
  padVol: number;
}

export const AudioEngine = (() => {
  let ctx: AudioContext | null = null;

  const getCtx = (): AudioContext | null => {
    if (!ctx) safeSync(() => { ctx = new (window.AudioContext || window.webkitAudioContext)(); }, "Audio.init");
    return ctx;
  };

  const resume = () => { safeSync(() => { if (ctx?.state === "suspended") ctx.resume(); }, "Audio.resume"); };

  /** 共通パターン: AudioContext 上にノードを作成して再生 */
  const play = (setup: (c: AudioContext) => void, tag?: string) => { safeSync(() => { const c = getCtx(); if (c) setup(c); }, `Audio.${tag}`); };

  const noise = (dur: number, vol: number = 0.08): void => play(c => {
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

  const tone = (freq: number, dur: number, type: OscillatorType = "sine", vol: number = 0.06): void => play(c => {
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + dur);
  }, "tone");

  const sweep = (sf: number, ef: number, dur: number, type: OscillatorType = "sine", vol: number = 0.04): void => play(c => {
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(sf, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(ef, 0.01), c.currentTime + dur);
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + dur);
  }, "sweep");

  /** 固定間隔でトーンのシーケンスを再生 */
  const seq = (freqs: number[], gap: number, dur: number, type: OscillatorType, vol: number): void =>
    freqs.forEach((f, i) => setTimeout(() => tone(f, dur, type, vol), i * gap));

  // ベース周波数を1オクターブ上げ、音量を引き上げてスピーカーで聞こえるようにする
  const FLOOR_BGM_PARAMS: Record<number, FloorBgmParams> = {
    1: { baseFreq: 130, baseType: "sine", padFreq: 392, padType: "sine", lpfFreq: 1200, lfoFreq: 0.1, lfoDepth: 4, baseVol: 0.15, padVol: 0.10 },
    2: { baseFreq: 116, baseType: "sine", padFreq: 350, padType: "triangle", lpfFreq: 1000, lfoFreq: 0.15, lfoDepth: 5, baseVol: 0.18, padVol: 0.12 },
    3: { baseFreq: 98, baseType: "triangle", padFreq: 294, padType: "triangle", lpfFreq: 800, lfoFreq: 0.2, lfoDepth: 8, baseVol: 0.20, padVol: 0.14 },
    4: { baseFreq: 88, baseType: "sawtooth", padFreq: 262, padType: "sawtooth", lpfFreq: 600, lfoFreq: 0.08, lfoDepth: 4, baseVol: 0.12, padVol: 0.08 },
    5: { baseFreq: 82, baseType: "sawtooth", padFreq: 246, padType: "square", lpfFreq: 500, lfoFreq: 0.3, lfoDepth: 12, baseVol: 0.22, padVol: 0.16 },
  };

  let bgmState: BgmState | null = null;
  let bgmMasterOut: GainNode | null = null;
  let bgmParams: FloorBgmParams | null = null;
  let currentMood: string = "exploration";

  const bgm = {
    currentVolume: 0.5,
    stopBgm: (fadeMs: number = 1000) => { safeSync(() => {
      if (!bgmState || !ctx) return;
      const t = ctx.currentTime;
      bgmMasterOut!.gain.setValueAtTime(bgmMasterOut!.gain.value, t);
      bgmMasterOut!.gain.linearRampToValueAtTime(0, t + fadeMs / 1000);
      const s = bgmState;
      setTimeout(() => {
        try {
          if (s.base) { s.base.stop(); s.base.disconnect(); }
          if (s.pad) { s.pad.stop(); s.pad.disconnect(); }
          if (s.lfo) { s.lfo.stop(); s.lfo.disconnect(); }
        } catch(_e) { /* 停止済みノードの停止エラーは無視 */ }
      }, fadeMs + 100);
      bgmState = null;
    }, "stopBgm"); },
    startFloorBgm: (floor: number) => { safeSync(() => {
      const c = getCtx(); if (!c) return;
      bgm.stopBgm(500);
      const p = FLOOR_BGM_PARAMS[floor] || FLOOR_BGM_PARAMS[1];
      bgmParams = { ...p };
      currentMood = "exploration";

      bgmMasterOut = c.createGain();
      bgmMasterOut.gain.value = 0;
      bgmMasterOut.connect(c.destination);

      const baseOut = c.createGain(); baseOut.gain.value = p.baseVol;
      const lpf = c.createBiquadFilter(); lpf.type = "lowpass"; lpf.frequency.value = p.lpfFreq;
      const base = c.createOscillator(); base.type = p.baseType; base.frequency.value = p.baseFreq;

      const padOut = c.createGain(); padOut.gain.value = p.padVol;
      const bpf = c.createBiquadFilter(); bpf.type = "bandpass"; bpf.frequency.value = p.padFreq;
      const pad = c.createOscillator(); pad.type = p.padType; pad.frequency.value = p.padFreq;

      const lfo = c.createOscillator(); lfo.type = "sine"; lfo.frequency.value = p.lfoFreq;
      const lfoGain = c.createGain(); lfoGain.gain.value = p.lfoDepth;
      lfo.connect(lfoGain); lfoGain.connect(base.frequency);

      base.connect(baseOut); baseOut.connect(lpf); lpf.connect(bgmMasterOut);
      pad.connect(padOut); padOut.connect(bpf); bpf.connect(bgmMasterOut);

      bgmMasterOut.gain.linearRampToValueAtTime(bgm.currentVolume, c.currentTime + 1);

      base.start(); pad.start(); lfo.start();

      bgmState = { base, pad, lfo, lpf, bpf, baseOut, padOut, lfoGain };
    }, "startFloorBgm"); },
    setEventMood: (type: string) => { safeSync(() => {
      if (!bgmState || !ctx || !bgmParams) return;
      const t = ctx.currentTime;
      currentMood = type;
      let lpfMult = 1, padVolMult = 1, lfoSpeedMult = 1;
      if (type === "encounter") { lpfMult = 1.5; padVolMult = 1.5; lfoSpeedMult = 2.0; }
      else if (type === "trap") { lpfMult = 0.7; padVolMult = 0.5; lfoSpeedMult = 1.5; }
      else if (type === "rest") { lpfMult = 2.0; padVolMult = 0.8; lfoSpeedMult = 0.5; }
      else if (type === "boss") { lpfMult = 2.0; padVolMult = 2.0; lfoSpeedMult = 3.0; }

      bgmState.lpf.frequency.linearRampToValueAtTime(bgmParams.lpfFreq * lpfMult, t + 0.5);
      bgmState.padOut.gain.linearRampToValueAtTime(bgmParams.padVol * padVolMult, t + 0.5);
      bgmState.lfo.frequency.linearRampToValueAtTime(bgmParams.lfoFreq * lfoSpeedMult, t + 0.5);
    }, "setEventMood"); },
    setBgmVolume: (vol: number): void => {
      bgm.currentVolume = vol;
      if (bgmMasterOut && ctx) {
        bgmMasterOut.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.1);
      }
    },
    updateCrisis: (hpPct: number, mnPct: number) => { safeSync(() => {
      if (!bgmState || !ctx || !bgmParams) return;
      const t = ctx.currentTime;
      let lpfMod = 1.0;
      let padDetune = 0;
      if (hpPct <= 0.25) { lpfMod = 0.6; padDetune = 100; }
      else if (hpPct <= 0.50) { lpfMod = 0.8; }

      let lfoDepthMod = 1.0;
      if (mnPct <= 0.30) { lfoDepthMod = 2.0; }
      if (mnPct <= 0.15) { lfoDepthMod = 4.0; }

      let baseLpf = bgmParams.lpfFreq;
      if (currentMood === "encounter") baseLpf *= 1.5;
      else if (currentMood === "trap") baseLpf *= 0.7;
      else if (currentMood === "rest" || currentMood === "boss") baseLpf *= 2.0;

      bgmState.lpf.frequency.linearRampToValueAtTime(baseLpf * lpfMod, t + 0.5);
      bgmState.pad.detune.linearRampToValueAtTime(padDetune, t + 0.5);
      bgmState.lfoGain.gain.linearRampToValueAtTime(bgmParams.lfoDepth * lfoDepthMod, t + 0.5);
    }, "updateCrisis"); }
  };

  return Object.freeze({
    init: getCtx, resume, bgm,
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
      page:     () => { tone(800, 0.05, "sine", 0.015); setTimeout(()=>tone(1200, 0.05, "sine", 0.015), 50); },
      unlock:   () => { seq([523,659,784,1047], 80, 0.1, "sine", 0.08); setTimeout(()=>noise(0.2, 0.02), 320); },
      titleGlow:() => sweep(200, 400, 1.0, "sine", 0.03),
      endingFanfare: () => { seq([523,659,784,880,1047,1319], 100, 0.15, "sine", 0.1); setTimeout(() => tone(200, 2.0, "sine", 0.05), 600); },
      curseApply: () => { sweep(100, 50, 0.8, "sawtooth", 0.06); setTimeout(() => play(c=>{const o1=c.createOscillator(),o2=c.createOscillator(),g=c.createGain();o1.frequency.value=400;o2.frequency.value=401;g.gain.value=0.04;o1.connect(g);o2.connect(g);g.connect(c.destination);o1.start();o2.start();o1.stop(c.currentTime+1);o2.stop(c.currentTime+1);}), 800); },
      secondLife: () => { seq([262,330,392,523], 60, 0.2, "sine", 0.1); sweep(100, 800, 0.5, "sine", 0.05); },
      ambient:  (fl: number) => play(c => {
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
