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
    // normal プリセットには regular プロファイル（lateralOscillation=10）が設定されている。
    // now=0 で sin(0)=0 となり揺さぶりオフセットが 0 になるため、X がパック位置と一致する。
    // これは意図した動作変更: フリー対戦 normal 難易度でも微小な揺さぶりが加わる仕様。
    const now = 0;

    const result = CpuAI.update(game, diff, now);

    expect(result).not.toBeNull();
    expect(result?.cpuTarget).not.toBeNull();
    expect(result?.cpuTarget?.x).toBe(100);
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
      game.pucks[0].x = 150;
      game.pucks[0].y = 400;
      game.pucks[0].vy = 2;
      game.pucks[0].vx = 0;

      const result = CpuAI.update(game, 'normal', 1000);
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
      game.pucks[0].x = 150;
      game.pucks[0].y = 400;
      game.pucks[0].vy = 2;
      game.pucks[0].vx = 0;

      const result = CpuAI.update(game, 'normal', 3100);
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
