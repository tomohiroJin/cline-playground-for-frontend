/* eslint-disable */
// @ts-nocheck
/**
 * KEYS & ARMS — 操作ガイド画面モジュール
 * タイトルから ↑ キーで遷移する3ページのヘルプ画面。
 */

import { W, H, BG, ON, K_R, K_RE, K_F, KEY_D } from '../constants';

/**
 * ヘルプ画面ファクトリ
 * @param ctx ゲームコンテキスト（状態・描画・音声・パーティクル・HUD）
 */
export function createHelpScreen(ctx) {
  const { G, draw } = ctx;
  const { $, onFill, txtC, txt, px } = draw;

  // 入力ヘルパー
  function J(k) { return G.jp[k.toLowerCase()]; }

  // 3ページ構成
  const PAGES = [
    { title: 'CAVE STAGE', content: drawCaveHelp },
    { title: 'PRAIRIE STAGE', content: drawPrairieHelp },
    { title: 'CASTLE STAGE', content: drawCastleHelp },
  ];

  /** 洞窟ステージの操作説明 */
  function drawCaveHelp() {
    const sx = 40, sy = 70;

    txtC('EXPLORE & COLLECT 3 KEYS', W / 2, sy, 7);

    // 移動
    $.globalAlpha = .8;
    txt('\u2190\u2192\u2191\u2193', sx, sy + 30, 8);
    txt('MOVE / CLIMB', sx + 80, sy + 30, 6);

    // アクション
    txt('Z', sx, sy + 56, 8);
    txt('GRAB KEY / HIT BAT', sx + 80, sy + 56, 6);

    txt('HOLD Z', sx, sy + 82, 8);
    txt('OPEN CAGE (HOLD!)', sx + 80, sy + 82, 6);

    txt('MASH Z', sx, sy + 108, 8);
    txt('FORCE OPEN MIMIC', sx + 80, sy + 108, 6);

    // ヒント
    $.globalAlpha = .5;
    txtC('WATCH FOR TRAPS!', W / 2, sy + 148, 6);
    txtC('PLACE ALL 3 KEYS AT THE DOOR', W / 2, sy + 164, 6);
    $.globalAlpha = 1;

    // スプライト装飾
    px(K_R, W / 2 - 60, sy + 190, 3, true);
    px(KEY_D, W / 2 - 20, sy + 194, 3, true);
    px(KEY_D, W / 2 + 10, sy + 194, 3, true);
    px(KEY_D, W / 2 + 40, sy + 194, 3, true);
  }

  /** 草原ステージの操作説明 */
  function drawPrairieHelp() {
    const sx = 40, sy = 70;

    txtC('DEFEAT ALL ENEMIES', W / 2, sy, 7);

    // 攻撃
    $.globalAlpha = .8;
    txt('\u2191 \u2192 \u2193', sx, sy + 30, 8);
    txt('ATTACK (UP/FWD/DOWN)', sx + 80, sy + 30, 6);

    // ガード
    txt('\u2190', sx, sy + 56, 8);
    txt('GUARD (BLOCK ATTACK)', sx + 80, sy + 56, 6);

    // コンボ
    txt('COMBO', sx, sy + 82, 8);
    txt('CHAIN HITS FOR BONUS', sx + 80, sy + 82, 6);

    // ヒント
    $.globalAlpha = .5;
    txtC('TIME YOUR ATTACKS!', W / 2, sy + 120, 6);
    txtC('GUARD WHEN ENEMIES STRIKE', W / 2, sy + 136, 6);
    txtC('COMBOS EARN MORE POINTS', W / 2, sy + 152, 6);
    $.globalAlpha = 1;

    // スプライト装飾
    px(K_F, W / 2 - 30, sy + 180, 3, true);
  }

  /** 城ステージの操作説明 */
  function drawCastleHelp() {
    const sx = 40, sy = 70;

    txtC('SET 6 GEMS ON PEDESTALS', W / 2, sy, 7);

    // 移動
    $.globalAlpha = .8;
    txt('\u2190 \u2192', sx, sy + 30, 8);
    txt('MOVE AROUND RING', sx + 80, sy + 30, 6);

    // 宝石設置
    txt('Z', sx, sy + 56, 8);
    txt('PLACE GEM', sx + 80, sy + 56, 6);

    // シールド
    txt('\u2191', sx, sy + 82, 8);
    txt('SHIELD (PROTECT GEM)', sx + 80, sy + 82, 6);

    // カウンター
    txt('\u2193', sx, sy + 108, 8);
    txt('COUNTER (DEFLECT ARM)', sx + 80, sy + 108, 6);

    // ヒント
    $.globalAlpha = .5;
    txtC('RETURN TO SAFE ZONE FOR GEMS', W / 2, sy + 148, 6);
    txtC('SHIELD GEMS FROM BOSS ARMS', W / 2, sy + 164, 6);
    txtC('COUNTER APPROACHING ARMS!', W / 2, sy + 180, 6);
    $.globalAlpha = 1;

    // スプライト装飾
    px(K_RE, W / 2 - 10, sy + 200, 3, true);
  }

  /** ヘルプ画面描画 */
  function drawHelp() {
    // 背景
    $.fillStyle = BG; $.fillRect(0, 0, W, H);

    // LCD スキャンライン
    $.fillStyle = 'rgba(145,158,125,0.08)';
    for (let y = 0; y < H; y += 2) $.fillRect(0, y, W, 1);

    // ページタイトル
    const page = PAGES[G.helpPage];
    txtC(page.title, W / 2, 24, 14);

    // 装飾ライン
    onFill(.15);
    const lw = 120;
    $.fillRect(W / 2 - lw / 2, 46, lw, 1);
    $.globalAlpha = 1;

    // ページ内容
    page.content();

    // ページインジケータ
    $.globalAlpha = .6;
    const pText = '< ' + (G.helpPage + 1) + '/3 >';
    txtC(pText, W / 2, H - 40, 8);
    $.globalAlpha = 1;

    // 操作ガイド（点滅）
    if (Math.floor(G.tick / 18) % 2) {
      $.globalAlpha = .5;
      txtC('Z/ESC: BACK', W / 2, H - 20, 6);
      $.globalAlpha = 1;
    }

    // LCD ベゼル影
    onFill(.03);
    $.fillRect(0, 0, W, 3); $.fillRect(0, H - 3, W, 3);
    $.fillRect(0, 0, 3, H); $.fillRect(W - 3, 0, 3, H);
    $.globalAlpha = 1;
  }

  /** 入力処理 */
  function update() {
    // ← → でページ切替
    if (J('arrowright') && G.helpPage < 2) { G.helpPage++; }
    if (J('arrowleft') && G.helpPage > 0) { G.helpPage--; }

    // Z / ESC でタイトルに戻る
    if (J('z') || J(' ') || J('escape')) {
      G.state = 'title'; G.blink = 0;
    }
  }

  return { draw: drawHelp, update };
}
