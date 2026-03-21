/**
 * マルチタッチ入力のコアロジックテスト
 * 画面上下分割で 1P / 2P の独立したタッチ追跡を検証する
 */
import {
  createMultiTouchState,
  processTouchStart,
  processTouchMove,
  processTouchEnd,
  getPlayerPosition,
  MultiTouchState,
} from './multi-touch';
import { CONSTANTS } from './constants';

const { WIDTH: W, HEIGHT: H } = CONSTANTS.CANVAS;
const MR = CONSTANTS.SIZES.MALLET;

// テスト用ヘルパー: Canvas 座標に変換済みの位置を指定
const canvasPos = (x: number, y: number) => ({ canvasX: x, canvasY: y });

describe('createMultiTouchState', () => {
  it('初期状態では両プレイヤーのタッチが未追跡である', () => {
    const state = createMultiTouchState();
    expect(state.player1TouchId).toBeUndefined();
    expect(state.player2TouchId).toBeUndefined();
    expect(state.player1Position).toBeUndefined();
    expect(state.player2Position).toBeUndefined();
  });
});

describe('processTouchStart', () => {
  it('下半分のタッチで player1 が追跡される', () => {
    const state = createMultiTouchState();
    const result = processTouchStart(state, 1, canvasPos(W / 2, H * 0.75), CONSTANTS);

    expect(result.player1TouchId).toBe(1);
    expect(result.player1Position).toBeDefined();
    expect(result.player2TouchId).toBeUndefined();
  });

  it('上半分のタッチで player2 が追跡される', () => {
    const state = createMultiTouchState();
    const result = processTouchStart(state, 2, canvasPos(W / 2, H * 0.25), CONSTANTS);

    expect(result.player2TouchId).toBe(2);
    expect(result.player2Position).toBeDefined();
    expect(result.player1TouchId).toBeUndefined();
  });

  it('両方同時にタッチできる', () => {
    let state = createMultiTouchState();
    state = processTouchStart(state, 1, canvasPos(W / 2, H * 0.75), CONSTANTS);
    state = processTouchStart(state, 2, canvasPos(W / 2, H * 0.25), CONSTANTS);

    expect(state.player1TouchId).toBe(1);
    expect(state.player2TouchId).toBe(2);
  });

  it('同じゾーンの 2 番目のタッチは無視される', () => {
    let state = createMultiTouchState();
    state = processTouchStart(state, 1, canvasPos(W / 2, H * 0.75), CONSTANTS);
    state = processTouchStart(state, 3, canvasPos(W / 2, H * 0.8), CONSTANTS);

    // 最初のタッチのみ追跡
    expect(state.player1TouchId).toBe(1);
  });

  it('player1 の位置が下半分にクランプされる', () => {
    const state = createMultiTouchState();
    const result = processTouchStart(state, 1, canvasPos(W / 2, H * 0.75), CONSTANTS);

    expect(result.player1Position!.y).toBeGreaterThanOrEqual(H / 2 + MR + 10);
    expect(result.player1Position!.y).toBeLessThanOrEqual(H - MR - 5);
  });

  it('player2 の位置が上半分にクランプされる', () => {
    const state = createMultiTouchState();
    const result = processTouchStart(state, 2, canvasPos(W / 2, H * 0.25), CONSTANTS);

    expect(result.player2Position!.y).toBeGreaterThanOrEqual(MR + 5);
    expect(result.player2Position!.y).toBeLessThanOrEqual(H / 2 - MR - 10);
  });
});

describe('processTouchMove', () => {
  it('追跡中の player1 タッチを移動すると位置が更新される', () => {
    let state = createMultiTouchState();
    state = processTouchStart(state, 1, canvasPos(W / 2, H * 0.75), CONSTANTS);
    const result = processTouchMove(state, 1, canvasPos(200, H * 0.8), CONSTANTS);

    expect(result.player1Position!.x).toBeCloseTo(200, 0);
  });

  it('追跡中の player2 タッチを移動すると位置が更新される', () => {
    let state = createMultiTouchState();
    state = processTouchStart(state, 2, canvasPos(W / 2, H * 0.25), CONSTANTS);
    const result = processTouchMove(state, 2, canvasPos(100, H * 0.2), CONSTANTS);

    expect(result.player2Position!.x).toBeCloseTo(100, 0);
  });

  it('追跡していないタッチ ID の移動は無視される', () => {
    let state = createMultiTouchState();
    state = processTouchStart(state, 1, canvasPos(W / 2, H * 0.75), CONSTANTS);
    const result = processTouchMove(state, 99, canvasPos(100, 100), CONSTANTS);

    expect(result).toBe(state);
  });
});

describe('processTouchEnd', () => {
  it('player1 のタッチ終了で位置がクリアされる', () => {
    let state = createMultiTouchState();
    state = processTouchStart(state, 1, canvasPos(W / 2, H * 0.75), CONSTANTS);
    const result = processTouchEnd(state, 1);

    expect(result.player1TouchId).toBeUndefined();
    expect(result.player1Position).toBeUndefined();
  });

  it('player2 のタッチ終了で位置がクリアされる', () => {
    let state = createMultiTouchState();
    state = processTouchStart(state, 2, canvasPos(W / 2, H * 0.25), CONSTANTS);
    const result = processTouchEnd(state, 2);

    expect(result.player2TouchId).toBeUndefined();
    expect(result.player2Position).toBeUndefined();
  });

  it('一方のタッチ終了で他方は影響を受けない', () => {
    let state = createMultiTouchState();
    state = processTouchStart(state, 1, canvasPos(W / 2, H * 0.75), CONSTANTS);
    state = processTouchStart(state, 2, canvasPos(W / 2, H * 0.25), CONSTANTS);
    const result = processTouchEnd(state, 1);

    expect(result.player1TouchId).toBeUndefined();
    expect(result.player2TouchId).toBe(2);
    expect(result.player2Position).toBeDefined();
  });

  it('追跡していないタッチ ID の終了は無視される', () => {
    const state = createMultiTouchState();
    const result = processTouchEnd(state, 99);

    expect(result).toBe(state);
  });
});

describe('getPlayerPosition', () => {
  it('player1 の現在位置を取得できる', () => {
    let state = createMultiTouchState();
    state = processTouchStart(state, 1, canvasPos(200, H * 0.75), CONSTANTS);

    const pos = getPlayerPosition(state, 'player1');
    expect(pos).toBeDefined();
    expect(pos!.x).toBeCloseTo(200, 0);
  });

  it('player2 の現在位置を取得できる', () => {
    let state = createMultiTouchState();
    state = processTouchStart(state, 2, canvasPos(100, H * 0.3), CONSTANTS);

    const pos = getPlayerPosition(state, 'player2');
    expect(pos).toBeDefined();
    expect(pos!.x).toBeCloseTo(100, 0);
  });

  it('タッチしていない場合は undefined を返す', () => {
    const state = createMultiTouchState();
    expect(getPlayerPosition(state, 'player1')).toBeUndefined();
    expect(getPlayerPosition(state, 'player2')).toBeUndefined();
  });
});
