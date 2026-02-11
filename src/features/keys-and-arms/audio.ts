import { resolveBeatLength } from './constants';
import type { Stage } from './types';

export class KeysAndArmsAudio {
  private context: AudioContext | null = null;

  private bgmBeat = 0;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') {
      return null;
    }
    if (!this.context) {
      const AudioCtor = window.AudioContext ?? null;
      if (!AudioCtor) {
        return null;
      }
      this.context = new AudioCtor();
    }
    return this.context;
  }

  async ensureStarted(): Promise<void> {
    const context = this.getContext();
    if (!context) {
      return;
    }
    if (context.state === 'suspended') {
      await context.resume();
    }
  }

  resetBgmBeat(): void {
    this.bgmBeat = 0;
  }

  getBeatLength(loop: number): number {
    return resolveBeatLength(loop);
  }

  playTone(frequency: number, duration: number, type: OscillatorType = 'square', gain = 0.03): void {
    const context = this.getContext();
    if (!context) {
      return;
    }
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gainNode.gain.setValueAtTime(gain, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }

  playBgmTick(stage: Stage, isVictory = false): void {
    if (isVictory) {
      return;
    }

    this.bgmBeat += 1;

    if (stage === 'cave') {
      if (this.bgmBeat % 4 === 0) this.playTone(165, 0.08, 'sine', 0.02);
      if (this.bgmBeat % 8 === 0) this.playTone(82, 0.2, 'triangle', 0.02);
      if (this.bgmBeat % 16 === 0) this.playTone(330, 0.06, 'sine', 0.012);
      return;
    }

    if (stage === 'grass') {
      if (this.bgmBeat % 2 === 0) this.playTone(110, 0.06, 'triangle', 0.025);
      if (this.bgmBeat % 2 === 1) this.playTone(880, 0.015, 'square', 0.015);
      if (this.bgmBeat % 4 === 0) this.playTone(220, 0.08, 'square', 0.018);
      if (this.bgmBeat % 8 === 0) this.playTone(330, 0.06, 'square', 0.012);
      return;
    }

    this.playTone(55, 0.15, 'triangle', 0.022);
    if (this.bgmBeat % 2 === 0) this.playTone(82, 0.12, 'sawtooth', 0.015);
    if (this.bgmBeat % 4 === 0) this.playTone(185, 0.08, 'square', 0.012);
    if (this.bgmBeat % 8 === 3) this.playTone(147, 0.06, 'sawtooth', 0.01);
  }

  playStart(): void {
    this.playTone(523, 0.08);
    window.setTimeout(() => this.playTone(659, 0.08), 70);
    window.setTimeout(() => this.playTone(784, 0.07), 140);
    this.resetBgmBeat();
  }

  playHit(): void {
    this.playTone(90, 0.2, 'sawtooth', 0.06);
  }

  playClear(): void {
    [523, 659, 784, 1047].forEach((freq, index) => {
      window.setTimeout(() => this.playTone(freq, 0.15), index * 100);
    });
  }
}
