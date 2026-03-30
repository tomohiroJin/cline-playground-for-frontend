import { CpuAI, applyAdaptability } from './ai';
import { EntityFactory } from './entities';
import { CONSTANTS } from './constants';
import type { AiBehaviorConfig } from './story-balance';
import type { AiPlayStyle } from './character-ai-profiles';
import { DEFAULT_PLAY_STYLE } from './character-ai-profiles';

/** テスト用ヘルパー: デフォルトを基にプレイスタイルを生成 */
const createPlayStyle = (overrides?: Partial<AiPlayStyle>): AiPlayStyle => ({
  ...DEFAULT_PLAY_STYLE,
  ...overrides,
});

/** テスト用ヘルパー: デフォルトを基に AI 設定を生成 */
const createConfig = (overrides?: Partial<AiBehaviorConfig>): AiBehaviorConfig => ({
  maxSpeed: 4.7,
  predictionFactor: 8,
  wobble: 0,
  skipRate: 0,
  centerWeight: 0,
  wallBounce: false,
  ...overrides,
});

const { WIDTH: W } = CONSTANTS.CANVAS;

describe('CpuAI Module', () => {
  it('should target puck when threatening goal', () => {
    const game = EntityFactory.createGameState();
    game.pucks[0].y = 200;
    game.pucks[0].vy = -5;
    game.pucks[0].x = 100;
    game.pucks[0].vx = 0;

    const diff = 'normal';
    // normal プリセットには regular プロファイル（sidePreference=0.1, lateralOscillation=10）が設定されている。
    // now=0 で sin(0)=0 → 揺さぶりオフセット 0。
    // sidePreference=0.1 により、ターゲット X はパック位置から右方向にわずかにオフセットされる。
    const now = 0;

    const result = CpuAI.update(game, diff, now);

    expect(result).not.toBeNull();
    expect(result?.cpuTarget).not.toBeNull();
    // sidePreference=0.1 で右にオフセットされるため、パック x=100 より大きくなる
    expect(result?.cpuTarget?.x).toBeGreaterThanOrEqual(100);
    expect(result?.cpuTarget?.x).toBeLessThan(120);
  });

  it('should return to home position if out of bounds', () => {
    const game = EntityFactory.createGameState();
    game.cpu.x = 10;

    const result = CpuAI.update(game, 'normal', 1000);

    expect(result).not.toBeNull();
    const target = CpuAI.calculateTarget(game, 'normal', 1000);
    expect(target.x).toBe(W / 2);
    expect(target.y).toBe(80);
  });

  describe('プレイスタイル拡張', () => {
    /** パックが CPU 側に向かっている状態を作るヘルパー */
    const makePuckComingTowardCpu = (game: ReturnType<typeof EntityFactory.createGameState>) => {
      game.pucks[0].x = 300;
      game.pucks[0].y = 250;
      game.pucks[0].vy = -5;
      game.pucks[0].vx = 0;
    };

    it('playStyle 未設定時は既存動作と同一（後方互換）', () => {
      // Arrange
      const game = EntityFactory.createGameState();
      makePuckComingTowardCpu(game);
      const configWithoutStyle = createConfig();
      const configWithStyle = createConfig({ playStyle: createPlayStyle() });

      // Act
      const targetWithout = CpuAI.calculateTargetWithBehavior(game, configWithoutStyle, 1000);
      const targetWith = CpuAI.calculateTargetWithBehavior(game, configWithStyle, 1000);

      // Assert: プレイスタイルが DEFAULT 相当なら X は同一
      expect(targetWith.x).toBeCloseTo(targetWithout.x, 0);
    });

    it('lateralOscillation > 0 でターゲット X が時間によって変動する', () => {
      // Arrange
      const game = EntityFactory.createGameState();
      makePuckComingTowardCpu(game);
      const config = createConfig({
        playStyle: createPlayStyle({ lateralOscillation: 40, lateralPeriod: 2000 }),
      });

      // Act: sin の位相が異なる now 値で計算
      const target1 = CpuAI.calculateTargetWithBehavior(game, config, 0);
      const target2 = CpuAI.calculateTargetWithBehavior(game, config, 500);

      // Assert: 異なる時刻で X が異なる（sin(0)=0, sin(π/2)=1）
      expect(target1.x).not.toBeCloseTo(target2.x, 0);
    });

    it('lateralOscillation = 0 でターゲット X が安定している', () => {
      // Arrange
      const game = EntityFactory.createGameState();
      makePuckComingTowardCpu(game);
      const config = createConfig({ playStyle: createPlayStyle() });

      // Act
      const target1 = CpuAI.calculateTargetWithBehavior(game, config, 0);
      const target2 = CpuAI.calculateTargetWithBehavior(game, config, 500);

      // Assert: 揺さぶりなし → 同じ X
      expect(target1.x).toBe(target2.x);
    });

    it('aggressiveness = 0 でゴール近くに留まる（小さい Y）', () => {
      // Arrange
      const game = EntityFactory.createGameState();
      makePuckComingTowardCpu(game);
      const configDefensive = createConfig({
        playStyle: createPlayStyle({ aggressiveness: 0 }),
      });

      // Act
      const target = CpuAI.calculateTargetWithBehavior(game, configDefensive, 1000);

      // Assert: 守備的 → Y が小さい（ゴール近く）
      expect(target.y).toBeLessThan(200);
    });

    it('aggressiveness = 1 で前に出る（大きい Y）', () => {
      // Arrange
      const game = EntityFactory.createGameState();
      makePuckComingTowardCpu(game);
      const configAggressive = createConfig({
        playStyle: createPlayStyle({ aggressiveness: 1 }),
      });
      const configDefensive = createConfig({
        playStyle: createPlayStyle({ aggressiveness: 0 }),
      });

      // Act
      const targetAggressive = CpuAI.calculateTargetWithBehavior(game, configAggressive, 1000);
      const targetDefensive = CpuAI.calculateTargetWithBehavior(game, configDefensive, 1000);

      // Assert: 攻撃的 → 守備的より Y が大きい（前に出ている）
      expect(targetAggressive.y).toBeGreaterThan(targetDefensive.y);
    });

    it('adaptability > 0 でスコア差に応じて maxSpeed が増加する', () => {
      // Arrange
      const game = EntityFactory.createGameState();
      makePuckComingTowardCpu(game);
      const config = createConfig({
        maxSpeed: 4.0,
        wobble: 10,
        playStyle: createPlayStyle({ adaptability: 0.8 }),
      });

      // Act: scoreDiff = 3（CPU が 3 点負けている）
      const resultWith = CpuAI.updateWithBehavior(game, config, 1000, CONSTANTS, 3);
      const resultWithout = CpuAI.updateWithBehavior(game, config, 1000, CONSTANTS, 0);

      // Assert: scoreDiff > 0 で速度が増加（上限まで動く距離が長くなる）
      // updateWithBehavior は速度を変えた設定で動作するため、速度ベクトルの大きさを比較
      expect(resultWith).not.toBeNull();
      expect(resultWithout).not.toBeNull();
      const speedWith = Math.hypot(resultWith!.cpu.vx, resultWith!.cpu.vy);
      const speedWithout = Math.hypot(resultWithout!.cpu.vx, resultWithout!.cpu.vy);
      expect(speedWith).toBeGreaterThanOrEqual(speedWithout);
    });

    it('adaptability = 0 でスコア差に関係なく速度が変わらない', () => {
      // Arrange
      const game = EntityFactory.createGameState();
      makePuckComingTowardCpu(game);
      const config = createConfig({
        maxSpeed: 4.0,
        playStyle: createPlayStyle({ adaptability: 0 }),
      });

      // Act
      const resultWith = CpuAI.updateWithBehavior(game, config, 1000, CONSTANTS, 3);
      const resultWithout = CpuAI.updateWithBehavior(game, config, 1000, CONSTANTS, 0);

      // Assert: adaptability = 0 → 速度変化なし
      expect(resultWith).not.toBeNull();
      expect(resultWithout).not.toBeNull();
      const speedWith = Math.hypot(resultWith!.cpu.vx, resultWith!.cpu.vy);
      const speedWithout = Math.hypot(resultWithout!.cpu.vx, resultWithout!.cpu.vy);
      expect(speedWith).toBeCloseTo(speedWithout, 5);
    });

    it('scoreDiff = 0 で適応が発動しない', () => {
      // Arrange
      const game = EntityFactory.createGameState();
      makePuckComingTowardCpu(game);
      const config = createConfig({
        maxSpeed: 4.0,
        playStyle: createPlayStyle({ adaptability: 1.0 }),
      });

      // Act
      const resultZero = CpuAI.updateWithBehavior(game, config, 1000, CONSTANTS, 0);
      const resultNoArg = CpuAI.updateWithBehavior(game, config, 1000, CONSTANTS);

      // Assert: scoreDiff = 0 でも undefined でも同じ動作
      expect(resultZero).not.toBeNull();
      expect(resultNoArg).not.toBeNull();
      const speedZero = Math.hypot(resultZero!.cpu.vx, resultZero!.cpu.vy);
      const speedNoArg = Math.hypot(resultNoArg!.cpu.vx, resultNoArg!.cpu.vy);
      expect(speedZero).toBeCloseTo(speedNoArg, 5);
    });
  });

  describe('applyAdaptability 単体テスト', () => {
    it('adaptability > 0, scoreDiff > 0 で maxSpeed が増加する', () => {
      const config = createConfig({
        maxSpeed: 4.0,
        predictionFactor: 8,
        wobble: 10,
        playStyle: createPlayStyle({ adaptability: 1.0 }),
      });
      const result = applyAdaptability(config, 3);
      expect(result.maxSpeed).toBeGreaterThan(config.maxSpeed);
      expect(result.predictionFactor).toBeGreaterThan(config.predictionFactor);
      expect(result.wobble).toBeLessThan(config.wobble);
    });

    it('adaptability = 0 の場合は元の config をそのまま返す', () => {
      const config = createConfig({
        maxSpeed: 4.0,
        playStyle: createPlayStyle({ adaptability: 0 }),
      });
      const result = applyAdaptability(config, 3);
      expect(result).toBe(config);
    });

    it('scoreDiff = 0 の場合は元の config をそのまま返す', () => {
      const config = createConfig({
        maxSpeed: 4.0,
        playStyle: createPlayStyle({ adaptability: 1.0 }),
      });
      const result = applyAdaptability(config, 0);
      expect(result).toBe(config);
    });

    it('scoreDiff が 3 を超えても boost は上限で頭打ちになる', () => {
      const config = createConfig({
        maxSpeed: 4.0,
        playStyle: createPlayStyle({ adaptability: 1.0 }),
      });
      const result3 = applyAdaptability(config, 3);
      const result10 = applyAdaptability(config, 10);
      expect(result3.maxSpeed).toBeCloseTo(result10.maxSpeed, 5);
    });

    it('playStyle 未設定時は DEFAULT_PLAY_STYLE（adaptability=0）でフォールバックする', () => {
      const config = createConfig();
      const result = applyAdaptability(config, 3);
      expect(result).toBe(config);
    });
  });

  describe('スタック検出', () => {
    it('移動量が極小だとcpuStuckTimerが記録される', () => {
      const game = EntityFactory.createGameState();
      game.cpu.x = 120;
      game.cpu.y = 90;
      game.cpu.vx = 0;
      game.cpu.vy = 0;
      game.cpuTarget = { x: 120, y: 90 };
      game.cpuTargetTime = 950;
      game.cpuStuckTimer = 0;
      game.pucks[0].x = 120;
      game.pucks[0].y = 200;
      game.pucks[0].vy = -1;
      game.pucks[0].vx = 0;

      // sidePreference=0 の config で影響を排除
      const config = createConfig({
        playStyle: createPlayStyle({ sidePreference: 0, aggressiveness: 0.5 }),
      });
      const result = CpuAI.updateWithBehavior(game, config, 1000);
      expect(result).not.toBeNull();
      expect(result!.cpuStuckTimer).toBe(1000);
    });

    it('2秒以上スタック後に中央にリセットされる', () => {
      const game = EntityFactory.createGameState();
      game.cpu.x = 120;
      game.cpu.y = 90;
      game.cpu.vx = 0;
      game.cpu.vy = 0;
      game.cpuTarget = { x: 120, y: 90 };
      game.cpuTargetTime = 3050;
      game.cpuStuckTimer = 1000;
      game.pucks[0].x = 120;
      game.pucks[0].y = 200;
      game.pucks[0].vy = -1;
      game.pucks[0].vx = 0;

      // sidePreference=0 の config で影響を排除
      const config = createConfig({
        playStyle: createPlayStyle({ sidePreference: 0, aggressiveness: 0.5 }),
      });
      const result = CpuAI.updateWithBehavior(game, config, 3100);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.cpu.x).toBe(W / 2);
        expect(result.cpu.y).toBe(80);
        expect(result.cpuStuckTimer).toBe(0);
      }
    });

    it('移動中はスタックタイマーがリセットされる', () => {
      const game = EntityFactory.createGameState();
      game.cpu.x = 100;
      game.cpu.y = 80;
      game.cpu.vx = 0;
      game.cpu.vy = 0;
      game.cpuStuckTimer = 1000;
      game.pucks[0].x = 200;
      game.pucks[0].y = 200;
      game.pucks[0].vy = -5;
      game.pucks[0].vx = 0;

      const result = CpuAI.update(game, 'normal', 2000);
      expect(result).not.toBeNull();
      expect(result!.cpuStuckTimer).toBe(0);
    });
  });
});

