/**
 * Phase 4: 統合テスト
 * ストーリーモード全体フロー・バランス整合性・クロスモジュール連携
 */
import { CHAPTER_1_STAGES } from './dialogue-data';
import {
  loadStoryProgress,
  saveStoryProgress,
  resetStoryProgress,
  isStageUnlocked,
} from './story';
import type { StoryProgress } from './story';
import {
  PLAYER_CHARACTER,
  STORY_CHARACTERS,
  FREE_BATTLE_CHARACTERS,
  findCharacterById,
  getCharacterByDifficulty,
  getRandomReaction,
} from './characters';
import { FIELDS } from './config';
import { CpuAI } from './ai';
import { EntityFactory } from './entities';
import { CONSTANTS } from './constants';
import { Physics } from './physics';
import { getStoryStageBalance, createStageConstants, AI_BEHAVIOR_PRESETS } from './story-balance';
import { applyItemEffect, ItemEffects } from './items';
import type { Difficulty } from './types';

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

// ── ストーリーモード完全フローテスト ─────────────────

describe('ストーリーモード完全フロー', () => {
  it('初期状態から全ステージクリアまでの進行', () => {
    // 1. 初期状態確認
    let progress = loadStoryProgress();
    expect(progress.clearedStages).toEqual([]);
    expect(isStageUnlocked('1-1', progress, CHAPTER_1_STAGES)).toBe(true);
    expect(isStageUnlocked('1-2', progress, CHAPTER_1_STAGES)).toBe(false);

    // 2. ステージ 1-1 クリア
    progress = { clearedStages: [...progress.clearedStages, '1-1'] };
    saveStoryProgress(progress);
    progress = loadStoryProgress();
    expect(isStageUnlocked('1-2', progress, CHAPTER_1_STAGES)).toBe(true);
    expect(isStageUnlocked('1-3', progress, CHAPTER_1_STAGES)).toBe(false);

    // 3. ステージ 1-2 クリア
    progress = { clearedStages: [...progress.clearedStages, '1-2'] };
    saveStoryProgress(progress);
    progress = loadStoryProgress();
    expect(isStageUnlocked('1-3', progress, CHAPTER_1_STAGES)).toBe(true);

    // 4. ステージ 1-3 クリア（全クリア）
    progress = { clearedStages: [...progress.clearedStages, '1-3'] };
    saveStoryProgress(progress);
    progress = loadStoryProgress();
    expect(progress.clearedStages).toHaveLength(3);
  });

  it('敗北時はステージが進行しない', () => {
    const progress = loadStoryProgress();
    // 1-1 で敗北 → 進行データに変更なし
    saveStoryProgress(progress);
    const afterLoss = loadStoryProgress();
    expect(afterLoss.clearedStages).toEqual([]);
    expect(isStageUnlocked('1-2', afterLoss, CHAPTER_1_STAGES)).toBe(false);
  });

  it('リセット後に初期状態に戻る', () => {
    saveStoryProgress({ clearedStages: ['1-1', '1-2', '1-3'] });
    resetStoryProgress();
    const progress = loadStoryProgress();
    expect(progress.clearedStages).toEqual([]);
  });
});

// ── ステージ定義とキャラクターの整合性 ──────────────

