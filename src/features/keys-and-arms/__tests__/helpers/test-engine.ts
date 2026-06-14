/**
 * KEYS & ARMS — テスト用エンジン
 *
 * 副作用（Canvas描画・Audio・localStorage）を全てモック化し、
 * ゲームロジック（gameTick）のみを実行可能にするテストヘルパー。
 *
 * engine.ts と同じ組み立てを行うが、描画は実Canvas不要。
 */
import type { GameState, GameScreen } from '../../types/game-state';
import { createGameTick } from '../../core/game-tick';
import { advanceTransition } from '../../core/transition';
import type { EngineContext } from '../../types/engine-context';
import type { StageNavigator } from '../../types/stage-navigator';
import { createRendering } from '../../core/rendering';
import { createParticles } from '../../core/particles';
import { createHUD } from '../../core/hud';
import { createInputHandler } from '../../core/input';
import type { InputHandler } from '../../core/input';
import { createInitialGameState } from '../../core/game-state';
import { createNullAudioService } from '../../infrastructure/null-audio-service';
import { createInMemoryStorageRepository } from '../../infrastructure/storage-repository';
import type { GameStorageRepository } from '../../infrastructure/storage-repository';
import { createCaveStage } from '../../stages/cave/index';
import { createPrairieStage } from '../../stages/prairie/index';
import { createBossStage } from '../../stages/boss/index';
import { createTitleScreen } from '../../screens/title';
import { createHelpScreen } from '../../screens/help';
import type { Stage } from '../../types/stage';
import { createMockCanvasContext } from './mock-factories';

/** テスト用エンジンの設定 */
export interface TestEngineOptions {
  initialHighScore?: number;
}

/**
 * テスト用エンジン
 *
 * 副作用を排除した状態でゲームロジックを実行する。
 * gameTick() を直接呼び出してゲーム進行をシミュレートできる。
 */
export class TestEngine {
  readonly input: InputHandler;
  readonly storage: GameStorageRepository;
  readonly G: GameState;
  /** ステージ遷移ナビゲータ（テストから遷移を直接トリガーするために公開） */
  readonly nav: StageNavigator;
  private readonly cave: Stage;
  private readonly prairie: Stage;
  private readonly boss: Stage;
  private readonly hud: EngineContext['hud'];
  private readonly helpScreen: { update(): void };
  private readonly titleScreen: { startGame(): void };
  private readonly runTick: () => void;

  constructor(options: TestEngineOptions = {}) {
    const ctx = createMockCanvasContext();
    this.input = createInputHandler();
    this.storage = createInMemoryStorageRepository(options.initialHighScore ?? 0);
    const audio = createNullAudioService();

    this.G = createInitialGameState(
      this.input.kd,
      this.input.jp,
      this.storage.getHighScore(),
    );

    const draw = createRendering(ctx);
    const particles = createParticles(draw);
    this.hud = createHUD(draw, this.G, audio, this.storage);

    this.nav = {
      cave: () => {},
      prairie: () => {},
      boss: () => {},
      startGame: () => {},
    };

    const engineCtx: EngineContext = {
      G: this.G,
      draw,
      audio,
      particles,
      hud: this.hud,
      storage: this.storage,
      nav: this.nav,
    };

    this.cave = createCaveStage(engineCtx);
    this.prairie = createPrairieStage(engineCtx);
    this.boss = createBossStage(engineCtx);
    this.titleScreen = createTitleScreen(engineCtx);
    this.helpScreen = createHelpScreen(engineCtx);

    // 遅延バインド（nav に実体を差し込む）
    this.nav.cave = this.cave.init.bind(this.cave);
    this.nav.prairie = this.prairie.init.bind(this.prairie);
    this.nav.boss = this.boss.init.bind(this.boss);
    this.nav.startGame = this.titleScreen.startGame;

    this.runTick = createGameTick({
      G: this.G,
      J: this.input.justPressed,
      clearJustPressed: this.input.clearJustPressed,
      jAct: this.input.isAction,
      hud: this.hud,
      audio,
      nav: this.nav,
      cave: this.cave,
      prairie: this.prairie,
      boss: this.boss,
      helpScreen: this.helpScreen,
      storage: this.storage,
    });
  }

  /** 1 ティック実行（描画スキップ）。本番 engine と同じ更新ロジックを共有する。 */
  gameTick(): void {
    this.runTick();
    // 本番では render(drawTrans) がトランジションを前進させるため、ここで同等処理を行う
    if (this.G.transition.t > 0) advanceTransition(this.G);
  }

  /** 指定ティック数だけゲームを進行 */
  advanceTicks(count: number): void {
    for (let i = 0; i < count; i++) {
      this.gameTick();
    }
  }

  /** キーを押して1ティック進行 */
  pressKeyAndTick(key: string): void {
    this.input.handleKeyDown(key);
    this.gameTick();
    this.input.handleKeyUp(key);
  }

  /** 特定の画面状態まで進行（最大 maxTicks） */
  advanceUntilScreen(screen: GameScreen, maxTicks = 500): void {
    for (let i = 0; i < maxTicks; i++) {
      if (this.G.state === screen) return;
      this.gameTick();
    }
    throw new Error(`${maxTicks} ティック以内に画面 '${screen}' に到達しなかった`);
  }

  /** ゲームを開始（タイトル → ステージ1） */
  startGame(): void {
    this.G.state = 'title';
    this.pressKeyAndTick('z');
    // トランジションをスキップ
    while (this.G.transition.t > 0) {
      this.gameTick();
    }
  }
}

/** TestEngine のショートカット */
export function createTestEngine(options?: TestEngineOptions): TestEngine {
  return new TestEngine(options);
}