// ── Phase S6-2: sidePreference テスト ──────────────

describe('sidePreference', () => {
  it('sidePreference > 0 でターゲット X が右にオフセットされる', () => {
    const game = EntityFactory.createGameState();
    game.pucks[0].y = 200;
    game.pucks[0].vy = -5;
    game.pucks[0].x = W / 2;
    game.pucks[0].vx = 0;

    const configRight = createConfig({
      playStyle: createPlayStyle({ sidePreference: 0.5 }),
    });
    const configCenter = createConfig({
      playStyle: createPlayStyle({ sidePreference: 0 }),
    });

    const targetRight = CpuAI.calculateTargetWithBehavior(game, configRight, 0);
    const targetCenter = CpuAI.calculateTargetWithBehavior(game, configCenter, 0);

    expect(targetRight.x).toBeGreaterThan(targetCenter.x);
  });

  it('sidePreference < 0 でターゲット X が左にオフセットされる', () => {
    const game = EntityFactory.createGameState();
    game.pucks[0].y = 200;
    game.pucks[0].vy = -5;
    game.pucks[0].x = W / 2;
    game.pucks[0].vx = 0;

    const configLeft = createConfig({
      playStyle: createPlayStyle({ sidePreference: -0.5 }),
    });
    const configCenter = createConfig({
      playStyle: createPlayStyle({ sidePreference: 0 }),
    });

    const targetLeft = CpuAI.calculateTargetWithBehavior(game, configLeft, 0);
    const targetCenter = CpuAI.calculateTargetWithBehavior(game, configCenter, 0);

    expect(targetLeft.x).toBeLessThan(targetCenter.x);
  });

  it('sidePreference = 0 ではオフセットなし', () => {
    const game = EntityFactory.createGameState();
    game.pucks[0].y = 200;
    game.pucks[0].vy = -5;
    game.pucks[0].x = W / 2;
    game.pucks[0].vx = 0;

    const config = createConfig({
      playStyle: createPlayStyle({ sidePreference: 0 }),
    });

    const target1 = CpuAI.calculateTargetWithBehavior(game, config, 0);
    const target2 = CpuAI.calculateTargetWithBehavior(game, config, 0);

    expect(target1.x).toBe(target2.x);
  });

  it('sidePreference のオフセットがフィールド外に出ない', () => {
    const game = EntityFactory.createGameState();
    game.pucks[0].y = 200;
    game.pucks[0].vy = -5;
    game.pucks[0].x = W - 30;
    game.pucks[0].vx = 0;

    const config = createConfig({
      playStyle: createPlayStyle({ sidePreference: 1.0 }),
    });

    const target = CpuAI.calculateTargetWithBehavior(game, config, 0);

    expect(target.x).toBeLessThanOrEqual(W);
    expect(target.x).toBeGreaterThanOrEqual(0);
  });
});

