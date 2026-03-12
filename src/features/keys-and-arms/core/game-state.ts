/**
 * ゲーム状態の初期化ファクトリ
 *
 * engine.ts の G オブジェクト生成を委譲する。
 * 入力オブジェクト（kd, jp）は外部から注入し共有する。
 */

import type { GameState } from '../types';

/** ハイスコアの読み込み（localStorage 副作用を分離） */
export function loadHighScore(): number {
  try {
    return parseInt(localStorage.getItem('kaG') || '0', 10) || 0;
  } catch {
    return 0;
  }
}

/** 初期ゲーム状態を生成 */
export function createInitialGameState(
  kd: Record<string, boolean>,
  jp: Record<string, boolean>,
  highScore = loadHighScore(),
): GameState {
  return {
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
    hi: highScore,
    resetConfirm: 0,
    earnedShields: 0,
    bgmBeat: 0,
    paused: false,
    helpPage: 0,

    // 入力
    jp,
    kd,

    // トランジション
    trT: 0,
    trTxt: '',
    trFn: undefined,
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
    grsLaneFlash: [], grsMiss: [],
    bos: {},
    bosParticles: [], bosShieldBreak: [], bosArmTrail: [],

    // 遅延バインド
    cavInit: undefined,
    grsInit: undefined,
    bosInit: undefined,
    startGame: undefined,
  } as unknown as GameState;
}
