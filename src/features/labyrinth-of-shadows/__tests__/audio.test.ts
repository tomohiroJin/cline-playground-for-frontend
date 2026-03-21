import { AudioService } from '../audio';
import { setupAudioContextMock } from './helpers/audio-mock';

// AudioContext のモック（共通ヘルパー使用）
beforeAll(() => {
  setupAudioContextMock();
});

beforeEach(() => {
  // 各テストの前にAudioServiceの状態をリセット
  AudioService.ctx = null;
  AudioService.bgmOsc = null;
  AudioService.bgmGain = null;
  AudioService.bgmOsc2 = null;
  AudioService.bgmGain2 = null;
  AudioService.bgmLfo = null;
  AudioService.bgmRunning = false;
});

describe('labyrinth-of-shadows/audio', () => {
  describe('play', () => {
    test('効果音を再生する', () => {
      AudioService.play('footstep', 0.3);
      expect(AudioService.ctx).not.toBeNull();
    });

    test('異なる効果音タイプで再生できる', () => {
      AudioService.play('key', 0.45);
      AudioService.play('hurt', 0.5);
      AudioService.play('heal', 0.4);
      expect(AudioService.ctx).not.toBeNull();
    });
  });

  describe('playSpatial', () => {
    test('空間音響付きで再生する', () => {
      AudioService.playSpatial('enemy', 0.3, -0.5);
      expect(AudioService.ctx).not.toBeNull();
    });
  });

  describe('BGM', () => {
    test('BGMを開始できる', () => {
      AudioService.startBGM();
      expect(AudioService.bgmRunning).toBe(true);
    });

    test('BGMを停止できる', () => {
      AudioService.startBGM();
      AudioService.stopBGM();
      expect(AudioService.bgmRunning).toBe(false);
      expect(AudioService.bgmOsc).toBeNull();
    });

    test('二重開始を防止する', () => {
      AudioService.startBGM();
      const osc = AudioService.bgmOsc;
      AudioService.startBGM();
      expect(AudioService.bgmOsc).toBe(osc);
    });

    test('BGMの危険度を更新できる', () => {
      AudioService.startBGM();
      // エラーなく実行されることを確認
      AudioService.updateBGM(0.5);
      AudioService.updateBGM(0);
      AudioService.updateBGM(1);
      expect(AudioService.bgmRunning).toBe(true);
    });
  });
});
