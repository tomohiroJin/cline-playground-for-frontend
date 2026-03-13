/**
 * KEYS & ARMS — テスト用エンジン
 *
 * 副作用（Canvas描画・Audio・localStorage）を全てモック化し、
 * ゲームロジック（gameTick）のみを実行可能にするテストヘルパー。
 *
 * engine.ts と同じ組み立てを行うが、描画は実Canvas不要。
 */
import { TRANSITION_MID } from '../../constants';
import type { GameState, GameScreen } from '../../types/game-state';
import type { EngineContext } from '../../types/engine-context';
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
  private readonly cave: Stage;
  private readonly prairie: Stage;
  private readonly boss: Stage;
  private readonly hud: EngineContext['hud'];
  private readonly helpScreen: { update(): void };
  private readonly titleScreen: { startGame(): void };

  constructor(options: TestEngineOptions = {}) {
    const ctx = createMockCanvasContext();
    this.input = createInputHandler();
    this.storage = createInMemoryStorageRepository(options.initialHighScore ?? 0);
    const audio = createNullAudioService();

    const uninitG = createInitialGameState(
      this.input.kd,
      this.input.jp,
      this.storage.getHighScore(),
    );
    this.G = uninitG as GameState;

    const draw = createRendering(ctx);
    const particles = createParticles(draw);
    this.hud = createHUD(draw, this.G, audio, this.storage);

    const engineCtx: EngineContext = {
      G: this.G,
      draw,
      audio,
      particles,
      hud: this.hud,
      storage: this.storage,
    };

    this.cave = createCaveStage(engineCtx);
    this.prairie = createPrairieStage(engineCtx);
    this.boss = createBossStage(engineCtx);
    this.titleScreen = createTitleScreen(engineCtx);
    this.helpScreen = createHelpScreen(engineCtx);

    // 遅延バインド
    this.G.cavInit = this.cave.init.bind(this.cave);
    this.G.grsInit = this.prairie.init.bind(this.prairie);
    this.G.bosInit = this.boss.init.bind(this.boss);
    this.G.startGame = this.titleScreen.startGame;
  }

  /** 1 ティック実行（描画スキップ） */
  gameTick(): void {
    const G = this.G;
    const { justPressed: J, clearJustPressed: clearJ, isAction: jAct } = this.input;

    G.tick++;
    if (G.beatPulse > 0) G.beatPulse--;

    const isGameplay = () =>
      G.state !== 'title' && G.state !== 'over' &&
      G.state !== 'trueEnd' && G.state !== 'ending1';

    // リセット確認
    if (G.resetConfirm > 0) {
      G.resetConfirm--;
      if (jAct()) {
        G.resetConfirm = 0; G.state = 'title'; G.blink = 0;
        if (G.score > G.hi) { G.hi = G.score; this.storage.setHighScore(G.hi); }
        clearJ(); return;
      }
      if (J('escape')) G.resetConfirm = 0;
      clearJ(); return;
    }

    // ポーズトグル
    if (J('p') && isGameplay() && G.state !== 'help') {
      G.paused = !G.paused;
      clearJ(); return;
    }

    // ポーズ中スキップ
    if (G.paused) {
      if (J('escape')) { G.paused = false; G.resetConfirm = 90; }
      clearJ(); return;
    }

    // ESC リセット確認
    if (J('escape') && isGameplay()) {
      G.resetConfirm = 90; clearJ(); return;
    }

    // ヒットストップ
    if (G.hitStop > 0) { G.hitStop--; clearJ(); return; }
    if (G.hurtFlash > 0) G.hurtFlash--;
    if (G.shakeT > 0) G.shakeT--;

    if (G.trT > 0) {
      if (isGameplay()) this.hud.doBeat();
      // 描画をスキップするため、トランジション処理をここで実行
      G.trT--;
      if (G.trT === TRANSITION_MID && G.trFn) G.trFn();
    } else {
      let nb = false;
      if (isGameplay()) nb = this.hud.doBeat();
      switch (G.state) {
        case 'cave': this.cave.update(nb); break;
        case 'grass': this.prairie.update(nb); break;
        case 'boss': this.boss.update(nb); break;
        case 'title':
          if (J('arrowup')) { G.state = 'help'; G.helpPage = 0; clearJ(); break; }
          if (jAct() || J('enter')) { this.titleScreen.startGame(); }
          break;
        case 'help': this.helpScreen.update(); break;
        case 'over': case 'trueEnd': case 'ending1': break;
      }
    }
    clearJ();
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
    while (this.G.trT > 0) {
      this.gameTick();
    }
  }
}

/** TestEngine のショートカット */
export function createTestEngine(options?: TestEngineOptions): TestEngine {
  return new TestEngine(options);
}
