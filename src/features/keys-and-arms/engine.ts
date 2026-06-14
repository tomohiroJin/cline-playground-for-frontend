/** KEYS & ARMS — ゲームエンジン（オーケストレータ） */

import type { EngineContext, StageNavigator } from './types';
import { W, H, BG, TICK_MS } from './constants';
import { createRendering } from './core/rendering';
import { createAudio } from './core/audio';
import { createParticles } from './core/particles';
import { createHUD } from './core/hud';
import { createInputHandler } from './core/input';
import { createGameTick } from './core/game-tick';
import { createInitialGameState } from './core/game-state';
import { createLocalStorageRepository } from './infrastructure/storage-repository';
import { createRenderEffects } from './core/render-effects';
import { createCaveStage } from './stages/cave/index';
import { createPrairieStage } from './stages/prairie/index';
import { createBossStage } from './stages/boss/index';
import { createTitleScreen } from './screens/title';
import { createHelpScreen } from './screens/help';
import { createGameOverScreen } from './screens/game-over';
import { createEndingScreen } from './screens/ending';
import { createTrueEndScreen } from './screens/true-end';

export interface Engine {
  start(): void;
  stop(): void;
  resize(): void;
  handleKeyDown(key: string): void;
  handleKeyUp(key: string): void;
}

export function createEngine(canvas: HTMLCanvasElement): Engine {
  const cv = canvas;
  const $ = cv.getContext('2d')!;
  cv.width = W; cv.height = H;
  function resize() {
    const s = Math.min(window.innerWidth * 0.94 / W, (window.innerHeight * 0.62) / H, 2.5);
    cv.style.width = (W * s) + 'px'; cv.style.height = (H * s) + 'px';
  }
  resize();

  const input = createInputHandler();
  const { justPressed: J, clearJustPressed: clearJ, isAction: jAct } = input;
  const storage = createLocalStorageRepository();
  const G = createInitialGameState(input.kd, input.jp, storage.getHighScore());
  const draw = createRendering($);
  const audio = createAudio(G);
  const particles = createParticles(draw);
  const hud = createHUD(draw, G, audio, storage);
  const effects = createRenderEffects($, draw.onFill, draw.txtC);
  const nav: StageNavigator = {
    cave: () => {},
    prairie: () => {},
    boss: () => {},
    startGame: () => {},
  };
  const ctx: EngineContext = { G, draw, audio, particles, hud, storage, nav };

  const cave = createCaveStage(ctx);
  const prairie = createPrairieStage(ctx);
  const boss = createBossStage(ctx);
  const titleScreen = createTitleScreen(ctx);
  const helpScreen = createHelpScreen(ctx);
  const gameOverScreen = createGameOverScreen(ctx);
  const endingScreen = createEndingScreen(ctx);
  const trueEndScreen = createTrueEndScreen(ctx);

  /* 遅延バインド（nav に実体を差し込む） */
  nav.cave = cave.init; nav.prairie = prairie.init;
  nav.boss = boss.init; nav.startGame = titleScreen.startGame;

  /* GAME TICK — 状態マシン（core/game-tick.ts に抽出済み） */
  const gameTick = createGameTick({
    G, J, clearJustPressed: clearJ, jAct,
    hud, audio, nav, cave, prairie, boss, helpScreen, storage,
  });

  /* RENDER — 描画 */
  function render() {
    $.save();
    const qk = G.state === 'boss' && G.bos ? G.bos.quake || 0 : 0;
    effects.applyScreenShake(G.shakeT, qk);
    $.fillStyle = BG; $.fillRect(0, 0, W, H);
    effects.drawScanlines();

    if (G.beatPulse > 0 && G.state !== 'title' && G.state !== 'over') {
      effects.drawBeatPulse(G.beatPulse);
    }
    effects.drawDamageFlash(G.hurtFlash);
    effects.drawHitStopFlash(G.hitStop);

    if (G.transition.t > 0) {
      switch (G.state) {
        case 'cave': cave.draw(); hud.drawHUD(); break;
        case 'grass': prairie.draw(); hud.drawHUD(); break;
        case 'boss': boss.draw(); hud.drawHUD(); break;
      }
      hud.drawTrans();
    } else {
      switch (G.state) {
        case 'title': titleScreen.draw(); break;
        case 'help': helpScreen.draw(); break;
        case 'cave': cave.draw(); hud.drawHUD(); break;
        case 'grass': prairie.draw(); hud.drawHUD(); break;
        case 'boss': boss.draw(); hud.drawHUD(); break;
        case 'over': gameOverScreen.draw(); break;
        case 'trueEnd': trueEndScreen.draw(); break;
        case 'ending1': endingScreen.draw(); break;
      }
    }

    effects.drawLCDBevel();
    if (G.paused) effects.drawPauseOverlay(G.tick);
    if (G.resetConfirm > 0) effects.drawResetConfirmOverlay(G.tick);
    $.restore();
  }

  /* FRAME — rAF ループ */
  let lastTime = 0, accumulator = 0;
  function frame(now: number): void {
    if (!lastTime) lastTime = now;
    const dt = Math.min(now - lastTime, 100);
    lastTime = now;
    accumulator += dt;
    while (accumulator >= TICK_MS) { gameTick(); accumulator -= TICK_MS; }
    render();
    if (running) animFrameId = requestAnimationFrame(frame);
  }

  /* エンジン制御 */
  let animFrameId: number = 0;
  let running = false;

  return {
    start() {
      if (running) return;
      running = true;
      lastTime = 0;
      accumulator = 0;
      animFrameId = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = 0; }
    },
    resize,
    handleKeyDown: input.handleKeyDown,
    handleKeyUp: input.handleKeyUp,
  };
}
