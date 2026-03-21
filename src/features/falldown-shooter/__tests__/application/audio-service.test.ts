// AudioService インターフェースとアダプターのテスト

import { NullAudioAdapter } from '../../application/audio-service';
import type { IAudioService } from '../../application/audio-service';

describe('NullAudioAdapter', () => {
  test('全メソッドがエラーなく呼び出せること', () => {
    // Arrange
    const audio: IAudioService = NullAudioAdapter;

    // Act & Assert — 例外が発生しないこと
    expect(() => audio.shoot()).not.toThrow();
    expect(() => audio.hit()).not.toThrow();
    expect(() => audio.land()).not.toThrow();
    expect(() => audio.line()).not.toThrow();
    expect(() => audio.power()).not.toThrow();
    expect(() => audio.bomb()).not.toThrow();
    expect(() => audio.over()).not.toThrow();
    expect(() => audio.win()).not.toThrow();
    expect(() => audio.skill()).not.toThrow();
    expect(() => audio.charge()).not.toThrow();
  });
});

describe('WebAudioAdapter', () => {
  /** OscillatorNode のモック型 */
  interface MockOscillatorNode {
    connect: jest.Mock;
    start: jest.Mock;
    stop: jest.Mock;
    type: string;
    frequency: { value: number };
  }

  /** GainNode のモック型 */
  interface MockGainNode {
    connect: jest.Mock;
    gain: {
      setValueAtTime: jest.Mock;
      exponentialRampToValueAtTime: jest.Mock;
    };
  }

  /** AudioContext のモック型 */
  interface MockAudioContext {
    createOscillator: jest.Mock;
    createGain: jest.Mock;
    currentTime: number;
    destination: Record<string, never>;
    state: string;
    resume: jest.Mock;
  }

  let mockOscillator: MockOscillatorNode;
  let mockGain: MockGainNode;
  let mockAudioContext: MockAudioContext;

  beforeEach(() => {
    mockOscillator = {
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      type: '',
      frequency: { value: 0 },
    };

    mockGain = {
      connect: jest.fn(),
      gain: {
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      },
    };

    mockAudioContext = {
      createOscillator: jest.fn(() => mockOscillator),
      createGain: jest.fn(() => mockGain),
      currentTime: 0,
      destination: {},
      state: 'running',
      resume: jest.fn().mockResolvedValue(undefined),
    };

    Object.defineProperty(window, 'AudioContext', {
      value: jest.fn(() => mockAudioContext),
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.resetModules();
  });

  test('shoot が音を再生すること', async () => {
    // Arrange
    const { WebAudioAdapter } = await import('../../infrastructure/web-audio-adapter');
    const adapter = new WebAudioAdapter();

    // Act
    adapter.shoot();

    // Assert
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    expect(mockOscillator.start).toHaveBeenCalled();
  });

  test('hit が音を再生すること', async () => {
    // Arrange
    const { WebAudioAdapter } = await import('../../infrastructure/web-audio-adapter');
    const adapter = new WebAudioAdapter();

    // Act
    adapter.hit();

    // Assert
    expect(mockOscillator.start).toHaveBeenCalled();
  });
});
