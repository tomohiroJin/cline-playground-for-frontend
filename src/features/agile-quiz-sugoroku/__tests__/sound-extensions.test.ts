/**
 * サウンド拡張関数のテスト
 */
jest.mock('tone', () => ({
  Synth: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
  })),
  PolySynth: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
  })),
  NoiseSynth: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
  })),
  Loop: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockReturnThis(),
    stop: jest.fn(),
    dispose: jest.fn(),
  })),
  Transport: {
    bpm: { value: 120 },
    start: jest.fn(),
    stop: jest.fn(),
    cancel: jest.fn(),
  },
  start: jest.fn(),
  now: jest.fn().mockReturnValue(0),
}));

import {
  playSfxComboBreak,
  playSfxDrumroll,
  playSfxFanfare,
  playSfxTickUrgent,
} from '../audio/sound';

describe('サウンド拡張関数', () => {
  // ── 初期化前の呼び出し ────────────────────────────────

  describe('初期化前の呼び出し', () => {
    it('playSfxComboBreak が初期化前でもエラーにならない', () => {
      // Act & Assert
      expect(() => playSfxComboBreak()).not.toThrow();
    });

    it('playSfxDrumroll が初期化前でもエラーにならない', () => {
      expect(() => playSfxDrumroll()).not.toThrow();
    });

    it('playSfxFanfare が初期化前でもエラーにならない', () => {
      expect(() => playSfxFanfare()).not.toThrow();
    });

    it('playSfxTickUrgent が初期化前でもエラーにならない', () => {
      expect(() => playSfxTickUrgent(5)).not.toThrow();
    });
  });

  // ── 呼び出し可能性 ────────────────────────────────

  describe('関数の呼び出し', () => {
    it('playSfxComboBreak が呼び出し可能', () => {
      // Act & Assert
      expect(() => playSfxComboBreak()).not.toThrow();
    });

    it('playSfxDrumroll が呼び出し可能', () => {
      expect(() => playSfxDrumroll()).not.toThrow();
    });

    it('playSfxFanfare が呼び出し可能', () => {
      expect(() => playSfxFanfare()).not.toThrow();
    });

    it('playSfxTickUrgent が残り秒数を引数に取り呼び出し可能', () => {
      expect(() => playSfxTickUrgent(10)).not.toThrow();
      expect(() => playSfxTickUrgent(3)).not.toThrow();
      expect(() => playSfxTickUrgent(1)).not.toThrow();
    });
  });
});
