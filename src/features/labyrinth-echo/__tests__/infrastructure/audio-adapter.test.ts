/**
 * 迷宮の残響 - AudioAdapter / NullAudioAdapter テスト
 *
 * AudioPort の実装を検証する。
 * AudioEngine はモック化し、マッピングと制御フローのみをテストする。
 */
import { AudioAdapter, NullAudioAdapter } from '../../infrastructure/audio/audio-adapter';
import type { SfxType, EventMood } from '../../application/ports/audio-port';

/** AudioEngine のモック */
const createMockAudioEngine = () => ({
  init: jest.fn(),
  resume: jest.fn(),
  sfx: {
    tick: jest.fn(),
    hit: jest.fn(),
    bigHit: jest.fn(),
    heal: jest.fn(),
    status: jest.fn(),
    clear: jest.fn(),
    floor: jest.fn(),
    over: jest.fn(),
    victory: jest.fn(),
    choice: jest.fn(),
    drain: jest.fn(),
    levelUp: jest.fn(),
    page: jest.fn(),
    unlock: jest.fn(),
    titleGlow: jest.fn(),
    endingFanfare: jest.fn(),
    curseApply: jest.fn(),
    secondLife: jest.fn(),
    ambient: jest.fn(),
  },
  bgm: {
    startFloorBgm: jest.fn(),
    stopBgm: jest.fn(),
    setEventMood: jest.fn(),
    updateCrisis: jest.fn(),
    setBgmVolume: jest.fn(),
    currentVolume: 0.5,
  },
});

describe('AudioAdapter', () => {
  let adapter: AudioAdapter;
  let mockEngine: ReturnType<typeof createMockAudioEngine>;

  beforeEach(() => {
    mockEngine = createMockAudioEngine();
    adapter = new AudioAdapter(mockEngine);
  });

  describe('initialize', () => {
    it('AudioEngine を初期化し resume を呼ぶ', () => {
      // Act
      adapter.initialize();

      // Assert
      expect(mockEngine.init).toHaveBeenCalled();
      expect(mockEngine.resume).toHaveBeenCalled();
    });
  });

  describe('playSfx', () => {
    /** 全 SfxType のマッピング検証 */
    const sfxTypes: SfxType[] = [
      'tick', 'hit', 'bigHit', 'heal',
      'status', 'clear', 'floor', 'over',
      'victory', 'choice', 'drain', 'levelUp',
      'page', 'unlock', 'titleGlow',
      'endingFanfare', 'curseApply', 'secondLife',
      'ambient',
    ];

    it.each(sfxTypes)(
      'SfxType "%s" が対応する AudioEngine メソッドを呼び出す',
      (sfxType) => {
        // Act
        adapter.playSfx(sfxType);

        // Assert
        expect(mockEngine.sfx[sfxType]).toHaveBeenCalled();
      }
    );
  });

  describe('startBgm', () => {
    it('指定フロアの BGM を開始する', () => {
      // Act
      adapter.startBgm(3);

      // Assert
      expect(mockEngine.bgm.startFloorBgm).toHaveBeenCalledWith(3);
    });
  });

  describe('stopBgm', () => {
    it('BGM を停止する', () => {
      // Act
      adapter.stopBgm();

      // Assert
      expect(mockEngine.bgm.stopBgm).toHaveBeenCalled();
    });
  });

  describe('setMood', () => {
    const moods: EventMood[] = ['exploration', 'encounter', 'trap', 'rest', 'boss'];

    it.each(moods)(
      'EventMood "%s" を AudioEngine に設定する',
      (mood) => {
        // Act
        adapter.setMood(mood);

        // Assert
        expect(mockEngine.bgm.setEventMood).toHaveBeenCalledWith(mood);
      }
    );
  });

  describe('updateCrisis', () => {
    it('HP/MN の割合を AudioEngine に渡す', () => {
      // Act
      adapter.updateCrisis(0.3, 0.15);

      // Assert
      expect(mockEngine.bgm.updateCrisis).toHaveBeenCalledWith(0.3, 0.15);
    });
  });

  describe('setVolume', () => {
    it('BGM 音量を設定する', () => {
      // Act
      adapter.setVolume(0.8);

      // Assert
      expect(mockEngine.bgm.setBgmVolume).toHaveBeenCalledWith(0.8);
    });
  });
});

describe('NullAudioAdapter', () => {
  let adapter: NullAudioAdapter;

  beforeEach(() => {
    adapter = new NullAudioAdapter();
  });

  it('initialize は何もしない', () => {
    expect(() => adapter.initialize()).not.toThrow();
  });

  it('playSfx は何もしない', () => {
    expect(() => adapter.playSfx('hit')).not.toThrow();
  });

  it('startBgm は何もしない', () => {
    expect(() => adapter.startBgm(1)).not.toThrow();
  });

  it('stopBgm は何もしない', () => {
    expect(() => adapter.stopBgm()).not.toThrow();
  });

  it('setMood は何もしない', () => {
    expect(() => adapter.setMood('exploration')).not.toThrow();
  });

  it('updateCrisis は何もしない', () => {
    expect(() => adapter.updateCrisis(0.5, 0.5)).not.toThrow();
  });

  it('setVolume は何もしない', () => {
    expect(() => adapter.setVolume(0.5)).not.toThrow();
  });
});
