/**
 * AudioContext モックの共通ヘルパー
 * テストファイル間で重複していた AudioContext のモック定義を統合
 */

/** モック OscillatorNode を生成する */
const createMockOscillator = () => ({
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  frequency: { value: 0 },
  type: '',
});

/** モック GainNode を生成する */
const createMockGain = () => ({
  connect: jest.fn(),
  gain: {
    value: 0,
    setValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn(),
  },
});

/** モック StereoPannerNode を生成する */
const createMockPanner = () => ({
  connect: jest.fn(),
  pan: { value: 0 },
});

/** テスト用の AudioContext モックをグローバルにセットアップする */
export const setupAudioContextMock = (): void => {
  (window as { AudioContext?: typeof AudioContext }).AudioContext = jest
    .fn()
    .mockImplementation(() => ({
      createOscillator: jest.fn(() => createMockOscillator()),
      createGain: jest.fn(() => createMockGain()),
      createStereoPanner: jest.fn(() => createMockPanner()),
      destination: {},
      currentTime: 0,
    }));
};
