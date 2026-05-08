// campaign-se-engine の単体テスト
//
// jsdom には AudioContext が無いため、no-op エンジンが返る前提でテスト。

import { createCampaignSeEngine } from './campaign-se-engine';

describe('createCampaignSeEngine (no AudioContext)', () => {
  it('AudioContext 未対応環境で no-op を返す', () => {
    const engine = createCampaignSeEngine();
    expect(() => engine.play('info')).not.toThrow();
    expect(() => engine.play('warn-tick')).not.toThrow();
    expect(() => engine.play('bonus')).not.toThrow();
    expect(() => engine.play('denied')).not.toThrow();
    expect(() => engine.play('clear-fanfare')).not.toThrow();
    expect(() => engine.play('game-over')).not.toThrow();
    expect(() => engine.play('lives-warn')).not.toThrow();
  });

  it('setMasterVolume と cleanup も no-op で安全', () => {
    const engine = createCampaignSeEngine();
    expect(() => engine.setMasterVolume(0.5)).not.toThrow();
    expect(() => engine.cleanup()).not.toThrow();
  });
});

describe('createCampaignSeEngine (mock AudioContext)', () => {
  const originalAudioContext = window.AudioContext;

  beforeEach(() => {
    // 簡易 AudioContext モック
    const mockOsc = {
      frequency: {
        value: 0,
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
      },
      type: 'sine',
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    };
    const mockGain = {
      gain: {
        value: 1,
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      },
      connect: jest.fn(),
    };
    const mockBuffer = { getChannelData: jest.fn(() => new Float32Array(100)) };
    const mockSrc = { buffer: null, connect: jest.fn(), start: jest.fn() };
    (window as unknown as { AudioContext: unknown }).AudioContext = jest.fn(() => ({
      currentTime: 0,
      sampleRate: 44100,
      state: 'running',
      destination: {},
      resume: jest.fn(),
      close: jest.fn(),
      createOscillator: jest.fn(() => ({ ...mockOsc })),
      createGain: jest.fn(() => ({ ...mockGain, gain: { ...mockGain.gain } })),
      createBuffer: jest.fn(() => mockBuffer),
      createBufferSource: jest.fn(() => mockSrc),
    }));
  });

  afterEach(() => {
    (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext = originalAudioContext;
  });

  it('AudioContext がある環境で 7 種すべて再生可能', () => {
    const engine = createCampaignSeEngine();
    const seNames = [
      'info',
      'warn-tick',
      'bonus',
      'denied',
      'clear-fanfare',
      'game-over',
      'lives-warn',
    ] as const;
    for (const name of seNames) {
      expect(() => engine.play(name)).not.toThrow();
    }
  });
});
