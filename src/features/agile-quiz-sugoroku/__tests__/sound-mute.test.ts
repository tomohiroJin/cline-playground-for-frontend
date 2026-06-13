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

import * as Tone from 'tone';
import { setSoundEnabled, isSoundEnabled, initAudio, playSfxCorrect } from '../infrastructure/audio/sound';

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

  describe('ミュートゲートの実効性', () => {
    // initAudio() はモジュールスコープの isAudioInitialized フラグにより 1 度しか実行されない。
    // beforeAll で呼び出してシンセを生成しておき、各テストでモック呼び出し履歴をリセットする。
    beforeAll(() => {
      initAudio();
    });

    beforeEach(() => {
      // Synth は initAudio 内で sfxSynth（results[0]）と tickSynth（results[1]）の順に生成される。
      // mock.results[n].value が実際に返されたオブジェクト（toDestination 適用後の同一参照）。
      const synthResults = (Tone.Synth as unknown as jest.Mock).mock.results;
      synthResults.forEach((result) => {
        if (result.type === 'return') {
          (result.value.triggerAttackRelease as jest.Mock).mockClear();
        }
      });
    });

    it('ミュート中は playSfxCorrect が Synth.triggerAttackRelease を呼び出さない', () => {
      // Arrange: ミュートを有効にする
      setSoundEnabled(false);

      // Act
      playSfxCorrect();

      // Assert: sfxSynth（Synth の 1 番目の返却値）が呼ばれていないこと
      const sfxSynthMock = (Tone.Synth as unknown as jest.Mock).mock.results[0].value;
      expect(sfxSynthMock.triggerAttackRelease).not.toHaveBeenCalled();
    });

    it('ミュート解除後は playSfxCorrect が Synth.triggerAttackRelease を呼び出す', () => {
      // Arrange: サウンドを有効にする
      setSoundEnabled(true);

      // Act
      playSfxCorrect();

      // Assert: sfxSynth（Synth の 1 番目の返却値）が呼ばれていること
      const sfxSynthMock = (Tone.Synth as unknown as jest.Mock).mock.results[0].value;
      expect(sfxSynthMock.triggerAttackRelease).toHaveBeenCalled();
    });
  });
});
