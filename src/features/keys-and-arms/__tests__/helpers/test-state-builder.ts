/**
 * KEYS & ARMS — テスト用 GameState ビルダー
 *
 * デフォルト値を持ち、テストに必要な部分のみオーバーライド可能。
 * createInitialGameState を基盤とし、型安全な GameState を生成する。
 */
import type { GameState, GameScreen } from '../../types/game-state';
import type { CaveState, PrairieState, BossState } from '../../types/stage';
import { createInitialGameState } from '../../core/game-state';
import { createInitialCaveState } from '../../core/initial-cave-state';
import { createInitialPrairieState } from '../../core/initial-prairie-state';
import { createInitialBossState } from '../../core/initial-boss-state';

/**
 * テスト用 GameState ビルダー
 *
 * @example
 * const state = gameState().withHP(5).withScreen('cave').build();
 */
export class GameStateBuilder {
  private overrides: Partial<GameState> = {};
  private cavOverrides: Partial<CaveState> = {};
  private grsOverrides: Partial<PrairieState> = {};
  private bosOverrides: Partial<BossState> = {};

  withScreen(screen: GameScreen): this {
    this.overrides.state = screen;
    return this;
  }

  withHP(hp: number): this {
    this.overrides.hp = hp;
    return this;
  }

  withMaxHP(maxHp: number): this {
    this.overrides.maxHp = maxHp;
    return this;
  }

  withScore(score: number): this {
    this.overrides.score = score;
    return this;
  }

  withHighScore(hi: number): this {
    this.overrides.hi = hi;
    return this;
  }

  withLoop(loop: number): this {
    this.overrides.loop = loop;
    return this;
  }

  withTick(tick: number): this {
    this.overrides.tick = tick;
    return this;
  }

  withPaused(paused: boolean): this {
    this.overrides.paused = paused;
    return this;
  }

  withEarnedShields(n: number): this {
    this.overrides.earnedShields = n;
    return this;
  }

  withCave(overrides: Partial<CaveState>): this {
    this.cavOverrides = { ...this.cavOverrides, ...overrides };
    return this;
  }

  withPrairie(overrides: Partial<PrairieState>): this {
    this.grsOverrides = { ...this.grsOverrides, ...overrides };
    return this;
  }

  withBoss(overrides: Partial<BossState>): this {
    this.bosOverrides = { ...this.bosOverrides, ...overrides };
    return this;
  }

  build(): GameState {
    // 完全な GameState を基盤とし、ステージ状態・全体状態のオーバーライドを適用
    const base = createInitialGameState({}, {}, 0);
    return {
      ...base,
      // ステージ状態
      cav: { ...createInitialCaveState(), ...this.cavOverrides },
      grs: { ...createInitialPrairieState(), ...this.grsOverrides },
      bos: { ...createInitialBossState(), ...this.bosOverrides },
      // 全体状態のオーバーライドを適用
      ...this.overrides,
    };
  }
}

/** ビルダーのショートカット */
export function gameState(): GameStateBuilder {
  return new GameStateBuilder();
}
