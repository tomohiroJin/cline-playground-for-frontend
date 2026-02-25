import { CONTENT } from './constants';
import type { SoundName } from './types';

// ==================== AUDIO SERVICE ====================
export const AudioService = {
  ctx: null as AudioContext | null,
  bgmOsc: null as OscillatorNode | null,
  bgmGain: null as GainNode | null,
  bgmOsc2: null as OscillatorNode | null,
  bgmGain2: null as GainNode | null,
  bgmLfo: null as OscillatorNode | null,
  bgmRunning: false,

  ensureCtx() {
    if (!this.ctx)
      this.ctx = new (
        window.AudioContext ||
        (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      )();
    return this.ctx;
  },

  play(type: SoundName, vol = 0.3) {
    try {
      const ctx = this.ensureCtx();
      const sound = CONTENT.sounds[type] || CONTENT.sounds.footstep;
      const [freq, wave, dur] = sound;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // 3D音響（StereoPannerNode）
      let lastNode: AudioNode = gain;
      if (typeof StereoPannerNode !== 'undefined') {
        const panner = ctx.createStereoPanner();
        gain.connect(panner);
        panner.connect(ctx.destination);
        lastNode = panner;
      } else {
        gain.connect(ctx.destination);
      }

      osc.connect(gain);
      if (lastNode !== gain) {
        // すでに接続済み
      } else {
        gain.connect(ctx.destination);
      }

      osc.frequency.value = freq + (Math.random() - 0.5) * 10;
      osc.type = wave;
      gain.gain.setValueAtTime(vol * 0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch {
      // オーディオ初期化失敗時は無視
    }
  },

  // 空間音響付き再生（pan: -1.0=左, 0=中央, 1.0=右）
  playSpatial(type: SoundName, vol = 0.3, pan = 0) {
    try {
      const ctx = this.ensureCtx();
      const sound = CONTENT.sounds[type] || CONTENT.sounds.footstep;
      const [freq, wave, dur] = sound;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);

      if (typeof StereoPannerNode !== 'undefined') {
        const panner = ctx.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, pan));
        gain.connect(panner);
        panner.connect(ctx.destination);
      } else {
        gain.connect(ctx.destination);
      }

      osc.frequency.value = freq + (Math.random() - 0.5) * 10;
      osc.type = wave;
      gain.gain.setValueAtTime(vol * 0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch {
      // オーディオ初期化失敗時は無視
    }
  },

  // プロシージャルアンビエントBGM開始
  startBGM() {
    if (this.bgmRunning) return;
    try {
      const ctx = this.ensureCtx();

      // ベースドローン（低周波）
      this.bgmOsc = ctx.createOscillator();
      this.bgmGain = ctx.createGain();
      this.bgmOsc.type = 'sine';
      this.bgmOsc.frequency.value = 38;
      this.bgmGain.gain.value = 0.015;
      this.bgmOsc.connect(this.bgmGain);
      this.bgmGain.connect(ctx.destination);
      this.bgmOsc.start();

      // 不穏なハーモニクス
      this.bgmOsc2 = ctx.createOscillator();
      this.bgmGain2 = ctx.createGain();
      this.bgmOsc2.type = 'triangle';
      this.bgmOsc2.frequency.value = 57;
      this.bgmGain2.gain.value = 0.008;
      this.bgmOsc2.connect(this.bgmGain2);
      this.bgmGain2.connect(ctx.destination);
      this.bgmOsc2.start();

      // LFO による揺らぎ
      this.bgmLfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      this.bgmLfo.type = 'sine';
      this.bgmLfo.frequency.value = 0.3;
      lfoGain.gain.value = 3;
      this.bgmLfo.connect(lfoGain);
      lfoGain.connect(this.bgmOsc.frequency);
      this.bgmLfo.start();

      this.bgmRunning = true;
    } catch {
      // BGM開始失敗時は無視
    }
  },

  // BGM停止
  stopBGM() {
    if (!this.bgmRunning) return;
    try {
      this.bgmOsc?.stop();
      this.bgmOsc2?.stop();
      this.bgmLfo?.stop();
    } catch {
      // 停止時のエラーは無視
    }
    this.bgmOsc = null;
    this.bgmGain = null;
    this.bgmOsc2 = null;
    this.bgmGain2 = null;
    this.bgmLfo = null;
    this.bgmRunning = false;
  },

  // BGM のゲーム状態連動（危険度で音量・不協和音を変化）
  updateBGM(danger: number) {
    if (!this.bgmRunning) return;
    try {
      if (this.bgmGain) {
        this.bgmGain.gain.value = 0.015 + danger * 0.02;
      }
      if (this.bgmOsc2) {
        // 危険度が高いほど不協和な周波数にシフト
        this.bgmOsc2.frequency.value = 57 + danger * 20;
      }
      if (this.bgmGain2) {
        this.bgmGain2.gain.value = 0.008 + danger * 0.015;
      }
    } catch {
      // 更新時のエラーは無視
    }
  },
};
