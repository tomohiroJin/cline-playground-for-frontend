/**
 * ゲーム状態の初期化ファクトリ
 *
 * engine.ts の G オブジェクト生成を委譲する。
 * 入力オブジェクト（kd, jp）は外部から注入し共有する。
 * ハイスコアは StorageRepository 経由で注入される。
 */

import type { UninitializedGameState } from '../types';

/** 初期ゲーム状態を生成（遅延バインド完了後に GameState として使用） */
export function createInitialGameState(
  kd: Record<string, boolean>,
  jp: Record<string, boolean>,
  highScore = 0,
): UninitializedGameState {
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

    // ステージ状態（各ステージ init で完全初期化される）
    cav: {},
    sparks: [], dust: [], feathers: [], smoke: [], stepDust: [], keySpk: [], cavDrips: [],
    grs: {},
    grsSlash: [], grsDead: [], grsGrass: [], grsDust: [],
    grsLaneFlash: [], grsMiss: [],
    bos: {},
    bosParticles: [], bosShieldBreak: [], bosArmTrail: [],

    // 遅延バインド（engine.ts で設定される）
    cavInit: undefined,
    grsInit: undefined,
    bosInit: undefined,
    startGame: undefined,
  };
}
