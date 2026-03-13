/**
 * KEYS & ARMS — オーディオモジュール
 * Web Audio API によるサウンドエフェクト・BGM
 */
import type { GameState, AudioModule, SoundEffects } from '../types';
import { HIT_STOP } from '../constants';

/**
 * webkitAudioContext を持つ可能性のあるウィンドウ型
 * Safari 旧バージョンでは AudioContext の代わりに webkitAudioContext を提供
 */
interface WindowWithWebKitAudio {
  webkitAudioContext?: typeof AudioContext;
}

/**
 * webkitAudioContext の存在を型安全にチェックする型ガード
 */
function hasWebKitAudioContext(win: Window): win is Window & WindowWithWebKitAudio {
  return 'webkitAudioContext' in win;
}

/**
 * AudioContext コンストラクタを取得する型ガード関数
 * WebKit 互換の webkitAudioContext にもフォールバック
 */
export function getAudioContextConstructor(): typeof AudioContext | undefined {
  if (typeof window === 'undefined') return undefined;
  if (typeof window.AudioContext === 'function') return window.AudioContext;
  if (hasWebKitAudioContext(window) && typeof window.webkitAudioContext === 'function') {
    return window.webkitAudioContext;
  }
  return undefined;
}

/**
 * オーディオモジュールを生成する
 * @param G ゲーム状態オブジェクト
 */
export function createAudio(G: GameState): AudioModule {
  let ac: AudioContext | undefined;

  /** AudioContext を確保 */
  function ea(): void {
    if (!ac) {
      const Ctor = getAudioContextConstructor();
      if (Ctor) ac = new Ctor();
    }
  }

  /** トーン生成（AudioContext 未初期化の場合は自動初期化） */
  function tn(f: number, d: number, tp: OscillatorType = 'square', v: number = .04): void {
    ea();
    if (!ac) return;
    const o: OscillatorNode = ac.createOscillator(), g: GainNode = ac.createGain();
    o.type = tp; o.frequency.value = f; g.gain.setValueAtTime(v, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + d);
    o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + d);
  }

  /** ノイズ生成（AudioContext 未初期化の場合は自動初期化） */
  function noise(d: number, v: number = .02): void {
    ea();
    if (!ac) return;
    const n: AudioBufferSourceNode = ac.createBufferSource(), buf: AudioBuffer = ac.createBuffer(1, ac.sampleRate * d, ac.sampleRate),
      data: Float32Array = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * v;
    n.buffer = buf; const g: GainNode = ac.createGain();
    g.gain.setValueAtTime(v, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + d);
    n.connect(g); g.connect(ac.destination); n.start(); n.stop(ac.currentTime + d);
  }

  /** ヒットストップ */
  function doHitStop(n: number): void { G.hitStop = n; }

  /** BGM ティック — ステージ別リズム */
  function bgmTick(): void {
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
  const S: SoundEffects = {
    tick() { tn(1500, .01, 'square', .015); },
    move() { tn(880, .03); },
    grab() { tn(1100, .08); setTimeout(() => tn(1400, .07), 50); doHitStop(HIT_STOP.MEDIUM); },
    hit() { tn(90, .2, 'sawtooth', .08); tn(70, .25, 'square', .04); noise(.15, .03); doHitStop(HIT_STOP.HEAVY); },
    kill() { tn(800, .04); setTimeout(() => tn(1100, .04), 35); doHitStop(HIT_STOP.LIGHT); },
    pry() { tn(500, .03); },
    guard() { tn(300, .08); tn(600, .06); noise(.04, .01); doHitStop(HIT_STOP.LIGHT); },
    clear() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tn(f, .15, 'square', .05), i * 100)); },
    over() { [400, 320, 240, 160].forEach((f, i) => setTimeout(() => tn(f, .2, 'sawtooth', .05), i * 150)); },
    start() { tn(523, .08); setTimeout(() => tn(659, .08), 70); setTimeout(() => tn(784, .07), 140); G.bgmBeat = 0; },
    warn() { tn(220, .07, 'square', .03); tn(165, .05, 'sawtooth', .02); },
    steal() { tn(180, .14, 'sawtooth', .06); setTimeout(() => tn(120, .12, 'square', .04), 60); noise(.08, .02); doHitStop(HIT_STOP.MEDIUM); },
    shieldBreak() { tn(400, .06); tn(200, .12, 'sawtooth', .04); noise(.06, .02); doHitStop(HIT_STOP.MEDIUM); },
    gem() { tn(660, .06); setTimeout(() => tn(880, .06), 50); setTimeout(() => tn(1100, .05), 100); doHitStop(HIT_STOP.LIGHT); },
    zap() { tn(150, .15, 'sawtooth', .06); tn(100, .1, 'square', .04); noise(.1, .02); doHitStop(HIT_STOP.HEAVY); },
    set() { tn(440, .08); setTimeout(() => tn(660, .08), 60); setTimeout(() => tn(880, .07), 120); doHitStop(HIT_STOP.MEDIUM); },
    step() { tn(600, .02, 'square', .015); },
    ladder() { tn(300, .04); setTimeout(() => tn(350, .04), 40); },
    safe() { tn(500, .04, 'sine', .025); setTimeout(() => tn(600, .03, 'sine', .02), 30); },
    drip() { tn(2000, .025, 'sine', .008); },
    combo(n: number) { const f = 600 + n * 60; tn(f, .04, 'square', .025); setTimeout(() => tn(f * 1.25, .03), 25); },
    bossDie() { [200, 160, 120, 80].forEach((f, i) => setTimeout(() => { tn(f, .2, 'sawtooth', .06); noise(.08, .02); }, i * 120)); }
  };

  return { ea, tn, noise, bgmTick, S };
}
