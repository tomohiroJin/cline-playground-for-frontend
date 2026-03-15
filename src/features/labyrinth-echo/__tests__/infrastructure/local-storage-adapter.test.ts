/**
 * 迷宮の残響 - LocalStorageAdapter テスト
 *
 * StoragePort の実装である LocalStorageAdapter の動作を検証する。
 * TDD: テストを先に書き、実装を後から追加する。
 */
import { LocalStorageAdapter, META_KEY, AUDIO_SETTINGS_KEY, DEFAULT_AUDIO_SETTINGS } from '../../infrastructure/storage/local-storage-adapter';
import type { MetaState } from '../../domain/models/meta-state';
import { FRESH_META } from '../../domain/models/meta-state';
import type { AudioSettings } from '../../domain/models/audio-settings';

/** localStorage のモック */
const createMockLocalStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
    get length() { return Object.keys(store).length; },
    key: jest.fn((index: number) => Object.keys(store)[index] ?? null),
    _store: store,
  };
};

describe('LocalStorageAdapter', () => {
  let adapter: LocalStorageAdapter;
  let mockStorage: ReturnType<typeof createMockLocalStorage>;

  beforeEach(() => {
    mockStorage = createMockLocalStorage();
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
    });
    adapter = new LocalStorageAdapter();
  });

  describe('saveMeta / loadMeta', () => {
    describe('正常系', () => {
      it('MetaState を保存し、同じデータを読み込める', async () => {
        // Arrange
        const meta: MetaState = {
          ...FRESH_META,
          runs: 5,
          kp: 10,
          bestFloor: 3,
        };

        // Act
        await adapter.saveMeta(meta);
        const loaded = await adapter.loadMeta();

        // Assert
        expect(loaded).toEqual(meta);
        expect(mockStorage.setItem).toHaveBeenCalledWith(
          META_KEY,
          JSON.stringify(meta)
        );
      });

      it('保存されていない場合は null を返す', async () => {
        // Act
        const loaded = await adapter.loadMeta();

        // Assert
        expect(loaded).toBeNull();
      });
    });

    describe('異常系', () => {
      it('localStorage が利用不可の場合、saveMeta は静かに失敗する', async () => {
        // Arrange
        mockStorage.setItem.mockImplementation(() => {
          throw new Error('QuotaExceededError');
        });
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        // Act & Assert — 例外がスローされないこと
        await expect(adapter.saveMeta(FRESH_META)).resolves.not.toThrow();
        consoleSpy.mockRestore();
      });

      it('localStorage が利用不可の場合、loadMeta は null を返す', async () => {
        // Arrange
        mockStorage.getItem.mockImplementation(() => {
          throw new Error('SecurityError');
        });
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        // Act
        const loaded = await adapter.loadMeta();

        // Assert
        expect(loaded).toBeNull();
        consoleSpy.mockRestore();
      });

      it('破損した JSON データの場合、null を返す', async () => {
        // Arrange
        mockStorage.getItem.mockReturnValue('{ broken json }}}');
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        // Act
        const loaded = await adapter.loadMeta();

        // Assert
        expect(loaded).toBeNull();
        consoleSpy.mockRestore();
      });

      it('不正なスキーマのデータの場合、null を返す', async () => {
        // Arrange — runs が文字列（本来は number）
        mockStorage.getItem.mockReturnValue(JSON.stringify({ runs: 'invalid' }));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        // Act
        const loaded = await adapter.loadMeta();

        // Assert
        expect(loaded).toBeNull();
        consoleSpy.mockRestore();
      });
    });
  });

  describe('resetMeta', () => {
    it('保存されたメタデータを削除する', async () => {
      // Arrange
      await adapter.saveMeta({ ...FRESH_META, runs: 10 });

      // Act
      await adapter.resetMeta();
      const loaded = await adapter.loadMeta();

      // Assert
      expect(loaded).toBeNull();
      expect(mockStorage.removeItem).toHaveBeenCalledWith(META_KEY);
    });

    it('localStorage が利用不可の場合、静かに失敗する', async () => {
      // Arrange
      mockStorage.removeItem.mockImplementation(() => {
        throw new Error('SecurityError');
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(adapter.resetMeta()).resolves.not.toThrow();
      consoleSpy.mockRestore();
    });
  });

  describe('saveAudioSettings / loadAudioSettings', () => {
    describe('正常系', () => {
      it('AudioSettings を保存し、同じデータを読み込める', () => {
        // Arrange
        const settings: AudioSettings = {
          bgmVolume: 0.8,
          sfxVolume: 0.6,
          enabled: true,
        };

        // Act
        adapter.saveAudioSettings(settings);
        const loaded = adapter.loadAudioSettings();

        // Assert
        expect(loaded).toEqual(settings);
        expect(mockStorage.setItem).toHaveBeenCalledWith(
          AUDIO_SETTINGS_KEY,
          JSON.stringify(settings)
        );
      });

      it('保存されていない場合はデフォルト値を返す', () => {
        // Act
        const loaded = adapter.loadAudioSettings();

        // Assert
        expect(loaded).toEqual(DEFAULT_AUDIO_SETTINGS);
      });
    });

    describe('異常系', () => {
      it('localStorage が利用不可の場合、saveAudioSettings は静かに失敗する', () => {
        // Arrange
        mockStorage.setItem.mockImplementation(() => {
          throw new Error('QuotaExceededError');
        });

        // Act & Assert — 例外がスローされないこと
        expect(() =>
          adapter.saveAudioSettings(DEFAULT_AUDIO_SETTINGS)
        ).not.toThrow();
      });

      it('localStorage が利用不可の場合、loadAudioSettings はデフォルト値を返す', () => {
        // Arrange
        mockStorage.getItem.mockImplementation(() => {
          throw new Error('SecurityError');
        });

        // Act
        const loaded = adapter.loadAudioSettings();

        // Assert
        expect(loaded).toEqual(DEFAULT_AUDIO_SETTINGS);
      });

      it('破損した JSON データの場合、デフォルト値を返す', () => {
        // Arrange
        mockStorage.getItem.mockReturnValue('not valid json');

        // Act
        const loaded = adapter.loadAudioSettings();

        // Assert
        expect(loaded).toEqual(DEFAULT_AUDIO_SETTINGS);
      });

      it('プリミティブ値の JSON の場合、デフォルト値を返す', () => {
        // Arrange — JSON.parse は成功するがオブジェクトではない
        mockStorage.getItem.mockReturnValue('"just a string"');

        // Act
        const loaded = adapter.loadAudioSettings();

        // Assert
        expect(loaded).toEqual(DEFAULT_AUDIO_SETTINGS);
      });
    });
  });

  describe('キー定数', () => {
    it('META_KEY が正しい値を持つ', () => {
      expect(META_KEY).toBe('labyrinth-echo-save');
    });

    it('AUDIO_SETTINGS_KEY が正しい値を持つ', () => {
      expect(AUDIO_SETTINGS_KEY).toBe('labyrinth-echo-audio-settings');
    });
  });

  describe('DEFAULT_AUDIO_SETTINGS', () => {
    it('デフォルト値が定義されている', () => {
      expect(DEFAULT_AUDIO_SETTINGS).toEqual({
        bgmVolume: 0.5,
        sfxVolume: 0.7,
        enabled: true,
      });
    });
  });
});