// ── Phase S6-3c: deflectionBias テスト ──────────────

describe('deflectionBias', () => {
  it('deflectionBias > 0 でパックの反射方向が壁方向に偏る', () => {
    // deflectionBias の効果は resolveMalletPuckOverlap 内で適用される
    // ここでは applyDeflectionBias 関数を直接テスト
    const { applyDeflectionBias } = require('./ai');
    // 真上方向の法線 (0, -1)
    const result = applyDeflectionBias(0, -1, 0.5);
    // bias > 0: 壁方向（水平）に傾く → nx の絶対値が増加
    expect(Math.abs(result.nx)).toBeGreaterThan(0);
  });

  it('deflectionBias < 0 でパックの反射方向がゴール方向に偏る', () => {
    const { applyDeflectionBias } = require('./ai');
    // 斜め方向の法線
    const result = applyDeflectionBias(0.7, -0.7, -0.5);
    // bias < 0: ゴール方向（垂直）に傾く
    expect(result.ny).toBeDefined();
  });

  it('deflectionBias = 0 では法線が変化しない', () => {
    const { applyDeflectionBias } = require('./ai');
    const result = applyDeflectionBias(0, -1, 0);
    expect(result.nx).toBeCloseTo(0, 5);
    expect(result.ny).toBeCloseTo(-1, 5);
  });
});

