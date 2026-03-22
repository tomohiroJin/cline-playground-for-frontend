/**
 * FrameProcessor のテスト
 */
import { Config } from '../../../config';
import { EffectType } from '../../../constants';
import {
  processFrame,
  resolveInput,
  updateEffect,
  updateCombo,
} from '../../../application/game-loop/frame-processor';
import type { FrameContext } from '../../../application/game-loop/frame-processor';
import {
  createInitialGameWorld,
  createInitialUIState,
} from '../../../application/game-loop/game-state';
import type { GameWorld } from '../../../application/game-loop/game-state';
import { buildPlayer, buildRamp } from '../../helpers/test-factories';

/** テスト用のデフォルト FrameContext を生成する */
const buildFrameContext = (
  overrides?: Partial<FrameContext>
): FrameContext => ({
  input: { left: false, right: false, accel: false, jump: false },
  frameCount: 1,
  passedObstacles: new Set(),
  isGodMode: false,
  screenWidth: Config.screen.width,
  screenHeight: Config.screen.height,
  rampHeight: Config.ramp.height,
  ...overrides,
});

/** テスト用の初期ワールドを構築する */
const buildTestWorld = (overrides?: Partial<GameWorld>): GameWorld => {
  const player = buildPlayer();
  const ramps = [
    buildRamp({ dir: 1 }),
    buildRamp({ dir: -1 }),
    buildRamp({ dir: 1 }),
  ];
  return {
    ...createInitialGameWorld(player, ramps),
    speed: Config.speed.min,
    ...overrides,
  };
};

describe('resolveInput', () => {
  it('通常時はそのまま入力を返す', () => {
    // Act
    const input = resolveInput(true, false, false, false, undefined);

    // Assert
    expect(input.left).toBe(true);
    expect(input.right).toBe(false);
  });

  it('リバースエフェクト時は左右が反転する', () => {
    // Act
    const input = resolveInput(true, false, false, false, EffectType.REVERSE);

    // Assert
    expect(input.left).toBe(false);
    expect(input.right).toBe(true);
  });
});

describe('updateEffect', () => {
  it('タイマーが0以下の場合にエフェクトをクリアする', () => {
    // Act
    const result = updateEffect({ type: EffectType.REVERSE, timer: 0 });

    // Assert
    expect(result.type).toBeUndefined();
    expect(result.timer).toBe(0);
  });

  it('タイマーが残っている場合にデクリメントする', () => {
    // Act
    const result = updateEffect({ type: EffectType.REVERSE, timer: 10 });

    // Assert
    expect(result.type).toBe(EffectType.REVERSE);
    expect(result.timer).toBe(9);
  });
});

describe('updateCombo', () => {
  it('コンボタイマーを1フレーム進める', () => {
    // Act
    const result = updateCombo({ count: 2, timer: 100 });

    // Assert
    expect(result.count).toBe(2);
    expect(result.timer).toBe(99);
  });

  it('タイマーが0の場合は0のまま', () => {
    // Act
    const result = updateCombo({ count: 0, timer: 0 });

    // Assert
    expect(result.timer).toBe(0);
  });
});

describe('processFrame', () => {
  it('ランプがない場合でも安全に処理される', () => {
    // Arrange
    const world = buildTestWorld({
      player: buildPlayer({ ramp: 99 }),
      ramps: [],
    });
    const ui = createInitialUIState();
    const ctx = buildFrameContext();

    // Act
    const result = processFrame(world, ui, ctx);

    // Assert
    expect(result.transition).toBe('none');
  });

  it('加速入力で速度が増加する', () => {
    // Arrange
    const world = buildTestWorld({ speed: Config.speed.min });
    const ui = createInitialUIState();
    const ctx = buildFrameContext({
      input: { left: false, right: false, accel: true, jump: false },
    });

    // Act
    const result = processFrame(world, ui, ctx);

    // Assert
    expect(result.world.speed).toBeGreaterThan(Config.speed.min);
  });

  it('ゴール到達時に cleared 遷移を返す', () => {
    // Arrange: 最後のランプの端にプレイヤーを配置する
    const ramps = [buildRamp({ dir: 1, isGoal: false })];
    const player = buildPlayer({
      x: Config.screen.width - Config.ramp.transitionMargin + 1,
      ramp: 0,
    });
    const world = buildTestWorld({ player, ramps });
    const ui = createInitialUIState();
    const ctx = buildFrameContext();

    // Act
    const result = processFrame(world, ui, ctx);

    // Assert
    expect(result.transition).toBe('cleared');
    expect(result.events.some(e => e.type === 'GOAL_REACHED')).toBe(true);
  });

  it('ランプ遷移時に AUDIO イベントを発行する', () => {
    // Arrange: ランプ端にプレイヤーを配置し、次のランプが存在する状態
    const ramps = [
      buildRamp({ dir: 1 }),
      buildRamp({ dir: -1 }),
    ];
    const player = buildPlayer({
      x: Config.screen.width - Config.ramp.transitionMargin + 1,
      ramp: 0,
    });
    const world = buildTestWorld({ player, ramps, speed: Config.speed.min });
    const ui = createInitialUIState();
    const ctx = buildFrameContext();

    // Act
    const result = processFrame(world, ui, ctx);

    // Assert
    expect(result.events.some(e => e.type === 'AUDIO' && e.sound === 'rampChange')).toBe(true);
    expect(result.world.player.ramp).toBe(1);
  });

  it('エフェクトタイマーがフレームごとに減少する', () => {
    // Arrange
    const world = buildTestWorld({
      effect: { type: EffectType.REVERSE, timer: 50 },
    });
    const ui = createInitialUIState();
    const ctx = buildFrameContext();

    // Act
    const result = processFrame(world, ui, ctx);

    // Assert
    expect(result.world.effect.timer).toBe(49);
  });

  it('トランジションエフェクトが減衰する', () => {
    // Arrange
    const world = buildTestWorld();
    const ui = { ...createInitialUIState(), transitionEffect: 1.0 };
    const ctx = buildFrameContext();

    // Act
    const result = processFrame(world, ui, ctx);

    // Assert
    expect(result.ui.transitionEffect).toBeLessThan(1.0);
  });
});
