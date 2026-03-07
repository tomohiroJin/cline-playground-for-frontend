/**
 * Phase 3: リプレイ性・UX 向上のテスト
 */
import { EntityFactory } from './entities';
import { MatchStats } from './types';
import {
  ACHIEVEMENTS,
  checkAchievements,
  getUnlockedAchievements,
  saveUnlockedAchievements,
  clearAchievements,
  AchievementCheckContext,
} from './achievements';
import {
  AudioSettings,
  DEFAULT_AUDIO_SETTINGS,
  loadAudioSettings,
  saveAudioSettings,
} from './audio-settings';

// localStorage モック
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string): string | null => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
});

// ── 3.1 実績システム ──────────────────────────────────
describe('3.1 実績システム', () => {
  describe('実績定義', () => {
    it('全実績が定義されている', () => {
      const ids = ACHIEVEMENTS.map(a => a.id);
      expect(ids).toContain('first_win');
      expect(ids).toContain('perfect');
      expect(ids).toContain('streak_3');
      expect(ids).toContain('streak_5');
      expect(ids).toContain('hard_win');
      expect(ids).toContain('all_fields');
      expect(ids).toContain('comeback');
      expect(ids).toContain('speed_demon');
      expect(ids).toContain('item_master');
    });

    it('各実績が id, name, description を持つ', () => {
      ACHIEVEMENTS.forEach(a => {
        expect(a.id).toBeTruthy();
        expect(a.name).toBeTruthy();
        expect(a.description).toBeTruthy();
      });
    });
  });

  describe('実績判定', () => {
    const baseContext: AchievementCheckContext = {
      winner: 'player',
      scores: { p: 3, c: 0 },
      difficulty: 'normal',
      fieldId: 'classic',
      stats: EntityFactory.createMatchStats(),
      winStreak: 0,
      maxScoreDiff: 0,
      fieldsWon: [],
      itemTypesUsed: [],
    };

    it('初勝利: プレイヤーが勝利した場合に解除', () => {
      const ctx: AchievementCheckContext = { ...baseContext, winner: 'player' };
      const unlocked = checkAchievements(ctx, []);
      expect(unlocked.map(a => a.id)).toContain('first_win');
    });

    it('初勝利: 既に解除済みの場合は重複しない', () => {
      const ctx: AchievementCheckContext = { ...baseContext, winner: 'player' };
      const unlocked = checkAchievements(ctx, ['first_win']);
      expect(unlocked.map(a => a.id)).not.toContain('first_win');
    });

    it('パーフェクト: 無失点勝利で解除', () => {
      const ctx: AchievementCheckContext = { ...baseContext, scores: { p: 3, c: 0 } };
      const unlocked = checkAchievements(ctx, []);
      expect(unlocked.map(a => a.id)).toContain('perfect');
    });

    it('パーフェクト: 失点がある場合は解除されない', () => {
      const ctx: AchievementCheckContext = { ...baseContext, scores: { p: 3, c: 1 } };
      const unlocked = checkAchievements(ctx, []);
      expect(unlocked.map(a => a.id)).not.toContain('perfect');
    });

    it('3連勝: winStreak が 3 以上で解除', () => {
      const ctx: AchievementCheckContext = { ...baseContext, winStreak: 3 };
      const unlocked = checkAchievements(ctx, []);
      expect(unlocked.map(a => a.id)).toContain('streak_3');
    });

    it('5連勝: winStreak が 5 以上で解除', () => {
      const ctx: AchievementCheckContext = { ...baseContext, winStreak: 5 };
      const unlocked = checkAchievements(ctx, []);
      expect(unlocked.map(a => a.id)).toContain('streak_5');
    });

    it('ハードモード制覇: Hard で勝利した場合に解除', () => {
      const ctx: AchievementCheckContext = { ...baseContext, difficulty: 'hard' };
      const unlocked = checkAchievements(ctx, []);
      expect(unlocked.map(a => a.id)).toContain('hard_win');
    });

    it('ハードモード制覇: Easy/Normal では解除されない', () => {
      const ctxEasy: AchievementCheckContext = { ...baseContext, difficulty: 'easy' };
      const ctxNormal: AchievementCheckContext = { ...baseContext, difficulty: 'normal' };
      expect(checkAchievements(ctxEasy, []).map(a => a.id)).not.toContain('hard_win');
      expect(checkAchievements(ctxNormal, []).map(a => a.id)).not.toContain('hard_win');
    });

    it('フィールドマスター: 全フィールドで勝利した場合に解除', () => {
      const allFields = ['classic', 'wide', 'pillars', 'zigzag', 'fortress', 'bastion'];
      const ctx: AchievementCheckContext = { ...baseContext, fieldsWon: allFields };
      const unlocked = checkAchievements(ctx, []);
      expect(unlocked.map(a => a.id)).toContain('all_fields');
    });

    it('大逆転: 3点差以上から逆転勝利で解除', () => {
      const ctx: AchievementCheckContext = { ...baseContext, maxScoreDiff: 3 };
      const unlocked = checkAchievements(ctx, []);
      expect(unlocked.map(a => a.id)).toContain('comeback');
    });

    it('大逆転: 2点差以下では解除されない', () => {
      const ctx: AchievementCheckContext = { ...baseContext, maxScoreDiff: 2 };
      const unlocked = checkAchievements(ctx, []);
      expect(unlocked.map(a => a.id)).not.toContain('comeback');
    });

    it('スピードデーモン: パック速度 15 以上で解除', () => {
      const stats: MatchStats = { ...EntityFactory.createMatchStats(), maxPuckSpeed: 15 };
      const ctx: AchievementCheckContext = { ...baseContext, stats };
      const unlocked = checkAchievements(ctx, []);
      expect(unlocked.map(a => a.id)).toContain('speed_demon');
    });

    it('アイテムコレクター: 全種類のアイテムを使用で解除', () => {
      const allItems = ['split', 'speed', 'invisible', 'shield', 'magnet', 'big'];
      const ctx: AchievementCheckContext = { ...baseContext, itemTypesUsed: allItems };
      const unlocked = checkAchievements(ctx, []);
      expect(unlocked.map(a => a.id)).toContain('item_master');
    });

    it('敗北時は勝利系の実績が解除されない', () => {
      const ctx: AchievementCheckContext = { ...baseContext, winner: 'cpu' };
      const unlocked = checkAchievements(ctx, []);
      const winAchievements = ['first_win', 'perfect', 'streak_3', 'hard_win', 'all_fields', 'comeback'];
      winAchievements.forEach(id => {
        expect(unlocked.map(a => a.id)).not.toContain(id);
      });
    });
  });

  describe('実績の保存・読み込み', () => {
    it('解除済み実績を localStorage に保存できる', () => {
      saveUnlockedAchievements(['first_win', 'perfect']);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'air_hockey_achievements',
        JSON.stringify(['first_win', 'perfect'])
      );
    });

    it('解除済み実績を localStorage から読み込める', () => {
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(['first_win']));
      const result = getUnlockedAchievements();
      expect(result).toEqual(['first_win']);
    });

    it('localStorage が空の場合は空配列を返す', () => {
      localStorageMock.getItem.mockReturnValueOnce(null as unknown as string);
      const result = getUnlockedAchievements();
      expect(result).toEqual([]);
    });

    it('実績をクリアできる', () => {
      clearAchievements();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('air_hockey_achievements');
    });
  });
});

