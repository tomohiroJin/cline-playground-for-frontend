/**
 * サウンドのミュートゲートに関するテスト
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

import { setSoundEnabled, isSoundEnabled } from '../infrastructure/audio/sound';

describe('sound mute gate', () => {
  afterEach(() => setSoundEnabled(true)); // 後始末

  it('デフォルトは有効', () => {
    expect(isSoundEnabled()).toBe(true);
  });

  it('setSoundEnabled で状態を切り替えられる', () => {
    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);
    setSoundEnabled(true);
    expect(isSoundEnabled()).toBe(true);
  });
});
