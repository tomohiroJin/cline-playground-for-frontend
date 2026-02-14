/* eslint-disable */
// @ts-nocheck
/**
 * KEYS & ARMS — オーディオモジュール
 * Web Audio API によるサウンドエフェクト・BGM
 */

/**
 * オーディオモジュールを生成する
 * @param G ゲーム状態オブジェクト
 */
export function createAudio(G) {
  let ac;

  /** AudioContext を確保 */
  function ea() {
    if (!ac) ac = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
  }

  /** トーン生成 */
  function tn(f, d, tp = 'square', v = .04) {
    if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = tp; o.frequency.value = f; g.gain.setValueAtTime(v, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + d);
    o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + d);
  }

  /** ノイズ生成 */
  function noise(d, v = .02) {
    if (!ac) return;
    const n = ac.createBufferSource(), buf = ac.createBuffer(1, ac.sampleRate * d, ac.sampleRate),
      data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * v;
    n.buffer = buf; const g = ac.createGain();
    g.gain.setValueAtTime(v, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + d);
    n.connect(g); g.connect(ac.destination); n.start(); n.stop(ac.currentTime + d);
  }

  /** ヒットストップ */
  function doHitStop(n) { G.hitStop = n; }

  /** BGM ティック — ステージ別リズム */
  function bgmTick() {
    if (!ac) return;
    // 勝利シーケンス中は無音
    if ((G.state === 'cave' && G.cav.won) || (G.state === 'grass' && G.grs.won) || (G.state === 'boss' && G.bos.won)) return;
    G.bgmBeat++;
    if (G.state === 'cave') {
      if (G.bgmBeat % 4 === 0) tn(165, .08, 'sine', .02);
      if (G.bgmBeat % 8 === 0) tn(82, .2, 'triangle', .02);
      if (G.bgmBeat % 16 === 0) tn(330, .06, 'sine', .012);
    } else if (G.state === 'grass') {
      if (G.bgmBeat % 2 === 0) tn(110, .06, 'triangle', .025);
      if (G.bgmBeat % 2 === 1) tn(880, .015, 'square', .015);
      if (G.bgmBeat % 4 === 0) tn(220, .08, 'square', .018);
      if (G.bgmBeat % 8 === 0) tn(330, .06, 'square', .012);
    } else if (G.state === 'boss') {
      tn(55, .15, 'triangle', .022);
      if (G.bgmBeat % 2 === 0) tn(82, .12, 'sawtooth', .015);
      if (G.bgmBeat % 4 === 0) tn(185, .08, 'square', .012);
      if (G.bgmBeat % 8 === 3) tn(147, .06, 'sawtooth', .01);
    }
  }

  /** SFX オブジェクト */
  const S = {
    tick() { tn(1500, .01, 'square', .015); },
    move() { tn(880, .03); },
    grab() { tn(1100, .08); setTimeout(() => tn(1400, .07), 50); doHitStop(3); },
    hit() { tn(90, .2, 'sawtooth', .08); tn(70, .25, 'square', .04); noise(.15, .03); doHitStop(4); },
    kill() { tn(800, .04); setTimeout(() => tn(1100, .04), 35); doHitStop(2); },
    pry() { tn(500, .03); },
    guard() { tn(300, .08); tn(600, .06); noise(.04, .01); doHitStop(2); },
    clear() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tn(f, .15, 'square', .05), i * 100)); },
    over() { [400, 320, 240, 160].forEach((f, i) => setTimeout(() => tn(f, .2, 'sawtooth', .05), i * 150)); },
    start() { tn(523, .08); setTimeout(() => tn(659, .08), 70); setTimeout(() => tn(784, .07), 140); G.bgmBeat = 0; },
    warn() { tn(220, .07, 'square', .03); tn(165, .05, 'sawtooth', .02); },
    steal() { tn(180, .14, 'sawtooth', .06); setTimeout(() => tn(120, .12, 'square', .04), 60); noise(.08, .02); doHitStop(3); },
    shieldBreak() { tn(400, .06); tn(200, .12, 'sawtooth', .04); noise(.06, .02); doHitStop(3); },
    gem() { tn(660, .06); setTimeout(() => tn(880, .06), 50); setTimeout(() => tn(1100, .05), 100); doHitStop(2); },
    zap() { tn(150, .15, 'sawtooth', .06); tn(100, .1, 'square', .04); noise(.1, .02); doHitStop(4); },
    set() { tn(440, .08); setTimeout(() => tn(660, .08), 60); setTimeout(() => tn(880, .07), 120); doHitStop(3); },
    step() { tn(600, .02, 'square', .015); },
    ladder() { tn(300, .04); setTimeout(() => tn(350, .04), 40); },
    safe() { tn(500, .04, 'sine', .025); setTimeout(() => tn(600, .03, 'sine', .02), 30); },
    drip() { tn(2000, .025, 'sine', .008); },
    combo(n) { const f = 600 + n * 60; tn(f, .04, 'square', .025); setTimeout(() => tn(f * 1.25, .03), 25); },
    bossDie() { [200, 160, 120, 80].forEach((f, i) => setTimeout(() => { tn(f, .2, 'sawtooth', .06); noise(.08, .02); }, i * 120)); }
  };

  return { ea, tn, noise, bgmTick, S };
}
