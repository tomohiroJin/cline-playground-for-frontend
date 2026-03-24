/**
 * Phase 4: ストーリーモード バランス調整テスト
 * TDD RED → GREEN → REFACTOR
 */
import { CHAPTER_1_STAGES } from './dialogue-data';
import { CONSTANTS } from './constants';
import { CHARACTER_AI_PROFILES } from './character-ai-profiles';

import {
  AiBehaviorConfig,
  AI_BEHAVIOR_PRESETS,
  getStoryStageBalance,
  StageBalanceConfig,
  createStageConstants,
  buildFreeBattleAiConfig,
} from './story-balance';
import { DEFAULT_PLAY_STYLE, getCharacterAiProfile } from './character-ai-profiles';

// ── AI 振る舞い設定の抽象化テスト ────────────────────

describe('AiBehaviorConfig プリセット', () => {
  it('easy/normal/hard の3つのプリセットが定義されている', () => {
    expect(AI_BEHAVIOR_PRESETS.easy).toBeDefined();
    expect(AI_BEHAVIOR_PRESETS.normal).toBeDefined();
    expect(AI_BEHAVIOR_PRESETS.hard).toBeDefined();
  });

  it('各プリセットに必須プロパティがある', () => {
    const requiredKeys: (keyof AiBehaviorConfig)[] = [
      'maxSpeed',
      'predictionFactor',
      'wobble',
      'skipRate',
      'centerWeight',
      'wallBounce',
    ];

    for (const difficulty of ['easy', 'normal', 'hard'] as const) {
      const preset = AI_BEHAVIOR_PRESETS[difficulty];
      for (const key of requiredKeys) {
        expect(preset[key]).toBeDefined();
      }
    }
  });

  it('easy は最も遅く、hard は最も速い', () => {
    expect(AI_BEHAVIOR_PRESETS.easy.maxSpeed).toBeLessThan(AI_BEHAVIOR_PRESETS.normal.maxSpeed);
    expect(AI_BEHAVIOR_PRESETS.normal.maxSpeed).toBeLessThan(AI_BEHAVIOR_PRESETS.hard.maxSpeed);
  });

  it('easy は予測精度が低い', () => {
    expect(AI_BEHAVIOR_PRESETS.easy.predictionFactor).toBeLessThan(
      AI_BEHAVIOR_PRESETS.normal.predictionFactor
    );
  });

  it('easy にはウォブル（ブレ）がある', () => {
    expect(AI_BEHAVIOR_PRESETS.easy.wobble).toBeGreaterThan(0);
    expect(AI_BEHAVIOR_PRESETS.hard.wobble).toBe(0);
  });

  it('easy にはスキップ率がある', () => {
    expect(AI_BEHAVIOR_PRESETS.easy.skipRate).toBeGreaterThan(0);
    expect(AI_BEHAVIOR_PRESETS.hard.skipRate).toBe(0);
  });

  it('hard は壁バウンス予測が有効', () => {
    expect(AI_BEHAVIOR_PRESETS.hard.wallBounce).toBe(true);
    expect(AI_BEHAVIOR_PRESETS.easy.wallBounce).toBe(false);
  });
});

// ── ステージ別バランス設定テスト ─────────────────────

