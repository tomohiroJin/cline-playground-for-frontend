import type { SaveData, DailyData } from '../../types';
import { recordDaily } from './daily-ops';

const createDefault = (overrides?: Partial<SaveData>): SaveData => ({
  pts: 0,
  plays: 0,
  best: 0,
  bestSt: 0,
  sty: ['standard'],
  ui: [],
  eq: ['standard'],
  ...overrides,
});

const TODAY = '2026-03-13';

describe('daily-ops', () => {
  describe('recordDaily', () => {
    it('初回プレイで 50pt の報酬を得る', () => {
      // Arrange
      const data = createDefault({ pts: 100 });

      // Act
      const result = recordDaily(data, 200, TODAY);

      // Assert
      expect(result.reward).toBeGreaterThanOrEqual(50);
      expect(result.data.daily?.firstPlayRewarded).toBe(true);
      expect(result.data.daily?.played).toBe(true);
    });

    it('初回プレイ + ベスト更新で追加報酬を得る', () => {
      // Arrange
      const data = createDefault({ pts: 0 });

      // Act
      const result = recordDaily(data, 500, TODAY);

      // Assert
      // 初回 50 + ベスト更新 Math.floor(500 * 0.1) = 50 → 合計 100
      expect(result.reward).toBe(100);
      expect(result.data.daily?.bestScore).toBe(500);
    });

    it('2回目のプレイでベスト更新なしの場合は報酬 0', () => {
      // Arrange
      const daily: DailyData = {
        date: TODAY,
        played: true,
        bestScore: 500,
        firstPlayRewarded: true,
      };
      const data = createDefault({ pts: 100, daily });

      // Act
      const result = recordDaily(data, 300, TODAY);

      // Assert
      expect(result.reward).toBe(0);
      expect(result.data.daily?.bestScore).toBe(500);
    });

    it('2回目のプレイでベスト更新した場合は差分報酬を得る', () => {
      // Arrange
      const daily: DailyData = {
        date: TODAY,
        played: true,
        bestScore: 300,
        firstPlayRewarded: true,
      };
      const data = createDefault({ pts: 100, daily });

      // Act
      const result = recordDaily(data, 500, TODAY);

      // Assert
      // ベスト更新 Math.floor((500 - 300) * 0.1) = 20
      expect(result.reward).toBe(20);
      expect(result.data.daily?.bestScore).toBe(500);
    });

    it('新しい日付の場合は前日データをリセットして初回扱い', () => {
      // Arrange
      const daily: DailyData = {
        date: '2026-03-12',
        played: true,
        bestScore: 1000,
        firstPlayRewarded: true,
      };
      const data = createDefault({ pts: 50, daily });

      // Act
      const result = recordDaily(data, 200, TODAY);

      // Assert
      expect(result.data.daily?.date).toBe(TODAY);
      expect(result.data.daily?.firstPlayRewarded).toBe(true);
      expect(result.reward).toBeGreaterThanOrEqual(50);
    });

    it('PT が報酬分加算される', () => {
      // Arrange
      const data = createDefault({ pts: 100 });

      // Act
      const result = recordDaily(data, 500, TODAY);

      // Assert
      expect(result.data.pts).toBe(100 + result.reward);
    });

    it('元のデータを変更しない', () => {
      // Arrange
      const data = createDefault({ pts: 100 });
      const originalPts = data.pts;

      // Act
      recordDaily(data, 500, TODAY);

      // Assert
      expect(data.pts).toBe(originalPts);
    });
  });
});
