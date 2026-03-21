/**
 * AudioService インターフェースと実装
 * ドメイン層・アプリケーション層から副作用を分離するための抽象化
 */
import type { SoundName } from '../../domain/types';
import { CONTENT } from '../../constants';

/** オーディオサービスのインターフェース */
export interface IAudioService {
  /** 効果音を再生する */
  play(sound: SoundName, volume: number): void;
  /** 空間音響付きで効果音を再生する（pan: -1.0=左, 0=中央, 1.0=右） */
  playSpatial(sound: SoundName, volume: number, pan: number): void;
  /** BGM を開始する */
  startBGM(): void;
  /** BGM を停止する */
  stopBGM(): void;
  /** BGM の危険度を更新する */
  updateBGM(danger: number): void;
}

/** Web Audio API を使用した AudioService 実装 */
export class WebAudioService implements IAudioService {
  private ctx: AudioContext | undefined;
  private bgmOsc: OscillatorNode | undefined;
  private bgmGain: GainNode | undefined;
  private bgmOsc2: OscillatorNode | undefined;
  private bgmGain2: GainNode | undefined;
  private bgmLfo: OscillatorNode | undefined;
  private bgmRunning = false;

  /** AudioContext を取得（遅延初期化） */
  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (
        window.AudioContext ||
        (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      )();
    }
    return this.ctx;
  }

  play(type: SoundName, vol = 0.3): void {
    try {
      const ctx = this.ensureCtx();
      const sound = CONTENT.sounds[type] || CONTENT.sounds.footstep;
      const [freq, wave, dur] = sound;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // 3D音響（StereoPannerNode）
      if (typeof StereoPannerNode !== 'undefined') {
        const panner = ctx.createStereoPanner();
        gain.connect(panner);
        panner.connect(ctx.destination);
      } else {
        gain.connect(ctx.destination);
      }

      osc.connect(gain);
      osc.frequency.value = freq + (Math.random() - 0.5) * 10;
      osc.type = wave as OscillatorType;
      gain.gain.setValueAtTime(vol * 0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch {
      // オーディオ初期化失敗時は無視
    }
  }

  playSpatial(type: SoundName, vol = 0.3, pan = 0): void {
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
      osc.type = wave as OscillatorType;
      gain.gain.setValueAtTime(vol * 0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch {
      // オーディオ初期化失敗時は無視
    }
  }

  startBGM(): void {
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
  }

  stopBGM(): void {
    if (!this.bgmRunning) return;
    try {
      this.bgmOsc?.stop();
      this.bgmOsc2?.stop();
      this.bgmLfo?.stop();
    } catch {
      // 停止時のエラーは無視
    }
    this.bgmOsc = undefined;
    this.bgmGain = undefined;
    this.bgmOsc2 = undefined;
    this.bgmGain2 = undefined;
    this.bgmLfo = undefined;
    this.bgmRunning = false;
  }

  updateBGM(danger: number): void {
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
  }
}

/** テスト用の何もしない AudioService */
export class NullAudioService implements IAudioService {
  /** 再生された音の履歴（テスト検証用） */
  readonly playedSounds: Array<{ sound: SoundName; volume: number }> = [];
  readonly spatialSounds: Array<{ sound: SoundName; volume: number; pan: number }> = [];
  bgmStarted = false;
  bgmStopped = false;
  lastDanger = 0;

  play(sound: SoundName, volume: number): void {
    this.playedSounds.push({ sound, volume });
  }

  playSpatial(sound: SoundName, volume: number, pan: number): void {
    this.spatialSounds.push({ sound, volume, pan });
  }

  startBGM(): void {
    this.bgmStarted = true;
  }

  stopBGM(): void {
    this.bgmStopped = true;
  }

  updateBGM(danger: number): void {
    this.lastDanger = danger;
  }

  /** テスト用：履歴をリセットする */
  reset(): void {
    this.playedSounds.length = 0;
    this.spatialSounds.length = 0;
    this.bgmStarted = false;
    this.bgmStopped = false;
    this.lastDanger = 0;
  }
}