describe('getStoryStageBalance', () => {
  describe('ステージ 1-1（はじめの一打）', () => {
    let balance: StageBalanceConfig;

    beforeEach(() => {
      balance = getStoryStageBalance('1-1');
    });

    it('バランス設定が取得できる', () => {
      expect(balance).toBeDefined();
    });

    it('初心者向けの低い CPU 速度', () => {
      // easy プリセットよりさらに遅い設定
      expect(balance.ai.maxSpeed).toBeLessThanOrEqual(CONSTANTS.CPU.easy);
    });

    it('予測精度が低い（初心者が2-3回で勝てるように）', () => {
      expect(balance.ai.predictionFactor).toBeLessThanOrEqual(1.5);
    });

    it('高めのスキップ率（CPU がときどきミスする）', () => {
      expect(balance.ai.skipRate).toBeGreaterThanOrEqual(0.08);
    });

    it('ウォブルが大きい（狙いが不正確）', () => {
      expect(balance.ai.wobble).toBeGreaterThanOrEqual(30);
    });

    it('アイテム出現間隔はデフォルト', () => {
      expect(balance.itemSpawnInterval).toBe(CONSTANTS.TIMING.ITEM_SPAWN);
    });
  });

  describe('ステージ 1-2（テクニカルな壁）', () => {
    let balance: StageBalanceConfig;

    beforeEach(() => {
      balance = getStoryStageBalance('1-2');
    });

    it('中程度の CPU 速度', () => {
      const stage1 = getStoryStageBalance('1-1');
      expect(balance.ai.maxSpeed).toBeGreaterThan(stage1.ai.maxSpeed);
      expect(balance.ai.maxSpeed).toBeLessThanOrEqual(CONSTANTS.CPU.normal);
    });

    it('アイテム出現が速い（アイテム活用を促す）', () => {
      expect(balance.itemSpawnInterval).toBeLessThan(CONSTANTS.TIMING.ITEM_SPAWN);
    });

    it('カムバック補正が強め（接戦を演出）', () => {
      expect(balance.comebackThreshold).toBeLessThanOrEqual(CONSTANTS.COMEBACK.THRESHOLD);
    });
  });

  describe('ステージ 1-3（部長の壁）', () => {
    let balance: StageBalanceConfig;

    beforeEach(() => {
      balance = getStoryStageBalance('1-3');
    });

    it('高い CPU 速度（苦戦するレベル）', () => {
      expect(balance.ai.maxSpeed).toBeGreaterThanOrEqual(4.5);
    });

    it('壁バウンス予測あり', () => {
      expect(balance.ai.wallBounce).toBe(true);
    });

    it('予測精度が高い', () => {
      expect(balance.ai.predictionFactor).toBeGreaterThanOrEqual(8);
    });

    it('スキップ率がない', () => {
      expect(balance.ai.skipRate).toBe(0);
    });

    it('カムバック補正がプレイヤーを助ける', () => {
      // 閾値が低い = より早くカムバック補正が発動
      expect(balance.comebackThreshold).toBeLessThanOrEqual(3);
    });
  });

  it('未定義のステージにはデフォルト設定を返す', () => {
    const balance = getStoryStageBalance('unknown-stage');
    expect(balance).toBeDefined();
    expect(balance.ai.maxSpeed).toBe(AI_BEHAVIOR_PRESETS.normal.maxSpeed);
  });

  it('全ステージの難易度が段階的に上昇する', () => {
    const balances = CHAPTER_1_STAGES.map(s => getStoryStageBalance(s.id));

    for (let i = 1; i < balances.length; i++) {
      expect(balances[i].ai.maxSpeed).toBeGreaterThanOrEqual(balances[i - 1].ai.maxSpeed);
    }
  });
});

// ── createStageConstants テスト ────────────────────

describe('createStageConstants', () => {
  it('ステージ1-1のカスタム定数を生成する', () => {
    const consts = createStageConstants('1-1');
    expect(consts.CPU.easy).toBeLessThanOrEqual(CONSTANTS.CPU.easy);
  });

  it('ベースの CONSTANTS を変更しない（不変性）', () => {
    const originalEasy = CONSTANTS.CPU.easy;
    createStageConstants('1-1');
    expect(CONSTANTS.CPU.easy).toBe(originalEasy);
  });

  it('アイテム出現間隔がカスタマイズされる', () => {
    const consts = createStageConstants('1-2');
    expect(consts.TIMING.ITEM_SPAWN).toBeLessThan(CONSTANTS.TIMING.ITEM_SPAWN);
  });

  it('カムバック閾値がカスタマイズされる', () => {
    const consts = createStageConstants('1-3');
    expect(consts.COMEBACK.THRESHOLD).toBeLessThanOrEqual(3);
  });
});

// ── カムバック補正テスト ──────────────────────────

