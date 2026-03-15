/**
 * 迷宮の残響 - AudioAdapter / NullAudioAdapter
 *
 * AudioPort の実装。AudioEngine をラップし、SfxType からメソッドへのマッピングを提供する。
 * NullAudioAdapter はテスト用のノーオプ実装。
 */
import type { AudioPort, SfxType, EventMood } from '../../application/ports/audio-port';

/**
 * AudioEngine の型（audio.ts の AudioEngine に対応）
 *
 * infrastructure 層内で AudioEngine への依存を型安全にするための定義。
 * 実際のインスタンスは audio.ts から提供される。
 */
export interface AudioEngineType {
  init: () => unknown;
  resume: () => void;
  sfx: Record<SfxType, (...args: number[]) => void>;
  bgm: {
    startFloorBgm: (floor: number) => void;
    stopBgm: (fadeMs?: number) => void;
    setEventMood: (type: string) => void;
    updateCrisis: (hpPct: number, mnPct: number) => void;
    setBgmVolume: (vol: number) => void;
    currentVolume: number;
  };
}

/** AudioEngine をラップした AudioPort 実装 */
export class AudioAdapter implements AudioPort {
  constructor(private readonly engine: AudioEngineType) {}

  /** AudioContext を初期化する */
  initialize(): void {
    this.engine.init();
    this.engine.resume();
  }

  /** 効果音を再生する */
  playSfx(sfxType: SfxType): void {
    const sfxFn = this.engine.sfx[sfxType];
    if (sfxFn) {
      sfxFn();
    }
  }

  /** 指定フロアの BGM を開始する */
  startBgm(floor: number): void {
    this.engine.bgm.startFloorBgm(floor);
  }

  /** BGM を停止する */
  stopBgm(): void {
    this.engine.bgm.stopBgm();
  }

  /** イベントムードを設定する */
  setMood(mood: EventMood): void {
    this.engine.bgm.setEventMood(mood);
  }

  /** 危機状態を更新する */
  updateCrisis(hpRatio: number, mnRatio: number): void {
    this.engine.bgm.updateCrisis(hpRatio, mnRatio);
  }

  /** BGM 音量を設定する */
  setVolume(volume: number): void {
    this.engine.bgm.setBgmVolume(volume);
  }
}

/** テスト用のノーオプ AudioPort 実装（NullObject パターン） */
export class NullAudioAdapter implements AudioPort {
  initialize(): void { /* ノーオプ */ }
  playSfx(_sfxType: SfxType): void { /* ノーオプ */ }
  startBgm(_floor: number): void { /* ノーオプ */ }
  stopBgm(): void { /* ノーオプ */ }
  setMood(_mood: EventMood): void { /* ノーオプ */ }
  updateCrisis(_hpRatio: number, _mnRatio: number): void { /* ノーオプ */ }
  setVolume(_volume: number): void { /* ノーオプ */ }
}
