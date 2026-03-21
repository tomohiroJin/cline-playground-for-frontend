// WebAudioAdapter — Web Audio API を使用した IAudioService 実装

import type { IAudioService } from '../application/audio-service';
import type { OscillatorType } from '../types';

/**
 * Web Audio API アダプター
 * 既存の audio.ts の IIFE シングルトンをクラスベースに変換
 */
export class WebAudioAdapter implements IAudioService {
  private ctx: AudioContext | null = null;
  private warned = false;

  private getContext(): AudioContext | null {
    if (!this.ctx) {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        } else if (!this.warned) {
          this.warned = true;
          console.warn('Web Audio API に対応していない環境です。音声は再生されません。');
        }
      } catch {
        if (!this.warned) {
          this.warned = true;
          console.warn('AudioContext の初期化に失敗しました。音声は再生されません。');
        }
      }
    }
    // suspended 状態の場合は resume を試行
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'square',
    volume = 0.2
  ): void {
    const c = this.getContext();
    if (!c) return;
    try {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + duration);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + duration);
    } catch {
      // 再生エラーは無視
    }
  }

  private sequence(
    notes: number[],
    interval: number,
    type: OscillatorType = 'sine',
    vol = 0.2
  ): void {
    notes.forEach((f, i) =>
      setTimeout(() => this.playTone(f, 0.1, type, vol), i * interval)
    );
  }

  shoot(): void {
    this.playTone(880, 0.08);
  }

  hit(): void {
    this.playTone(220, 0.08);
  }

  land(): void {
    this.playTone(120, 0.06, 'triangle');
  }

  line(): void {
    this.sequence([523, 659, 784], 50);
  }

  power(): void {
    this.sequence([440, 660, 880], 30);
  }

  bomb(): void {
    this.playTone(80, 0.2, 'sawtooth', 0.3);
  }

  over(): void {
    this.sequence([400, 300, 200], 100, 'sawtooth');
  }

  win(): void {
    this.sequence([523, 659, 784, 1047], 80);
  }

  skill(): void {
    this.sequence([880, 1100, 1320, 1760], 40, 'sine', 0.3);
  }

  charge(): void {
    this.playTone(660, 0.15, 'sine', 0.15);
  }
}
