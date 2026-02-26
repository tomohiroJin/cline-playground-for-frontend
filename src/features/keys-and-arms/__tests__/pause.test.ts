/* eslint-disable */
// @ts-nocheck
/**
 * KEYS & ARMS — ポーズ機能テスト
 *
 * engine.ts のポーズ関連ロジックをユニット的に検証する。
 * gameTick 内のポーズ処理をシミュレートするため、
 * 該当ロジックを関数として抽出・テストする。
 */

describe('ポーズ機能', () => {
  /** ポーズトグルロジックのシミュレーション */
  function simulatePauseToggle(G, jp) {
    function J(k) { return jp[k.toLowerCase()]; }
    function clearJ() { for (const k in jp) delete jp[k]; }

    // ポーズトグル（ゲームプレイ中のみ）
    if (J('p') && G.state !== 'title' && G.state !== 'over'
        && G.state !== 'trueEnd' && G.state !== 'ending1' && G.state !== 'help') {
      G.paused = !G.paused;
      clearJ(); return 'toggled';
    }

    // ポーズ中はティックスキップ
    if (G.paused) {
      if (J('escape')) {
        G.paused = false;
        G.resetConfirm = 90;
      }
      clearJ(); return 'skipped';
    }

    return 'continue';
  }

  it('Pキーでポーズ状態がトグルする', () => {
    const G = { state: 'cave', paused: false, resetConfirm: 0 };
    const jp = { p: true };

    // false → true
    simulatePauseToggle(G, jp);
    expect(G.paused).toBe(true);

    // true → false
    jp.p = true;
    simulatePauseToggle(G, jp);
    expect(G.paused).toBe(false);
  });

  it('ポーズ中はゲームティックがスキップされる', () => {
    const G = { state: 'cave', paused: true, resetConfirm: 0 };
    const jp = {};

    const result = simulatePauseToggle(G, jp);
    expect(result).toBe('skipped');
  });

  it('ポーズ中にESCでリセット確認に遷移する', () => {
    const G = { state: 'cave', paused: true, resetConfirm: 0 };
    const jp = { escape: true };

    simulatePauseToggle(G, jp);
    expect(G.paused).toBe(false);
    expect(G.resetConfirm).toBe(90);
  });

  it('タイトル画面ではPキーが無効', () => {
    const G = { state: 'title', paused: false, resetConfirm: 0 };
    const jp = { p: true };

    const result = simulatePauseToggle(G, jp);
    expect(result).toBe('continue');
    expect(G.paused).toBe(false);
  });

  it('ゲームオーバー画面ではPキーが無効', () => {
    const G = { state: 'over', paused: false, resetConfirm: 0 };
    const jp = { p: true };

    const result = simulatePauseToggle(G, jp);
    expect(result).toBe('continue');
    expect(G.paused).toBe(false);
  });
});
