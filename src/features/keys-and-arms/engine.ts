/* eslint-disable */
// @ts-nocheck
/**
 * KEYS & ARMS — ゲームエンジン（オーケストレータ）
 * 各モジュールを組み立て、ゲームループを駆動する。
 */

import { W, H, BG, ON, TICK_MS } from './constants';
import { createRendering } from './core/rendering';
import { createAudio } from './core/audio';
import { createParticles } from './core/particles';
import { createHUD } from './core/hud';
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

  /* ================================================================
     CANVAS セットアップ
     ================================================================ */
  const cv = canvas;
  const $ = cv.getContext('2d')!;
  cv.width = W; cv.height = H;

  function resize() {
    const s = Math.min(window.innerWidth * 0.94 / W, (window.innerHeight * 0.62) / H, 2.5);
    cv.style.width = (W * s) + 'px';
    cv.style.height = (H * s) + 'px';
  }
  resize();

  /* ================================================================
     INPUT — キーボード状態管理
     ================================================================ */
  const kd = {}, jp = {};
  function J(k) { return jp[k.toLowerCase()]; }
  function clearJ() { for (const k in jp) delete jp[k]; }
  function jAct() { return J('z') || J(' '); }

  /* ================================================================
     GAME STATE — 共有ゲーム状態オブジェクト
     ================================================================ */
  const G = {
    // 全体状態
    state: 'title',
    loop: 1,
    score: 0,
    dispScore: 0,
    hp: 3,
    maxHp: 3,
    tick: 0,
    beatCtr: 0,
    beatNum: 0,
    beatPulse: 0,
    noDmg: true,
    hurtFlash: 0,
    shakeT: 0,
    hitStop: 0,
    hi: parseInt(localStorage.getItem('kaG') || '0'),
    resetConfirm: 0,
    earnedShields: 0,
    bgmBeat: 0,
    paused: false,
    helpPage: 0,

    // 入力（jp はフレーム中の「押された」フラグ）
    jp,
    kd,

    // トランジション
    trT: 0,
    trTxt: '',
    trFn: null,
    trSub: '',

    // タイトル画面
    blink: 0,
    cheatBuf: '',

    // エンディング
    e1T: 0,
    teT: 0,

    // ステージ状態（各ステージ init で初期化される）
    cav: {},
    sparks: [], dust: [], feathers: [], smoke: [], stepDust: [], keySpk: [], cavDrips: [],
    grs: {},
    grsSlash: [], grsDead: [], grsGrass: [], grsDust: [],
    bos: {},
    bosParticles: [], bosShieldBreak: [], bosArmTrail: [],

    // 遅延バインド：各ステージ init コールバック
    cavInit: null,
    grsInit: null,
    bosInit: null,
    startGame: null,
  };

  /* ================================================================
     モジュール生成
     ================================================================ */
  const draw = createRendering($);
  const audio = createAudio(G);
  const particles = createParticles(draw);
  const hud = createHUD(draw, G, audio);

  const ctx = { G, draw, audio, particles, hud };

  // ステージ
  const cave = createCaveStage(ctx);
  const prairie = createPrairieStage(ctx);
  const boss = createBossStage(ctx);

  // 画面
  const titleScreen = createTitleScreen(ctx);
  const helpScreen = createHelpScreen(ctx);
  const gameOverScreen = createGameOverScreen(ctx);
  const endingScreen = createEndingScreen(ctx);
  const trueEndScreen = createTrueEndScreen(ctx);

  /* ================================================================
     遅延バインド — ステージ間の循環参照を解決
     ================================================================ */
  G.cavInit = cave.init;
  G.grsInit = prairie.init;
  G.bosInit = boss.init;
  G.startGame = titleScreen.startGame;

  /* ================================================================
     描画ヘルパー（オーケストレータ用）
     ================================================================ */
  const { onFill, txt, txtC } = draw;

  /* ================================================================
     GAME TICK — 状態マシン
     ================================================================ */
  function gameTick() {
    G.tick++;
    if (G.beatPulse > 0) G.beatPulse--;

    // リセット確認
    if (G.resetConfirm > 0) {
      G.resetConfirm--;
      if (jAct()) {
        G.resetConfirm = 0; G.state = 'title'; G.blink = 0;
        if (G.score > G.hi) { G.hi = G.score; localStorage.setItem('kaG', String(G.hi)); }
        clearJ(); return;
      }
      if (J('escape')) G.resetConfirm = 0;
      clearJ(); return;
    }

    // ポーズトグル（ゲームプレイ中のみ）
    if (J('p') && G.state !== 'title' && G.state !== 'over'
        && G.state !== 'trueEnd' && G.state !== 'ending1' && G.state !== 'help') {
      G.paused = !G.paused;
      clearJ(); return;
    }

    // ポーズ中はティックスキップ（ただしESCは受け付ける）
    if (G.paused) {
      // ESC でリセット確認（ポーズ中も有効）
      if (J('escape')) {
        G.paused = false;
        G.resetConfirm = 90;
      }
      clearJ(); return;
    }

    // ESC でリセット確認（ゲームプレイ中のみ）
    if (J('escape') && G.state !== 'title' && G.state !== 'over' && G.state !== 'trueEnd' && G.state !== 'ending1') {
      G.resetConfirm = 90; clearJ(); return;
    }

    // ヒットストップ
    if (G.hitStop > 0) { G.hitStop--; clearJ(); return; }
    if (G.hurtFlash > 0) G.hurtFlash--;
    if (G.shakeT > 0) G.shakeT--;

    if (G.trT > 0) {
      if (G.state !== 'title' && G.state !== 'over' && G.state !== 'trueEnd' && G.state !== 'ending1') hud.doBeat();
    } else {
      let nb = false;
      if (G.state !== 'title' && G.state !== 'over' && G.state !== 'trueEnd' && G.state !== 'ending1') nb = hud.doBeat();
      switch (G.state) {
        case 'cave': cave.update(nb); break;
        case 'grass': prairie.update(nb); break;
        case 'boss': boss.update(nb); break;
        case 'title':
          for (const k of 'abcdefghijklmnopqrstuvwxyz'.split('')) {
            if (J(k)) { G.cheatBuf += k; if (G.cheatBuf.length > 10) G.cheatBuf = G.cheatBuf.slice(-10); }
          }
          if (J('arrowup')) { G.state = 'help'; G.helpPage = 0; clearJ(); break; }
          if (jAct() || J('enter')) { audio.ea(); audio.S.start(); titleScreen.startGame(); }
          break;
        case 'help': helpScreen.update(); break;
        case 'over': case 'trueEnd': case 'ending1': break;
      }
    }
    clearJ();
  }

  /* ================================================================
     RENDER — 描画
     ================================================================ */
  function render() {
    $.save();
    const qk = G.state === 'boss' && G.bos ? G.bos.quake || 0 : 0;
    const totalShake = G.shakeT + qk;
    if (totalShake > 0) {
      const sx = (Math.random() - .5) * totalShake * .7;
      const sy = (Math.random() - .5) * totalShake * .5;
      $.translate(sx, sy);
    }
    $.fillStyle = BG; $.fillRect(0, 0, W, H);
    // LCD スキャンライン
    $.fillStyle = 'rgba(145,158,125,0.08)';
    for (let y = 0; y < H; y += 2) $.fillRect(0, y, W, 1);
    // ビートパルス
    if (G.beatPulse > 0 && G.state !== 'title' && G.state !== 'over') {
      onFill(G.beatPulse / 6 * .035); $.fillRect(0, 0, W, H); $.globalAlpha = 1;
    }
    // ダメージフラッシュ
    if (G.hurtFlash > 0) {
      const hfa = Math.min(1, G.hurtFlash / 5);
      $.fillStyle = `rgba(40,10,0,${hfa * .2})`; $.fillRect(0, 0, W, H);
    }
    // ヒットストップフラッシュ
    if (G.hitStop > 0) { $.fillStyle = BG; $.globalAlpha = .1; $.fillRect(0, 0, W, H); $.globalAlpha = 1; }

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

    // LCD ベゼル影
    onFill(.03);
    $.fillRect(0, 0, W, 3); $.fillRect(0, H - 3, W, 3);
    $.fillRect(0, 0, 3, H); $.fillRect(W - 3, 0, 3, H);
    $.globalAlpha = 1;

    // ポーズオーバーレイ
    if (G.paused) {
      $.fillStyle = 'rgba(26,40,16,.65)'; $.fillRect(0, 0, W, H);
      $.fillStyle = BG;
      txtC('PAUSED', W / 2, H / 2 - 20, 16);
      if (Math.floor(G.tick / 18) % 2) {
        txtC('P: RESUME    ESC: TITLE', W / 2, H / 2 + 14, 6);
      }
    }

    // リセット確認オーバーレイ
    if (G.resetConfirm > 0) {
      $.fillStyle = 'rgba(26,40,16,.75)'; $.fillRect(0, 0, W, H);
      $.fillStyle = BG; txtC('RETURN TO TITLE?', W / 2, H / 2 - 20, 10);
      if (Math.floor(G.tick / 12) % 2) txtC('Z: YES    ESC: NO', W / 2, H / 2 + 10, 7);
    }
    $.restore();
  }

  /* ================================================================
     FRAME — rAF ループ
     ================================================================ */
  let lastTime = 0, accumulator = 0;
  function frame(now) {
    if (!lastTime) lastTime = now;
    const dt = Math.min(now - lastTime, 100);
    lastTime = now;
    accumulator += dt;
    while (accumulator >= TICK_MS) { gameTick(); accumulator -= TICK_MS; }
    render();
    if (running) animFrameId = requestAnimationFrame(frame);
  }

  /* ================================================================
     エンジン制御
     ================================================================ */
  let animFrameId: number = 0;
  let running = false;

  function start(): void {
    if (running) return;
    running = true;
    lastTime = 0;
    accumulator = 0;
    animFrameId = requestAnimationFrame(frame);
  }

  function stop(): void {
    running = false;
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = 0;
    }
  }

  function handleKeyDown(key: string): void {
    const k = key.toLowerCase();
    if (!kd[k]) jp[k] = true;
    kd[k] = true;
  }

  function handleKeyUp(key: string): void {
    kd[key.toLowerCase()] = false;
  }

  return { start, stop, resize, handleKeyDown, handleKeyUp };
}
