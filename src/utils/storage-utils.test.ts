import {
  extractImageName,
  addClearHistory,
  getClearHistory,
  saveClearHistory,
  ClearHistory,
  getPuzzleRecords,
  savePuzzleRecords,
  recordScore,
  migrateClearHistory,
} from './storage-utils';
import { PuzzleScore, PuzzleRecord } from '../types/puzzle';

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

  describe('getPuzzleRecords', () => {
    it('ローカルストレージが空の場合は空の配列を返す', () => {
      expect(getPuzzleRecords()).toEqual([]);
    });

    it('保存された記録を取得する', () => {
      const records: PuzzleRecord[] = [
        {
          imageId: 'test_image',
          division: 4,
          bestScore: 7000,
          bestRank: '★★☆',
          bestTime: 120,
          bestMoves: 40,
          clearCount: 1,
          lastClearDate: '2025-04-09T12:00:00.000Z',
        },
      ];
      localStorageMock.setItem('puzzle_records', JSON.stringify(records));
      expect(getPuzzleRecords()).toEqual(records);
    });
  });

  describe('savePuzzleRecords', () => {
    it('記録を保存する', () => {
      const records: PuzzleRecord[] = [
        {
          imageId: 'test_image',
          division: 4,
          bestScore: 7000,
          bestRank: '★★☆',
          bestTime: 120,
          bestMoves: 40,
          clearCount: 1,
          lastClearDate: '2025-04-09T12:00:00.000Z',
        },
      ];
      savePuzzleRecords(records);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'puzzle_records',
        JSON.stringify(records)
      );
    });
  });

  describe('recordScore', () => {
    const mockScore: PuzzleScore = {
      totalScore: 7000,
      moveCount: 40,
      elapsedTime: 120,
      hintUsed: false,
      division: 4,
      rank: '★★☆',
      shuffleMoves: 32,
    };

    beforeEach(() => {
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-04-09T12:00:00.000Z');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('新規記録を作成しisBestScore=trueを返す', () => {
      const { record, isBestScore } = recordScore('test_image', 4, mockScore);

      expect(isBestScore).toBe(true);
      expect(record.imageId).toBe('test_image');
      expect(record.division).toBe(4);
      expect(record.bestScore).toBe(7000);
      expect(record.bestRank).toBe('★★☆');
      expect(record.clearCount).toBe(1);
    });

    it('既存記録を更新しベスト更新時にisBestScore=trueを返す', () => {
      const existing: PuzzleRecord[] = [
        {
          imageId: 'test_image',
          division: 4,
          bestScore: 5000,
          bestRank: '★★☆',
          bestTime: 200,
          bestMoves: 50,
          clearCount: 1,
          lastClearDate: '2025-04-08T12:00:00.000Z',
        },
      ];
      localStorageMock.setItem('puzzle_records', JSON.stringify(existing));

      const { record, isBestScore } = recordScore('test_image', 4, mockScore);

      expect(isBestScore).toBe(true);
      expect(record.bestScore).toBe(7000);
      expect(record.bestTime).toBe(120);
      expect(record.bestMoves).toBe(40);
      expect(record.clearCount).toBe(2);
    });

    it('既存記録のベストスコアを下回る場合isBestScore=falseを返す', () => {
      const existing: PuzzleRecord[] = [
        {
          imageId: 'test_image',
          division: 4,
          bestScore: 9000,
          bestRank: '★★★',
          bestTime: 60,
          bestMoves: 32,
          clearCount: 1,
          lastClearDate: '2025-04-08T12:00:00.000Z',
        },
      ];
      localStorageMock.setItem('puzzle_records', JSON.stringify(existing));

      const { record, isBestScore } = recordScore('test_image', 4, mockScore);

      expect(isBestScore).toBe(false);
      expect(record.bestScore).toBe(9000);
      expect(record.bestRank).toBe('★★★');
      expect(record.clearCount).toBe(2);
    });

    it('異なる難易度の場合は新規記録として作成する', () => {
      const existing: PuzzleRecord[] = [
        {
          imageId: 'test_image',
          division: 3,
          bestScore: 5000,
          bestRank: '★★☆',
          bestTime: 200,
          bestMoves: 50,
          clearCount: 1,
          lastClearDate: '2025-04-08T12:00:00.000Z',
        },
      ];
      localStorageMock.setItem('puzzle_records', JSON.stringify(existing));

      const { record, isBestScore } = recordScore('test_image', 4, mockScore);

      expect(isBestScore).toBe(true);
      expect(record.division).toBe(4);
    });
  });

  describe('migrateClearHistory', () => {
    beforeEach(() => {
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-04-09T12:00:00.000Z');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('マイグレーション済みの場合は何もしない', () => {
      localStorageMock.setItem('puzzle_migration_v1', 'done');
      migrateClearHistory();
      // puzzle_records が設定されていないことを確認
      expect(localStorageMock.getItem('puzzle_records')).toBeNull();
    });

    it('クリア履歴が空の場合はマイグレーション済みフラグのみ設定する', () => {
      migrateClearHistory();
      expect(localStorageMock.getItem('puzzle_migration_v1')).toBe('done');
    });

    it('クリア履歴をPuzzleRecordに変換する', () => {
      const history: ClearHistory[] = [
        {
          id: '1',
          imageName: 'image_a',
          clearTime: 120,
          clearDate: '2025-04-08T12:00:00.000Z',
        },
        {
          id: '2',
          imageName: 'image_a',
          clearTime: 90,
          clearDate: '2025-04-09T12:00:00.000Z',
        },
        {
          id: '3',
          imageName: 'image_b',
          clearTime: 200,
          clearDate: '2025-04-07T12:00:00.000Z',
        },
      ];
      localStorageMock.setItem('puzzle_clear_history', JSON.stringify(history));

      migrateClearHistory();

      const records = JSON.parse(
        localStorageMock.getItem('puzzle_records')!
      ) as PuzzleRecord[];
      expect(records.length).toBe(2);

      const imageA = records.find(r => r.imageId === 'image_a')!;
      expect(imageA.clearCount).toBe(2);
      expect(imageA.bestTime).toBe(90);
      expect(imageA.division).toBe(4);
      expect(imageA.bestScore).toBe(0);

      const imageB = records.find(r => r.imageId === 'image_b')!;
      expect(imageB.clearCount).toBe(1);
      expect(imageB.bestTime).toBe(200);

      expect(localStorageMock.getItem('puzzle_migration_v1')).toBe('done');
    });

    it('二重実行を防ぐ', () => {
      const history: ClearHistory[] = [
        {
          id: '1',
          imageName: 'image_a',
          clearTime: 120,
          clearDate: '2025-04-08T12:00:00.000Z',
        },
      ];
      localStorageMock.setItem('puzzle_clear_history', JSON.stringify(history));

      migrateClearHistory();
      const firstRecords = localStorageMock.getItem('puzzle_records');

      // 2回目の呼び出し
      migrateClearHistory();
      const secondRecords = localStorageMock.getItem('puzzle_records');

      expect(firstRecords).toBe(secondRecords);
    });
  });
});
