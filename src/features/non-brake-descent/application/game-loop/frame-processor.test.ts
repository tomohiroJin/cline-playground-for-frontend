/**
 * processFrame 単体テスト（B2-S2）
 *
 * 純粋関数なので Audio モック不要。
 * AAA パターン・日本語テスト名で記述。
 */
import { createPlayer } from '../../domain/entities/player';
import { Config } from '../../config';
import { ObstacleType, RampType, SpeedRank } from '../../constants';
import type { Ramp } from '../../types';
import { processFrame } from './frame-processor';
import type { FrameContext } from './frame-processor';
import { createInitialGameWorld, createInitialUIState } from './game-state';
import { BackgroundGen } from '../../generators';

// --- テスト用ヘルパー ---

/** テスト用のシンプルなランプ配列を生成する（障害物なし） */
const buildSimpleRamps = (count: number): Ramp[] =>
  Array.from({ length: count }, (_, i): Ramp => ({
    dir: i % 2 === 0 ? 1 : -1,
    obs: [],
    type: RampType.NORMAL,
    isGoal: i === count - 1,
  }));

/** テスト用の最小 FrameContext を生成する */
const buildCtx = (overrides?: Partial<FrameContext>): FrameContext => ({
  screenWidth: Config.screen.width,
  screenHeight: Config.screen.height,
  rampHeight: Config.ramp.height,
  minSpeed: Config.speed.min,
  isGodMode: false,
  motionScale: 1,
  frameIndex: 1,
  wasOnGround: true,
  prevRank: 0,
  lastRamp: 0,
  passedObstacles: new Set(),
  ...overrides,
});

/** テスト用の最小 GameWorld を生成する */
const buildWorld = (ramps: Ramp[], overrides?: Parameters<typeof createInitialGameWorld>[1] extends object ? object : never) => {
  const player = createPlayer();
  const world = createInitialGameWorld(player, ramps);
  return { ...world, speed: Config.speed.min, ...overrides } as typeof world;
};

/** 入力なし（何も押していない）状態 */
const noInput = { left: false, right: false, accel: false, jump: false };

// --- テストスイート ---

