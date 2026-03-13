/** KEYS & ARMS — ゲームエンジン（オーケストレータ） */

import type { EngineContext, GameState } from './types';
import { W, H, BG, TICK_MS } from './constants';
import { createRendering } from './core/rendering';
import { createAudio } from './core/audio';
import { createParticles } from './core/particles';
import { createHUD } from './core/hud';
import { createInputHandler } from './core/input';
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
  const uninitG = createInitialGameState(input.kd, input.jp, storage.getHighScore());
  // 遅延バインド完了後に GameState として使用（各ステージ init でステージ状態が設定される）
  const G = uninitG as GameState;
  const draw = createRendering($);
  const audio = createAudio(G);
  const particles = createParticles(draw);
  const hud = createHUD(draw, G, audio, storage);
  const effects = createRenderEffects($, draw.onFill, draw.txtC);
  const ctx: EngineContext = { G, draw, audio, particles, hud, storage };

  const cave = createCaveStage(ctx);
  const prairie = createPrairieStage(ctx);
  const boss = createBossStage(ctx);
  const titleScreen = createTitleScreen(ctx);
  const helpScreen = createHelpScreen(ctx);
  const gameOverScreen = createGameOverScreen(ctx);
  const endingScreen = createEndingScreen(ctx);
  const trueEndScreen = createTrueEndScreen(ctx);

  /* 遅延バインド */
  G.cavInit = cave.init; G.grsInit = prairie.init;
  G.bosInit = boss.init; G.startGame = titleScreen.startGame;
  const isGameplay = () => G.state !== 'title' && G.state !== 'over' && G.state !== 'trueEnd' && G.state !== 'ending1';

  /* GAME TICK — 状態マシン */
  function gameTick() {
    G.tick++;
    if (G.beatPulse > 0) G.beatPulse--;

    // リセット確認
    if (G.resetConfirm > 0) {
      G.resetConfirm--;
      if (jAct()) {
        G.resetConfirm = 0; G.state = 'title'; G.blink = 0;
        if (G.score > G.hi) { G.hi = G.score; storage.setHighScore(G.hi); }
        clearJ(); return;
      }
      if (J('escape')) G.resetConfirm = 0;
      clearJ(); return;
    }

    // ポーズトグル（ゲームプレイ中のみ）
    if (J('p') && isGameplay() && G.state !== 'help') {
      G.paused = !G.paused;
      clearJ(); return;
    }

    // ポーズ中はティックスキップ
    if (G.paused) {
      if (J('escape')) { G.paused = false; G.resetConfirm = 90; }
      clearJ(); return;
    }

    // ESC でリセット確認
    if (J('escape') && isGameplay()) {
      G.resetConfirm = 90; clearJ(); return;
    }

    // ヒットストップ
    if (G.hitStop > 0) { G.hitStop--; clearJ(); return; }
    if (G.hurtFlash > 0) G.hurtFlash--;
    if (G.shakeT > 0) G.shakeT--;

    if (G.trT > 0) {
      if (isGameplay()) hud.doBeat();
    } else {
      let nb = false;
      if (isGameplay()) nb = hud.doBeat();
      switch (G.state) {
        case 'cave': cave.update(nb); break;
        case 'grass': prairie.update(nb); break;
        case 'boss': boss.update(nb); break;
        case 'title':
          for (const k of 'abcdefghijklmnopqrstuvwxyz'.split('')) {
            if (J(k)) { G.cheatBuf += k; if (G.cheatBuf.length > 10) G.cheatBuf = G.cheatBuf.slice(-10); }
          }
          if (J('arrowup')) { G.state = 'help'; G.helpPage = 0; clearJ(); break; }
          if (jAct() || J('enter')) { audio.S.start(); titleScreen.startGame(); }
          break;
        case 'help': helpScreen.update(); break;
        case 'over': case 'trueEnd': case 'ending1': break;
      }
    }
    clearJ();
  }

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

    if (G.trT > 0) {
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
