/* eslint-disable */
// @ts-nocheck
/**
 * KEYS & ARMS — ヘルプ画面テスト
 */

describe('ヘルプ画面', () => {
  /** ヘルプ遷移ロジックのシミュレーション（engine.ts の title ケース） */
  function simulateTitleInput(G, jp) {
    function J(k) { return jp[k.toLowerCase()]; }
    function clearJ() { for (const k in jp) delete jp[k]; }

    if (G.state === 'title' && J('arrowup')) {
      G.state = 'help';
      G.helpPage = 0;
      clearJ();
      return;
    }
  }

  /** ヘルプ画面入力ロジックのシミュレーション（help.ts の update） */
  function simulateHelpInput(G, jp) {
    function J(k) { return jp[k.toLowerCase()]; }

    if (J('arrowright') && G.helpPage < 2) { G.helpPage++; }
    if (J('arrowleft') && G.helpPage > 0) { G.helpPage--; }
    if (J('z') || J(' ') || J('escape')) {
      G.state = 'title'; G.blink = 0;
    }
  }

  it('タイトル画面で↑キーでヘルプに遷移する', () => {
    const G = { state: 'title', helpPage: 0, blink: 10 };
    const jp = { arrowup: true };

    simulateTitleInput(G, jp);
    expect(G.state).toBe('help');
    expect(G.helpPage).toBe(0);
  });

  it('←→でページ切替する', () => {
    const G = { state: 'help', helpPage: 0, blink: 0 };

    // 0 → 1
    simulateHelpInput(G, { arrowright: true });
    expect(G.helpPage).toBe(1);

    // 1 → 2
    simulateHelpInput(G, { arrowright: true });
    expect(G.helpPage).toBe(2);
  });

  it('ページ範囲外には移動しない', () => {
    const G = { state: 'help', helpPage: 0, blink: 0 };

    // 0で左を押しても0のまま
    simulateHelpInput(G, { arrowleft: true });
    expect(G.helpPage).toBe(0);

    // 2で右を押しても2のまま
    G.helpPage = 2;
    simulateHelpInput(G, { arrowright: true });
    expect(G.helpPage).toBe(2);
  });

  it('Zでタイトルに戻る', () => {
    const G = { state: 'help', helpPage: 1, blink: 0 };

    simulateHelpInput(G, { z: true });
    expect(G.state).toBe('title');
  });

  it('ESCでタイトルに戻る', () => {
    const G = { state: 'help', helpPage: 2, blink: 0 };

    simulateHelpInput(G, { escape: true });
    expect(G.state).toBe('title');
  });
});
