import {
  extractImageName,
  addClearHistory,
  getClearHistory,
  saveClearHistory,
  ClearHistory,
} from './storage-utils';

// モックのlocalStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => {
      return store[key] || null;
    }),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

// グローバルオブジェクトのlocalStorageをモックに置き換え
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('storage-utils', () => {
  beforeEach(() => {
    // 各テスト前にlocalStorageをクリア
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('extractImageName', () => {
    it('ファイルパスからファイル名を抽出する', () => {
      const filePath = '/images/default/sunset_candy_shop.webp';
      expect(extractImageName(filePath)).toBe('sunset_candy_shop');
    });

    it('空の文字列の場合は「Unknown」を返す', () => {
      expect(extractImageName('')).toBe('Unknown');
    });

    it('undefinedの場合は「Unknown」を返す', () => {
      expect(extractImageName(undefined as unknown as string)).toBe('Unknown');
    });
  });

  describe('getClearHistory', () => {
    it('ローカルストレージが空の場合は空の配列を返す', () => {
      const history = getClearHistory();
      expect(history).toEqual([]);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('puzzle_clear_history');
    });

    it('ローカルストレージから履歴を取得する', () => {
      const mockHistory: ClearHistory[] = [
        {
          id: '123',
          imageName: 'test_image',
          clearTime: 120,
          clearDate: '2025-04-09T12:00:00.000Z',
        },
      ];
      localStorageMock.setItem('puzzle_clear_history', JSON.stringify(mockHistory));

      const history = getClearHistory();
      expect(history).toEqual(mockHistory);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('puzzle_clear_history');
    });

    it('JSONパースエラーが発生した場合は空の配列を返す', () => {
      localStorageMock.setItem('puzzle_clear_history', 'invalid-json');

      // コンソールエラーをスパイ
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const history = getClearHistory();
      expect(history).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('saveClearHistory', () => {
    it('履歴をローカルストレージに保存する', () => {
      const mockHistory: ClearHistory[] = [
        {
          id: '123',
          imageName: 'test_image',
          clearTime: 120,
          clearDate: '2025-04-09T12:00:00.000Z',
        },
      ];

      saveClearHistory(mockHistory);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'puzzle_clear_history',
        JSON.stringify(mockHistory)
      );
    });

    it('保存時にエラーが発生した場合はコンソールにエラーを出力する', () => {
      const mockHistory: ClearHistory[] = [
        {
          id: '123',
          imageName: 'test_image',
          clearTime: 120,
          clearDate: '2025-04-09T12:00:00.000Z',
        },
      ];

      // setItemでエラーを発生させる
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      // コンソールエラーをスパイ
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      saveClearHistory(mockHistory);

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('addClearHistory', () => {
    beforeEach(() => {
      // Date.toISOStringをモック
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-04-09T12:00:00.000Z');

      // generateIdをモック（内部関数なのでモジュール全体をモック）
      jest.spyOn(Math, 'random').mockReturnValue(0.123456789);
    });

    afterEach(() => {
      // モックをリセット
      jest.restoreAllMocks();
    });

    it('新しいクリア履歴を追加する', () => {
      const updatedHistory = addClearHistory('test_image', 120);

      // 履歴が正しく追加されていることを確認
      expect(updatedHistory.length).toBe(1);
      expect(updatedHistory[0].imageName).toBe('test_image');
      expect(updatedHistory[0].clearTime).toBe(120);
      expect(updatedHistory[0].clearDate).toBe('2025-04-09T12:00:00.000Z');
      expect(updatedHistory[0].id).toBeDefined();

      // ローカルストレージに保存されたことを確認
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('既存の履歴に新しい履歴を追加する', () => {
      const existingHistory: ClearHistory[] = [
        {
          id: 'existing-id',
          imageName: 'existing_image',
          clearTime: 180,
          clearDate: '2025-04-08T12:00:00.000Z',
        },
      ];

      localStorageMock.setItem('puzzle_clear_history', JSON.stringify(existingHistory));

      const updatedHistory = addClearHistory('new_image', 150);

      // 新しい履歴が先頭に追加されていることを確認
      expect(updatedHistory.length).toBe(2);
      expect(updatedHistory[0].imageName).toBe('new_image');
      expect(updatedHistory[0].clearTime).toBe(150);
      expect(updatedHistory[1].imageName).toBe('existing_image');
    });
  });
});