describe('ステージ定義の整合性', () => {
  it('全ステージのキャラクターが定義されている', () => {
    for (const stage of CHAPTER_1_STAGES) {
      const char = findCharacterById(stage.characterId);
      expect(char).toBeDefined();
      expect(char?.name).toBeTruthy();
      expect(char?.icon).toBeTruthy();
      expect(char?.reactions.onScore.length).toBeGreaterThan(0);
      expect(char?.reactions.onConcede.length).toBeGreaterThan(0);
      expect(char?.reactions.onWin.length).toBeGreaterThan(0);
      expect(char?.reactions.onLose.length).toBeGreaterThan(0);
    }
  });

  it('全ステージのフィールドが定義されている', () => {
    for (const stage of CHAPTER_1_STAGES) {
      const field = FIELDS.find(f => f.id === stage.fieldId);
      expect(field).toBeDefined();
      expect(field?.goalSize).toBeGreaterThan(0);
    }
  });

  it('全ステージの難易度が有効', () => {
    const validDifficulties: Difficulty[] = ['easy', 'normal', 'hard'];
    for (const stage of CHAPTER_1_STAGES) {
      expect(validDifficulties).toContain(stage.difficulty);
    }
  });

  it('ステージ順が難易度昇順', () => {
    const difficultyOrder: Record<Difficulty, number> = { easy: 0, normal: 1, hard: 2 };
    for (let i = 1; i < CHAPTER_1_STAGES.length; i++) {
      const prev = difficultyOrder[CHAPTER_1_STAGES[i - 1].difficulty];
      const curr = difficultyOrder[CHAPTER_1_STAGES[i].difficulty];
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });

  it('勝利スコアがステージの進行に応じて適切', () => {
    // 1-1, 1-2 は3点先取、1-3 は5点先取
    expect(CHAPTER_1_STAGES[0].winScore).toBe(3);
    expect(CHAPTER_1_STAGES[1].winScore).toBe(3);
    expect(CHAPTER_1_STAGES[2].winScore).toBe(5);
  });
});

// ── バランス設定と AI の統合テスト ──────────────────

describe('バランス設定と AI の統合', () => {
  describe('ステージ 1-1: 初心者フレンドリー', () => {
    it('CPU の移動速度が遅い', () => {
      const game = EntityFactory.createGameState();
      game.pucks[0].y = 200;
      game.pucks[0].vy = -5;
      game.pucks[0].x = 300;
      game.cpu.x = 100;
      game.cpu.y = 80;

      const balance = getStoryStageBalance('1-1');
      const result = CpuAI.updateWithBehavior(game, balance.ai, 1000);

      if (result) {
        const speed = Math.sqrt(result.cpu.vx ** 2 + result.cpu.vy ** 2);
        expect(speed).toBeLessThanOrEqual(balance.ai.maxSpeed + 0.01);
      }
    });

    it('カスタム定数でゲームループが動作する', () => {
      const consts = createStageConstants('1-1');
      const game = EntityFactory.createGameState();
      game.pucks[0].y = 200;
      game.pucks[0].vy = -5;

      const balance = getStoryStageBalance('1-1');
      const result = CpuAI.updateWithBehavior(game, balance.ai, 1000, consts);
      expect(result).toBeDefined();
    });
  });

  describe('ステージ 1-2: アイテム活用ステージ', () => {
    it('アイテム出現間隔が短い', () => {
      const consts = createStageConstants('1-2');
      expect(consts.TIMING.ITEM_SPAWN).toBeLessThan(CONSTANTS.TIMING.ITEM_SPAWN);
    });

    it('全アイテムエフェクトがゲーム状態に適用できる', () => {
      const game = EntityFactory.createGameState();
      const items = ['split', 'speed', 'invisible', 'shield', 'magnet', 'big'] as const;

      for (const itemId of items) {
        const result = applyItemEffect(game, { id: itemId }, 'player', Date.now());
        expect(result).toBeDefined();
        expect(result.flash).toBeDefined();
      }
    });
  });

  describe('ステージ 1-3: 高難度', () => {
    it('CPU が壁バウンス予測を使用する', () => {
      const game = EntityFactory.createGameState();
      game.pucks[0].x = 400;
      game.pucks[0].y = 300;
      game.pucks[0].vx = 5;
      game.pucks[0].vy = -8;

      const balance = getStoryStageBalance('1-3');
      const target = CpuAI.calculateTargetWithBehavior(game, balance.ai, 1000);

      // 壁バウンス予測でフィールド内に収まる
      expect(target.x).toBeGreaterThanOrEqual(20);
      expect(target.x).toBeLessThanOrEqual(CONSTANTS.CANVAS.WIDTH - 20);
    });

    it('カムバック補正が強化されている', () => {
      const consts = createStageConstants('1-3');
      expect(consts.COMEBACK.THRESHOLD).toBeLessThanOrEqual(CONSTANTS.COMEBACK.THRESHOLD);
    });
  });
});

// ── フリー対戦モードの回帰テスト ─────────────────────

describe('フリー対戦モードの回帰テスト', () => {
  it('各難易度の AI が正常に動作する', () => {
    const difficulties: Difficulty[] = ['easy', 'normal', 'hard'];

    for (const diff of difficulties) {
      const game = EntityFactory.createGameState();
      game.pucks[0].y = 200;
      game.pucks[0].vy = -5;

      const target = CpuAI.calculateTarget(game, diff, 1000);
      expect(target).toBeDefined();
      expect(target.x).toBeDefined();
      expect(target.y).toBeDefined();
    }
  });

  it('各難易度のキャラクターが取得できる', () => {
    const difficulties: Difficulty[] = ['easy', 'normal', 'hard'];

    for (const diff of difficulties) {
      const char = getCharacterByDifficulty(diff);
      expect(char).toBeDefined();
      expect(char.name).toBeTruthy();
    }
  });

  it('物理演算が正常に動作する', () => {
    const collision = Physics.detectCollision(100, 100, 20, 110, 100, 20);
    expect(collision).not.toBeNull();
    expect(collision?.penetration).toBeGreaterThan(0);
  });
});

// ── キャラクターリアクション統合テスト ──────────────

describe('キャラクターリアクション', () => {
  it('全キャラクターのリアクションがランダム取得できる', () => {
    const allChars = [
      PLAYER_CHARACTER,
      ...Object.values(STORY_CHARACTERS),
      ...Object.values(FREE_BATTLE_CHARACTERS),
    ];

    for (const char of allChars) {
      const reaction = getRandomReaction(char.reactions.onScore);
      expect(typeof reaction).toBe('string');
      expect(reaction.length).toBeGreaterThan(0);
    }
  });

  it('プレイヤーキャラが findCharacterById で見つかる', () => {
    const found = findCharacterById('player');
    expect(found).toBeDefined();
    expect(found?.name).toBe('アキラ');
  });

  it('全ストーリーキャラが findCharacterById で見つかる', () => {
    for (const char of Object.values(STORY_CHARACTERS)) {
      const found = findCharacterById(char.id);
      expect(found).toBeDefined();
      expect(found?.name).toBe(char.name);
    }
  });
});

// ── AI プリセット↔ CONSTANTS の整合性テスト ────────

describe('AI プリセットと CONSTANTS の整合性', () => {
  it('プリセットの maxSpeed が CONSTANTS.CPU と一致する', () => {
    expect(AI_BEHAVIOR_PRESETS.easy.maxSpeed).toBe(CONSTANTS.CPU.easy);
    expect(AI_BEHAVIOR_PRESETS.normal.maxSpeed).toBe(CONSTANTS.CPU.normal);
    expect(AI_BEHAVIOR_PRESETS.hard.maxSpeed).toBe(CONSTANTS.CPU.hard);
  });
});