describe('processFrame 単体テスト', () => {
  // ────────────────────────────────────────────────────────────────────────────
  describe('正常系: エフェクトタイマー', () => {
    it('effect.timer > 0 のとき 1 減算されること', () => {
      // Arrange
      const ramps = buildSimpleRamps(3);
      const world = {
        ...buildWorld(ramps),
        effect: { type: 'reverse' as const, timer: 10 },
      };
      const ui = createInitialUIState(BackgroundGen.initClouds());
      const ctx = buildCtx();

      // Act
      const result = processFrame(world, ui, noInput, ctx);

      // Assert
      expect(result.world.effect.timer).toBe(9);
      expect(result.world.effect.type).toBe('reverse');
    });

    it('effect.timer === 0 のとき type が undefined になること', () => {
      // Arrange
      const ramps = buildSimpleRamps(3);
      const world = {
        ...buildWorld(ramps),
        effect: { type: 'reverse' as const, timer: 0 },
      };
      const ui = createInitialUIState(BackgroundGen.initClouds());
      const ctx = buildCtx();

      // Act
      const result = processFrame(world, ui, noInput, ctx);

      // Assert
      expect(result.world.effect.type).toBeUndefined();
      expect(result.world.effect.timer).toBe(0);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  describe('正常系: 速度ランク変化', () => {
    it('速度が MID 閾値を超えると newRank !== prevRank になり SPEED_RANK_CHANGED イベントが発火すること', () => {
      // Arrange
      // SpeedDomain.getRank: speed < 6 → LOW(0), speed < 10 → MID(1)
      const ramps = buildSimpleRamps(3);
      const world = {
        ...buildWorld(ramps),
        // 速度を MID 閾値ちょうどにしておき、加速で超えさせる
        speed: 9.9,
      };
      const ui = createInitialUIState(BackgroundGen.initClouds());
      // prevRank = MID（1）で、speed 9.9 → 加速 → HIGH(2) に変化
      const ctx = buildCtx({ prevRank: SpeedRank.MID });

      // Act
      const result = processFrame(world, ui, { ...noInput, accel: true }, ctx);

      // Assert: 速度が HIGH 閾値(10)以上に到達していること
      expect(result.world.speed).toBeGreaterThanOrEqual(10);
      // ランク変化イベントが含まれること
      const rankEvent = result.events.find(e => e.type === 'SPEED_RANK_CHANGED');
      expect(rankEvent).toBeDefined();
      if (rankEvent && rankEvent.type === 'SPEED_RANK_CHANGED') {
        expect(rankEvent.rank).toBe(SpeedRank.HIGH);
      }
      expect(result.newRank).toBe(SpeedRank.HIGH);
    });

    it('速度ランクが変化しない場合は SPEED_RANK_CHANGED イベントが発火しないこと', () => {
      // Arrange
      const ramps = buildSimpleRamps(3);
      const world = { ...buildWorld(ramps), speed: Config.speed.min };
      const ui = createInitialUIState(BackgroundGen.initClouds());
      // prevRank = LOW(0)、速度も LOW のまま
      const ctx = buildCtx({ prevRank: SpeedRank.LOW });

      // Act
      const result = processFrame(world, ui, noInput, ctx);

      // Assert
      const rankEvent = result.events.find(e => e.type === 'SPEED_RANK_CHANGED');
      expect(rankEvent).toBeUndefined();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  describe('正常系: ランプ遷移', () => {
    it('ランプ端に到達すると遷移後の player.ramp が進むこと（isGoal=false）', () => {
      // Arrange: ランプ 0 の右端近くにプレイヤーを配置
      const ramps = buildSimpleRamps(5);
      const player = createPlayer(Config.screen.width - Config.ramp.transitionMargin + 1, 0);
      const world = {
        ...createInitialGameWorld(player, ramps),
        speed: Config.speed.min,
        combo: { count: 0, timer: 0 },
        effect: { type: undefined as undefined, timer: 0 },
        lastRamp: 0,
        nearMissCount: 0,
        dangerLevel: 0,
        score: 0,
        speedBonus: 0,
        camY: 0,
      };
      const ui = createInitialUIState(BackgroundGen.initClouds());
      const ctx = buildCtx({ lastRamp: 0 });

      // Act
      const result = processFrame(world, ui, noInput, ctx);

      // Assert
      expect(result.isGoal).toBe(false);
      expect(result.isDead).toBe(false);
      expect(result.world.player.ramp).toBe(1);
    });

    it('最終ランプの端に到達すると isGoal=true になること', () => {
      // Arrange: 2ランプ構成の最後（index 1）にいる状態で右端を超える
      const ramps: Ramp[] = [
        { dir: 1, obs: [], type: RampType.NORMAL, isGoal: false },
        { dir: -1, obs: [], type: RampType.NORMAL, isGoal: true },
      ];
      // ランプ 1 の dir=-1 なので、左端 (x <= transitionMargin) でゴール
      const player = createPlayer(Config.ramp.transitionMargin - 1, 0);
      const playerWithRamp = { ...player, ramp: 1 };
      const world = {
        ...createInitialGameWorld(playerWithRamp, ramps),
        speed: Config.speed.min,
        combo: { count: 0, timer: 0 },
        effect: { type: undefined as undefined, timer: 0 },
        lastRamp: 1,
        nearMissCount: 0,
        dangerLevel: 0,
        score: 0,
        speedBonus: 0,
        camY: 0,
      };
      const ui = createInitialUIState(BackgroundGen.initClouds());
      const ctx = buildCtx({ lastRamp: 1 });

      // Act
      const result = processFrame(world, ui, noInput, ctx);

      // Assert
      expect(result.isGoal).toBe(true);
      // GOAL_REACHED イベントが含まれること
      const goalEvent = result.events.find(e => e.type === 'GOAL_REACHED');
      expect(goalEvent).toBeDefined();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  describe('正常系: 着地検出', () => {
    it('前フレームが空中（wasOnGround=false）で着地（onGround=true）したとき AUDIO(land) イベントが発火すること', () => {
      // Arrange:
      // Physics.applyJump の仕様: jumpCD <= 0 かつ jumping=false のとき onGround=true になる。
      // jumpCD=0, jumping=false, y=0 のプレイヤーを「前フレームは空中（wasOnGround=false）」
      // という条件で渡すことで、「今フレームで onGround=true」の着地条件を満たす。
      const ramps = buildSimpleRamps(3);
      const player = {
        ...createPlayer(100, 0),
        y: 0,
        vy: 0,
        jumping: false,
        jumpCD: 0,
        onGround: false, // 前フレームは onGround=false (jumpCD を消化したタイミング)
      };
      const world = {
        ...createInitialGameWorld(player, ramps),
        speed: Config.speed.min,
        combo: { count: 0, timer: 0 },
        effect: { type: undefined as undefined, timer: 0 },
        lastRamp: 0,
        nearMissCount: 0,
        dangerLevel: 0,
        score: 0,
        speedBonus: 0,
        camY: 0,
      };
      const ui = createInitialUIState(BackgroundGen.initClouds());
      // wasOnGround=false（前フレームは空中）
      const ctx = buildCtx({ wasOnGround: false });

      // Act
      const result = processFrame(world, ui, noInput, ctx);

      // Assert: jumpCD=0 かつ jumping=false → applyJump 後 onGround=true になる
      expect(result.world.player.onGround).toBe(true);
      // AUDIO land イベントが含まれること
      const landEvent = result.events.find(
        e => e.type === 'AUDIO' && (e as { type: 'AUDIO'; sound: string }).sound === 'land'
      );
      expect(landEvent).toBeDefined();
    });

    it('前フレームが接地（wasOnGround=true）の場合は AUDIO(land) が発火しないこと', () => {
      // Arrange
      const ramps = buildSimpleRamps(3);
      const player = { ...createPlayer(100, 0), onGround: true, jumping: false };
      const world = {
        ...createInitialGameWorld(player, ramps),
        speed: Config.speed.min,
        combo: { count: 0, timer: 0 },
        effect: { type: undefined as undefined, timer: 0 },
        lastRamp: 0,
        nearMissCount: 0,
        dangerLevel: 0,
        score: 0,
        speedBonus: 0,
        camY: 0,
      };
      const ui = createInitialUIState(BackgroundGen.initClouds());
      // wasOnGround=true
      const ctx = buildCtx({ wasOnGround: true });

      // Act
      const result = processFrame(world, ui, noInput, ctx);

      // Assert
      const landEvent = result.events.find(
        e => e.type === 'AUDIO' && (e as { type: 'AUDIO'; sound: string }).sound === 'land'
      );
      expect(landEvent).toBeUndefined();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  describe('不変条件', () => {
    it('world.speed >= minSpeed が常に維持されること', () => {
      // Arrange
      const ramps = buildSimpleRamps(3);
      const world = { ...buildWorld(ramps), speed: Config.speed.min };
      const ui = createInitialUIState(BackgroundGen.initClouds());
      const ctx = buildCtx();

      // Act: 加速なし（デフォルト減速）
      const result = processFrame(world, ui, noInput, ctx);

      // Assert
      expect(result.world.speed).toBeGreaterThanOrEqual(Config.speed.min);
    });

    it('world.score >= 0 が常に維持されること（score=0 起点で差分が負にならない）', () => {
      // Arrange
      const ramps = buildSimpleRamps(3);
      const world = { ...buildWorld(ramps), score: 0 };
      const ui = createInitialUIState(BackgroundGen.initClouds());
      const ctx = buildCtx();

      // Act
      const result = processFrame(world, ui, noInput, ctx);

      // Assert
      expect(result.world.score).toBeGreaterThanOrEqual(0);
    });

    it('isGoal と isDead が同時に true にならないこと', () => {
      // Arrange
      const ramps = buildSimpleRamps(3);
      const world = buildWorld(ramps);
      const ui = createInitialUIState(BackgroundGen.initClouds());
      const ctx = buildCtx();

      // Act
      const result = processFrame(world, ui, noInput, ctx);

      // Assert
      expect(result.isGoal && result.isDead).toBe(false);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  describe('異常系: ramp が取得できない場合', () => {
    it('player.ramp が範囲外のとき例外を投げずカメラのみ更新して返すこと', () => {
      // Arrange: ramp インデックス 0 にプレイヤーがいるがランプ配列が空
      const ramps: Ramp[] = [];
      const player = createPlayer();
      const world = {
        ...createInitialGameWorld(player, ramps),
        speed: Config.speed.min,
        combo: { count: 0, timer: 0 },
        effect: { type: undefined as undefined, timer: 0 },
        lastRamp: 0,
        nearMissCount: 0,
        dangerLevel: 0,
        score: 0,
        speedBonus: 0,
        camY: 0,
      };
      const ui = createInitialUIState(BackgroundGen.initClouds());
      const ctx = buildCtx();

      // Act & Assert: 例外を投げないこと
      expect(() => processFrame(world, ui, noInput, ctx)).not.toThrow();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  describe('正常系: ゴッドモード', () => {
    it('ゴッドモードが有効な場合、岩に衝突しても isDead=false のままであること', () => {
      // Arrange: プレイヤーの直前に ROCK を配置
      const rockObs = {
        t: ObstacleType.ROCK as (typeof ObstacleType)[keyof typeof ObstacleType],
        pos: 0.5,
        passed: false,
      };
      // dir=1 のランプで pos=0.5 → ox = 40 + 0.5 * (400-80) = 40 + 160 = 200
      const ramps: Ramp[] = [
        { dir: 1, obs: [rockObs], type: RampType.NORMAL, isGoal: false },
        { dir: -1, obs: [], type: RampType.NORMAL, isGoal: true },
      ];
      // プレイヤーを ox=200 の直前に配置（衝突範囲 groundThreshold=22 以内）
      const player = createPlayer(200, 0);
      const world = {
        ...createInitialGameWorld(player, ramps),
        speed: Config.speed.min,
        combo: { count: 0, timer: 0 },
        effect: { type: undefined as undefined, timer: 0 },
        lastRamp: 0,
        nearMissCount: 0,
        dangerLevel: 0,
        score: 0,
        speedBonus: 0,
        camY: 0,
      };
      const ui = createInitialUIState(BackgroundGen.initClouds());
      const ctx = buildCtx({ isGodMode: true });

      // Act
      const result = processFrame(world, ui, noInput, ctx);

      // Assert: ゴッドモードなので死亡しない
      expect(result.isDead).toBe(false);
    });
  });
});
