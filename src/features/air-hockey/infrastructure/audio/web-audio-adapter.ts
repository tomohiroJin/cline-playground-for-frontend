/**
 * Web Audio API アダプタ
 * - AudioPort の具象実装
 * - 現 core/sound.ts のロジックをアダプタ化
 */
import type { AudioPort } from '../../domain/contracts/audio';

export class WebAudioAdapter implements AudioPort {
  private audioCtx: AudioContext | null = null;
  private bgmInterval: ReturnType<typeof setInterval> | null = null;
  private bgmGain: GainNode | null = null;
  private bgmTempo = 1.0;
  private bgmNoteIndex = 0;
  private bgmVolumeValue = 0.15;
  private seVolumeValue = 1.0;
  private isMuted = false;

  // BGM メロディパターン
  private readonly BGM_NOTES = [
    262, 330, 392, 330, 349, 392, 440, 392,
    330, 349, 392, 330, 262, 330, 392, 440,
  ];

  private getContext(): AudioContext | null {
    const w = window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };
    const AudioContextClass = w.AudioContext || w.webkitAudioContext;
    if (!this.audioCtx && AudioContextClass) {
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume = 0.3): void {
    try {
      if (this.isMuted) return;
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.value = freq;
      const adjustedVolume = volume * this.seVolumeValue;
      gain.gain.setValueAtTime(adjustedVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      /* Audio not supported */
    }
  }

  private playSequence(notes: [number, OscillatorType, number, number][]): void {
    notes.forEach(([freq, type, dur, vol], i) => {
      setTimeout(() => this.playTone(freq, type, dur, vol), i * 100);
    });
  }

  private playBgmNote(): void {
    const ctx = this.getContext();
    if (!ctx || !this.bgmGain) return;
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();
    osc.connect(noteGain);
    noteGain.connect(this.bgmGain);
    osc.type = 'triangle';
    osc.frequency.value = this.BGM_NOTES[this.bgmNoteIndex % this.BGM_NOTES.length];
    const noteDuration = 0.19 / this.bgmTempo;
    noteGain.gain.setValueAtTime(0.3, ctx.currentTime);
    noteGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + noteDuration);
    osc.start();
    osc.stop(ctx.currentTime + noteDuration);
    this.bgmNoteIndex++;
  }

  private startBgmInterval(): void {
    if (this.bgmInterval) clearInterval(this.bgmInterval);
    this.bgmInterval = setInterval(() => this.playBgmNote(), 200 / this.bgmTempo);
  }

  // AudioPort 実装
  playHit(speed: number): void {
    const freq = 800 + Math.min(speed, 10) * 40;
    const vol = 0.15 + Math.min(speed, 10) * 0.02;
    this.playTone(freq, 'square', 0.05, vol);
  }

  playWall(angle = 0): void {
    const freq = 400 + Math.abs(angle) * 50;
    this.playTone(freq, 'triangle', 0.05, 0.15);
  }

  playGoal(): void {
    this.playSequence([
      [523, 'sine', 0.15, 0.3],
      [659, 'sine', 0.15, 0.3],
      [784, 'sine', 0.2, 0.3],
    ]);
  }

  playLose(): void {
    this.playSequence([
      [400, 'sine', 0.2, 0.3],
      [300, 'sine', 0.3, 0.3],
    ]);
  }

  playItem(): void {
    this.playTone(1000, 'sine', 0.1, 0.25);
  }

  playCountdown(): void {
    this.playTone(600, 'sine', 0.15, 0.25);
  }

  playGo(): void {
    this.playSequence([
      [523, 'sine', 0.1, 0.3],
      [784, 'sine', 0.2, 0.35],
    ]);
  }

  playStart(): void {
    this.playSequence([
      [440, 'sine', 0.1, 0.2],
      [554, 'sine', 0.1, 0.2],
      [659, 'sine', 0.15, 0.2],
    ]);
  }

  startBgm(): void {
    try {
      if (this.isMuted) return;
      const ctx = this.getContext();
      if (!ctx || this.bgmInterval) return;

      this.bgmGain = ctx.createGain();
      this.bgmGain.connect(ctx.destination);
      this.bgmGain.gain.value = this.bgmVolumeValue;
      this.bgmNoteIndex = 0;

      this.playBgmNote();
      this.startBgmInterval();
    } catch {
      /* Audio not supported */
    }
  }

  stopBgm(): void {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.bgmGain = null;
  }

  setBgmTempo(tempo: number): void {
    this.bgmTempo = tempo;
    if (this.bgmInterval) {
      this.startBgmInterval();
    }
  }

  setBgmVolume(volume: number): void {
    this.bgmVolumeValue = (volume / 100) * 0.8;
    if (this.bgmGain) this.bgmGain.gain.value = this.bgmVolumeValue;
  }

  setSeVolume(volume: number): void {
    this.seVolumeValue = volume / 100;
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted && this.bgmInterval) this.stopBgm();
  }
}
