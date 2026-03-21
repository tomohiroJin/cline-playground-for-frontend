// ============================================================================
// Deep Sea Interceptor - 実績システムのテスト
// ============================================================================

import { checkNewAchievements, loadAchievements, saveAchievements, AchievementList } from '../achievements';
import type { PlayStats, SavedAchievementData } from '../types';

/** テスト用の基本 PlayStats を構築 */
function buildPlayStats(overrides: Partial<PlayStats> = {}): PlayStats {
  return {
    score: 0,
    maxCombo: 0,
    grazeCount: 0,
    livesLost: 0,
    playTime: 600000,
    difficulty: 'standard',
    weaponType: 'torpedo',
    stagesCleared: 0,
    rank: 'D',
    ...overrides,
  };
}

describe('AchievementList', () => {
  it('10個の実績が定義されていること', () => {
    expect(AchievementList).toHaveLength(10);
  });

  it('各実績にid, name, description, conditionがあること', () => {
    AchievementList.forEach(a => {
      expect(a.id).toBeDefined();
      expect(a.name).toBeDefined();
      expect(a.description).toBeDefined();
      expect(typeof a.condition).toBe('function');
    });
  });
});

describe('checkNewAchievements', () => {
  const emptySaved: SavedAchievementData = { unlockedIds: [], lastUpdated: 0 };

  describe('正常系', () => {
    it('初回プレイで「初陣」が解除されること', () => {
      // Arrange
      const stats = buildPlayStats();

      // Act
      const result = checkNewAchievements(stats, emptySaved);

      // Assert
      expect(result.some(a => a.id === 'first_sortie')).toBe(true);
    });

    it('全5ステージクリアで「任務完了」が解除されること', () => {
      // Arrange
      const stats = buildPlayStats({ stagesCleared: 5 });

      // Act
      const result = checkNewAchievements(stats, emptySaved);

      // Assert
      expect(result.some(a => a.id === 'mission_complete')).toBe(true);
    });

    it('コンボ30以上で「コンボマスター」が解除されること', () => {
      // Arrange
      const stats = buildPlayStats({ maxCombo: 30 });

      // Act
      const result = checkNewAchievements(stats, emptySaved);

      // Assert
      expect(result.some(a => a.id === 'combo_master')).toBe(true);
    });

    it('グレイズ50回以上で「グレイズの達人」が解除されること', () => {
      // Arrange
      const stats = buildPlayStats({ grazeCount: 50 });

      // Act
      const result = checkNewAchievements(stats, emptySaved);

      // Assert
      expect(result.some(a => a.id === 'graze_expert')).toBe(true);
    });

    it('無傷クリアで「無傷の深海兵」が解除されること', () => {
      // Arrange
      const stats = buildPlayStats({ livesLost: 0, stagesCleared: 5 });

      // Act
      const result = checkNewAchievements(stats, emptySaved);

      // Assert
      expect(result.some(a => a.id === 'no_damage')).toBe(true);
    });

    it('50000点以上で「スコアハンター」が解除されること', () => {
      // Arrange
      const stats = buildPlayStats({ score: 50000 });

      // Act
      const result = checkNewAchievements(stats, emptySaved);

      // Assert
      expect(result.some(a => a.id === 'score_hunter')).toBe(true);
    });

    it('15分以内クリアで「スピードランナー」が解除されること', () => {
      // Arrange
      const stats = buildPlayStats({ stagesCleared: 5, playTime: 14 * 60 * 1000 });

      // Act
      const result = checkNewAchievements(stats, emptySaved);

      // Assert
      expect(result.some(a => a.id === 'speed_runner')).toBe(true);
    });

    it('ABYSS難易度クリアで「深淵の生還者」が解除されること', () => {
      // Arrange
      const stats = buildPlayStats({ difficulty: 'abyss', stagesCleared: 5 });

      // Act
      const result = checkNewAchievements(stats, emptySaved);

      // Assert
      expect(result.some(a => a.id === 'abyss_survivor')).toBe(true);
    });

    it('バイオミサイルクリアで「ウェポンマスター」が解除されること', () => {
      // Arrange
      const stats = buildPlayStats({ weaponType: 'bioMissile', stagesCleared: 5 });

      // Act
      const result = checkNewAchievements(stats, emptySaved);

      // Assert
      expect(result.some(a => a.id === 'weapon_master')).toBe(true);
    });

    it('ランクSで「Sランク達成」が解除されること', () => {
      // Arrange
      const stats = buildPlayStats({ rank: 'S' });

      // Act
      const result = checkNewAchievements(stats, emptySaved);

      // Assert
      expect(result.some(a => a.id === 'rank_s')).toBe(true);
    });
  });

  describe('異常系', () => {
    it('既に解除済みの実績は返さないこと', () => {
      // Arrange
      const stats = buildPlayStats();
      const saved: SavedAchievementData = {
        unlockedIds: ['first_sortie'],
        lastUpdated: Date.now(),
      };

      // Act
      const result = checkNewAchievements(stats, saved);

      // Assert
      expect(result.some(a => a.id === 'first_sortie')).toBe(false);
    });

    it('条件を満たさない実績は返さないこと', () => {
      // Arrange
      const stats = buildPlayStats({ stagesCleared: 3 });

      // Act
      const result = checkNewAchievements(stats, emptySaved);

      // Assert
      // mission_complete は stagesCleared >= 5 が必要
      expect(result.some(a => a.id === 'mission_complete')).toBe(false);
    });
  });
});

describe('loadAchievements', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('保存データがない場合は空の初期値を返すこと', () => {
    // Act
    const result = loadAchievements();

    // Assert
    expect(result.unlockedIds).toEqual([]);
    expect(result.lastUpdated).toBe(0);
  });

  it('保存データがある場合はパースして返すこと', () => {
    // Arrange
    const data: SavedAchievementData = {
      unlockedIds: ['first_sortie'],
      lastUpdated: 12345,
    };
    localStorage.setItem('deep_sea_interceptor_achievements', JSON.stringify(data));

    // Act
    const result = loadAchievements();

    // Assert
    expect(result.unlockedIds).toEqual(['first_sortie']);
    expect(result.lastUpdated).toBe(12345);
  });

  it('不正なJSONの場合は初期値を返すこと', () => {
    // Arrange
    localStorage.setItem('deep_sea_interceptor_achievements', '{invalid json}');

    // Act
    const result = loadAchievements();

    // Assert
    expect(result.unlockedIds).toEqual([]);
    expect(result.lastUpdated).toBe(0);
  });
});

describe('saveAchievements', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('実績データをlocalStorageに保存できること', () => {
    // Arrange
    const data: SavedAchievementData = {
      unlockedIds: ['first_sortie', 'combo_master'],
      lastUpdated: Date.now(),
    };

    // Act
    saveAchievements(data);

    // Assert
    const stored = localStorage.getItem('deep_sea_interceptor_achievements');
    expect(stored).toBeDefined();
    const parsed = JSON.parse(stored!);
    expect(parsed.unlockedIds).toEqual(['first_sortie', 'combo_master']);
  });
});