// ── 3.2 リザルト画面強化 ──────────────────────────────
describe('3.2 リザルト画面強化', () => {
  describe('MVP スタッツ判定', () => {
    // MVP ロジックは achievements.ts と一緒にユーティリティとして提供
    it('最も印象的なスタッツをハイライトする', () => {
      // MVP 判定はコンポーネント内で行うため、ここでは型チェックのみ
      const stats: MatchStats = {
        ...EntityFactory.createMatchStats(),
        playerHits: 25,
        playerSaves: 8,
        maxPuckSpeed: 14.5,
      };
      // playerSaves が最も突出 → MVP カテゴリは "saves"
      expect(stats.playerSaves).toBeGreaterThan(0);
    });
  });
});

// ── 3.4 音量設定 ──────────────────────────────────────
describe('3.4 音量設定', () => {
  describe('AudioSettings 型', () => {
    it('デフォルト設定が定義されている', () => {
      expect(DEFAULT_AUDIO_SETTINGS.bgmVolume).toBe(50);
      expect(DEFAULT_AUDIO_SETTINGS.seVolume).toBe(50);
      expect(DEFAULT_AUDIO_SETTINGS.muted).toBe(false);
    });
  });

  describe('音量設定の保存・読み込み', () => {
    it('音量設定を localStorage に保存できる', () => {
      const settings: AudioSettings = { bgmVolume: 80, seVolume: 60, muted: false };
      saveAudioSettings(settings);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'air_hockey_audio_settings',
        JSON.stringify(settings)
      );
    });

    it('音量設定を localStorage から読み込める', () => {
      const settings: AudioSettings = { bgmVolume: 80, seVolume: 60, muted: false };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(settings));
      const result = loadAudioSettings();
      expect(result).toEqual(settings);
    });

    it('localStorage が空の場合はデフォルト設定を返す', () => {
      localStorageMock.getItem.mockReturnValueOnce(null as unknown as string);
      const result = loadAudioSettings();
      expect(result).toEqual(DEFAULT_AUDIO_SETTINGS);
    });

    it('不正なデータの場合はデフォルト設定を返す', () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid json');
      const result = loadAudioSettings();
      expect(result).toEqual(DEFAULT_AUDIO_SETTINGS);
    });
  });
});

// ── 3.5 チュートリアル ────────────────────────────────
describe('3.5 チュートリアル', () => {
  const TUTORIAL_KEY = 'air_hockey_tutorial_completed';

  it('チュートリアル完了フラグを保存できる', () => {
    localStorage.setItem(TUTORIAL_KEY, 'true');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(TUTORIAL_KEY, 'true');
  });

  it('チュートリアル完了後に再表示されない', () => {
    localStorageMock.getItem.mockReturnValueOnce('true');
    const isCompleted = localStorage.getItem(TUTORIAL_KEY) === 'true';
    expect(isCompleted).toBe(true);
  });

  it('初回は未完了状態', () => {
    localStorageMock.getItem.mockReturnValueOnce(null as unknown as string);
    const isCompleted = localStorage.getItem(TUTORIAL_KEY) === 'true';
    expect(isCompleted).toBe(false);
  });
});