describe('カムバック補正の適切な機能', () => {
  it('ステージ 1-1 のカムバック補正はデフォルト', () => {
    const balance = getStoryStageBalance('1-1');
    expect(balance.comebackThreshold).toBe(CONSTANTS.COMEBACK.THRESHOLD);
    expect(balance.comebackMalletBonus).toBe(CONSTANTS.COMEBACK.MALLET_BONUS);
  });

  it('ステージ 1-2 のカムバック補正は強化されている', () => {
    const balance = getStoryStageBalance('1-2');
    // 閾値が低い or ボーナスが高い
    const isStronger =
      balance.comebackThreshold < CONSTANTS.COMEBACK.THRESHOLD ||
      balance.comebackMalletBonus > CONSTANTS.COMEBACK.MALLET_BONUS;
    expect(isStronger).toBe(true);
  });

  it('全ステージのカムバック補正パラメータが妥当な範囲', () => {
    for (const stage of CHAPTER_1_STAGES) {
      const balance = getStoryStageBalance(stage.id);
      expect(balance.comebackThreshold).toBeGreaterThanOrEqual(1);
      expect(balance.comebackThreshold).toBeLessThanOrEqual(5);
      expect(balance.comebackMalletBonus).toBeGreaterThanOrEqual(0);
      expect(balance.comebackMalletBonus).toBeLessThanOrEqual(0.3);
      expect(balance.comebackGoalReduction).toBeGreaterThanOrEqual(0);
      expect(balance.comebackGoalReduction).toBeLessThanOrEqual(0.2);
    }
  });
});

// ── S2-4-3: キャラクター AI プロファイル統合テスト ──────────

describe('キャラクター AI プロファイルのステージ統合', () => {
  it('ステージ 1-1（ヒロ）に playStyle が設定されている', () => {
    const balance = getStoryStageBalance('1-1');
    expect(balance.ai.playStyle).toBeDefined();
    expect(balance.ai.playStyle).toEqual(CHARACTER_AI_PROFILES['hiro']);
  });

  it('ステージ 1-2（ミサキ）に playStyle が設定されている', () => {
    const balance = getStoryStageBalance('1-2');
    expect(balance.ai.playStyle).toBeDefined();
    expect(balance.ai.playStyle).toEqual(CHARACTER_AI_PROFILES['misaki']);
  });

  it('ステージ 1-3（タクマ）に playStyle が設定されている', () => {
    const balance = getStoryStageBalance('1-3');
    expect(balance.ai.playStyle).toBeDefined();
    expect(balance.ai.playStyle).toEqual(CHARACTER_AI_PROFILES['takuma']);
  });
});

describe('buildFreeBattleAiConfig', () => {
  it('難易度の基本パラメータが維持される', () => {
    const config = buildFreeBattleAiConfig('hard', 'misaki');
    expect(config.maxSpeed).toBe(AI_BEHAVIOR_PRESETS.hard.maxSpeed);
    expect(config.predictionFactor).toBe(AI_BEHAVIOR_PRESETS.hard.predictionFactor);
    expect(config.wobble).toBe(AI_BEHAVIOR_PRESETS.hard.wobble);
    expect(config.skipRate).toBe(AI_BEHAVIOR_PRESETS.hard.skipRate);
    expect(config.wallBounce).toBe(AI_BEHAVIOR_PRESETS.hard.wallBounce);
  });

  it('選択キャラの playStyle が反映される', () => {
    const config = buildFreeBattleAiConfig('normal', 'misaki');
    expect(config.playStyle).toEqual(getCharacterAiProfile('misaki'));
  });

  it('characterId 未指定で AI_BEHAVIOR_PRESETS をそのまま返す', () => {
    const config = buildFreeBattleAiConfig('normal');
    expect(config).toBe(AI_BEHAVIOR_PRESETS.normal);
  });

  it('未知の characterId で DEFAULT_PLAY_STYLE にフォールバックする', () => {
    const config = buildFreeBattleAiConfig('easy', 'unknown-char');
    expect(config.playStyle).toEqual(DEFAULT_PLAY_STYLE);
  });
});

describe('AI_BEHAVIOR_PRESETS のキャラクター AI プロファイル統合', () => {
  it('easy プリセットに playStyle が設定されている（ルーキー）', () => {
    expect(AI_BEHAVIOR_PRESETS.easy.playStyle).toBeDefined();
    expect(AI_BEHAVIOR_PRESETS.easy.playStyle).toEqual(CHARACTER_AI_PROFILES['rookie']);
  });

  it('normal プリセットに playStyle が設定されている（レギュラー）', () => {
    expect(AI_BEHAVIOR_PRESETS.normal.playStyle).toBeDefined();
    expect(AI_BEHAVIOR_PRESETS.normal.playStyle).toEqual(CHARACTER_AI_PROFILES['regular']);
  });

  it('hard プリセットに playStyle が設定されている（エース）', () => {
    expect(AI_BEHAVIOR_PRESETS.hard.playStyle).toBeDefined();
    expect(AI_BEHAVIOR_PRESETS.hard.playStyle).toEqual(CHARACTER_AI_PROFILES['ace']);
  });
});
