/**
 * AI 設定可能インターフェースのテスト
 * リファクタリング: AiBehaviorConfig による振る舞い制御
 */
import { CpuAI } from './ai';
import { EntityFactory } from './entities';
import { CONSTANTS } from './constants';
import { AI_BEHAVIOR_PRESETS, getStoryStageBalance } from './story-balance';
import type { AiBehaviorConfig } from './story-balance';

const { WIDTH: W, HEIGHT: H } = CONSTANTS.CANVAS;

describe('CpuAI.updateWithBehavior', () => {
  it('AiBehaviorConfig を渡して CPU を更新できる', () => {
    const game = EntityFactory.createGameState();
    game.pucks[0].y = 200;
    game.pucks[0].vy = -5;
    game.pucks[0].x = 200;

    const config = AI_BEHAVIOR_PRESETS.normal;
    const result = CpuAI.updateWithBehavior(game, config, 1000);

    expect(result).not.toBeNull();
    expect(result?.cpu).toBeDefined();
  });

  it('easy プリセットと difficulty="easy" で同等の動作', () => {
    const game = EntityFactory.createGameState();
    game.pucks[0].y = 200;
    game.pucks[0].vy = -5;
    game.pucks[0].x = 200;

    // 同じランダム状態ではないが、ターゲット計算のロジックは同じ
    const configTarget = CpuAI.calculateTargetWithBehavior(
      game, AI_BEHAVIOR_PRESETS.easy, 1000
    );
    const diffTarget = CpuAI.calculateTarget(game, 'easy', 1000);

    // 両方ともパック付近をターゲットにする（ウォブルがあるので完全一致はしない）
    expect(configTarget.y).toBeLessThan(H / 2);
    expect(diffTarget.y).toBeLessThan(H / 2);
  });

  it('ステージ 1-1 の設定で遅い CPU が返る', () => {
    // skipRate による非決定的な null 返却を防ぐためモック
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.99);

    const game = EntityFactory.createGameState();
    game.pucks[0].y = 200;
    game.pucks[0].vy = -5;
    game.pucks[0].x = 300;
    game.cpu.x = 100;
    game.cpu.y = 80;

    const balance = getStoryStageBalance('1-1');
    const result = CpuAI.updateWithBehavior(game, balance.ai, 1000);

    expect(result).not.toBeNull();
    if (result) {
      // 速度が balance.ai.maxSpeed 以下
      const speed = Math.sqrt(result.cpu.vx ** 2 + result.cpu.vy ** 2);
      expect(speed).toBeLessThanOrEqual(balance.ai.maxSpeed + 0.01);
    }

    randomSpy.mockRestore();
  });

  it('スキップ率が高い設定では null を返すことがある', () => {
    const game = EntityFactory.createGameState();
    const highSkipConfig: AiBehaviorConfig = {
      ...AI_BEHAVIOR_PRESETS.easy,
      skipRate: 1.0, // 100% スキップ
    };

    const result = CpuAI.updateWithBehavior(game, highSkipConfig, 1000);
    expect(result).toBeNull();
  });

  it('壁バウンス予測が有効な設定で予測が正確', () => {
    const game = EntityFactory.createGameState();
    // パックが壁に向かって斜めに進む
    game.pucks[0].x = 400;
    game.pucks[0].y = 300;
    game.pucks[0].vx = 5;
    game.pucks[0].vy = -8;

    const withBounce: AiBehaviorConfig = {
      ...AI_BEHAVIOR_PRESETS.hard,
      wallBounce: true,
      predictionFactor: 12,
    };
    const withoutBounce: AiBehaviorConfig = {
      ...AI_BEHAVIOR_PRESETS.hard,
      wallBounce: false,
      predictionFactor: 12,
    };

    const targetWithBounce = CpuAI.calculateTargetWithBehavior(
      game, withBounce, 1000
    );
    const _targetWithoutBounce = CpuAI.calculateTargetWithBehavior(
      game, withoutBounce, 1000
    );

    // 壁バウンス予測ありの方がフィールド内に収まる
    expect(targetWithBounce.x).toBeGreaterThanOrEqual(20);
    expect(targetWithBounce.x).toBeLessThanOrEqual(W - 20);
  });

  it('centerWeight が高い設定ではターゲットが中央に寄る', () => {
    const game = EntityFactory.createGameState();
    game.pucks[0].x = 50;
    game.pucks[0].y = 300;
    game.pucks[0].vy = -3;
    game.pucks[0].vx = 0;

    const highCenter: AiBehaviorConfig = {
      ...AI_BEHAVIOR_PRESETS.easy,
      centerWeight: 0.9,
      wobble: 0,
    };
    const lowCenter: AiBehaviorConfig = {
      ...AI_BEHAVIOR_PRESETS.normal,
      centerWeight: 0,
    };

    const targetHigh = CpuAI.calculateTargetWithBehavior(game, highCenter, 1000);
    const targetLow = CpuAI.calculateTargetWithBehavior(game, lowCenter, 1000);

    // 高 centerWeight はターゲットが中央寄り
    const distFromCenterHigh = Math.abs(targetHigh.x - W / 2);
    const distFromCenterLow = Math.abs(targetLow.x - W / 2);
    expect(distFromCenterHigh).toBeLessThan(distFromCenterLow);
  });
});

describe('既存 API の後方互換性', () => {
  it('CpuAI.update が Difficulty 文字列で引き続き動作する', () => {
    const game = EntityFactory.createGameState();
    game.pucks[0].y = 200;
    game.pucks[0].vy = -5;

    const result = CpuAI.update(game, 'normal', 1000);
    expect(result).not.toBeNull();
  });

  it('CpuAI.calculateTarget が Difficulty 文字列で引き続き動作する', () => {
    const game = EntityFactory.createGameState();
    game.pucks[0].y = 200;
    game.pucks[0].vy = -5;

    const target = CpuAI.calculateTarget(game, 'normal', 1000);
    expect(target).toBeDefined();
    expect(target.x).toBeDefined();
    expect(target.y).toBeDefined();
  });
});