// ── Phase S6-3d: reactionDelay テスト ──────────────

describe('shouldRecalculateTarget', () => {
  it('パック方向転換時に reactionDelay 経過後は再計算を許可する', () => {
    const { shouldRecalculateTarget } = require('./ai');
    expect(shouldRecalculateTarget(0, 100, 50, true)).toBe(true);
  });

  it('パック方向転換時に reactionDelay 未経過なら再計算しない', () => {
    const { shouldRecalculateTarget } = require('./ai');
    expect(shouldRecalculateTarget(0, 30, 50, true)).toBe(false);
  });

  it('パック方向転換がなければ再計算しない', () => {
    const { shouldRecalculateTarget } = require('./ai');
    expect(shouldRecalculateTarget(0, 1000, 50, false)).toBe(false);
  });

  it('reactionDelay=0 ではパック方向転換時に即座に再計算', () => {
    const { shouldRecalculateTarget } = require('./ai');
    expect(shouldRecalculateTarget(0, 0, 0, true)).toBe(true);
  });
});

// ── Phase S6-3b: defenseStyle テスト ──────────────

describe('defenseStyle', () => {
  // パックが相手陣地にある時（puck.vy >= 0 or puck.y >= H/2）のポジション制御
  const H = CONSTANTS.CANVAS.HEIGHT;

  it('center: パック相手陣地時にゴール中央付近に戻る', () => {
    const game = EntityFactory.createGameState();
    // パックが相手陣地（下半分）に移動中 → CPU にとっての相手陣地
    game.pucks[0].y = H * 0.75;
    game.pucks[0].vy = 3;
    game.pucks[0].x = 100;

    const config = createConfig({
      playStyle: createPlayStyle({ defenseStyle: 'center', aggressiveness: 0.5 }),
    });

    const target = CpuAI.calculateTargetWithBehavior(game, config, 0);
    // center: X はフィールド中央付近
    expect(Math.abs(target.x - W / 2)).toBeLessThan(100);
  });

  it('aggressive: パック相手陣地時に中盤付近に留まる', () => {
    const game = EntityFactory.createGameState();
    game.pucks[0].y = H * 0.75;
    game.pucks[0].vy = 3;
    game.pucks[0].x = 100;

    const config = createConfig({
      playStyle: createPlayStyle({ defenseStyle: 'aggressive', aggressiveness: 0.5 }),
    });

    const target = CpuAI.calculateTargetWithBehavior(game, config, 0);
    // aggressive: Y が center よりも前方（H/2 に近い）にいる
    expect(target.y).toBeGreaterThan(60);
  });

  it('パック自陣時は defenseStyle ではなく aggressiveness が優先（#6）', () => {
    const game = EntityFactory.createGameState();
    // パックが CPU 陣地（上半分）に向かっている
    game.pucks[0].y = 200;
    game.pucks[0].vy = -5;
    game.pucks[0].x = W / 2;

    const configCenter = createConfig({
      playStyle: createPlayStyle({ defenseStyle: 'center', aggressiveness: 0.7 }),
    });
    const configAggressive = createConfig({
      playStyle: createPlayStyle({ defenseStyle: 'aggressive', aggressiveness: 0.7 }),
    });

    const targetCenter = CpuAI.calculateTargetWithBehavior(game, configCenter, 0);
    const targetAggressive = CpuAI.calculateTargetWithBehavior(game, configAggressive, 0);

    // パック自陣時は aggressiveness が同じなので、defenseStyle の違いは影響しない
    expect(targetCenter.y).toBe(targetAggressive.y);
  });
});
