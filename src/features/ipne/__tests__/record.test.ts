/**
 * ゲーム記録システムのテスト
 */
import {
  STORAGE_KEYS,
  createRecord,
  loadBestRecords,
  saveBestRecords,
  isBestRecord,
  updateBestRecord,
  saveRecord,
  clearRecords,
  getBestRecordForClass,
  getAllBestRecords,
} from '../record';
import { PlayerClass, Rating } from '../types';

describe('record', () => {
  // テスト前にローカルストレージをクリア
  beforeEach(() => {
    localStorage.clear();
  });

  describe('STORAGE_KEYS', () => {
    test('ストレージキーが正しく設定されていること', () => {
      expect(STORAGE_KEYS.BEST_RECORDS).toBe('ipne_best_records');
      expect(STORAGE_KEYS.TUTORIAL_COMPLETED).toBe('ipne_tutorial_completed');
    });
  });

  describe('createRecord', () => {
    test('ゲーム記録を作成すること', () => {
      const record = createRecord(120000, Rating.S, PlayerClass.WARRIOR);

      expect(record.time).toBe(120000);
      expect(record.rating).toBe(Rating.S);
      expect(record.playerClass).toBe(PlayerClass.WARRIOR);
      expect(record.date).toBeDefined();
    });

    test('日付がISO形式であること', () => {
      const record = createRecord(120000, Rating.S, PlayerClass.WARRIOR);
      const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

      expect(record.date).toMatch(dateRegex);
    });
  });

  describe('loadBestRecords', () => {
    test('記録がない場合は空オブジェクトを返すこと', () => {
      const records = loadBestRecords();
      expect(records).toEqual({});
    });

    test('保存された記録を読み込むこと', () => {
      const testRecord = {
        [PlayerClass.WARRIOR]: {
          time: 100000,
          rating: Rating.S,
          playerClass: PlayerClass.WARRIOR,
          date: '2024-01-01T00:00:00.000Z',
        },
      };
      localStorage.setItem(STORAGE_KEYS.BEST_RECORDS, JSON.stringify(testRecord));

      const records = loadBestRecords();
      expect(records[PlayerClass.WARRIOR]?.time).toBe(100000);
    });

    test('不正なJSONの場合は空オブジェクトを返すこと', () => {
      localStorage.setItem(STORAGE_KEYS.BEST_RECORDS, 'invalid json');

      const records = loadBestRecords();
      expect(records).toEqual({});
    });
  });

  describe('saveBestRecords', () => {
    test('記録を保存すること', () => {
      const records = {
        [PlayerClass.WARRIOR]: {
          time: 100000,
          rating: Rating.S,
          playerClass: PlayerClass.WARRIOR,
          date: '2024-01-01T00:00:00.000Z',
        },
      };

      saveBestRecords(records);

      const stored = localStorage.getItem(STORAGE_KEYS.BEST_RECORDS);
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)[PlayerClass.WARRIOR].time).toBe(100000);
    });
  });

  describe('isBestRecord', () => {
    test('ベスト記録がない場合はtrueを返すこと', () => {
      const record = createRecord(120000, Rating.S, PlayerClass.WARRIOR);
      expect(isBestRecord(record, undefined)).toBe(true);
    });

    test('タイムが短い場合はtrueを返すこと', () => {
      const newRecord = createRecord(100000, Rating.S, PlayerClass.WARRIOR);
      const currentBest = createRecord(120000, Rating.S, PlayerClass.WARRIOR);

      expect(isBestRecord(newRecord, currentBest)).toBe(true);
    });

    test('タイムが長い場合はfalseを返すこと', () => {
      const newRecord = createRecord(150000, Rating.A, PlayerClass.WARRIOR);
      const currentBest = createRecord(120000, Rating.S, PlayerClass.WARRIOR);

      expect(isBestRecord(newRecord, currentBest)).toBe(false);
    });

    test('タイムが同じ場合はfalseを返すこと', () => {
      const newRecord = createRecord(120000, Rating.S, PlayerClass.WARRIOR);
      const currentBest = createRecord(120000, Rating.S, PlayerClass.WARRIOR);

      expect(isBestRecord(newRecord, currentBest)).toBe(false);
    });
  });

  describe('updateBestRecord', () => {
    test('ベスト記録がない場合は更新すること', () => {
      const record = createRecord(120000, Rating.S, PlayerClass.WARRIOR);
      const { records, isNewBest } = updateBestRecord(record, {});

      expect(isNewBest).toBe(true);
      expect(records[PlayerClass.WARRIOR]?.time).toBe(120000);
    });

    test('ベスト記録より速い場合は更新すること', () => {
      const existingRecords = {
        [PlayerClass.WARRIOR]: createRecord(150000, Rating.A, PlayerClass.WARRIOR),
      };
      const newRecord = createRecord(100000, Rating.S, PlayerClass.WARRIOR);

      const { records, isNewBest } = updateBestRecord(newRecord, existingRecords);

      expect(isNewBest).toBe(true);
      expect(records[PlayerClass.WARRIOR]?.time).toBe(100000);
    });

    test('ベスト記録より遅い場合は更新しないこと', () => {
      const existingRecords = {
        [PlayerClass.WARRIOR]: createRecord(100000, Rating.S, PlayerClass.WARRIOR),
      };
      const newRecord = createRecord(150000, Rating.A, PlayerClass.WARRIOR);

      const { records, isNewBest } = updateBestRecord(newRecord, existingRecords);

      expect(isNewBest).toBe(false);
      expect(records[PlayerClass.WARRIOR]?.time).toBe(100000);
    });

    test('別の職業の記録に影響しないこと', () => {
      const existingRecords = {
        [PlayerClass.WARRIOR]: createRecord(100000, Rating.S, PlayerClass.WARRIOR),
      };
      const newRecord = createRecord(150000, Rating.A, PlayerClass.THIEF);

      const { records } = updateBestRecord(newRecord, existingRecords);

      expect(records[PlayerClass.WARRIOR]?.time).toBe(100000);
      expect(records[PlayerClass.THIEF]?.time).toBe(150000);
    });
  });

  describe('saveRecord', () => {
    test('記録を保存してベスト記録を更新すること', () => {
      const record = createRecord(120000, Rating.S, PlayerClass.WARRIOR);
      const { isNewBest } = saveRecord(record);

      expect(isNewBest).toBe(true);

      const stored = loadBestRecords();
      expect(stored[PlayerClass.WARRIOR]?.time).toBe(120000);
    });
  });

  describe('clearRecords', () => {
    test('全ての記録をクリアすること', () => {
      const record = createRecord(120000, Rating.S, PlayerClass.WARRIOR);
      saveRecord(record);
      localStorage.setItem(STORAGE_KEYS.TUTORIAL_COMPLETED, 'true');

      clearRecords();

      expect(localStorage.getItem(STORAGE_KEYS.BEST_RECORDS)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.TUTORIAL_COMPLETED)).toBeNull();
    });
  });

  describe('getBestRecordForClass', () => {
    test('指定職業のベスト記録を取得すること', () => {
      const record = createRecord(120000, Rating.S, PlayerClass.WARRIOR);
      saveRecord(record);

      const bestRecord = getBestRecordForClass(PlayerClass.WARRIOR);
      expect(bestRecord?.time).toBe(120000);
    });

    test('記録がない場合はundefinedを返すこと', () => {
      const bestRecord = getBestRecordForClass(PlayerClass.THIEF);
      expect(bestRecord).toBeUndefined();
    });
  });

  describe('getAllBestRecords', () => {
    test('全職業のベスト記録を取得すること', () => {
      saveRecord(createRecord(100000, Rating.S, PlayerClass.WARRIOR));
      saveRecord(createRecord(150000, Rating.A, PlayerClass.THIEF));

      const allRecords = getAllBestRecords();

      expect(allRecords).toHaveLength(2);
      expect(allRecords.find(r => r.playerClass === PlayerClass.WARRIOR)?.record.time).toBe(100000);
      expect(allRecords.find(r => r.playerClass === PlayerClass.THIEF)?.record.time).toBe(150000);
    });

    test('記録がない場合は空配列を返すこと', () => {
      const allRecords = getAllBestRecords();
      expect(allRecords).toEqual([]);
    });
  });
});
