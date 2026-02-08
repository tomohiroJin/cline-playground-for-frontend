/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { useState, useCallback, useEffect, useRef, useMemo, Component } from "react";
import { Storage, SAVE_KEY } from './storage';

// ╔══════════════════════════════════════════════════════════════╗
// ║  迷宮の残響 — v6: Polish / Audio Toggle / Hints / QoL        ║
// ║  SOLID / DRY / DbC / Functional-Declarative                  ║
// ╚══════════════════════════════════════════════════════════════╝

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

// ============================================================
// §1. CONTRACTS & ERROR HANDLING
// ============================================================

/** Design-by-Contract assertion — throws on violation */
const invariant = (cond, ctx, detail = "") => {
  if (!cond) {
    const msg = `[迷宮の残響] Invariant violation in ${ctx}${detail ? `: ${detail}` : ""}`;
    console.error(msg);
    throw new Error(msg);
  }
};

/** Safely execute a synchronous callback */
const safeSync = (fn, ctx) => {
  try { return fn(); }
  catch (e) { console.error(`[${ctx}]`, e.message); return null; }
};

/** Safely execute an asynchronous callback */
const safeAsync = async (fn, ctx) => {
  try { return await fn(); }
  catch (e) { console.error(`[${ctx}]`, e.message); return null; }
};

/** React Error Boundary */
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("[ErrorBoundary]", error, info.componentStack); }
  render() {
    if (this.state.error) return (
      <div style={{ minHeight: "100vh", background: "#0a0a18", color: "#f87171", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, fontFamily: "sans-serif" }}>
        <h2 style={{ marginBottom: 16, letterSpacing: 4 }}>エラーが発生しました</h2>
        <p style={{ color: "#808098", fontSize: 13, marginBottom: 24, textAlign: "center", maxWidth: 400, lineHeight: 1.8 }}>
          ゲームデータの読み込み中にエラーが発生しました。<br />ページを再読み込みしてください。
        </p>
        <pre style={{ fontSize: 11, color: "#706080", background: "rgba(20,20,40,.8)", padding: 16, borderRadius: 8, maxWidth: "90vw", overflow: "auto", marginBottom: 24 }}>
          {this.state.error.message}
        </pre>
        <button onClick={() => { this.setState({ error: null }); window.location.reload(); }}
          style={{ padding: "10px 24px", background: "rgba(99,102,241,.15)", border: "1px solid rgba(99,102,241,.4)", color: "#a5b4fc", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>
          再読み込み
        </button>
      </div>
    );
    return this.props.children;
  }
}

// ============================================================
// §2. AUDIO ENGINE (SRP: audio only)
// ============================================================

const AudioEngine = (() => {
  let ctx = null;

  const getCtx = () => {
    if (!ctx) safeSync(() => { ctx = new (window.AudioContext || window.webkitAudioContext)(); }, "Audio.init");
    return ctx;
  };

  const resume = () => safeSync(() => { if (ctx?.state === "suspended") ctx.resume(); }, "Audio.resume");

  /** Common pattern: create nodes and play on AudioContext */
  const play = (setup, tag) => safeSync(() => { const c = getCtx(); if (c) setup(c); }, `Audio.${tag}`);

  const noise = (dur, vol = 0.08) => play(c => {
    const src = c.createBufferSource(), buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    src.buffer = buf;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 600;
    src.connect(f); f.connect(g); g.connect(c.destination);
    src.start(); src.stop(c.currentTime + dur);
  }, "noise");

  const tone = (freq, dur, type = "sine", vol = 0.06) => play(c => {
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + dur);
  }, "tone");

  const sweep = (sf, ef, dur, type = "sine", vol = 0.04) => play(c => {
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(sf, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(ef, 0.01), c.currentTime + dur);
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + dur);
  }, "sweep");

  /** Play a sequence of tones at fixed intervals */
  const seq = (freqs, gap, dur, type, vol) =>
    freqs.forEach((f, i) => setTimeout(() => tone(f, dur, type, vol), i * gap));

  return Object.freeze({
    init: getCtx, resume,
    sfx: Object.freeze({
      tick:     () => tone(600 + Math.random() * 300, 0.025, "sine", 0.012),
      hit:      () => { noise(0.2, 0.12); tone(80, 0.15, "sawtooth", 0.08); },
      bigHit:   () => { noise(0.4, 0.18); tone(50, 0.3, "sawtooth", 0.12); sweep(200, 40, 0.3, "square", 0.06); },
      heal:     () => seq([440, 554, 659], 80, 0.15, "sine", 0.05),
      status:   () => { tone(200, 0.3, "sawtooth", 0.06); setTimeout(() => tone(150, 0.3, "sawtooth", 0.05), 100); },
      clear:    () => seq([523, 659, 784], 60, 0.1, "sine", 0.04),
      floor:    () => { sweep(100, 400, 1.2, "sine", 0.04); setTimeout(() => sweep(150, 500, 0.8, "sine", 0.03), 300); noise(1.5, 0.03); },
      over:     () => { tone(220, 0.4, "sawtooth", 0.06); setTimeout(() => tone(185, 0.4, "sawtooth", 0.06), 300); setTimeout(() => tone(147, 0.8, "sawtooth", 0.07), 600); noise(1.5, 0.04); },
      victory:  () => seq([523, 659, 784, 1047], 120, 0.3, "sine", 0.06),
      choice:   () => { tone(800, 0.06, "sine", 0.03); setTimeout(() => tone(1000, 0.06, "sine", 0.03), 40); },
      drain:    () => sweep(300, 150, 0.3, "sine", 0.025),
      levelUp:  () => seq([523, 659, 784, 880, 1047], 60, 0.15, "sine", 0.04),
      ambient:  (fl) => play(c => {
        const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
        f.type = "lowpass"; f.frequency.value = 200 + fl * 30;
        o.type = "sine"; o.frequency.value = 30 + fl * 8;
        g.gain.setValueAtTime(0, c.currentTime);
        g.gain.linearRampToValueAtTime(0.025, c.currentTime + 1);
        g.gain.linearRampToValueAtTime(0, c.currentTime + 4);
        o.connect(f); f.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + 4);
      }, "ambient"),
    }),
  });
})();

// ============================================================
// §3. PERSISTENCE (SRP: storage only)
// ============================================================
// Storage と SAVE_KEY は './storage' からインポート済み

// ============================================================
// §4. GAME CONFIGURATION (OCP: extend via data, not code)
// ============================================================

const CFG = Object.freeze({
  EVENTS_PER_FLOOR: 3,
  MAX_FLOOR: 5,
  BASE_HP: 55,
  BASE_MN: 35,
  BASE_INF: 5,
  BOSS_EVENT_ID: "e030",
});

/** Floor metadata — names/descriptions/colors match original design */
const FLOOR_META = Object.freeze({
  1: { name: "表層回廊",   desc: "迷宮の入口。油断すれば、ここで終わる。",                              color: "#60a5fa" },
  2: { name: "灰色の迷路", desc: "光が途絶えた。静寂と恐怖が支配する灰色の世界。",                      color: "#a0a0b8" },
  3: { name: "深淵の間",   desc: "空間が歪む。常識が通用しない。帰還率は三割を切る。",                  color: "#c084fc" },
  4: { name: "忘却の底",   desc: "記憶が曖昧になる。自分が何者か忘れていく。",                          color: "#f472b6" },
  5: { name: "迷宮の心臓", desc: "迷宮の核心。ここから生還した者は、極めて少ない。",                    color: "#fbbf24" },
});

const EVENT_TYPE = Object.freeze({
  exploration: { label: "探 索", colors: ["#38bdf8", "rgba(56,189,248,0.08)",  "rgba(56,189,248,0.2)"]  },
  encounter:   { label: "遭 遇", colors: ["#fbbf24", "rgba(251,191,36,0.08)",  "rgba(251,191,36,0.2)"]  },
  trap:        { label: "罠",    colors: ["#f87171", "rgba(248,113,113,0.08)", "rgba(248,113,113,0.2)"] },
  rest:        { label: "安 息", colors: ["#4ade80", "rgba(74,222,128,0.08)",  "rgba(74,222,128,0.2)"]  },
});

const STATUS_META = Object.freeze({
  "負傷": { colors: ["#f87171", "rgba(248,113,113,0.08)", "rgba(248,113,113,0.18)"], tick: null },
  "混乱": { colors: ["#c084fc", "rgba(192,132,252,0.08)", "rgba(192,132,252,0.18)"], tick: null },
  "出血": { colors: ["#fb7185", "rgba(251,113,133,0.08)", "rgba(251,113,133,0.18)"], tick: { hp: -5, mn: 0 } },
  "恐怖": { colors: ["#a78bfa", "rgba(167,139,250,0.08)", "rgba(167,139,250,0.18)"], tick: { hp: 0, mn: -4 } },
  "呪い": { colors: ["#fb923c", "rgba(251,146,60,0.08)",  "rgba(251,146,60,0.18)"],  tick: null },
});

const DIFFICULTY = Object.freeze([
  { id: "easy",   name: "探索者", sub: "初心者向け", color: "#4ade80", icon: "🌿",
    desc: "体力・精神にゆとりがあり、迷宮の侵蝕も穏やか。物語を楽しみたい方に。",
    hpMod: 12, mnMod: 8, drainMod: 0, dmgMult: 0.8, kpDeath: 1, kpWin: 2 },
  { id: "normal", name: "挑戦者", sub: "標準難度",   color: "#818cf8", icon: "⚔",
    desc: "均衡の取れた難易度。判断力と運の両方が試される。",
    hpMod: 0,  mnMod: 0,  drainMod: -1, dmgMult: 1, kpDeath: 1, kpWin: 3 },
  { id: "hard",   name: "求道者", sub: "上級者向け", color: "#f59e0b", icon: "🔥",
    desc: "初期値が低く侵蝕が激しい。知識と経験を総動員しなければ生還は困難。",
    hpMod: -15, mnMod: -12, drainMod: -3, dmgMult: 1.35, kpDeath: 2, kpWin: 5 },
  { id: "abyss",  name: "修羅",   sub: "最高難度",   color: "#ef4444", icon: "💀",
    desc: "全てが致命的。一つの判断ミスが死に直結する。真の強者のみが挑む領域。",
    hpMod: -25, mnMod: -20, drainMod: -5, dmgMult: 1.8, kpDeath: 3, kpWin: 8 },
]);

/** Canonical empty meta state — single source of truth for init and reset (DRY) */
const FRESH_META = Object.freeze({
  runs: 0, escapes: 0, kp: 0, unlocked: [], bestFl: 0,
  totalEvents: 0, endings: [], clearedDiffs: [], totalDeaths: 0,
  lastRun: null, title: null,
});

const UNLOCKS = Object.freeze([
  // ── 基本（BASIC: total cost ~130, always available） ──
  { id: "u1",  name: "探索者の直感", desc: "初期情報値 +3",          cost: 3, icon: "◈",  cat: "basic", fx: { infoBonus: 3 } },
  { id: "u2",  name: "鋼の心臓",     desc: "初期HP +5",             cost: 3, icon: "♥",  cat: "basic", fx: { hpBonus: 5 } },
  { id: "u3",  name: "冷静沈着",     desc: "初期精神力 +4",         cost: 3, icon: "◎",  cat: "basic", fx: { mentalBonus: 4 } },
  { id: "u4",  name: "古文書の知識", desc: "情報取得量 +10%",       cost: 6, icon: "✧",  cat: "basic", fx: { infoMult: 1.1 } },
  { id: "u5",  name: "回復体質",     desc: "回復効果 +12%",         cost: 6, icon: "✦",  cat: "basic", fx: { healMult: 1.12 } },
  { id: "u6",  name: "危機察知",     desc: "HP低下時、条件判定が緩和", cost: 8, icon: "⚡", cat: "basic", fx: { dangerSense: true } },
  { id: "u7",  name: "精神防壁",     desc: "精神ダメージ -8%",      cost: 6, icon: "◉",  cat: "basic", fx: { mnReduce: 0.92 } },
  { id: "u8",  name: "止血の知識",   desc: "出血ダメージ半減",       cost: 4, icon: "❋",  cat: "basic", fx: { bleedReduce: true } },
  { id: "u9",  name: "鉄の体躯",     desc: "初期HP +8",             cost: 5, icon: "♦",  cat: "basic", fx: { hpBonus: 8 } },
  { id: "u10", name: "瞑想の心得",   desc: "初期精神力 +6",         cost: 5, icon: "☯",  cat: "basic", fx: { mentalBonus: 6 } },
  { id: "u11", name: "博識",         desc: "初期情報値 +5",         cost: 5, icon: "📖", cat: "basic", fx: { infoBonus: 5 } },
  { id: "u12", name: "不屈の意志",   desc: "精神ドレイン無効化",     cost: 10, icon: "☀",  cat: "basic", fx: { drainImmune: true } },
  { id: "u13", name: "頑強な肉体",   desc: "HPダメージ -5%",        cost: 8, icon: "🛡",  cat: "basic", fx: { hpReduce: 0.95 } },
  { id: "u14", name: "迷宮の記憶",   desc: "情報取得量 +15%",       cost: 8, icon: "🔮", cat: "basic", fx: { infoMult: 1.15 } },
  { id: "u15", name: "生存本能",     desc: "初期HP +12",            cost: 8, icon: "💪", cat: "basic", fx: { hpBonus: 12 } },
  { id: "u16", name: "深淵の耐性",   desc: "初期精神力 +8",         cost: 7, icon: "🌙", cat: "basic", fx: { mentalBonus: 8 } },
  { id: "u17", name: "解読者の目",   desc: "初期情報値 +6",         cost: 7, icon: "👁",  cat: "basic", fx: { infoBonus: 6 } },
  { id: "u18", name: "応急手当",     desc: "回復効果 +15%（重複可）", cost: 8, icon: "💊", cat: "basic", fx: { healMult: 1.15 } },
  { id: "u19", name: "鋼の精神",     desc: "精神ダメージ -12%（重複可）", cost: 10, icon: "🧠", cat: "basic", fx: { mnReduce: 0.88 } },
  { id: "u20", name: "不死身の体",   desc: "HPダメージ -8%（重複可）",   cost: 10, icon: "⛊",  cat: "basic", fx: { hpReduce: 0.92 } },
  // ── 特別（SPECIAL: 修羅クリア必須、高コスト） ──
  { id: "u21", name: "二度目の命",   desc: "HP/精神が0になった時、一度だけ半分回復して復活", cost: 35, icon: "🔄", cat: "special", gate: "abyss", fx: { secondLife: true } },
  { id: "u22", name: "呪い耐性",     desc: "呪い状態異常を完全無効化",   cost: 18, icon: "🛡",  cat: "special", gate: "abyss", fx: { curseImmune: true } },
  { id: "u23", name: "連鎖の記憶",   desc: "連続イベントの発生確率が上昇", cost: 15, icon: "🔗", cat: "special", gate: "abyss", fx: { chainBoost: true } },
  { id: "u24", name: "交渉術",       desc: "遭遇イベントの精神条件が緩和", cost: 18, icon: "🤝", cat: "special", gate: "abyss", fx: { negotiator: true } },
  { id: "u25", name: "第六感",       desc: "精神低下時、精神条件判定を緩和", cost: 22, icon: "👁‍🗨", cat: "special", gate: "abyss", fx: { mentalSense: true } },
  { id: "u26", name: "歴戦の傷",     desc: "初期HP +12、初期精神力 +10", cost: 28, icon: "⚔",  cat: "special", gate: "abyss", fx: { hpBonus: 12, mentalBonus: 10 } },
  { id: "u27", name: "叡智の結晶",   desc: "初期情報値 +6、情報取得量 +10%", cost: 25, icon: "💎", cat: "special", gate: "abyss", fx: { infoBonus: 6, infoMult: 1.1 } },
  { id: "u28", name: "全ダメージ軽減",desc: "HPダメージ -5%、精神ダメージ -5%", cost: 25, icon: "🌀", cat: "special", gate: "abyss", fx: { hpReduce: 0.95, mnReduce: 0.95 } },
  { id: "u29", name: "迷宮の寵児",   desc: "全初期ステータス +5",    cost: 40, icon: "✨", cat: "special", gate: "abyss", fx: { hpBonus: 5, mentalBonus: 5, infoBonus: 5 } },
  { id: "u30", name: "完全回復",     desc: "回復効果 +20%（重複可）", cost: 22, icon: "💚", cat: "special", gate: "abyss", fx: { healMult: 1.2 } },
  // ── 難易度クリア報酬（TROPHY: 勲章的な微効果） ──
  { id: "u31", name: "探索者の証",   desc: "全初期ステータス +1",    cost: 0, icon: "🌿", cat: "trophy", req: "easy",   fx: { hpBonus: 1, mentalBonus: 1, infoBonus: 1 } },
  { id: "u32", name: "挑戦者の証",   desc: "回復効果 +5%、情報取得量 +5%", cost: 0, icon: "⚔",  cat: "trophy", req: "normal", fx: { healMult: 1.05, infoMult: 1.05 } },
  { id: "u33", name: "求道者の証",   desc: "全ステータス +2、HPダメージ -2%", cost: 0, icon: "🔥", cat: "trophy", req: "hard",   fx: { hpBonus: 2, mentalBonus: 2, infoBonus: 2, hpReduce: 0.98 } },
  { id: "u34", name: "修羅の証",     desc: "全ステータス +3、全ダメージ -3%", cost: 0, icon: "💀", cat: "trophy", req: "abyss", fx: { hpBonus: 3, mentalBonus: 3, infoBonus: 3, hpReduce: 0.97, mnReduce: 0.97 } },
  { id: "u35", name: "完全制覇の印", desc: "全ステータス +5、回復 +8%、情報 +8%", cost: 0, icon: "👑", cat: "trophy", req: "abyss_perfect", fx: { hpBonus: 5, mentalBonus: 5, infoBonus: 5, healMult: 1.08, infoMult: 1.08 } },
  // ── 実績解放（ACHIEVEMENT: 条件厳格化、微効果） ──
  { id: "u36", name: "百戦錬磨",     desc: "全初期ステータス +2",    cost: 0, icon: "🏅", cat: "achieve", achReq: (m) => m.runs >= 20,   achDesc: "20回探索する", fx: { hpBonus: 2, mentalBonus: 2, infoBonus: 2 } },
  { id: "u37", name: "生還の達人",   desc: "回復効果 +8%、精神ダメージ -3%", cost: 0, icon: "🏆", cat: "achieve", achReq: (m) => m.escapes >= 8, achDesc: "8回生還する", fx: { healMult: 1.08, mnReduce: 0.97 } },
  { id: "u38", name: "博覧強記",     desc: "初期情報値 +3、情報取得量 +8%", cost: 0, icon: "📚", cat: "achieve", achReq: (m) => m.totalEvents >= 80, achDesc: "累計80イベントをクリアする", fx: { infoBonus: 3, infoMult: 1.08 } },
  { id: "u39", name: "死線を越えて", desc: "全ダメージ -3%",          cost: 0, icon: "☠",  cat: "achieve", achReq: (m) => (m.totalDeaths ?? 0) >= 15, achDesc: "15回死亡する", fx: { hpReduce: 0.97, mnReduce: 0.97 } },
  { id: "u40", name: "エンディングコレクター", desc: "全初期ステータス +3", cost: 0, icon: "🎭", cat: "achieve", achReq: (m) => (m.endings?.length ?? 0) >= 8, achDesc: "8種類のEDを見る", fx: { hpBonus: 3, mentalBonus: 3, infoBonus: 3 } },
]);
// ============================================================
// §5. PURE GAME LOGIC (no side effects, no React)
// ============================================================

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rand  = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

/** FX key classification for merge strategy */
const FX_MULT = new Set(["infoMult", "healMult", "mnReduce", "hpReduce"]);
const FX_BOOL = new Set(["dangerSense", "bleedReduce", "drainImmune", "curseImmune", "secondLife", "chainBoost", "negotiator", "mentalSense"]);
const FX_DEFAULTS = Object.freeze({ hpBonus: 0, mentalBonus: 0, infoBonus: 0, infoMult: 1, healMult: 1, dangerSense: false, mnReduce: 1, bleedReduce: false, drainImmune: false, hpReduce: 1, curseImmune: false, secondLife: false, chainBoost: false, negotiator: false, mentalSense: false });

/**
 * Merge all unlock effects into a single FX object.
 * @pre  each id in unlockIds exists in UNLOCKS
 * @post returned object has every key in FX_DEFAULTS
 */
const computeFx = (unlockIds) => {
  const fx = { ...FX_DEFAULTS };
  for (const uid of unlockIds) {
    const def = UNLOCKS.find(u => u.id === uid);
    if (!def?.fx) continue;
    for (const [k, v] of Object.entries(def.fx)) {
      if (FX_MULT.has(k))      fx[k] *= v;
      else if (FX_BOOL.has(k)) fx[k] = v;
      else                      fx[k] += v;
    }
  }
  return fx;
};

/**
 * Create initial player state for a new run.
 * @pre  diff != null && fx != null
 * @post hp > 0 && mn > 0
 */
const createPlayer = (diff, fx) => {
  invariant(diff != null, "createPlayer", "diff is required");
  invariant(fx != null, "createPlayer", "fx is required");
  const hp = CFG.BASE_HP + fx.hpBonus + diff.hpMod;
  const mn = CFG.BASE_MN + fx.mentalBonus + diff.mnMod;
  return { hp, maxHp: hp, mn, maxMn: mn, inf: CFG.BASE_INF + fx.infoBonus, st: [] };
};

/**
 * Evaluate a condition string against player state.
 * @param cond — "default" | "status:X" | "hp>N" | "mn>N" | "inf>N"
 */
const evalCond = (cond, player, fx) => {
  if (cond === "default") return true;
  if (cond.startsWith("status:")) return player.st.includes(cond.slice(7));
  if (cond.startsWith("hp>")) {
    const t = parseInt(cond.slice(3), 10);
    return ((fx.dangerSense && player.hp < 30) ? player.hp + 20 : player.hp) > t;
  }
  if (cond.startsWith("hp<"))  return player.hp  < parseInt(cond.slice(3), 10);
  if (cond.startsWith("mn>")) {
    const t = parseInt(cond.slice(3), 10);
    let mn = player.mn;
    if (fx.negotiator)  mn += 8;  // 交渉術
    if (fx.mentalSense && player.mn < 25) mn += 15; // 第六感
    return mn > t;
  }
  if (cond.startsWith("mn<"))  return player.mn  < parseInt(cond.slice(3), 10);
  if (cond.startsWith("inf>")) return player.inf > parseInt(cond.slice(4), 10);
  if (cond.startsWith("inf<")) return player.inf < parseInt(cond.slice(4), 10);
  console.warn(`[evalCond] Unknown format: "${cond}"`);
  return true;
};

/**
 * Resolve which outcome applies for a choice.
 * @pre choice.o is a non-empty array
 */
const resolveOutcome = (choice, player, fx) => {
  invariant(choice?.o?.length > 0, "resolveOutcome", "choice must have outcomes");
  for (const o of choice.o) {
    if (o.c !== "default" && evalCond(o.c, player, fx)) return o;
  }
  return choice.o.find(o => o.c === "default") ?? choice.o[0];
};

/**
 * Apply fx/diff modifiers to raw outcome values. Pure.
 * @returns { hp, mn, inf }
 */
const applyModifiers = (outcome, fx, diff, playerStatuses) => {
  let hp = outcome.hp ?? 0, mn = outcome.mn ?? 0, inf = outcome.inf ?? 0;
  if (hp > 0) hp = Math.round(hp * fx.healMult);
  if (hp < 0) hp = Math.round(hp * fx.hpReduce);
  if (diff?.dmgMult !== 1) {
    if (hp < 0) hp = Math.round(hp * diff.dmgMult);
    if (mn < 0) mn = Math.round(mn * diff.dmgMult);
  }
  if (inf > 0) inf = Math.round(inf * fx.infoMult);
  if (mn < 0)  mn = Math.round(mn * fx.mnReduce);
  if (playerStatuses.includes("呪い") && inf > 0) inf = Math.round(inf * 0.5);
  return { hp, mn, inf };
};

/**
 * Apply stat changes + status flag to player. Pure.
 */
const applyToPlayer = (player, { hp, mn, inf }, flag) => {
  let sts = [...player.st];
  if (flag?.startsWith("add:"))    { const s = flag.slice(4); if (!sts.includes(s)) sts.push(s); }
  if (flag?.startsWith("remove:")) { sts = sts.filter(s => s !== flag.slice(7)); }
  return {
    ...player,
    hp:  clamp(player.hp + hp, 0, player.maxHp),
    mn:  clamp(player.mn + mn, 0, player.maxMn),
    inf: Math.max(0, player.inf + inf),
    st:  sts,
  };
};

/**
 * Compute per-turn drain (labyrinth + status ticks). Pure.
 * @returns { player, drain: {hp,mn}|null }
 */
const computeDrain = (player, fx, diff) => {
  const base = diff ? diff.drainMod : -1;
  let hpD = 0, mnD = fx.drainImmune ? 0 : base;
  for (const s of player.st) {
    const tick = STATUS_META[s]?.tick;
    if (!tick) continue;
    let h = tick.hp;
    const m = tick.mn;
    if (s === "出血" && fx.bleedReduce) h = Math.round(h * 0.5);
    hpD += h; mnD += m;
  }
  if (hpD === 0 && mnD === 0) return { player, drain: null };
  return {
    player: { ...player, hp: clamp(player.hp + hpD, 0, player.maxHp), mn: clamp(player.mn + mnD, 0, player.maxMn) },
    drain: { hp: hpD, mn: mnD },
  };
};

/** Classify impact for audio/visual feedback */
const classifyImpact = (hp, mn) => {
  if (hp < -15) return "bigDmg";
  if (hp < 0 || mn < -10) return "dmg";
  if (hp > 0) return "heal";
  return null;
};

/** Overall progress 0-100 */
const computeProgress = (floor, step) =>
  Math.min(100, ((floor - 1) * CFG.EVENTS_PER_FLOOR + step) / (CFG.MAX_FLOOR * CFG.EVENTS_PER_FLOOR) * 100);

/** Vignette visual effect from player health */
const computeVignette = (player) => {
  if (!player) return {};
  const hr = player.hp / player.maxHp, mr = player.mn / player.maxMn;
  const spread = hr < 0.5 ? Math.round((1 - hr) * 200) : 0;
  return {
    boxShadow: spread > 0 ? `inset 0 0 ${spread}px ${Math.round(spread * 0.4)}px rgba(${hr < 0.25 ? "180,0,0" : "60,0,0"},${(0.6 - hr).toFixed(2)})` : "none",
    filter: mr < 0.3 ? `blur(${Math.round((0.3 - mr) * 3)}px) saturate(${(mr * 3).toFixed(1)})` : "none",
  };
};

/**
 * Process a player's choice — pure computation, no side effects.
 * @pre event and player are non-null, 0 <= choiceIdx < event.ch.length
 * @post returns all derived data needed by the UI callback
 */
const processChoice = (event, choiceIdx, player, fx, diff) => {
  invariant(event && player, "processChoice", "event and player required");
  invariant(choiceIdx >= 0 && choiceIdx < event.ch.length, "processChoice", `invalid index ${choiceIdx}`);
  const choice  = event.ch[choiceIdx];
  const outcome = resolveOutcome(choice, player, fx);
  const mods    = applyModifiers(outcome, fx, diff, player.st);
  const chainId = parseChainFlag(outcome.fl);
  let playerFlag = chainId ? null : outcome.fl;
  if (fx.curseImmune && playerFlag === "add:呪い") playerFlag = null;
  const updated  = applyToPlayer(player, mods, playerFlag);
  const { player: drained, drain } = computeDrain(updated, fx, diff);
  const impact   = classifyImpact(mods.hp, mods.mn);
  return { choice, outcome, mods, chainId, playerFlag, drained, drain, impact };
};

/** Validate event data at load time (fail-fast DbC) */
const validateEvents = (events) => {
  for (const e of events) {
    invariant(e.id, "validateEvents", "Event missing id");
    invariant(Array.isArray(e.fl) && e.fl.length > 0, "validateEvents", `${e.id}: floors must be non-empty array`);
    invariant(EVENT_TYPE[e.tp], "validateEvents", `${e.id}: unknown type "${e.tp}"`);
    invariant(Array.isArray(e.ch) && e.ch.length > 0, "validateEvents", `${e.id}: choices required`);
    for (const ch of e.ch) {
      invariant(ch.t, "validateEvents", `${e.id}: choice missing text`);
      invariant(Array.isArray(ch.o) && ch.o.length > 0, "validateEvents", `${e.id}: "${ch.t}" must have outcomes`);
    }
  }
  return events;
};

// ============================================================
// §6a. DEFINITIONS (Titles, Endings, Chains)
// ============================================================

const TITLES = Object.freeze([
  // Starter
  { id: "t00", name: "迷い人",         icon: "🚶", color: "#808098", cond: () => true, desc: "全ての探索者が最初に持つ称号" },
  // Run milestones
  { id: "t01", name: "初探索者",       icon: "🔰", color: "#4ade80", cond: (m) => m.runs >= 1,  desc: "初めての探索を終えた" },
  { id: "t02", name: "冒険者",         icon: "⚔",  color: "#818cf8", cond: (m) => m.runs >= 5,  desc: "5回の探索を経験した" },
  { id: "t03", name: "熟練探索者",     icon: "🗡",  color: "#c084fc", cond: (m) => m.runs >= 15, desc: "15回の探索を経験した" },
  { id: "t04", name: "歴戦の勇者",     icon: "🏛",  color: "#fbbf24", cond: (m) => m.runs >= 30, desc: "30回の探索を経験した" },
  { id: "t05", name: "伝説の探索者",   icon: "👑",  color: "#ff0040", cond: (m) => m.runs >= 50, desc: "50回の探索を経験した" },
  // Escape milestones
  { id: "t06", name: "生還者",         icon: "🌿", color: "#4ade80", cond: (m) => m.escapes >= 1, desc: "初めて迷宮から生還した" },
  { id: "t07", name: "迷宮踏破者",     icon: "🏆", color: "#fbbf24", cond: (m) => m.escapes >= 10, desc: "10回生還を果たした" },
  { id: "t08", name: "不死身",         icon: "☀",  color: "#fde68a", cond: (m) => m.escapes >= 20, desc: "20回生還した不滅の存在" },
  // Death milestones
  { id: "t09", name: "七転八起",       icon: "🔄", color: "#f87171", cond: (m) => (m.totalDeaths ?? 0) >= 7, desc: "7回死んでも立ち上がった" },
  { id: "t10", name: "不死鳥",         icon: "🔥", color: "#f97316", cond: (m) => (m.totalDeaths ?? 0) >= 15, desc: "15回の死から蘇り続ける者" },
  // Difficulty
  { id: "t11", name: "挑戦者の誇り",   icon: "⚔",  color: "#818cf8", cond: (m) => m.clearedDiffs?.includes("normal"), desc: "挑戦者難度をクリアした" },
  { id: "t12", name: "求道の極み",     icon: "🔥", color: "#f59e0b", cond: (m) => m.clearedDiffs?.includes("hard"), desc: "求道者難度をクリアした" },
  { id: "t13", name: "修羅を超えし者", icon: "💀", color: "#ef4444", cond: (m) => m.clearedDiffs?.includes("abyss"), desc: "修羅難度をクリアした" },
  { id: "t14", name: "全難度制覇",     icon: "💎", color: "#ff0040", cond: (m) => DIFFICULTY.every(d => m.clearedDiffs?.includes(d.id)), desc: "全ての難易度をクリアした" },
  // Ending collection
  { id: "t15", name: "語り部",         icon: "📖", color: "#c084fc", cond: (m) => (m.endings?.length ?? 0) >= 3, desc: "3つのエンディングを見た" },
  { id: "t16", name: "運命の紡ぎ手",   icon: "🌌", color: "#a78bfa", cond: (m) => (m.endings?.length ?? 0) >= 6, desc: "6つのエンディングを見た" },
  { id: "t17", name: "全てを見た者",   icon: "🌟", color: "#fde68a", cond: (m) => (m.endings?.length ?? 0) >= ENDINGS.length, desc: "全エンディングを回収した" },
  // Special
  { id: "t18", name: "知見の守護者",   icon: "◈",  color: "#60a5fa", cond: (m) => m.unlocked.length >= 20, desc: "20個の知見を解放した" },
  { id: "t19", name: "完全なる継承者", icon: "✨", color: "#fbbf24", cond: (m) => m.unlocked.length >= UNLOCKS.length, desc: "全ての知見を解放した" },
  { id: "t20", name: "修羅の覇者",     icon: "💀👑", color: "#ff0040", cond: (m) => m.endings?.includes("abyss_perfect"), desc: "修羅で完全なる帰還を達成した" },
]);

/** Get all unlocked titles for a meta state */
const getUnlockedTitles = (meta) => TITLES.filter(t => t.cond(meta));

/** Get active title object */
const getActiveTitle = (meta) => {
  if (meta.title) { const t = TITLES.find(t => t.id === meta.title); if (t?.cond(meta)) return t; }
  const unlocked = getUnlockedTitles(meta);
  return unlocked[unlocked.length - 1] ?? TITLES[0];
};

const ENDINGS = Object.freeze([
  // ── Difficulty-specific endings (highest priority) ──
  { id: "abyss_perfect", name: "修羅の覇者", sub: "LORD OF CARNAGE",
    desc: "修羅──死と隣り合わせの極限。その全てを制し、傷なく、狂わず、全てを知り尽くした。\n迷宮が震えている。恐怖しているのだ、お前という存在に。\nこの偉業を成し遂げた者は、歴史上ただ一人。",
    cond: (p, _log, d) => d?.id === "abyss" && p.hp > p.maxHp * 0.7 && p.mn > p.maxMn * 0.7 && p.inf > 35,
    color: "#ff0040", icon: "💀👑", bonusKp: 6, gradient: "linear-gradient(135deg, #ff0040, #fbbf24, #ff0040)" },
  { id: "abyss_clear", name: "修羅を超えし者", sub: "BEYOND THE ABYSS",
    desc: "最高難度「修羅」を生還した。\n全てが牙を剥く世界で、お前は立っていた。\nその名は畏怖と共に語り継がれるだろう。",
    cond: (_p, _log, d) => d?.id === "abyss",
    color: "#ef4444", icon: "💀", bonusKp: 4, gradient: "linear-gradient(135deg, #ef4444, #b91c1c, #7f1d1d)" },
  { id: "hard_clear", name: "求道の果て", sub: "END OF ASCETICISM",
    desc: "求道者の道は険しかった。\nだが、その険しさこそが鍛えてくれた。\n迷宮の深淵を覗き、なお正気を保つ者──それが求道者だ。",
    cond: (_p, _log, d) => d?.id === "hard",
    color: "#f59e0b", icon: "🔥", bonusKp: 2, gradient: "linear-gradient(135deg, #f59e0b, #d97706, #92400e)" },
  // ── General endings ──
  { id: "perfect",  name: "完全なる帰還",   sub: "THE PERFECT RETURN",
    desc: "傷ひとつなく、正気を保ち、迷宮の全てを理解した上での脱出。\nこれ以上ない完璧な探索だった。",
    cond: (p, _log) => p.hp > p.maxHp * 0.7 && p.mn > p.maxMn * 0.7 && p.inf > 35,
    color: "#fde68a", icon: "👑", bonusKp: 2, gradient: "linear-gradient(135deg, #fbbf24, #f59e0b)" },
  { id: "scholar",  name: "知識の導き",     sub: "GUIDED BY WISDOM",
    desc: "蓄積した知識が道を照らした。\n迷宮の秘密を胸に、あなたは光の中へ歩み出す。",
    cond: (p) => p.inf >= 40,
    color: "#fbbf24", icon: "📖", bonusKp: 2, gradient: "linear-gradient(135deg, #fbbf24, #f97316)" },
  { id: "iron",     name: "不屈の生還",     sub: "UNYIELDING SURVIVOR",
    desc: "傷だらけでも折れなかった。痛みを超え、意志の力だけで帰還を果たした。",
    cond: (p) => p.hp > p.maxHp * 0.5 && p.st.length > 0,
    color: "#f97316", icon: "🔥", bonusKp: 2, gradient: "linear-gradient(135deg, #f97316, #ef4444)" },
  { id: "battered", name: "満身創痍の脱出", sub: "BARELY ALIVE",
    desc: "意識が朦朧とする中、最後の一歩を踏み出した。\n生きている。それだけが、全てだ。",
    cond: (p) => p.hp <= p.maxHp * 0.25 && p.hp > 0,
    color: "#ef4444", icon: "💔", bonusKp: 1, gradient: "linear-gradient(135deg, #ef4444, #991b1b)" },
  { id: "madness",  name: "狂気の淵より",   sub: "EDGE OF MADNESS",
    desc: "現実と幻覚の境界が曖昧なまま出口に辿り着いた。\n自分の名前を思い出すのに、数分かかった。",
    cond: (p) => p.mn <= p.maxMn * 0.25 && p.mn > 0,
    color: "#a78bfa", icon: "🌀", bonusKp: 1, gradient: "linear-gradient(135deg, #a78bfa, #6d28d9)" },
  { id: "cursed",   name: "呪われし帰還者", sub: "CURSED RETURNER",
    desc: "脱出は果たした。だが迷宮の呪いは身体に刻まれたまま。\nあの闇の一部が、今もあなたの中にいる。",
    cond: (p) => p.st.includes("呪い") || (p.st.includes("出血") && p.st.includes("恐怖")),
    color: "#fb923c", icon: "⛧", bonusKp: 2, gradient: "linear-gradient(135deg, #fb923c, #9a3412)" },
  { id: "veteran",  name: "歴戦の探索者",   sub: "SEASONED EXPLORER",
    desc: "数多の困難を乗り越え、迷宮の深奥から帰還した。\nあなたの経験は、後に続く者の道標となるだろう。",
    cond: (_, log) => log.length >= 13,
    color: "#c084fc", icon: "⚔", bonusKp: 1, gradient: "linear-gradient(135deg, #c084fc, #7c3aed)" },
  { id: "standard", name: "生還",           sub: "ESCAPE",
    desc: "生きて帰った。それは紛れもない勝利だ。\n迷宮を知る者として、あなたはまた一歩強くなった。",
    cond: () => true,
    color: "#4ade80", icon: "✦", bonusKp: 0, gradient: "linear-gradient(135deg, #4ade80, #16a34a)" },
]);

/**
 * Determine ending based on player state at escape.
 * First matching ending wins (priority order).
 * @pre player.hp > 0 && player.mn > 0
 */
const determineEnding = (player, log, diff) => {
  for (const e of ENDINGS) {
    if (e.cond(player, log, diff)) return e;
  }
  return ENDINGS[ENDINGS.length - 1]; // fallback: standard
};

// ── Chain event logic ──

/**
 * Parse chain flag from outcome.
 * @returns chain event id or null
 */
const parseChainFlag = (flag) => {
  if (!flag) return null;
  if (flag.startsWith("chain:")) return flag.slice(6);
  return null;
};

/**
 * Pick event, excluding chainOnly events and used IDs.
 * Chain events are only triggered by explicit chain flags.
 * Cross-run events require metaCond to pass.
 * chainBoost: doubles the weight of events that have chain outcomes.
 */
const pickEvent = (events, floor, usedIds, meta, fx) => {
  const pool = events.filter(e =>
    e.fl.includes(floor) && !usedIds.includes(e.id) && !e.chainOnly
    && (!e.metaCond || e.metaCond(meta))
  );
  if (pool.length === 0) return null;
  // chainBoost: duplicate chain-starting events in the weighted pool
  if (fx?.chainBoost) {
    const boosted = [];
    for (const e of pool) {
      boosted.push(e);
      const hasChain = e.ch?.some(c => c.o?.some(o => o.fl?.startsWith("chain:")));
      if (hasChain) boosted.push(e); // double weight
    }
    return shuffle(boosted)[0];
  }
  return shuffle(pool)[0];
};

/** Find a chain event by ID */
const findChainEvent = (events, id) => events.find(e => e.id === id) ?? null;


// ============================================================
// §6b. EVENT DATA (163 events — data only, do not refactor)
// ============================================================

const EV = [
  // ═══ FLOOR 1 (6 events) ═══
  {id:"e001",fl:[1],tp:"trap",
    sit:"迷宮に踏み入れた直後、足元の石板が沈んだ。壁の隙間から錆びた矢が三本、こちらを狙っている。",
    ch:[
      {t:"地面に伏せる",o:[
        {c:"default",r:"咄嗟に伏せた。矢は頭上を通過したが、額を強打し血が目に入る。",hp:-10,mn:-5,inf:2}
      ]},
      {t:"横に飛び退く",o:[
        {c:"default",r:"壁際に飛び退いた。矢は掠めたが、着地で足首を捻った。",hp:-8,mn:-3,inf:0,fl:"add:負傷"}
      ]},
      {t:"矢の軌道を見極めて避ける",o:[
        {c:"inf>12",r:"飛来する矢の角度を瞬時に計算し、最小限の動きで回避した。",hp:0,mn:0,inf:8},
        {c:"default",r:"見極めようとした一瞬が命取り。一本が肩に深く刺さった。",hp:-18,mn:-8,inf:3,fl:"add:負傷"}
      ]}
    ]},
  {id:"e002",fl:[1,2],tp:"exploration",
    sit:"薄暗い通路の先に二つの道。左からは水の流れる音、右は完全な静寂。右へ大きな生物が這った痕跡が続く。",
    ch:[
      {t:"水音のする左の道を進む",o:[
        {c:"status:負傷",r:"水場で傷口を洗えた。痛みが和らぐ。",hp:8,mn:3,inf:0,fl:"remove:負傷"},
        {c:"default",r:"湿った岩場で足を滑らせ壁に激突。水は飲めたが代償は大きい。",hp:-5,mn:0,inf:2}
      ]},
      {t:"静かな右の道を進む",o:[
        {c:"inf>15",r:"壁の模様が迷宮の地図の一部だと分かった。",hp:0,mn:3,inf:14},
        {c:"default",r:"行き止まりの壁に奇妙な模様。這った痕跡の主の気配に精神が削られる。",hp:0,mn:-8,inf:7}
      ]},
      {t:"痕跡を詳しく調べる",o:[
        {c:"default",r:"巨大な爪痕だ。この層にも大型の何かが棲んでいる。恐怖で手が震える。",hp:0,mn:-7,inf:6}
      ]}
    ]},
  {id:"e003",fl:[1],tp:"encounter",
    sit:"小部屋の天井から鎖で吊られた檻。中に白骨化した遺体と道具袋。鎖は酷く錆びており、触れれば崩落しそうだ。",
    ch:[
      {t:"檻に手を伸ばして道具袋を取る",o:[
        {c:"inf>10",r:"鎖の状態を見極め、崩落前に素早く袋を掴んだ。中に迷宮の構造メモ。",hp:-3,mn:0,inf:12},
        {c:"default",r:"袋に触れた瞬間、鎖が切れた。腕を挟まれ激痛が走る。",hp:-15,mn:-5,inf:5,fl:"add:負傷"}
      ]},
      {t:"遺体を観察する",o:[
        {c:"default",r:"餓死。檻に閉じ込められたまま力尽きたらしい。精神に来る光景だ。",hp:0,mn:-9,inf:8}
      ]},
      {t:"部屋を離れる",o:[
        {c:"default",r:"立ち去った瞬間、背後で鎖が切れ檻が落下する音。心臓が跳ね上がる。",hp:0,mn:-7,inf:0}
      ]}
    ]},
  {id:"e004",fl:[1,2],tp:"trap",
    sit:"壁に不自然に新しい石のブロック。周囲に細い溝、天井にも違和感がある。",
    ch:[
      {t:"ブロックを押してみる",o:[
        {c:"inf>12",r:"構造を推測し慎重に押した。壁が開き近道が現れた。",hp:0,mn:3,inf:5},
        {c:"default",r:"押した瞬間、天井から石塊が落下。破片で全身を打たれた。",hp:-14,mn:-5,inf:3}
      ]},
      {t:"溝の構造を時間をかけて観察する",o:[
        {c:"default",r:"罠の全体像を把握し安全に無効化。だが長時間の集中で神経をすり減らした。",hp:0,mn:-8,inf:10}
      ]},
      {t:"触れずに迂回する",o:[
        {c:"default",r:"遠回りした。体力と時間を消耗したが安全ではあった。",hp:-5,mn:-3,inf:0}
      ]}
    ]},
  {id:"e005",fl:[1],tp:"exploration",
    sit:"壁に取り付けられた古い掲示板。黄ばんだ紙が何枚か。下に何かの巣がある。",
    ch:[
      {t:"読める紙だけ素早く読む",o:[
        {c:"default",r:"「第三層以降、沈黙は安全の証ではない」──有用な情報だ。",hp:0,mn:0,inf:8}
      ]},
      {t:"全ての紙を調べる",o:[
        {c:"default",r:"解読中、巣から大量の虫が。パニックで転倒し頭を打った。",hp:-8,mn:-7,inf:14}
      ]},
      {t:"巣を調べる",o:[
        {c:"default",r:"迷宮の生物の生態が分かった。だが毒虫に刺された。",hp:-12,mn:-3,inf:10}
      ]}
    ]},
  {id:"e006",fl:[1,2],tp:"rest",
    sit:"比較的安全そうな小部屋。壁際に乾いた藁が敷かれている。藁の下に何か隠されているようにも見える。",
    ch:[
      {t:"しっかり休息を取る",o:[
        {c:"default",r:"警戒しながら休息。体力は回復したが、迷宮の気配に神経は休まらない。",hp:12,mn:2,inf:0,fl:"remove:負傷"}
      ]},
      {t:"藁の下を調べてから休む",o:[
        {c:"default",r:"前の利用者のメモを発見。だが安眠の機会を逃し休息は不十分に。",hp:5,mn:0,inf:10}
      ]},
      {t:"短時間だけ仮眠して先を急ぐ",o:[
        {c:"default",r:"15分ほどの浅い仮眠。回復は最小限だが時間のロスは避けた。",hp:5,mn:3,inf:0}
      ]}
    ]},

  // ═══ FLOOR 1-2 (8 events) ═══
  {id:"e007",fl:[1,2],tp:"encounter",
    sit:"壁に大きな鏡が嵌め込まれている。鏡の中の自分は微かに違う動きをしている。縁に「汝の選択を映す」と。",
    ch:[
      {t:"鏡に触れてみる",o:[
        {c:"mn>50",r:"映像が変わった。次の部屋の光景が映し出されている。先読みの情報を得た。",hp:0,mn:-5,inf:12},
        {c:"default",r:"映し出された自分が突然叫んだ。幻覚でも心が砕けそうだ。",hp:-3,mn:-10,inf:4}
      ]},
      {t:"鏡の裏側を調べる",o:[
        {c:"default",r:"隠し棚に回復薬が一つ。ただし鏡が割れ、破片で手を切った。",hp:3,mn:0,inf:5}
      ]},
      {t:"目を逸らして通り過ぎる",o:[
        {c:"default",r:"通り過ぎた瞬間、鏡の中の自分が「逃げるな」と囁いた気がした。",hp:0,mn:-6,inf:0}
      ]}
    ]},
  {id:"e008",fl:[1,2,3],tp:"encounter",
    sit:"広間の中央に光る液体が満たされた器。甘い香りだが、台座の周囲に干からびた小動物の死骸が散らばっている。",
    ch:[
      {t:"液体を少量だけ口にする",o:[
        {c:"mn>55",r:"直感を信じた一口。活力が満ちるが、視界が歪む副作用。",hp:18,mn:-9,inf:0},
        {c:"default",r:"激しい嘔吐。毒だ。身体中が焼けるように痛い。",hp:-18,mn:-7,inf:0,fl:"add:混乱"}
      ]},
      {t:"死骸を調べる",o:[
        {c:"default",r:"外傷なく内側から壊死。液体は体内で何かを引き起こすらしい。",hp:0,mn:-7,inf:11}
      ]},
      {t:"台座の文字を調べる",o:[
        {c:"default",r:"「選別の泉」──資格なき者は死ぬ仕組みらしい。",hp:0,mn:-6,inf:9}
      ]}
    ]},
  {id:"e035",fl:[1,2],tp:"encounter",
    sit:"通路に前の探索者の荷物が散乱。血痕が壁まで続いている。まだ使えそうな道具がいくつか見える。血痕は新しい。",
    ch:[
      {t:"荷物を素早く漁る",o:[
        {c:"default",r:"包帯と手書き地図を発見。だが暗闇から唸り声が。急いで立ち去った。",hp:5,mn:-8,inf:8}
      ]},
      {t:"血痕を辿る",o:[
        {c:"inf>15",r:"隠し通路に瀕死の探索者。手当をすると有力な情報を教えてくれた。",hp:-5,mn:3,inf:14},
        {c:"default",r:"辿った先に、探索者だったものの残骸。顔のない死体。嘔吐した。",hp:-3,mn:-12,inf:4,fl:"add:恐怖"}
      ]},
      {t:"関わらず立ち去る",o:[
        {c:"default",r:"血の匂いが鼻にこびりつき、しばらく吐き気が収まらない。",hp:0,mn:-7,inf:0}
      ]}
    ]},
  {id:"e033",fl:[1,2,3],tp:"trap",
    sit:"通路に紫の花が一面に咲いている。花粉が空気中に舞い、頭がぼんやりしてきた。通路は花畑を通るしかない。",
    ch:[
      {t:"息を止めて一気に走り抜ける",o:[
        {c:"hp>40",r:"花畑を駆け抜けた。少し吸ったが最小限の影響で済んだ。",hp:-5,mn:-5,inf:0},
        {c:"default",r:"走る体力がなく花粉を大量に吸引。幻覚が見え始めた。",hp:-8,mn:-10,inf:0,fl:"add:混乱"}
      ]},
      {t:"花を採取して調べる",o:[
        {c:"default",r:"精神作用のある花だ。有用な情報だが頭がぐらつく。",hp:-3,mn:-7,inf:12}
      ]},
      {t:"服で口を覆い慎重に進む",o:[
        {c:"default",r:"布越しでも完全には防げない。通過したが軽い眩暈が残る。",hp:-2,mn:-8,inf:2}
      ]}
    ]},
  {id:"e040",fl:[1,2],tp:"exploration",
    sit:"崩れかけた階段を降りると、地下水が流れる空間に出た。水面が青白く光っている。壁に古い壁画が残っている。",
    ch:[
      {t:"壁画を丁寧に調べる",o:[
        {c:"default",r:"迷宮の建造時の壁画。設計者の意図に関する情報を得た。だが壁画の中の顔が突然動いた──ように見えた。",hp:0,mn:-8,inf:13}
      ]},
      {t:"光る水を手ですくう",o:[
        {c:"mn>45",r:"不思議な水は傷を癒す効果があった。肌に染み込むような温かさ。",hp:10,mn:3,inf:3},
        {c:"default",r:"水に手を入れた瞬間、電撃のような痛みが全身を走った。",hp:-10,mn:-8,inf:2}
      ]},
      {t:"水の流れに沿って先に進む",o:[
        {c:"default",r:"流れは安全な通路に続いていた。時間を節約できた。",hp:0,mn:0,inf:5}
      ]}
    ]},
  {id:"e041",fl:[1,2],tp:"trap",
    sit:"通路の天井に無数の目のような模様が彫られている。足を踏み入れた途端、模様が赤く光り始めた。空気が重くなる。",
    ch:[
      {t:"走って通り抜ける",o:[
        {c:"default",r:"赤い光が追ってきた。走り抜けたが、最後に強烈な閃光を浴びた。目が眩む。",hp:-5,mn:-7,inf:0}
      ]},
      {t:"目を閉じてゆっくり進む",o:[
        {c:"mn>40",r:"精神を集中し視覚情報を遮断。模様の魔力を無効化した。壁の振動から通路の構造も読み取れた。",hp:0,mn:-8,inf:10},
        {c:"default",r:"目を閉じても赤い光が瞼を貫く。恐怖で腰が抜けかけた。",hp:0,mn:-9,inf:3,fl:"add:恐怖"}
      ]},
      {t:"模様の法則性を分析する",o:[
        {c:"default",r:"古い封印魔法の残滓だと分かった。解析データは貴重だが、長時間光に曝されて頭痛が酷い。",hp:-6,mn:-6,inf:15}
      ]}
    ]},

  // ═══ FLOOR 2-3 (10 events) ═══
  {id:"e009",fl:[2,3],tp:"trap",
    sit:"床に規則的なタイル。壁に無数の穴。奥に扉が見えるが迂回路はない。踏み間違えれば針の嵐。",
    ch:[
      {t:"色の違うタイルを避けて進む",o:[
        {c:"inf>18",r:"パターンを推測。無傷で通過。知識は力だ。",hp:0,mn:3,inf:3},
        {c:"default",r:"判別を誤った。壁から飛んだ針が腕と脚に。",hp:-14,mn:-5,inf:4,fl:"add:負傷"}
      ]},
      {t:"走って一気に駆け抜ける",o:[
        {c:"hp>55",r:"全力疾走。何本か刺さったが致命傷は免れた。",hp:-12,mn:-2,inf:0},
        {c:"default",r:"速度が出ず複数の針が深く刺さった。",hp:-22,mn:-8,inf:0,fl:"add:負傷"}
      ]},
      {t:"瓦礫を投げて罠を作動させる",o:[
        {c:"default",r:"大半の罠を作動させ通過。だが最後のタイルが反応し足首に一本。",hp:-6,mn:-5,inf:7}
      ]}
    ]},
  {id:"e010",fl:[2,3],tp:"encounter",
    sit:"通路の先から呻き声。壁にもたれた人影。「助けてくれ...水を...」と弱々しい声。",
    ch:[
      {t:"近づいて助ける",o:[
        {c:"inf>22",r:"本物の探索者だと判断。手当をすると深層の情報を教えてくれた。",hp:-3,mn:10,inf:14},
        {c:"default",r:"近づいた瞬間、相手が豹変。迷宮が生んだ擬態体だ。喉を掴まれた。",hp:-20,mn:-9,inf:4,fl:"add:負傷"}
      ]},
      {t:"距離を保って話しかける",o:[
        {c:"default",r:"本物の探索者で情報を得られた。だが助けきれなかった罪悪感が残る。",hp:0,mn:-5,inf:8}
      ]},
      {t:"無視して通り過ぎる",o:[
        {c:"default",r:"背後の呻き声が精神を抉る。もし本物だったら──後味が最悪だ。",hp:0,mn:-9,inf:0}
      ]}
    ]},
  {id:"e011",fl:[2,3],tp:"exploration",
    sit:"天井から根のようなものが垂れている。温かく、内部を液体が流れている。この迷宮は──生きているのか。",
    ch:[
      {t:"根を辿って奥に進む",o:[
        {c:"default",r:"迷宮が生命体である証拠を発見。だが根が突然収縮し腕を締め付けられた。",hp:-8,mn:-8,inf:15}
      ]},
      {t:"根の液体を採取して飲む",o:[
        {c:"mn>45",r:"栄養のある液体で体力が回復。だが味は最悪。",hp:6,mn:-5,inf:3},
        {c:"default",r:"意識が飛んだ。気づくと床に倒れていた。迷宮の「血液」の代償は大きい。",hp:-10,mn:-9,inf:5,fl:"add:混乱"}
      ]},
      {t:"観察だけに留める",o:[
        {c:"default",r:"脈動のリズムが迷宮の振動と同期している。安全に重要な発見を得た。",hp:0,mn:-2,inf:10}
      ]}
    ]},
  {id:"e012",fl:[2,3],tp:"trap",
    sit:"足元が急に柔らかくなった。流砂だ。すでに膝まで沈んでいる。前方3メートルに岩場が見える。",
    ch:[
      {t:"全力でもがいて前に進む",o:[
        {c:"hp>50",r:"力業で脱出。全身泥だらけで消耗したが生きている。",hp:-14,mn:-5,inf:0},
        {c:"default",r:"もがくほど沈む。顎まで来たところで必死に這い出た。",hp:-22,mn:-10,inf:0}
      ]},
      {t:"身体を水平にして浮力を利用",o:[
        {c:"default",r:"冷静に対処し脱出。全身砂だらけで関節が軋む。",hp:-5,mn:-8,inf:4}
      ]},
      {t:"壁の突起に手を伸ばす",o:[
        {c:"default",r:"体を引き上げた。肩が外れかけたが壁の記号も発見。",hp:-8,mn:-3,inf:8}
      ]}
    ]},
  {id:"e032",fl:[2,3],tp:"encounter",
    sit:"暗い部屋に人型の石像。両手から炎が灯っている。「一つを受け取れ。だが代価を支払え」と台座に刻まれている。足元に骨が散らばる。",
    ch:[
      {t:"右手の炎を受け取る",o:[
        {c:"default",r:"温かな炎は身体を癒す力。だが代価として激しい頭痛。記憶の一部が霞む。",hp:18,mn:-10,inf:-8}
      ]},
      {t:"左手の炎を受け取る",o:[
        {c:"default",r:"冷たい炎は知識を灌ぐ力。情報が流れ込む。だが手が焼けた。",hp:-12,mn:-5,inf:18}
      ]},
      {t:"どちらも受け取らない",o:[
        {c:"default",r:"拒否した瞬間、石像の目が光った。天井から石片が降り注ぐ。代価を拒むことも罪らしい。",hp:-15,mn:-8,inf:0}
      ]}
    ]},
  {id:"e042",fl:[2,3],tp:"encounter",
    sit:"小部屋の壁に大きな穴が開いている。穴の奥から温風と共に、甘い匂いが漂ってくる。穴の縁には乾いた血の跡がある。",
    ch:[
      {t:"穴に頭を入れて覗く",o:[
        {c:"default",r:"暗闇の中に巨大な眼と目が合った。一瞬で首を引っ込めた。心臓が止まりかけた。だが内部構造の情報を得た。",hp:-3,mn:-10,inf:10}
      ]},
      {t:"石を投げ入れて反応を見る",o:[
        {c:"default",r:"石は闇に消え……数秒後、噛み砕かれた破片が吐き出された。近づいてはいけない。",hp:0,mn:-8,inf:6}
      ]},
      {t:"穴を避けて通過する",o:[
        {c:"default",r:"穴の前を通過した瞬間、中から舌のような触手が伸びた。ギリギリで避けたが足を切った。",hp:-6,mn:-8,inf:0}
      ]}
    ]},
  {id:"e043",fl:[2,3],tp:"rest",
    sit:"以前の探索者が作った隠し部屋。入口が巧みに偽装されている。中に保存食と毛布、壁に書き殴られたメモ。",
    ch:[
      {t:"食料を食べて休む",o:[
        {c:"default",r:"乾燥肉と硬いパン。美味ではないが身体が喜んでいる。安全な休息を得た。",hp:14,mn:10,inf:0,fl:"remove:負傷"}
      ]},
      {t:"メモを解読する",o:[
        {c:"default",r:"探索者の詳細な記録。後半は精神崩壊したのか判読不能だが、前半は貴重な情報だ。",hp:3,mn:-5,inf:16}
      ]},
      {t:"食料を食べつつメモも読む",o:[
        {c:"default",r:"欲張った結果、どちらも中途半端に。だが最低限の回復と情報は得た。",hp:6,mn:2,inf:8}
      ]}
    ]},
  {id:"e044",fl:[2,3,4],tp:"trap",
    sit:"通路の床に等間隔で丸い紋様。踏むと光る。最初の三つを踏んだ時、背後の通路が崩落した。もう戻れない。残りを踏み間違えれば──",
    ch:[
      {t:"光ったパターンを記憶して再現する",o:[
        {c:"inf>20",r:"パターンを完全に記憶。正解の紋様だけを踏んで通過。見事。",hp:0,mn:-5,inf:8},
        {c:"default",r:"一つ間違えた。床から電撃が走り全身が痙攣した。なんとか正解のルートを見つけたが。",hp:-14,mn:-7,inf:5}
      ]},
      {t:"全速力で駆け抜ける",o:[
        {c:"default",r:"いくつか踏んだが速度で被害を最小限に。最後の一歩で強烈な衝撃を受けた。",hp:-10,mn:-5,inf:0}
      ]},
      {t:"壁を伝って紋様を避ける",o:[
        {c:"default",r:"壁際を進んだが、壁にも罠があった。鋭い棘が腕に刺さる。",hp:-8,mn:-3,inf:3}
      ]}
    ]},

  // ═══ FLOOR 3-4 (10 events) ═══
  {id:"e013",fl:[2,3,4],tp:"encounter",
    sit:"天秤が置かれた部屋。片方に黒い石、もう片方は空。台座に「等価を捧げよ」。四隅に異なる色の石。",
    ch:[
      {t:"情報の断片を皿に置く",o:[
        {c:"inf>28",r:"天秤が均衡し隠し通路が開いた。大幅な近道だが、情報の一部を失った。",hp:0,mn:7,inf:-18,fl:"shortcut"},
        {c:"default",r:"不十分だった。天秤が傾き、床から棘が突き出した。",hp:-16,mn:-8,inf:-5,fl:"add:負傷"}
      ]},
      {t:"四隅の石を一つ選んで置く",o:[
        {c:"default",r:"赤い石を選んだ。壁が開き保管庫が。回復と引き換えに精神的疲労。",hp:10,mn:-5,inf:3}
      ]},
      {t:"天秤に触れず部屋を調べる",o:[
        {c:"default",r:"台座の文字を記録。有用だが、退出時に床の棘が足に。",hp:-8,mn:-2,inf:11}
      ]}
    ]},
  {id:"e014",fl:[2,3,4],tp:"rest",
    sit:"地下水の泉がある洞穴。水は透明で冷たい。泉の底に光るものが見える。",
    ch:[
      {t:"水を飲んで休息する",o:[
        {c:"default",r:"清浄な水で回復。だが遠くで何かが崩れる音がした。",hp:12,mn:10,inf:0}
      ]},
      {t:"泉の底の光るものを取る",o:[
        {c:"default",r:"水晶に深層の情報が刻まれていた。水の中で何かに指を噛まれた。",hp:-5,mn:0,inf:15}
      ]},
      {t:"泉で傷を洗い十分に休む",o:[
        {c:"status:負傷",r:"傷を丁寧に洗い流した。痛みが引いていく。",hp:15,mn:10,inf:0,fl:"remove:負傷"},
        {c:"status:恐怖",r:"清らかな水で心が落ち着いた。恐怖が薄れていく。",hp:8,mn:16,inf:0,fl:"remove:恐怖"},
        {c:"default",r:"身体を清めて休息。かなり回復した。",hp:14,mn:13,inf:0}
      ]}
    ]},
  {id:"e015",fl:[3,4],tp:"trap",
    sit:"霧が立ち込める広間。視界3メートル。霧の中から金属が擦れる不快な音が不規則に響く。",
    ch:[
      {t:"光源に真っ直ぐ進む",o:[
        {c:"mn>48",r:"集中して辿り着いた。古いランタン。途中で刃を避けた際に腕を切った。",hp:-8,mn:-8,inf:4},
        {c:"default",r:"方向を見失い天井の吊り刃に激突。深い切り傷。",hp:-22,mn:-9,inf:2,fl:"add:出血"}
      ]},
      {t:"壁伝いに慎重に進む",o:[
        {c:"default",r:"時間はかかったが壁の警告文を発見。長時間霧にいたせいで精神がやられた。",hp:0,mn:-9,inf:10}
      ]},
      {t:"金属音のパターンを分析する",o:[
        {c:"default",r:"規則性を発見し安全に通過。だが集中しすぎて酷い頭痛に。",hp:-3,mn:-7,inf:14}
      ]}
    ]},
  {id:"e016",fl:[3,4],tp:"encounter",
    sit:"自分と全く同じ姿の影。一歩近づくと一歩下がる。影の口が動く。「お前はここで何を得た？」",
    ch:[
      {t:"得た情報を答える",o:[
        {c:"inf>28",r:"知識を語ると影は道を開けた。「まだ正気のようだ」と。",hp:0,mn:7,inf:5},
        {c:"default",r:"答えに窮した。影が嗤い、冷気が全身を貫いた。「空っぽだな」",hp:-5,mn:-12,inf:0,fl:"add:恐怖"}
      ]},
      {t:"黙って影を通り抜ける",o:[
        {c:"mn>42",r:"幻影と見抜き通り抜けた。影は煙のように消えた。",hp:0,mn:-7,inf:3},
        {c:"default",r:"影に触れた瞬間、記憶が途切れた。気づくと床に膝をついていた。",hp:-8,mn:-10,inf:0,fl:"add:混乱"}
      ]},
      {t:"「お前は何者だ」と問い返す",o:[
        {c:"default",r:"「お前の恐れだ」影が消え、壁に文字が。迷宮の本質に関する情報だが恐怖が刻まれた。",hp:-5,mn:-8,inf:15}
      ]}
    ]},
  {id:"e017",fl:[3,4],tp:"exploration",
    sit:"円形の部屋。天井に星のような光点。中央に石柱。四面に紋様。甘い香りが漂うが──麻痺性のガスかもしれない。",
    ch:[
      {t:"息を止めて四面の紋様を記録",o:[
        {c:"hp>40",r:"肺が焼けるようだが全紋様を記録。極めて有用な情報。",hp:-10,mn:-5,inf:20},
        {c:"default",r:"耐えきれず吸い込んだ。半分しか記録できなかった。",hp:-8,mn:-9,inf:10,fl:"add:混乱"}
      ]},
      {t:"天井の光点を観察する",o:[
        {c:"default",r:"光点の配置は安全地帯の位置を示しているかも。頭が重い。",hp:-3,mn:-5,inf:10}
      ]},
      {t:"布で口を覆い素早く通過する",o:[
        {c:"default",r:"最小限の吸入で通過。情報は得られなかったが被害も小さい。",hp:-3,mn:-2,inf:0}
      ]}
    ]},
  {id:"e018",fl:[3,4,5],tp:"trap",
    sit:"壁が徐々に狭まる通路。最狭部は人一人がやっと。壁面が湿り脈動している。生きている壁だ。",
    ch:[
      {t:"身体を横にして素早く通る",o:[
        {c:"hp>45",r:"一気に通り抜けた。壁の収縮が始まったが間一髪。粘液で皮膚が痛む。",hp:-10,mn:-5,inf:0},
        {c:"default",r:"体力不足で動きが鈍った。壁の圧迫で肋骨にヒビ。",hp:-22,mn:-9,inf:0,fl:"add:負傷"}
      ]},
      {t:"脈動のリズムを観察して通る",o:[
        {c:"default",r:"緩む瞬間を見極めて通過。壁面に長く触れ発疹が出た。",hp:-6,mn:-8,inf:8}
      ]},
      {t:"迂回路を探す",o:[
        {c:"inf>20",r:"以前の情報を元に迂回路を発見。遠回りだが安全。",hp:-3,mn:-3,inf:0},
        {c:"default",r:"見つからず結局通るしかなかった。最悪のタイミングで壁が収縮。",hp:-18,mn:-7,inf:2,fl:"add:負傷"}
      ]}
    ]},
  {id:"e045",fl:[3,4],tp:"encounter",
    sit:"広間に巨大な蜘蛛の巣。中央に何かが包まれている。蜘蛛の姿は見えないが、巣が微かに振動している。",
    ch:[
      {t:"包まれたものを取りに行く",o:[
        {c:"hp>45",r:"巣を切り裂き中身を回収。前の探索者の遺品──詳細な地図だ。だが蜘蛛が戻ってきて噛まれた。",hp:-12,mn:-5,inf:18},
        {c:"default",r:"巣に足を取られ動けなくなった。天井から降りてきた巨大な蜘蛛に腕を噛まれた。毒が回る。",hp:-18,mn:-9,inf:8,fl:"add:負傷"}
      ]},
      {t:"巣を燃やす",o:[
        {c:"default",r:"衣服の端を燃やして巣に引火。中のものは灰に。だが煙で蜘蛛が逃げ、安全に通過できた。",hp:-3,mn:3,inf:0}
      ]},
      {t:"巣を避けて壁際を通る",o:[
        {c:"default",r:"慎重に壁際を進んだ。糸に少し触れたが、振動で蜘蛛を呼ぶ前に離れた。",hp:0,mn:-8,inf:0}
      ]}
    ]},
  {id:"e046",fl:[3,4],tp:"exploration",
    sit:"書庫のような部屋。本棚が崩れ、本が散乱している。一冊だけ台座の上に光っている。だが台座の周りに焦げ跡──防衛機構がある。",
    ch:[
      {t:"光る本を素早く取る",o:[
        {c:"inf>22",r:"焦げ跡のパターンから安全なタイミングを読んだ。本には迷宮の設計図の断片が。",hp:0,mn:-3,inf:20},
        {c:"default",r:"台座に手を伸ばした瞬間、青い炎が噴き出した。手を引っ込めたが火傷を負った。本は取れなかった。",hp:-14,mn:-8,inf:0}
      ]},
      {t:"散乱した本を調べる",o:[
        {c:"default",r:"ほとんど朽ちているが、断片的な情報を複数の本から集めた。目が疲れた。",hp:0,mn:-6,inf:12}
      ]},
      {t:"台座の防衛機構を解除する",o:[
        {c:"inf>18",r:"機構を分析し無効化。光る本を安全に入手。迷宮の核心に近づく情報だ。",hp:0,mn:-5,inf:22},
        {c:"default",r:"解除に失敗し、防衛機構が暴走。部屋全体が炎に包まれた。火傷を負いながら脱出。",hp:-16,mn:-7,inf:3,fl:"add:負傷"}
      ]}
    ]},

  // ═══ FLOOR 3-4-5 ═══
  {id:"e019",fl:[3,4,5],tp:"rest",
    sit:"石造りの祭壇がある聖域。空気が違う。祭壇の上に光る結晶。罅が入っており力が弱まっている。",
    ch:[
      {t:"結晶に触れる",o:[
        {c:"mn>40",r:"温かな光に包まれた。傷が癒え精神が澄む。ただし結晶は砕けた。",hp:20,mn:20,inf:0,fl:"remove:負傷"},
        {c:"default",r:"精神が弱い状態で触れ光が暴走。回復したが精神に衝撃。",hp:12,mn:-9,inf:0,fl:"remove:負傷"}
      ]},
      {t:"祭壇に祈りを捧げる",o:[
        {c:"default",r:"穏やかな安らぎ。恐怖と混乱が薄れていく。",hp:3,mn:18,inf:0,fl:"remove:混乱"}
      ]},
      {t:"聖域の壁の記録を調べる",o:[
        {c:"default",r:"迷宮の核心に関する極めて重要な情報。設計者が残した安全地帯だった。",hp:3,mn:3,inf:18}
      ]}
    ]},
  {id:"e020",fl:[3,4,5],tp:"encounter",
    sit:"闇の中に蝋燭が一本。光の輪の中に白紙の本と銀の鍵。光の外に──何かの気配。蝋燭の炎が揺れる。",
    ch:[
      {t:"鍵を取る",o:[
        {c:"default",r:"掴んだ瞬間、蝋燭が消えた。完全な闇。何かが足元を這った。再び灯った時、部屋の構造が変わっていた。",hp:-3,mn:-9,inf:8}
      ]},
      {t:"本を調べる",o:[
        {c:"default",r:"触れると文字が浮かんだ。最深部の情報だ。だがページが燃え始め指を焦がした。",hp:-5,mn:-5,inf:18}
      ]},
      {t:"光の外の気配に語りかける",o:[
        {c:"mn>45",r:"闇の番人と対話。敵意はなく、この場所の意味を教えてくれた。",hp:0,mn:-7,inf:15},
        {c:"default",r:"闇の中の存在を直視してしまった。名状しがたい恐怖。",hp:-5,mn:-13,inf:4,fl:"add:恐怖"}
      ]}
    ]},
  {id:"e034",fl:[3,4,5],tp:"encounter",
    sit:"行き止まりの壁の向こうから光。壁は薄く叩けば壊せそうだが轟音で何かを呼ぶかもしれない。",
    ch:[
      {t:"壁を破壊して突き進む",o:[
        {c:"hp>40",r:"蹴破った先に宝物庫。だが轟音に引き寄せられた何かの足音。急いで情報を回収し逃げた。",hp:-8,mn:-7,inf:15},
        {c:"default",r:"壁は壊れたが、その先の何かと鉢合わせ。全力で逃げたが深い爪傷。",hp:-20,mn:-9,inf:5,fl:"add:出血"}
      ]},
      {t:"小さな穴を開けて覗く",o:[
        {c:"default",r:"穴から向こう側を覗いた。情報は得たが冷気で体温を奪われた。",hp:-5,mn:-5,inf:12}
      ]},
      {t:"引き返す",o:[
        {c:"default",r:"来た道の罠が再起動。避けるのに消耗した。",hp:-8,mn:-8,inf:0}
      ]}
    ]},

  // ═══ FLOOR 4-5 (8 events) ═══
  {id:"e021",fl:[4,5],tp:"encounter",
    sit:"巨大な地下湖。鏡のような水面の下で何かが蠢く。対岸に出口の光。湖畔に亀裂の入った小舟。",
    ch:[
      {t:"舟を修理して漕ぎ出す",o:[
        {c:"inf>25",r:"知識を活かして補修。水面下の影が舟に触れたが振り切った。",hp:-5,mn:-5,inf:0},
        {c:"default",r:"湖の中央で浸水。水面下から触手のようなものが。必死で漕いだ。",hp:-18,mn:-10,inf:0}
      ]},
      {t:"湖畔を歩いて迂回する",o:[
        {c:"default",r:"岩場を進んだ。壁画の記録を発見。だが湖から何かに足首を掴まれた。",hp:-10,mn:-8,inf:10}
      ]},
      {t:"泳いで渡る",o:[
        {c:"hp>55",r:"全力で泳いだ。水中で何かに足を引かれたが振り切った。",hp:-16,mn:-9,inf:0},
        {c:"default",r:"溺れかけた。水中の何かに引きずり込まれそうになった。奇跡的に浅瀬に戻れたが。",hp:-28,mn:-13,inf:0,fl:"add:恐怖"}
      ]}
    ]},
  {id:"e022",fl:[4,5],tp:"trap",
    sit:"床全面に魔法陣。影が四方に分裂。空気が重く呼吸が苦しい。踏み入れた瞬間から何かが始まった。",
    ch:[
      {t:"動かずに紋様を解読する",o:[
        {c:"inf>33",r:"知識で解読成功。冷静を保てば害はない。深層の知識を得た。",hp:0,mn:3,inf:15},
        {c:"default",r:"光が強まり意識が朦朧。別の通路に倒れていた。紋様の痣が残る。",hp:-10,mn:-12,inf:5,fl:"add:呪い"}
      ]},
      {t:"全力で紋様の外に飛び出す",o:[
        {c:"hp>40",r:"跳躍して脱出。膝を痛めたが紋様の効果は避けた。",hp:-10,mn:-5,inf:0},
        {c:"default",r:"紋様が足を縛った。脚に深い痺れが残る。",hp:-16,mn:-7,inf:0,fl:"add:負傷"}
      ]},
      {t:"目を閉じて精神を集中する",o:[
        {c:"mn>48",r:"内なる平静を保った。精神試験の装置だった。隠し通路が現れた。",hp:0,mn:-9,inf:10},
        {c:"default",r:"光が精神を侵食。耐えたが恐怖が刻まれた。",hp:-3,mn:-10,inf:3,fl:"add:恐怖"}
      ]}
    ]},
  {id:"e023",fl:[4,5],tp:"encounter",
    sit:"歯車の機構がある大広間。回転する巨大な歯車の向こうに重要そうな扉。一部が欠損し不規則に動く。",
    ch:[
      {t:"タイミングを計って通り抜ける",o:[
        {c:"mn>48",r:"パターンを読み切り通過。最後で服が巻き込まれ引きちぎって脱出。",hp:-5,mn:-7,inf:4},
        {c:"default",r:"判断が遅れ歯車に巻き込まれかけた。肋骨を圧迫され血を吐いた。",hp:-25,mn:-10,inf:2,fl:"add:負傷"}
      ]},
      {t:"機構を停止させる",o:[
        {c:"inf>30",r:"構造を分析し欠損箇所に詰め物。歯車が停止。見事。",hp:0,mn:3,inf:8},
        {c:"default",r:"暴走させた。飛び散る破片で全身を切り裂かれた。",hp:-20,mn:-7,inf:5,fl:"add:出血"}
      ]},
      {t:"迂回路を探す",o:[
        {c:"default",r:"隅に以前の探索者が掘った穴を発見。狭いが通れた。背中を石で抉った。",hp:-8,mn:-2,inf:4}
      ]}
    ]},
  {id:"e024",fl:[4,5],tp:"exploration",
    sit:"壁一面に無数の手形。赤褐色の古い手形の中に、一つだけ鮮やかな青い手形が脈打っている。",
    ch:[
      {t:"青い手形に手を重ねる",o:[
        {c:"mn>40",r:"壁が振動し隠し部屋が開いた。前の探索者の記憶の断片が流れ込んだ。",hp:10,mn:-8,inf:12},
        {c:"default",r:"探索者の死の記憶が流入。恐怖と絶望が心を蝕む。",hp:5,mn:-12,inf:8,fl:"add:恐怖"}
      ]},
      {t:"手形の配置パターンを分析する",o:[
        {c:"default",r:"生還者の記録だ。赤い手形が圧倒的に多い──ほとんどが死んだということだ。",hp:0,mn:-8,inf:12}
      ]},
      {t:"文字を読み解く",o:[
        {c:"default",r:"「第五層の扉は三つの鍵を持つ」──書いた者の筆跡は最後に乱れ途切れている。",hp:0,mn:-5,inf:10}
      ]}
    ]},
  {id:"e025",fl:[4,5],tp:"trap",
    sit:"突然、天井が下がり始めた。ゆっくりだが確実に。出口は前方20メートル。天井にはびっしりと棘。",
    ch:[
      {t:"全力で走り抜ける",o:[
        {c:"hp>45",r:"棘が背中を削ったが出口に飛び込んだ。血だらけだが生きている。",hp:-15,mn:-5,inf:0,fl:"add:出血"},
        {c:"default",r:"途中で躓いた。棘が肩に食い込み、肉を削りながら這って脱出。",hp:-25,mn:-10,inf:0,fl:"add:出血"}
      ]},
      {t:"低姿勢で這って進む",o:[
        {c:"default",r:"匍匐前進。天井が目の前まで迫る恐怖は一生消えない。",hp:-3,mn:-12,inf:0}
      ]},
      {t:"壁の仕掛けを探す",o:[
        {c:"inf>25",r:"停止レバーを発見。天井が止まり余裕を持って通過。知識が命を救った。",hp:0,mn:-5,inf:5},
        {c:"default",r:"探す余裕はなかった。天井が迫りパニック状態で転がり出た。",hp:-12,mn:-10,inf:2}
      ]}
    ]},
  {id:"e047",fl:[4,5],tp:"encounter",
    sit:"石碑が並ぶ回廊。各石碑に名前と日付が刻まれている──迷宮で死んだ探索者の墓標だ。最新の日付はつい最近のものだ。奥の石碑に自分の名前が……いや、見間違いか？",
    ch:[
      {t:"自分の名前の石碑を確認する",o:[
        {c:"mn>50",r:"近づくと文字が変わった。精神攻撃だ。冷静に対処したが心臓が煩い。石碑の裏に隠し通路を発見。",hp:0,mn:-7,inf:14},
        {c:"default",r:"自分の名前と今日の日付が刻まれている。幻覚だと分かっていても足が動かない。しばらく立ち尽くした。",hp:0,mn:-13,inf:5,fl:"add:恐怖"}
      ]},
      {t:"石碑の情報を記録する",o:[
        {c:"default",r:"過去の探索者の到達階層や死因を記録。貴重なデータだが、自分もこうなるのかという思いが消えない。",hp:0,mn:-7,inf:14}
      ]},
      {t:"目を逸らして通り過ぎる",o:[
        {c:"default",r:"見ないふりをして駆け抜けた。だが最後の石碑に刻まれた日付が今日だったのは見えてしまった。",hp:0,mn:-9,inf:0}
      ]}
    ]},
  {id:"e048",fl:[4,5],tp:"rest",
    sit:"暖かい光が漏れる小部屋。中にはまだ温かい焚き火と、整えられた寝床。誰かがついさっきまでここにいたようだ。壁に「休め。だが長居はするな」と書かれている。",
    ch:[
      {t:"警戒しつつ休息を取る",o:[
        {c:"default",r:"焚き火の温もりが身に沁みる。束の間の安息。だが壁の文字が警告通り、30分後に部屋が暗くなり始めた。",hp:15,mn:16,inf:0,fl:"remove:負傷"}
      ]},
      {t:"部屋の痕跡を調べる",o:[
        {c:"default",r:"ここの主は定期的に安全地帯を作っている存在らしい。迷宮の「管理者」に関する情報を得た。焚き火で少し温まった。",hp:5,mn:3,inf:16}
      ]},
      {t:"焚き火で傷を焼いて処置する",o:[
        {c:"status:出血",r:"痛みに耐えながら傷口を焼いた。出血は止まった。壁に新たなメモを残して出発。",hp:-3,mn:-5,inf:0,fl:"remove:出血"},
        {c:"default",r:"大きな傷はないが、焚き火の温もりで心が少し軽くなった。",hp:8,mn:10,inf:0}
      ]}
    ]},

  // ═══ FLOOR 5 FINAL (4 events) ═══
  {id:"e030",fl:[5],tp:"encounter",
    sit:"迷宮の最奥。巨大な石扉の前に三つの鍵穴を持つ錠前。壁に「知恵」「勇気」「慈悲」の紋章。これが最後の試練だ。",
    ch:[
      {t:"蓄積した情報で錠前を解析する ── 知恵",o:[
        {c:"inf>38",r:"全ての知識が繋がった。扉が重々しく開く。光が差し込む。脱出だ。",hp:0,mn:13,inf:0,fl:"escape"},
        {c:"default",r:"情報が足りない。一部は開いたが完全な解錠に至らなかった。",hp:0,mn:-9,inf:5}
      ]},
      {t:"力ずくで扉を破壊する ── 勇気",o:[
        {c:"hp>45",r:"渾身の力で体当たり。蝶番が砕け扉が崩れた。肩の骨にヒビが入ったが、出口がある。",hp:-30,mn:16,inf:0,fl:"escape"},
        {c:"default",r:"力が足りない。扉はびくともせず、反動で肩を脱臼。",hp:-18,mn:-10,inf:0,fl:"add:負傷"}
      ]},
      {t:"扉に手を当て語りかける ── 慈悲",o:[
        {c:"mn>55",r:"精神を集中すると扉が共鳴し、ゆっくり自ら開いた。迷宮が帰還を認めた。",hp:0,mn:-14,inf:0,fl:"escape"},
        {c:"default",r:"対話は成立しなかった。扉は沈黙。精神だけが削られる。",hp:0,mn:-10,inf:3}
      ]}
    ]},
  {id:"e031",fl:[5],tp:"trap",
    sit:"最奥の間への通路。壁の両側から刃が周期的に飛び出す。古い血痕が無数に。ここを超えなければ。",
    ch:[
      {t:"刃のパターンを読んで駆け抜ける",o:[
        {c:"mn>45",r:"吸って、吐いて、走った。刃が腕を掠めたが致命傷は避けた。",hp:-10,mn:-8,inf:0},
        {c:"default",r:"集中が途切れ腹部を深く切られた。なんとか通路を抜けた。",hp:-22,mn:-9,inf:0,fl:"add:出血"}
      ]},
      {t:"慎重に一刃ずつ確認して進む",o:[
        {c:"default",r:"時間はかかったが確実に進んだ。精神的消耗が激しい。",hp:-5,mn:-10,inf:3}
      ]},
      {t:"刃の機構を壊しながら進む",o:[
        {c:"inf>30",r:"構造を理解し要所を壊しながら進んだ。安全に通過。",hp:-3,mn:-5,inf:5},
        {c:"default",r:"壊そうとして逆に活性化。乱射する刃の中を転がり抜けた。",hp:-20,mn:-7,inf:3,fl:"add:負傷"}
      ]}
    ]},
  {id:"e049",fl:[5],tp:"encounter",
    sit:"最終区画の手前。巨大な空洞の中央に、人型の光が浮かんでいる。迷宮の核──意思を持つ存在だ。「帰りたいか」と問いかけてくる。",
    ch:[
      {t:"「帰る。ここで得たものを持って」",o:[
        {c:"inf>35",r:"光が瞬いた。「その知識、持ち帰る価値がある」──道が開かれた。",hp:0,mn:-7,inf:0,fl:"escape"},
        {c:"default",r:"「まだ足りない」光が鋭く輝き、精神を抉られた。もう少し知識が必要だ。",hp:-5,mn:-12,inf:5}
      ]},
      {t:"「この迷宮の目的を教えろ」",o:[
        {c:"default",r:"「試練だ。お前たちの種が己を知るための」──凄まじい情報量が脳に流れ込んだ。頭が割れそうだ。",hp:-8,mn:-10,inf:25}
      ]},
      {t:"無言で横を通り過ぎる",o:[
        {c:"mn>50",r:"光は何も言わなかった。だが通り過ぎた後、身体が軽くなった気がする。認められたのかもしれない。",hp:5,mn:7,inf:0},
        {c:"default",r:"通り過ぎようとした瞬間、光が爆発的に膨張した。全身を焼かれるような痛みの後、気づくと通路の先にいた。",hp:-15,mn:-10,inf:0}
      ]}
    ]},
  {id:"e050",fl:[5],tp:"trap",
    sit:"最後の通路。床が透明で、下は底なしの虚空。通路の幅は一歩分。全長30メートル。風が吹き上げている。一歩でも踏み外せば──",
    ch:[
      {t:"恐怖を押し殺して一歩ずつ進む",o:[
        {c:"mn>45",r:"足が震える。だが一歩、また一歩。永遠に感じた30メートルを渡り切った。",hp:0,mn:-9,inf:0},
        {c:"default",r:"途中で足が竦んだ。風に煽られよろめき、膝をついて這って進んだ。精神が限界に近い。",hp:-5,mn:-12,inf:0}
      ]},
      {t:"走って一気に渡る",o:[
        {c:"hp>40",r:"考えるな。走れ。──渡り切った。膝から崩れ落ちたが、向こう側にいる。",hp:-8,mn:-5,inf:0},
        {c:"default",r:"走り出したが足が追いつかない。転倒しかけ、端にしがみついた。這い上がった時には全身が震えていた。",hp:-15,mn:-9,inf:0}
      ]},
      {t:"壁面の手がかりを探す",o:[
        {c:"inf>28",r:"壁に目立たない取っ手を発見。これを頼りに安全に渡れた。知識が恐怖に勝った。",hp:0,mn:-3,inf:3},
        {c:"default",r:"手がかりは見つからない。結局這って渡るしかなかった。虚空を見ないように。",hp:-3,mn:-10,inf:0}
      ]}
    ]},

  // ═══ ADDITIONAL EVENTS (18 new) ═══

  // ── F1: 初心者でも楽しめる探索・休息 ──
  {id:"e051",fl:[1],tp:"exploration",
    sit:"入口近くの壁に、前の探索者が炭で描いた簡易地図がある。荒いが現在位置と周辺の部屋配置が分かる。だが地図の端に「この先、右は嘘」と走り書き。",
    ch:[
      {t:"地図を丁寧に模写する",o:[
        {c:"default",r:"有用な情報を写し取った。地図があるだけで精神的な安心感がある。",hp:0,mn:7,inf:10}
      ]},
      {t:"地図を信じて右を避ける",o:[
        {c:"default",r:"右を避けたが、実は「嘘」とは右の通路にある罠のこと。重要な部屋を見逃した。",hp:0,mn:0,inf:3}
      ]},
      {t:"あえて右に進んでみる",o:[
        {c:"default",r:"罠があったが事前に身構えていたので最小限の被害。罠の先に隠し部屋を発見。",hp:-6,mn:0,inf:12}
      ]}
    ]},
  {id:"e052",fl:[1],tp:"rest",
    sit:"入口から近い小洞窟。外の光がわずかに差し込み、比較的安全そうだ。壁に苔が生え、空気は湿っているが悪くない。",
    ch:[
      {t:"安全を確認して休む",o:[
        {c:"default",r:"外光のおかげで精神的に楽だ。しっかり休息を取り、態勢を整えた。",hp:10,mn:10,inf:0}
      ]},
      {t:"苔を調べる",o:[
        {c:"default",r:"食用可能な苔だ。味は苦いが栄養になる。迷宮の植生に関する知識も得た。",hp:5,mn:0,inf:8}
      ]},
      {t:"洞窟の奥を探索する",o:[
        {c:"default",r:"奥に小さな祠があった。古い供え物と文字。迷宮の起源に関する手がかりだ。",hp:0,mn:3,inf:10}
      ]}
    ]},
  {id:"e053",fl:[1,2],tp:"encounter",
    sit:"通路に小さな光る虫が群れている。近づくと道を照らすように移動を始めた。案内しているのか、罠に誘っているのか。",
    ch:[
      {t:"虫についていく",o:[
        {c:"mn>40",r:"直感を信じた。虫は安全な道を案内してくれた。隠された小部屋に辿り着く。中に役立つ記録があった。",hp:0,mn:7,inf:10},
        {c:"default",r:"虫の群れは突然散り、暗闇に取り残された。壁に激突し額を切った。",hp:-8,mn:-8,inf:2}
      ]},
      {t:"虫を捕まえて調べる",o:[
        {c:"default",r:"迷宮に適応した発光生物だ。行動パターンから安全な道が推測できる。生態情報を記録した。",hp:0,mn:0,inf:9}
      ]},
      {t:"虫を無視して進む",o:[
        {c:"default",r:"虫の群れが一斉に消え、暗闇が増した。松明代わりにしたかった。",hp:0,mn:-5,inf:0}
      ]}
    ]},

  // ── F2-3: 中盤の探索・休息・リスクリワード ──
  {id:"e054",fl:[2,3],tp:"rest",
    sit:"以前の探索者が天井から滴る水を溜めた石桶がある。水は清潔そうだ。石桶の横に「ここは安全だ。急ぐな」と刻まれている。",
    ch:[
      {t:"水を飲んで十分に休む",o:[
        {c:"default",r:"冷たい水が染み渡る。身体も心も少し軽くなった。忠告に従って焦らず休息。",hp:12,mn:13,inf:0}
      ]},
      {t:"休みつつ周囲を観察する",o:[
        {c:"default",r:"石桶の底に文字が彫られていた。次の階層の罠の情報だ。水を飲みながらメモを取る。",hp:8,mn:7,inf:8}
      ]},
      {t:"水を持てるだけ持って先を急ぐ",o:[
        {c:"default",r:"水筒代わりに布を浸して持参。後で使えるだろう。休息は不十分だが時間を優先した。",hp:5,mn:2,inf:0}
      ]}
    ]},
  {id:"e055",fl:[2,3],tp:"exploration",
    sit:"壁に巨大な壁画。迷宮の全体構造を描いているようだが、一部が意図的に削り取られている。削られた跡は新しい。",
    ch:[
      {t:"残っている部分を詳細に記録する",o:[
        {c:"default",r:"全5層の概略構造が判明した。各層の罠の傾向も分かる。非常に有用な情報だ。",hp:0,mn:3,inf:16}
      ]},
      {t:"削られた部分を推測で補完する",o:[
        {c:"inf>20",r:"既存の知識と壁画の法則性から欠損部分を復元。完全な地図に近い情報を得た。",hp:0,mn:7,inf:20},
        {c:"default",r:"推測を試みたが確信が持てない。不確かな情報は危険でもある。",hp:0,mn:-3,inf:8}
      ]},
      {t:"誰が削ったのか痕跡を調べる",o:[
        {c:"default",r:"削った道具と足跡がある。迷宮を管理する何者かがいる。その存在自体が重要な情報だ。",hp:0,mn:-5,inf:12}
      ]}
    ]},
  {id:"e056",fl:[2,3],tp:"encounter",
    sit:"小部屋に古い機械仕掛けの箱。表面に三つのダイヤルと「正しき数を」の銘。間違えると罰が下るであろうことは想像に難くない。",
    ch:[
      {t:"これまでの情報からダイヤルを合わせる",o:[
        {c:"inf>22",r:"壁画や碑文の数字を思い出した。カチリと音がして箱が開く。中に精神を回復する香が入っていた。",hp:0,mn:16,inf:5},
        {c:"default",r:"当てずっぽうでダイヤルを回した。電撃が走り意識が一瞬飛んだ。",hp:-10,mn:-8,inf:3}
      ]},
      {t:"箱を力ずくで開ける",o:[
        {c:"hp>45",r:"叩き壊した。防衛機構が作動して手を焼いたが中身は回収できた。薬草の束だ。",hp:-8,mn:0,inf:0,fl:"remove:負傷"},
        {c:"default",r:"固すぎて壊せない。むしろ拳を痛めただけだ。",hp:-5,mn:-3,inf:0}
      ]},
      {t:"箱を調べるだけにする",o:[
        {c:"default",r:"機構の構造を記録した。どこかで同じ仕掛けに出会うかもしれない。",hp:0,mn:0,inf:8}
      ]}
    ]},
  {id:"e057",fl:[2,3,4],tp:"trap",
    sit:"通路の空気が急に冷え込んだ。吐く息が白い。壁に霜が張り、床が凍っている。奥の扉まで20メートル。転んだら止まれない──壁の棘に激突する。",
    ch:[
      {t:"壁に手をつきながらゆっくり進む",o:[
        {c:"default",r:"手が凍傷になりかけたが確実に進めた。壁の表面にうっすら文字が浮かんでいるのを発見。",hp:-5,mn:-3,inf:7}
      ]},
      {t:"靴底を削って滑り止めにする",o:[
        {c:"inf>15",r:"知恵が効いた。安定して歩行でき、余裕を持って通過。氷の中に保存された古文書も回収。",hp:0,mn:0,inf:12},
        {c:"default",r:"多少マシにはなったが途中で滑り尻餅。尾てい骨を強打したが棘は避けた。",hp:-8,mn:-5,inf:3}
      ]},
      {t:"勢いをつけて滑り抜ける",o:[
        {c:"default",r:"スケートのように滑走──制御できず壁に激突。棘は避けたが肩を強打。",hp:-12,mn:-3,inf:0}
      ]}
    ]},

  // ── F3-4: 中盤〜後半 ──
  {id:"e058",fl:[3,4],tp:"exploration",
    sit:"天井が高いドーム状の部屋。壁面に螺旋状の階段が彫られているが、実際に登れるのは途中まで。上部に碑文が見えるが読み取るには工夫が必要だ。",
    ch:[
      {t:"登れるところまで登って碑文を読む",o:[
        {c:"hp>35",r:"途中で足場が崩れかけたが踏ん張った。碑文には最深部の鍵に関する情報が。非常に貴重だ。",hp:-5,mn:3,inf:18},
        {c:"default",r:"足場が崩れ落下。幸い高さは2メートルほどだったが腰を打った。碑文は途中までしか読めなかった。",hp:-10,mn:-5,inf:8}
      ]},
      {t:"下から碑文の見える部分だけ記録する",o:[
        {c:"default",r:"距離があって不完全だが、いくつかの重要な単語を拾えた。安全を優先した判断だ。",hp:0,mn:0,inf:8}
      ]},
      {t:"階段の構造自体を分析する",o:[
        {c:"default",r:"迷宮建造時の技術が分かる。建築様式から設計者の意図を推測できた。",hp:0,mn:0,inf:10}
      ]}
    ]},
  {id:"e059",fl:[3,4],tp:"rest",
    sit:"温泉のような湯気が立ち上る小さな泉を発見。硫黄の匂いがする。湯は適温で、傷に効きそうだ。だが湯気で視界が悪く、周囲の警戒が難しい。",
    ch:[
      {t:"傷を湯で洗い休息する",o:[
        {c:"status:負傷",r:"温泉成分が傷を癒す。しばらく浸かっていると身体の芯から温まり、痛みが引いた。",hp:18,mn:13,inf:0,fl:"remove:負傷"},
        {c:"status:出血",r:"温水で血流が良くなりすぎるか心配だったが、むしろ止血に効いた。身体も温まる。",hp:12,mn:10,inf:0,fl:"remove:出血"},
        {c:"default",r:"身体に傷はないが、温泉の温かさは精神的に大きな慰め。しっかり休息が取れた。",hp:14,mn:16,inf:0}
      ]},
      {t:"湯気を利用して周囲を探索する",o:[
        {c:"default",r:"湯気の向こうに隠し通路を発見。温泉で温まりつつ情報も得た一石二鳥。",hp:8,mn:7,inf:10}
      ]},
      {t:"泉の成分を分析する",o:[
        {c:"default",r:"迷宮の地下構造に関する情報が得られた。鉱物組成から岩盤の弱い箇所が推測できる。",hp:3,mn:3,inf:14}
      ]}
    ]},
  {id:"e060",fl:[3,4],tp:"encounter",
    sit:"巨大な影が壁に映っている。だが影を落とす本体が見つからない。影は緩やかに動き、こちらに気づいている様子はない。影の足元に何かが落ちている。",
    ch:[
      {t:"影の足元のものを拾う",o:[
        {c:"mn>42",r:"精神を研ぎ澄ませ影に触れないよう拾い上げた。前の探索者の記録石だ。極めて有用。影は気づかなかった。",hp:0,mn:-5,inf:16},
        {c:"default",r:"影に手が触れた瞬間、全身が凍りついた。影に精気を吸われた。必死に逃げ出した。",hp:-10,mn:-9,inf:5}
      ]},
      {t:"影の正体を観察する",o:[
        {c:"default",r:"影は迷宮が作り出す「掃除者」──異物を排除する存在らしい。長く観察するほど不安が募る。",hp:0,mn:-8,inf:12}
      ]},
      {t:"影に話しかける",o:[
        {c:"inf>25",r:"知識を元に迷宮の言語で呼びかけた。影が一瞬止まり、道を空けた。通り抜けた先に安全地帯がある。",hp:0,mn:7,inf:5},
        {c:"default",r:"反応がない──と思った瞬間、影が急速にこちらに伸びた。走って逃げた。心臓が破裂しそうだ。",hp:-3,mn:-9,inf:3}
      ]}
    ]},
  {id:"e061",fl:[3,4,5],tp:"rest",
    sit:"壁にかすれた文字で「管理者の部屋」と。中は驚くほど整然としている。簡素な寝台、机、そして棚に並ぶ瓶。迷宮の管理者が定期的に使う部屋のようだ。",
    ch:[
      {t:"瓶の中身を確認する",o:[
        {c:"inf>20",r:"回復薬だ。成分を分析して最適なものを選んだ。身体と精神の両方が回復。さらに瓶のラベルから情報も得た。",hp:15,mn:13,inf:8},
        {c:"default",r:"一つを選んで飲んだ。苦いが効果はある。ただし種類を間違えたらしく軽い眩暈が残る。",hp:10,mn:3,inf:3}
      ]},
      {t:"机の上の記録を読む",o:[
        {c:"default",r:"管理者の日誌の断片。迷宮の運営に関する驚くべき記録。各階層の弱点が書かれていた。",hp:3,mn:7,inf:18}
      ]},
      {t:"寝台で休息する",o:[
        {c:"default",r:"迷宮で初めてまともな寝具で眠れた。短時間だが深い眠り。精神が大きく回復した。",hp:8,mn:21,inf:0,fl:"remove:恐怖"}
      ]}
    ]},

  // ── F4-5: 後半 ──
  {id:"e062",fl:[4,5],tp:"exploration",
    sit:"巨大な時計仕掛けが壁に埋め込まれている。針は不規則に動き、文字盤には数字の代わりに紋章が刻まれている。時計の裏側に小さな扉がある。",
    ch:[
      {t:"紋章の配置を分析する",o:[
        {c:"inf>30",r:"全ての紋章が迷宮の各区画に対応していると分かった。現在地と出口の関係が明確に。これは決定的な情報だ。",hp:0,mn:7,inf:20},
        {c:"default",r:"一部の紋章の意味を解読できた。不完全だが手がかりにはなる。",hp:0,mn:-3,inf:10}
      ]},
      {t:"時計の裏の扉を開ける",o:[
        {c:"default",r:"小さな保管庫。中に前の到達者が残した手記。最終層の詳細な攻略情報が──だが手記の最後は血で汚れていた。",hp:0,mn:-8,inf:16}
      ]},
      {t:"時計の針を特定の位置に合わせる",o:[
        {c:"inf>25",r:"碑文の情報を元に合わせた。壁の一部が開き、近道が現れた。",hp:0,mn:3,inf:0,fl:"shortcut"},
        {c:"default",r:"適当に合わせた。時計から高周波の音が鳴り響き耳が痛い。慌てて離れた。",hp:-3,mn:-7,inf:4}
      ]}
    ]},
  {id:"e063",fl:[4,5],tp:"encounter",
    sit:"広間に二体の石像が向かい合っている。一体は口を開き、一体は口を閉じている。開いた口の中が光っている。閉じた口の石像の手には巻物が握られている。",
    ch:[
      {t:"開いた口の中に手を入れる",o:[
        {c:"mn>48",r:"怖いが手を入れた。中に温かい石があった。触れると身体に活力が戻った。勇気の試練だったのだ。",hp:15,mn:10,inf:3},
        {c:"default",r:"手を入れた瞬間、口が閉じかけた。必死に引き抜いたが指を挟まれた。",hp:-10,mn:-7,inf:2}
      ]},
      {t:"巻物を取る",o:[
        {c:"default",r:"巻物を抜くと石像が震動した。急いで読む。最深部の試練に関する情報。石像が崩れ始め、落ちてきた腕で肩を打った。",hp:-8,mn:-3,inf:15}
      ]},
      {t:"両方の石像を観察だけする",o:[
        {c:"default",r:"石像の配置と紋様から迷宮の設計思想を理解した。直接的な報酬はないが深い理解を得た。",hp:0,mn:0,inf:10}
      ]}
    ]},
  {id:"e064",fl:[4,5],tp:"rest",
    sit:"天井から滝のように水が落ちている空間。水の裏側に小さな空洞がある。滝の轟音が外界の音を遮断し、不思議と安心感がある。",
    ch:[
      {t:"空洞に入って休息する",o:[
        {c:"default",r:"滝の音が全てをかき消す。迷宮の気配も、自分の恐怖も。深い安らぎを得て心身が回復した。",hp:12,mn:18,inf:0,fl:"remove:恐怖"}
      ]},
      {t:"滝の水で身体を清めて傷を洗う",o:[
        {c:"status:出血",r:"冷たい水が出血を止める。痛みに耐えながら傷口を丁寧に洗った。",hp:8,mn:7,inf:0,fl:"remove:出血"},
        {c:"status:呪い",r:"滝の水には浄化作用があった。呪いの紋様が薄れていく。",hp:5,mn:7,inf:0,fl:"remove:呪い"},
        {c:"default",r:"冷水で身を清めた。頭がすっきりする。混乱が晴れていく感覚。",hp:8,mn:13,inf:0,fl:"remove:混乱"}
      ]},
      {t:"滝の裏の壁を調べる",o:[
        {c:"default",r:"水で洗い流されずに残った刻印を発見。極めて古い情報だ。迷宮が作られた当初の記録かもしれない。",hp:3,mn:7,inf:14}
      ]}
    ]},

  // ── F5: 最終層追加 ──
  {id:"e065",fl:[5],tp:"encounter",
    sit:"最深部に近い回廊。突然、今まで通ってきた全ての層の光景が走馬灯のように壁に映し出された。そして声が聞こえた──「最後の問いだ。お前は何のためにここにいる」",
    ch:[
      {t:"「生きて帰るためだ」",o:[
        {c:"hp>35",r:"生存本能が最も強い答え。壁の映像が消え、真っ直ぐな通路が現れた。迷宮がその意志を認めた。",hp:0,mn:10,inf:5},
        {c:"default",r:"「その身体でか」と嘲笑された。映像が激しく明滅し、目を灼かれた。",hp:-8,mn:-7,inf:0}
      ]},
      {t:"「知識を得るためだ」",o:[
        {c:"inf>35",r:"積み上げた知識が光となって壁に映る。「十分だ」──通路が開かれた。",hp:0,mn:7,inf:8},
        {c:"default",r:"「まだ足りない」映像が圧倒的な情報量で脳に流れ込んだ。理解が追いつかない。",hp:-3,mn:-9,inf:10}
      ]},
      {t:"「分からない。だが止まれない」",o:[
        {c:"mn>42",r:"正直な答えに迷宮が沈黙した。長い静寂の後、道が静かに開いた。最も人間らしい答えだったのかもしれない。",hp:5,mn:7,inf:5},
        {c:"default",r:"「迷いがあるな」壁の映像が恐怖の記憶だけを選び出して再生した。精神を抉られる。",hp:0,mn:-10,inf:3}
      ]}
    ]},
  {id:"e066",fl:[5],tp:"exploration",
    sit:"最終層の一角に、透明な柱の中に浮かぶ金色の球体がある。球体は脈動し、迷宮全体の心臓のように見える。柱には亀裂が走り、触れれば壊せそうだ。",
    ch:[
      {t:"球体に触れて情報を読み取る",o:[
        {c:"inf>32",r:"蓄積した知識がフィルターとなり、球体の情報を安全に受け取れた。出口への最短ルートが脳に焼き付いた。",hp:0,mn:-5,inf:20},
        {c:"default",r:"情報が多すぎて処理しきれない。頭が割れそうな痛みの中、断片的な情報だけ得た。",hp:-5,mn:-9,inf:10}
      ]},
      {t:"柱を壊して球体を取り出す",o:[
        {c:"hp>40",r:"柱を砕いた。球体は手の中で溶けるように消えたが、その温かさが傷を癒した。迷宮の一部を取り込んだような感覚。",hp:12,mn:7,inf:8},
        {c:"default",r:"柱が砕けた衝撃で吹き飛ばされた。球体は霧散し、残ったのは痛みだけ。",hp:-14,mn:-8,inf:3}
      ]},
      {t:"球体を観察だけする",o:[
        {c:"default",r:"脈動のパターンから迷宮の構造が読み取れる。直接触れなくても十分な情報だ。安全に最大限の成果を得た。",hp:0,mn:3,inf:15}
      ]}
    ]},
  {id:"e067",fl:[5],tp:"rest",
    sit:"最終層の奥、不思議な空間。壁も天井も淡い光を放ち、暖かい風が吹いている。迷宮の最深部にこんな場所があるとは。石碑に「最後の休息処」と刻まれている。",
    ch:[
      {t:"全てを委ねて休む",o:[
        {c:"default",r:"不思議な安らぎ。全ての状態異常が和らぎ、心身が回復していく。最後の戦いに備えよ──石碑の文字が変わった。",hp:20,mn:18,inf:0,fl:"remove:負傷"}
      ]},
      {t:"休みながら石碑の全文を読む",o:[
        {c:"default",r:"設計者の遺言が刻まれていた。迷宮は「人間の限界を試す装置」として作られたものだ。全てを知った上で最後に挑む。",hp:10,mn:13,inf:15}
      ]},
      {t:"罠を警戒して短時間だけ休む",o:[
        {c:"default",r:"警戒は杞憂だった。だが短い休息でも確実に回復した。準備は万全に近い。",hp:10,mn:10,inf:0}
      ]}
    ]},

  // ═══ WAVE 3: 15 NEW EVENTS ═══

  {id:"e070",fl:[1],tp:"rest",
    sit:"入口付近の踊り場。壁に松明が一本残っていて、周囲を照らしている。ここなら少しは安心して休める。隅に革袋と水筒が転がっている。",
    ch:[
      {t:"水筒の水を飲んで休む",o:[
        {c:"default",r:"水はまだ清潔だった。喉を潤し、気力を取り戻す。松明の光が心を落ち着かせる。",hp:8,mn:10,inf:0}
      ]},
      {t:"革袋の中を調べる",o:[
        {c:"default",r:"前の探索者が残した簡易救急セットと走り書きのメモ。第一層の罠の位置が書いてある。",hp:5,mn:4,inf:10}
      ]},
      {t:"松明を持って先に進む",o:[
        {c:"default",r:"光源を確保。暗闇の恐怖がかなり軽減される。視界が広がり罠にも気づきやすくなった。",hp:0,mn:8,inf:5}
      ]}
    ]},
  {id:"e071",fl:[1],tp:"exploration",
    sit:"通路の床に、色の異なるタイルが一枚だけ埋め込まれている。踏んでも何も起きない。だがタイルの下に空洞がある音がする。",
    ch:[
      {t:"タイルを慎重に外す",o:[
        {c:"default",r:"下に小さな保管庫。先人が隠した情報片とハーブ。ハーブを噛むと気力が戻る。",hp:3,mn:7,inf:8}
      ]},
      {t:"周囲のタイルも調べる",o:[
        {c:"default",r:"他のタイルは全て本物。この一枚だけが特別──意図的に作られた隠し場所だ。パターンを学習した。",hp:0,mn:3,inf:10}
      ]},
      {t:"触れずに特徴だけ記録する",o:[
        {c:"default",r:"色と材質の違いを記憶した。今後、同じ手がかりが見つかるかもしれない。",hp:0,mn:0,inf:6}
      ]}
    ]},
  {id:"e072",fl:[1,2],tp:"encounter",
    sit:"通路の角で、壁に背をつけて座り込む若い探索者と出くわした。怪我はなさそうだが顔色が悪い。「……一人は心細くて。少しだけ一緒にいてくれないか」",
    ch:[
      {t:"しばらく話し相手になる",o:[
        {c:"default",r:"互いの情報を交換した。一人じゃないという安心感が精神を癒す。彼は別の道で見たことを教えてくれた。",hp:0,mn:10,inf:8}
      ]},
      {t:"情報だけ交換して別れる",o:[
        {c:"default",r:"効率的だが少し冷たかったか。だが互いに知らない情報を得られた。",hp:0,mn:3,inf:12}
      ]},
      {t:"警戒して距離を取る",o:[
        {c:"inf>12",r:"擬態ではなく本物の人間だと判断。だが深入りは避けた。彼の持つ地図の一部だけ見せてもらった。",hp:0,mn:0,inf:7},
        {c:"default",r:"偽物かもしれない。関わらずに去った。一人の孤独感が少し増した。",hp:0,mn:-5,inf:0}
      ]}
    ]},
  {id:"e073",fl:[2,3],tp:"exploration",
    sit:"壁に三枚の絵画が掛かっている。一枚目は美しい庭園、二枚目は嵐の海、三枚目は月夜の森。どれも異様にリアルで、触れると絵の中に吸い込まれそうだ。",
    ch:[
      {t:"庭園の絵に触れる",o:[
        {c:"default",r:"一瞬、花の香りに包まれた。幻影だが精神が大きく回復する。絵の隅に小さな文字で迷宮の情報が記されていた。",hp:3,mn:10,inf:6}
      ]},
      {t:"嵐の絵に触れる",o:[
        {c:"mn>35",r:"激しい波と風の幻影。だが嵐の中にパターンがある──迷宮の構造に通じる法則性を見出した。",hp:-3,mn:-3,inf:16},
        {c:"default",r:"嵐の恐怖に呑まれかけた。絵から手を離すと汗だくで膝が震えている。",hp:-3,mn:-6,inf:5}
      ]},
      {t:"絵を触らず裏側を確認する",o:[
        {c:"default",r:"三枚とも裏に数字が書かれていた。何かの組み合わせ──後で使えるかもしれない。",hp:0,mn:0,inf:10}
      ]}
    ]},
  {id:"e074",fl:[2,3],tp:"encounter",
    sit:"天井の穴から微かに光が差し込む部屋。光の中に植物が育っている。花、茸、苔──迷宮の中の小さなオアシスだ。蝶のような虫が舞っている。",
    ch:[
      {t:"花の香りを楽しみながら休息する",o:[
        {c:"default",r:"自然の生命力に触れると心が安らぐ。迷宮にもまだこんな場所がある。精神が大きく回復した。",hp:5,mn:12,inf:0}
      ]},
      {t:"茸と苔を調べる",o:[
        {c:"default",r:"薬効のある種がいくつか。食用可能なものを見分けて摂取。体力が回復し、植生の知識も得た。",hp:8,mn:4,inf:8}
      ]},
      {t:"蝶を追って周囲を探索する",o:[
        {c:"default",r:"蝶は壁の隠し通路に消えた。通路の入口に古い文字──この部屋の存在理由が分かった。迷宮設計者の慈悲だ。",hp:3,mn:7,inf:10}
      ]}
    ]},
  {id:"e075",fl:[2,3,4],tp:"trap",
    sit:"通路が突然下り坂に。滑りやすい床の先に暗い穴が口を開けている。穴の手前に鉄の棒が一本突き出ている。",
    ch:[
      {t:"鉄棒を掴んで穴を飛び越える",o:[
        {c:"hp>40",r:"鉄棒を支点にして跳躍。対岸に着地成功。腕の筋が張ったが大した怪我はない。",hp:-3,mn:0,inf:0},
        {c:"default",r:"鉄棒を掴んだが体力不足で振り切れず、穴の縁にしがみついた。這い上がるのに全力を使った。",hp:-10,mn:-5,inf:0}
      ]},
      {t:"穴の周囲を慎重に進む",o:[
        {c:"default",r:"壁沿いの細い足場を発見。時間はかかったが安全に通過。穴の中に光るものが見えたが取りに行く勇気はない。",hp:0,mn:-3,inf:3}
      ]},
      {t:"穴の深さを調べる",o:[
        {c:"default",r:"石を落とすと3秒後に着水音。約15メートル。穴の壁面に苔で文字が書かれていた。重要な情報だ。",hp:0,mn:0,inf:10}
      ]}
    ]},
  {id:"e076",fl:[3,4],tp:"encounter",
    sit:"小さな祠に、一本の蝋燭が灯っている。蝋燭の傍に三つの小瓶。赤、青、緑。台座に「一つだけ選べ。効果は飲まねば分からぬ」とある。",
    ch:[
      {t:"赤い瓶を飲む",o:[
        {c:"default",r:"血の味がした。身体に力が漲る。体力が大きく回復した。ただし軽い興奮状態が続く。",hp:18,mn:-3,inf:0}
      ]},
      {t:"青い瓶を飲む",o:[
        {c:"default",r:"凍えるような冷たさの後、頭が冴え渡った。精神が回復し、記憶が鮮明になる。",hp:-2,mn:14,inf:5}
      ]},
      {t:"緑の瓶を飲む",o:[
        {c:"default",r:"苦い薬草の味。身体の異常が浄化されていく感覚。傷や状態異常が緩和された。",hp:8,mn:7,inf:0,fl:"remove:混乱"}
      ]}
    ]},
  {id:"e077",fl:[3,4],tp:"exploration",
    sit:"円形の部屋の壁が回転している。壁面に文字が刻まれているが、回転しているので断片的にしか読めない。回転を止める機構がどこかにあるはずだ。",
    ch:[
      {t:"回転する文字を目で追って読む",o:[
        {c:"mn>38",r:"集中力を発揮。回転の中から文章を組み立てた。次の階層の核心に関する情報だ。目が疲れたが。",hp:0,mn:-5,inf:16},
        {c:"default",r:"目が回る。吐き気を覚えて中断。一部だけ読み取れた。",hp:-3,mn:-5,inf:7}
      ]},
      {t:"機構を探して壁を止める",o:[
        {c:"inf>20",r:"床のスイッチを発見。壁が停止し全文を楽に読めた。最深部の地図情報が手に入った。",hp:0,mn:3,inf:18},
        {c:"default",r:"スイッチを探したが見つからない。結局断片を記録するしかなかった。",hp:0,mn:-3,inf:8}
      ]},
      {t:"壁の回転速度のパターンを記録する",o:[
        {c:"default",r:"回転自体に意味がある。速度変化が暗号になっていた。解読すると有用な情報に。",hp:0,mn:0,inf:12}
      ]}
    ]},
  {id:"e078",fl:[3,4],tp:"rest",
    sit:"かつて誰かが作った地下菜園の跡。枯れた植物が多いが、一角にまだ生きている薬草が数本。水瓶には古いが飲める水が残っている。",
    ch:[
      {t:"薬草を採取して使う",o:[
        {c:"status:負傷",r:"薬草を傷に塗ると痛みが和らいだ。自然の力は偉大だ。",hp:12,mn:7,inf:3,fl:"remove:負傷"},
        {c:"status:出血",r:"止血効果のある草を見つけた。出血が止まり身体が楽になった。",hp:8,mn:7,inf:3,fl:"remove:出血"},
        {c:"default",r:"食用可能な薬草を食べた。苦いが身体に活力が戻る。",hp:10,mn:7,inf:3}
      ]},
      {t:"水を飲んで菜園で休む",o:[
        {c:"default",r:"生命の営みがある場所は安心する。束の間だが穏やかな時間を過ごした。",hp:7,mn:12,inf:0}
      ]},
      {t:"菜園の構造を調べる",o:[
        {c:"default",r:"水の供給路が迷宮の配管構造を示している。インフラ情報は貴重だ。少し休憩もした。",hp:3,mn:4,inf:12}
      ]}
    ]},
  {id:"e079",fl:[4,5],tp:"encounter",
    sit:"壁に大きな顔の彫刻がある。目が閉じている。近づくと目が開き、こちらを見た。「問いに答えよ。正解なら褒美を、不正解なら罰を」",
    ch:[
      {t:"問いを受ける",o:[
        {c:"inf>28",r:"「迷宮の層はいくつある」──蓄積した知識で即答した。彫刻の口から金色の液体が流れ出した。飲むと全身が温かくなる。",hp:10,mn:10,inf:5},
        {c:"default",r:"答えられなかった。彫刻の目から光線。精神を直接灼かれるような痛みに叫んだ。",hp:-5,mn:-8,inf:3}
      ]},
      {t:"問いを拒否する",o:[
        {c:"default",r:"「拒否も一つの答えだ」──彫刻は目を閉じた。何も起きない。安堵と共に通り過ぎた。",hp:0,mn:0,inf:0}
      ]},
      {t:"彫刻の構造を調べる",o:[
        {c:"default",r:"防衛装置の一種だ。仕組みを理解すれば危険はない。構造から迷宮の技術情報を得た。",hp:0,mn:0,inf:12}
      ]}
    ]},
  {id:"e080",fl:[4,5],tp:"exploration",
    sit:"通路の途中に、空間が歪んでいる箇所がある。向こう側の景色が揺らいで見える。手を入れると温かい。別の場所に繋がっているのかもしれない。",
    ch:[
      {t:"思い切って飛び込む",o:[
        {c:"mn>40",r:"一瞬の浮遊感の後、二階層先の通路に出た。大幅な近道だ。空間の歪みに関する貴重な体験情報も得た。",hp:0,mn:-5,inf:8,fl:"shortcut"},
        {c:"default",r:"飛び込んだが弾き返された。衝撃で全身が痛む。資格が足りなかったのか。",hp:-10,mn:-6,inf:3}
      ]},
      {t:"歪みの周囲を観察する",o:[
        {c:"default",r:"空間の境界に文字列が浮かんでいる。迷宮の空間構造に関する根本的な情報だ。これは大きい。",hp:0,mn:3,inf:16}
      ]},
      {t:"小石を投げ入れて様子を見る",o:[
        {c:"default",r:"石は消え──数秒後に背後から飛んできた。空間がループしている。この発見自体が有用な情報だ。",hp:0,mn:0,inf:9}
      ]}
    ]},
  {id:"e081",fl:[4,5],tp:"rest",
    sit:"天井から差す一筋の光の下に、自然に育った一本の木。迷宮の深部にありえない光景だが、木陰には穏やかな空気が流れている。幹に傷を癒す樹液が滲んでいる。",
    ch:[
      {t:"木陰で休息する",o:[
        {c:"default",r:"木の存在自体が癒しだ。恐怖が和らぎ、精神が大きく回復した。傷も樹液で手当できた。",hp:10,mn:15,inf:0,fl:"remove:恐怖"}
      ]},
      {t:"樹液を傷に塗る",o:[
        {c:"status:出血",r:"樹液が止血剤のように効いた。驚くべき治癒力。木に感謝して出発。",hp:12,mn:8,inf:0,fl:"remove:出血"},
        {c:"status:負傷",r:"樹液の効果で傷が塞がっていく。この木は迷宮の「免疫系」の一部かもしれない。",hp:14,mn:8,inf:5,fl:"remove:負傷"},
        {c:"default",r:"樹液を腕に塗ると温かくなった。小さな擦り傷が消えていく。精神的にも落ち着いた。",hp:8,mn:10,inf:3}
      ]},
      {t:"木の年輪と根を調べる",o:[
        {c:"default",r:"何百年も前からここにある。根は迷宮の深部まで伸びている。迷宮と共生する植物──生態系の核心情報だ。",hp:5,mn:7,inf:14}
      ]}
    ]},
  {id:"e082",fl:[5],tp:"exploration",
    sit:"最深部の回廊に、歴代の到達者の名前が光る文字で壁に刻まれている。数十の名前の中に、消えかけているものもある。壁の最下部に空白がある──自分の名前を刻む場所か。",
    ch:[
      {t:"名前を刻む",o:[
        {c:"default",r:"刻んだ瞬間、壁全体が脈動した。到達者として認識された。迷宮が道を示し始める──壁の紋様が変化し、出口への方角が分かるようになった。",hp:0,mn:8,inf:12}
      ]},
      {t:"消えかけの名前を調べる",o:[
        {c:"default",r:"「失敗者」の名前は消えるらしい。だが消えかけの文字の下に隠しメッセージ──最終試練の攻略ヒントだ。",hp:0,mn:0,inf:16}
      ]},
      {t:"名前の数と年代を記録する",o:[
        {c:"default",r:"到達者は過去百年で四十七人。生還者はそのうち十二人。生還者の共通点を分析した──全員が情報値を重視した探索者だ。",hp:0,mn:4,inf:14}
      ]}
    ]},
  {id:"e083",fl:[5],tp:"encounter",
    sit:"最終層の広間に、自分と同じ姿をした「影」が待っている。だが今度は第三層の影と違う。穏やかな表情で、手を差し出している。「ここまで来たのか。少し休め」",
    ch:[
      {t:"手を取って休息する",o:[
        {c:"mn>35",r:"影は自分自身の「理性」の投影らしい。触れると穏やかな安心感が全身を包んだ。精神が大きく回復する。",hp:5,mn:16,inf:0,fl:"remove:恐怖"},
        {c:"default",r:"手を取ったが、影が揺らいだ。精神が不安定だと維持できないようだ。少しだけ安らいだ。",hp:3,mn:7,inf:0}
      ]},
      {t:"影に迷宮の情報を聞く",o:[
        {c:"default",r:"影──自分自身の記憶の集積──が整理された形で情報を提示してくれた。蓄積した知識の再確認と新しい気づき。",hp:0,mn:7,inf:14}
      ]},
      {t:"影を無視して先に進む",o:[
        {c:"default",r:"影は悲しそうに微笑み消えた。少し胸が痛むが、立ち止まっている場合ではない。",hp:0,mn:-3,inf:0}
      ]}
    ]},
  {id:"e084",fl:[5],tp:"trap",
    sit:"最終層の狭い通路。壁から無数の細い管が突き出ており、先端から微かに蒸気が漏れている。周期的に噴出しているようだ。蒸気は高温──触れれば火傷する。",
    ch:[
      {t:"噴出のタイミングを読んで突破する",o:[
        {c:"mn>42",r:"呼吸を整え、パターンを読み切った。最小限の被害で通過。腕を少し焼いたが致命傷ではない。",hp:-5,mn:-3,inf:0},
        {c:"default",r:"タイミングを誤り蒸気を正面から浴びた。顔を庇ったが腕に酷い火傷。",hp:-14,mn:-6,inf:0,fl:"add:負傷"}
      ]},
      {t:"管の配置を分析して死角を見つける",o:[
        {c:"inf>30",r:"噴出しない管がある。それを辿るルートで完全に無傷で通過。知識の勝利だ。",hp:0,mn:3,inf:5},
        {c:"default",r:"分析に時間をかけすぎた。蒸気量が増え始め、やむなく突っ込んだ。",hp:-10,mn:-5,inf:3}
      ]},
      {t:"衣類を濡らして防御しながら進む",o:[
        {c:"default",r:"水筒の水で布を濡らし顔を覆った。被害は軽減できたが腕は焼けた。",hp:-7,mn:-2,inf:0}
      ]}
    ]},

  // ═══ STAT-REACTIVE EVENTS: outcomes vary greatly by current stats ═══

  {id:"e100",fl:[1,2],tp:"encounter",
    sit:"石段の踊り場に古びた自動販売機のような装置。三つのレバーにそれぞれ「赤」「青」「金」の宝石が嵌っている。装置の上部に液晶のような表示──数字がこちらの状態に反応して変化している。",
    ch:[
      {t:"赤のレバーを引く（体力に反応）",o:[
        {c:"hp>50",r:"装置が唸り、温かい液体が流れ出した。飲むと全身に力が漲る。健康な肉体にこそ効果がある薬のようだ。",hp:15,mn:5,inf:3},
        {c:"hp>30",r:"液体が出たが味が薄い。多少の回復効果はあるが、満身創痍では薬も十分に効かないらしい。",hp:6,mn:0,inf:3},
        {c:"default",r:"装置が警告音を発した。「対象の損傷が許容範囲を超過」──液体の代わりに電撃を浴びた。",hp:-8,mn:-5,inf:5}
      ]},
      {t:"青のレバーを引く（精神に反応）",o:[
        {c:"mn>40",r:"冷たい霧が噴出。吸い込むと頭が冴え渡る。精神が安定している者に知恵を授ける装置か。",hp:0,mn:10,inf:10},
        {c:"mn>25",r:"霧が出たが薄い。効果は限定的。精神が不安定だと装置も力を出せないようだ。",hp:0,mn:4,inf:6},
        {c:"default",r:"霧が黒く変色。吸い込んだ途端、幻覚が──精神が弱り切った者への罰か。",hp:-3,mn:-8,inf:3,fl:"add:混乱"}
      ]},
      {t:"金のレバーを引く（情報に反応）",o:[
        {c:"inf>25",r:"装置の全機能が解放された。迷宮の設計図の断片が表示に映し出される。知識がある者だけが読める暗号だ。",hp:5,mn:5,inf:18},
        {c:"inf>12",r:"一部の機能が解放。断片的だが有用な情報が表示された。",hp:0,mn:0,inf:10},
        {c:"default",r:"「認証失敗」──装置がロックされた。何も得られなかった。時間の無駄だ。",hp:0,mn:-5,inf:2}
      ]}
    ]},

  {id:"e101",fl:[2,3],tp:"encounter",
    sit:"行き止まりの壁に巨大な顔の浮き彫り。目が開き、声が響く。「お前の現在を申告せよ。正直なら通す。偽りなら罰する」──自分の状態を正確に把握しているか試されている。",
    ch:[
      {t:"「まだ余力がある」と答える",o:[
        {c:"hp>45",r:"「真実だ」壁が開いた。正直であると同時に、まだ戦える証明でもある。通路の先に回復の泉。",hp:10,mn:8,inf:5},
        {c:"default",r:"「偽りだ。お前は限界に近い」壁から衝撃波。嘘は見抜かれる。",hp:-12,mn:-5,inf:0}
      ]},
      {t:"「知識で道を切り開く」と答える",o:[
        {c:"inf>20",r:"「その自負に見合う知恵を持っている」壁が開き、情報の書庫への道が現れた。",hp:0,mn:5,inf:16},
        {c:"default",r:"「知識が足りぬ」壁が振動し天井から砂が降り注ぐ。視界が悪い中を逃げた。",hp:-5,mn:-6,inf:3}
      ]},
      {t:"「心は折れていない」と答える",o:[
        {c:"mn>35",r:"「確かにその目は生きている」壁が静かに開いた。奥に安全な休息所がある。",hp:5,mn:12,inf:3},
        {c:"default",r:"「その目は既に死んでいる」言葉が胸を刺す。精神的打撃が重い。",hp:0,mn:-8,inf:2}
      ]}
    ]},

  {id:"e102",fl:[2,3,4],tp:"trap",
    sit:"天井が低い通路。突然、前方の床が抜け落ち、3メートルの穴が現れた。穴の底に棘。向こう側まで跳ぶか、壁を伝うか、迂回路を見つけるか。身体の状態が判断を左右する。",
    ch:[
      {t:"全力で跳躍する",o:[
        {c:"hp>50",r:"助走をつけて大ジャンプ。余裕を持って対岸に着地。体力がある時こそ大胆に。",hp:-2,mn:3,inf:0},
        {c:"hp>30",r:"跳んだが距離がギリギリ。対岸の縁にしがみつき、腹を強打しながら這い上がった。",hp:-10,mn:-3,inf:0},
        {c:"default",r:"跳躍力が足りず穴に落ちた。棘は避けたが衝撃で足を痛めた。這い上がるのに精神力も消耗。",hp:-16,mn:-6,inf:0,fl:"add:負傷"}
      ]},
      {t:"壁の突起を使って横移動する",o:[
        {c:"mn>35",r:"冷静に手がかりを見極め、穴の横を安全に通過。途中で壁の文字も読めた。",hp:0,mn:-3,inf:8},
        {c:"default",r:"集中力が途切れ手を滑らせた。なんとか掴み直したが心臓が止まりそうだった。",hp:-5,mn:-8,inf:2}
      ]},
      {t:"周囲を調べて迂回路を探す",o:[
        {c:"inf>18",r:"以前の情報と照合。壁の一部が偽装──押すと迂回通路が開いた。知識の勝利。",hp:0,mn:0,inf:6},
        {c:"default",r:"迂回路は見つからず時間を浪費。結局壁を伝って渡るしかなかった。",hp:-5,mn:-5,inf:2}
      ]}
    ]},

  {id:"e103",fl:[3,4],tp:"encounter",
    sit:"石造りの診療所のような部屋。台の上に古い道具と薬瓶。壁に「治療は無償ではない」と。機械仕掛けの椅子が中央にあり、座ると診断が始まるようだ。",
    ch:[
      {t:"椅子に座って診断を受ける",o:[
        {c:"hp>40",r:"「軽傷。治療効率：高」──効率よく処置され、傷が癒えた。状態が良い時ほど治療も効く。",hp:12,mn:5,inf:0,fl:"remove:負傷"},
        {c:"hp>20",r:"「中度損傷。応急処置を実施」──最低限の治療。深い傷には対応しきれないが出血は止まった。",hp:5,mn:0,inf:0,fl:"remove:出血"},
        {c:"default",r:"「重篤。治療不可。代替措置：情報提供」──治せないほど消耗している。代わりに迷宮の医療情報が提供された。",hp:0,mn:3,inf:14}
      ]},
      {t:"薬瓶の中身を自分で調合する",o:[
        {c:"inf>25",r:"成分の知識から最適な配合を導いた。手製の万能薬──体力も精神も回復する。",hp:10,mn:10,inf:0},
        {c:"inf>15",r:"ある程度の調合はできたが完璧ではない。片方にしか効かない薬になった。",hp:8,mn:0,inf:3},
        {c:"default",r:"配合を間違え、飲んだ瞬間猛烈な腹痛。治療どころか症状が悪化した。",hp:-8,mn:-5,inf:5}
      ]},
      {t:"道具だけ持ち出す",o:[
        {c:"default",r:"包帯と消毒液を確保。今すぐは使わないが後で役に立つだろう。道具の情報も記録した。",hp:3,mn:0,inf:7}
      ]}
    ]},

  {id:"e104",fl:[3,4,5],tp:"exploration",
    sit:"巨大な砂時計が部屋の中央に。上の砂はまだ残っている。砂時計の横に三つの穴──手を入れると何かが得られるが、砂が落ちきる前に選ばなければならない。迷えば何も得られない。",
    ch:[
      {t:"左の穴（体力が必要）",o:[
        {c:"hp>45",r:"腕を突っ込むと何かに噛まれた──が、その奥に回復結晶。痛みに耐えて掴み取った。体力がなければ引き抜けなかった。",hp:8,mn:8,inf:5},
        {c:"default",r:"何かに噛まれ、体力不足で引き抜くのに手間取った。結晶は掴めず傷だけ増えた。",hp:-10,mn:-3,inf:2}
      ]},
      {t:"中央の穴（精神力が必要）",o:[
        {c:"mn>38",r:"手を入れると幻覚が流入。だが冷静に本物の感触を見分けた──情報の結晶だ。精神力があれば幻覚に惑わされない。",hp:0,mn:-5,inf:18},
        {c:"default",r:"幻覚に呑まれ混乱した。手を入れたまま動けなくなり、砂時計が落ちきった時にようやく我に返った。",hp:-3,mn:-8,inf:4,fl:"add:混乱"}
      ]},
      {t:"右の穴（情報が必要）",o:[
        {c:"inf>22",r:"穴の形状から中の構造を推測。安全な方法で中身を取り出した──純粋な回復薬だ。知識は最高の道具。",hp:12,mn:10,inf:0},
        {c:"default",r:"構造が分からず手探りで奥まで入れた。指先に刺さった棘の毒が手に回る。",hp:-8,mn:-5,inf:3}
      ]}
    ]},

  {id:"e105",fl:[1,2,3],tp:"encounter",
    sit:"壁の窪みに、三色に光る石が置かれている。赤は温かく、青は冷たく、金は振動している。一つだけ持ち出せる。現在の身体の状態が石の効果を左右するようだ。",
    ch:[
      {t:"赤い石を取る",o:[
        {c:"hp>50",r:"赤い石が強く輝いた。体力が充実している時、石は更に力を増す。全身に活力が漲り体力上限が僅かに上がった気さえする。",hp:12,mn:3,inf:0},
        {c:"hp>25",r:"石が淡く光った。多少は癒されたが、満身創痍では石の力も限定的だ。",hp:5,mn:0,inf:0},
        {c:"default",r:"石が黒ずんだ。体力が枯渇していると石は力を発揮できないどころか、残った生命力すら吸われた。",hp:-5,mn:0,inf:2}
      ]},
      {t:"青い石を取る",o:[
        {c:"mn>40",r:"石が深く澄んだ光を放つ。精神が安定している者に英知を与える。頭が冴え、迷宮の構造が直感的に理解できた。",hp:0,mn:8,inf:14},
        {c:"mn>20",r:"微かに光った。多少の安らぎはあるが、精神が揺らいでいると石も揺らぐ。",hp:0,mn:4,inf:5},
        {c:"default",r:"石が砕けた。精神が弱り切った者が触れると共鳴が起きず自壊するらしい。破片で手を切った。",hp:-3,mn:-5,inf:3}
      ]},
      {t:"金の石を取る",o:[
        {c:"inf>20",r:"石が回転し始め、情報の奔流が脳に流れ込んだ。知識がある者にこそ、更なる知識が与えられる。迷宮の法則だ。",hp:3,mn:3,inf:16},
        {c:"inf>10",r:"石が少し振動した。断片的な情報を得た。もっと知識があれば完全に読み取れたかもしれない。",hp:0,mn:0,inf:8},
        {c:"default",r:"石は反応しなかった。知識の基盤がなければ受け取りようがない。無駄足だった。",hp:0,mn:-3,inf:2}
      ]}
    ]},

  {id:"e106",fl:[4,5],tp:"encounter",
    sit:"大広間に天秤のような装置。左の皿に黒曜石、右の皿は空。壁に「己の最も優れたものを捧げよ。それに見合う報酬を得る」──自分の最大の長所は何だ？",
    ch:[
      {t:"体力を捧げる（血を皿に）",o:[
        {c:"hp>50",r:"皿に血を垂らすと天秤が大きく傾いた。「見事な生命力」──報酬として迷宮の地図と回復薬が出現。",hp:-10,mn:10,inf:15},
        {c:"hp>30",r:"血を垂らしたが天秤は小さく傾いただけ。「不十分だが認めよう」──少量の報酬。",hp:-8,mn:3,inf:6},
        {c:"default",r:"天秤が動かない。「その程度の体力では捧げ物にならぬ」──拒絶された。虚しい。",hp:-5,mn:-5,inf:0}
      ]},
      {t:"知恵を捧げる（得た情報を皿に語る）",o:[
        {c:"inf>30",r:"蓄えた知識を語ると天秤が大きく傾いた。「素晴らしい知の探求者」──全ステータスが回復する輝く水が報酬に。",hp:10,mn:10,inf:-10},
        {c:"inf>15",r:"語り終えたが天秤はやや傾いただけ。「もう少し深い知識を期待した」──限定的な報酬。",hp:3,mn:3,inf:-5},
        {c:"default",r:"「語るべき知識がないようだ」天秤は微動だにしない。恥辱感で精神が削られる。",hp:0,mn:-6,inf:0}
      ]},
      {t:"精神力を捧げる（恐怖を直視する）",o:[
        {c:"mn>45",r:"恐怖の幻影を真正面から見据えた。「強靭な精神」──天秤が傾き、全ての状態異常を浄化する光が降り注ぐ。",hp:5,mn:-8,inf:8,fl:"remove:呪い"},
        {c:"mn>25",r:"恐怖に立ち向かったが途中で目を逸らした。「まあまあだ」──小さな回復のみ。",hp:3,mn:-5,inf:3},
        {c:"default",r:"幻影を見た瞬間に叫んで逃げた。天秤が嘲笑うように揺れた。精神的打撃。",hp:0,mn:-8,inf:0,fl:"add:恐怖"}
      ]}
    ]},

  {id:"e107",fl:[2,3,4],tp:"exploration",
    sit:"壁一面に鍵穴。無数にある中で、光っているのは三つだけ。それぞれ異なる色──赤、青、黄。鍵はないが、手を差し込めば開くかもしれない。ただし、間違った穴に手を入れれば罠が作動する。",
    ch:[
      {t:"赤い鍵穴に手を入れる",o:[
        {c:"hp>45",r:"穴が熱い。だが体力があれば耐えられる。中から武具の欠片──防護の情報が焼き付けられていた。",hp:-5,mn:3,inf:12},
        {c:"default",r:"熱に耐えられず引き抜いた。手が水膨れだらけだ。",hp:-10,mn:-3,inf:3}
      ]},
      {t:"青い鍵穴に手を入れる",o:[
        {c:"mn>38",r:"精神への圧力が来た。だが心が安定していれば難なく耐えられる。中から記憶の結晶が。",hp:0,mn:-3,inf:15},
        {c:"default",r:"精神が脆い状態で圧を受け意識が飛んだ。目覚めると手ぶらだった。",hp:-3,mn:-8,inf:2}
      ]},
      {t:"黄色い鍵穴に手を入れる",o:[
        {c:"inf>20",r:"暗号パネルが中にある。知識があれば解読できる。正解。奥から万能薬が出てきた。",hp:8,mn:8,inf:5},
        {c:"default",r:"暗号を解けず、パネルが自爆。衝撃波で吹き飛ばされた。",hp:-8,mn:-5,inf:5}
      ]}
    ]},

  {id:"e108",fl:[3,4,5],tp:"encounter",
    sit:"小部屋に一体の人形が座っている。近づくと目が光り、語り始めた。「お前の弱点を教えてやろう。それを受け入れれば救ってやる。拒めば何も起きない」",
    ch:[
      {t:"弱点を聞く（HPが低いほど大きな恩恵）",o:[
        {c:"hp>50",r:"「お前は十分に強い。教えることはない」──何も起きなかった。強者には慈悲は不要らしい。",hp:0,mn:0,inf:3},
        {c:"hp>25",r:"「体が傷ついている。これを使え」──回復薬を渡された。弱さを認めた者への報酬。",hp:15,mn:5,inf:0},
        {c:"default",r:"「瀕死だな。全てを癒してやろう」──強い光に包まれ、傷が塞がっていく。弱いほど多くを受け取れる矛盾の法則。",hp:25,mn:10,inf:0,fl:"remove:負傷"}
      ]},
      {t:"弱点を拒否する",o:[
        {c:"mn>40",r:"「拒む精神力がある。見込みがある」人形が微笑み、小さな護符をくれた。精神の守りが増した。",hp:0,mn:8,inf:5},
        {c:"default",r:"「強がりだな」人形の目が消えた。何も得られなかったが、何も失わなかった。",hp:0,mn:0,inf:0}
      ]},
      {t:"人形の構造を調べる",o:[
        {c:"inf>22",r:"迷宮の自動修復システムの一部だ。構造から迷宮全体の運営メカニズムに関する重要情報を得た。",hp:0,mn:0,inf:16},
        {c:"default",r:"触った途端に人形が崩れた。壊してしまった罪悪感が残る。",hp:0,mn:-5,inf:5}
      ]}
    ]},

  {id:"e109",fl:[4,5],tp:"trap",
    sit:"通路の先に光の壁。通り抜けるしかないが、壁は通過者の状態を「査定」して通行料を取るらしい。壁の前に立つと身体が走査される感覚がある。",
    ch:[
      {t:"そのまま突っ込む",o:[
        {c:"hp>45",r:"光の壁が体力の一部を吸い取った。だが体力に余裕があったため最小限の代償で済んだ。壁の向こうの通路は安全。",hp:-8,mn:0,inf:3},
        {c:"hp>25",r:"体力が中程度だったため壁は精神も要求した。二重の代償。",hp:-5,mn:-5,inf:3},
        {c:"default",r:"瀕死の身体を査定した壁は全てを要求した。骨まで響く痛みと精神的衝撃。辛うじて通過。",hp:-12,mn:-8,inf:3}
      ]},
      {t:"精神を集中して壁を騙す",o:[
        {c:"mn>42",r:"精神力で壁の査定を欺いた。通行料ゼロで通過。壁が困惑して消滅した。",hp:0,mn:-5,inf:6},
        {c:"default",r:"欺けなかった。壁が怒り査定を厳しくした。激痛が走る。",hp:-10,mn:-6,inf:2}
      ]},
      {t:"壁の仕組みを分析してから通る",o:[
        {c:"inf>28",r:"査定のアルゴリズムを理解し、最小の代償で通る方法を導いた。知識の力。",hp:-2,mn:-1,inf:5},
        {c:"default",r:"分析に時間をかけすぎた。壁が強制吸引を開始。問答無用で通行料を搾り取られた。",hp:-8,mn:-5,inf:4}
      ]}
    ]},

  {id:"e110",fl:[1,2,3],tp:"rest",
    sit:"静かな小部屋。中央の焚き火跡はまだ温かい。壁に薬棚、床に寝袋。だが全てを使う時間はない。自分の今の状態に合わせて最も必要なものを選ぶべきだ。",
    ch:[
      {t:"寝袋で精神を休める",o:[
        {c:"mn>35",r:"安定した精神でぐっすり眠れた。短時間で十分に回復。精神が安定しているほど質の良い眠りが取れる。",hp:3,mn:12,inf:0},
        {c:"default",r:"横になったが悪夢にうなされた。精神が不安定だと休息すら安らぎにならない。",hp:3,mn:3,inf:0}
      ]},
      {t:"薬棚を物色する",o:[
        {c:"inf>15",r:"ラベルの知識がある。最適な薬を選んで服用。効果は絶大だ。",hp:12,mn:5,inf:0,fl:"remove:負傷"},
        {c:"default",r:"どれがどれか分からない。適当に一つ飲んだ。多少は効いた気がする。",hp:5,mn:2,inf:3}
      ]},
      {t:"焚き火跡を再利用して暖を取る",o:[
        {c:"hp>35",r:"残り火で効率よく暖まった。体力があれば薪を集めて火を起こし直すこともできた。身体も心も温まる。",hp:5,mn:8,inf:2},
        {c:"default",r:"薪を集める体力もない。残り火の温もりに手を翳した。僅かな慰め。",hp:2,mn:4,inf:0}
      ]}
    ]},

  {id:"e111",fl:[5],tp:"encounter",
    sit:"最終層の扉の前。守護者のような存在が立ちはだかる。巨大な影──しかし攻撃してくる気配はない。「最後の審判だ。お前の全てを量る」三つのステータスが光の柱として身体から立ち上る。",
    ch:[
      {t:"体力の柱を差し出す",o:[
        {c:"hp>50",r:"赤い柱が輝く。「見事な生命力。通ってよい」守護者が道を開けた。",hp:-15,mn:5,inf:0,fl:"escape"},
        {c:"hp>35",r:"赤い柱がやや暗い。「可もなく不可もなく。一つ試練を与える」追加の衝撃を受けたが通過。",hp:-20,mn:0,inf:0},
        {c:"default",r:"「体力不足。この柱では通行を認められない」衝撃波で弾き飛ばされた。",hp:-10,mn:-5,inf:0}
      ]},
      {t:"知恵の柱を差し出す",o:[
        {c:"inf>40",r:"金の柱が眩しく輝く。「真の知恵者よ。迷宮はお前を認める」守護者が消え、出口への道が開いた。",hp:0,mn:5,inf:-15,fl:"escape"},
        {c:"inf>25",r:"金の柱が揺れる。「惜しい。もう少し深い知識があれば」部分的に道が開いたが、通り抜ける際に精神を削られた。",hp:0,mn:-8,inf:0},
        {c:"default",r:"「知恵が足りない」金の柱が砕け散った。衝撃が全身を駆け巡る。",hp:-5,mn:-8,inf:0}
      ]},
      {t:"精神の柱を差し出す",o:[
        {c:"mn>48",r:"青い柱が天に届く。「折れぬ心。それが最も尊い」守護者が深く頷き、消えた。出口が目の前に。",hp:5,mn:-18,inf:0,fl:"escape"},
        {c:"mn>30",r:"青い柱が点滅する。「不安定だがまだ折れていない。通ることを許す」──辛うじて通過。代償は重い。",hp:0,mn:-15,inf:0},
        {c:"default",r:"「精神は既に折れかけている」青い柱が消え、冷たい風が全身を吹き抜けた。",hp:0,mn:-8,inf:0,fl:"add:恐怖"}
      ]}
    ]},

  // ═══ STAT-REACTIVE EVENTS WAVE 2 ═══

  {id:"e120",fl:[1,2],tp:"trap",
    sit:"通路の中央に宝箱。明らかに怪しいが中身が気になる。鍵はかかっておらず蓋は軽い。罠があるとしたら、開けた後か。",
    ch:[
      {t:"全力で蓋を開けて飛び退く",o:[
        {c:"hp>45",r:"蓋を弾き開け即座に後退。案の定、針が飛んだが余裕で回避。中に回復薬と地図の断片。体力に余裕があると大胆に動ける。",hp:8,mn:5,inf:8},
        {c:"hp>25",r:"開けて退いたが反応が遅れ、針が肩を掠めた。中身は回収できたが手痛い代償。",hp:-5,mn:0,inf:6},
        {c:"default",r:"開けた瞬間に針が刺さった。身体が重くて避けられない。中身を取る余裕もなく逃げた。",hp:-10,mn:-5,inf:0,fl:"add:負傷"}
      ]},
      {t:"罠を先に解除してから開ける",o:[
        {c:"inf>15",r:"箱の構造から罠の位置を推測。見事に解除し安全に中身を回収。包帯と古い鍵。",hp:3,mn:3,inf:8},
        {c:"default",r:"解除しようとしたが構造を読み間違え、逆に罠を起動。毒ガスを浴びた。",hp:-8,mn:-6,inf:3}
      ]},
      {t:"箱を蹴り倒して距離を取る",o:[
        {c:"default",r:"蹴った衝撃で罠が作動したが離れていて無傷。箱は壊れ中身が散乱。一部だけ回収できた。",hp:0,mn:0,inf:4}
      ]}
    ]},

  {id:"e121",fl:[2,3],tp:"encounter",
    sit:"石の水盤に透明な液体。水盤の縁に三つの杯──銀、銅、木。壁の碑文は「器が飲み手を選ぶ」。液体の効果は杯によって変わるらしい。",
    ch:[
      {t:"銀の杯で飲む（精神力で効果が変化）",o:[
        {c:"mn>35",r:"杯が青白く輝いた。液体が清涼な風のように精神を浄化する。澄んだ心に最大の恩恵。",hp:3,mn:14,inf:5,fl:"remove:混乱"},
        {c:"mn>20",r:"杯が鈍く光った。効果はあるが限定的。心がざわついていると薬も薄まるようだ。",hp:0,mn:6,inf:2},
        {c:"default",r:"杯が黒ずんだ。液体が苦くなり吐き出した。精神が乱れた者には毒になる。",hp:-3,mn:-5,inf:2}
      ]},
      {t:"銅の杯で飲む（体力で効果が変化）",o:[
        {c:"hp>40",r:"杯が赤銅色に輝き、液体が温かくなった。体力が漲り傷が塞がっていく。健全な肉体をさらに強くする。",hp:14,mn:3,inf:0,fl:"remove:負傷"},
        {c:"hp>20",r:"杯が微かに光る。体の傷が少し癒えたが、弱った身体では効果が薄い。",hp:5,mn:0,inf:0},
        {c:"default",r:"杯が錆びたように見えた。液体は酸っぱく、胃が痛む。衰弱した身体が拒絶した。",hp:-3,mn:-3,inf:2}
      ]},
      {t:"木の杯で飲む（情報値で効果が変化）",o:[
        {c:"inf>25",r:"杯に文字が浮かび上がった。液体が知識の媒体に変化──飲むと膨大な情報が穏やかに脳に流れ込んだ。",hp:3,mn:3,inf:18},
        {c:"inf>12",r:"杯に断片的な文字が見える。液体から一部の情報を読み取れた。",hp:0,mn:0,inf:9},
        {c:"default",r:"杯に何も起きなかった。液体はただの水と変わらない味。知識がなければ器も応えない。",hp:0,mn:0,inf:2}
      ]}
    ]},

  {id:"e122",fl:[2,3,4],tp:"exploration",
    sit:"壁に巨大な迷路図が描かれている。指で辿ると正しい道を示すらしい。だが迷路は三層構造で、体力・精神・知識のどれかで攻略法が変わる。",
    ch:[
      {t:"力任せに壁を押して近道を探す",o:[
        {c:"hp>45",r:"壁の弱い箇所を拳で叩き割った。最短ルートの情報が壁面に刻まれていた。体力があれば知恵も不要。",hp:-5,mn:5,inf:14},
        {c:"hp>25",r:"叩いたが壁は頑丈だった。拳を痛めただけ。結局一部だけ辿って情報を得た。",hp:-6,mn:0,inf:6},
        {c:"default",r:"叩く力すらない。壁に額をつけて項垂れた。何も得られなかった。",hp:-3,mn:-5,inf:0}
      ]},
      {t:"精神を集中して迷路を俯瞰する",o:[
        {c:"mn>35",r:"精神を研ぎ澄ませると迷路全体のパターンが見えた。ゴールから逆算し全ルートを把握。頭の中に地図ができた。",hp:0,mn:-5,inf:16},
        {c:"default",r:"集中しようとしたが雑念が邪魔をする。途中で迷い精神を消耗した。",hp:0,mn:-6,inf:5}
      ]},
      {t:"既知の情報と照合して解読する",o:[
        {c:"inf>22",r:"以前の壁画や碑文の情報と迷路図が繋がった。迷宮全体のマッピングがほぼ完成。これは決定的だ。",hp:0,mn:5,inf:20},
        {c:"default",r:"照合しようにも元の情報が少ない。推測で一部を読み取った。",hp:0,mn:-2,inf:7}
      ]}
    ]},

  {id:"e123",fl:[3,4],tp:"encounter",
    sit:"扉の前に番人の骸骨が座っている。骸骨の手に錆びた秤。近づくと骸骨の顎が動いた。「通りたくば、己の最も弱い部分を秤に載せよ」",
    ch:[
      {t:"「体が弱い」と認める",o:[
        {c:"hp>40",r:"骸骨が嗤った。「嘘だ。お前の体は十分に強い」──嘘を見破られ衝撃波。正直でなければならない。",hp:-8,mn:-5,inf:0},
        {c:"default",r:"骸骨が頷いた。「正直者だ。ならば体を癒してやろう」温かい光に包まれ、傷が癒える。弱さを認めた者への慈悲。",hp:15,mn:5,inf:3,fl:"remove:負傷"}
      ]},
      {t:"「心が弱い」と認める",o:[
        {c:"mn>35",r:"骸骨が首を振った。「お前の精神は折れていない」──虚偽の申告。罰として精神攻撃を受けた。",hp:0,mn:-8,inf:0},
        {c:"default",r:"骸骨が同意した。「その通りだ」精神を包む温かい光。恐怖が薄れ安堵が満ちる。正直は美徳。",hp:3,mn:14,inf:3,fl:"remove:恐怖"}
      ]},
      {t:"「知恵が足りない」と認める",o:[
        {c:"inf>20",r:"骸骨が怒った。「十分な知恵があるだろう」嘘つきへの罰は厳しい。",hp:-5,mn:-5,inf:-5},
        {c:"default",r:"骸骨が微笑んだ。「素直な者だ。知恵を授けよう」情報が流れ込む。謙虚さが報われた。",hp:0,mn:3,inf:16}
      ]}
    ]},

  {id:"e124",fl:[3,4,5],tp:"trap",
    sit:"通路が三方向に分かれている。左は赤い光、中央は青い光、右は黄色い光が奥から漏れている。壁に「己を知る者だけが正しい道を選ぶ」。",
    ch:[
      {t:"赤い光の道（体力の試練）",o:[
        {c:"hp>45",r:"溶岩のように熱い通路。だが体力があれば耐えられる。走り抜けた先に安全地帯と補給品。",hp:-8,mn:5,inf:5},
        {c:"hp>25",r:"熱さに耐えながら通過。火傷を負ったが生きている。選択は間違っていなかった──ギリギリだが。",hp:-12,mn:-3,inf:3},
        {c:"default",r:"体力不足で途中で倒れかけた。這って戻り別の道へ。時間と体力を無駄にした。",hp:-10,mn:-5,inf:0}
      ]},
      {t:"青い光の道（精神の試練）",o:[
        {c:"mn>35",r:"恐怖の幻覚が押し寄せる通路。だが精神が安定していれば幻と見抜ける。通過後、心が研ぎ澄まされていた。",hp:0,mn:-5,inf:8},
        {c:"mn>20",r:"幻覚に何度か呑まれかけたが、なんとか通過。精神は削られたが情報を得た。",hp:-3,mn:-8,inf:5},
        {c:"default",r:"幻覚と現実の区別がつかなくなった。気づくと入口に戻されていた。精神が大きく削られた。",hp:-3,mn:-10,inf:0,fl:"add:混乱"}
      ]},
      {t:"黄色い光の道（知識の試練）",o:[
        {c:"inf>25",r:"壁面に暗号が刻まれた通路。知識で解読しながら進むと安全に通過。暗号自体が貴重な情報源。",hp:0,mn:3,inf:14},
        {c:"inf>12",r:"暗号の一部を解読できた。不完全だが通過はできた。",hp:-3,mn:-3,inf:8},
        {c:"default",r:"暗号が全く読めず壁からの攻撃を避けられなかった。知識不足の代償は痛い。",hp:-8,mn:-5,inf:3}
      ]}
    ]},

  {id:"e125",fl:[4,5],tp:"encounter",
    sit:"球形の部屋。重力が不安定で身体が浮きかける。中央に三つの結晶──赤・青・金──が浮遊している。触れると結晶は消え、効果を発揮する。だが結晶は持ち主の状態を映す鏡でもある。",
    ch:[
      {t:"赤い結晶に触れる",o:[
        {c:"hp>45",r:"結晶が眩く輝いた。体力の充実が結晶を共鳴させた。全身に治癒のエネルギーが流れ込む。",hp:15,mn:5,inf:3},
        {c:"hp>25",r:"結晶が淡く光った。不完全な共鳴だが、ある程度の回復効果があった。",hp:6,mn:0,inf:2},
        {c:"default",r:"結晶が黒く染まり砕けた。弱りきった肉体は結晶の力を受け止められない。破片が手に突き刺さった。",hp:-5,mn:-3,inf:3}
      ]},
      {t:"青い結晶に触れる",o:[
        {c:"mn>38",r:"結晶が深い藍色に輝いた。安定した精神が結晶と共振し、知覚が研ぎ澄まされる。迷宮の構造が直感で分かるようになった。",hp:3,mn:8,inf:12},
        {c:"mn>20",r:"結晶が弱く明滅。不安定な共鳴だが、一時的に精神が安らいだ。",hp:0,mn:5,inf:4},
        {c:"default",r:"結晶が割れ、冷気が噴出。精神が弱い者に触れられると自壊する安全装置らしい。凍傷を負った。",hp:-5,mn:-5,inf:3}
      ]},
      {t:"金の結晶に触れる",o:[
        {c:"inf>30",r:"結晶が回転し情報を投射し始めた。蓄えた知識と結晶が同調し、迷宮の秘密が次々と解き明かされる。",hp:5,mn:5,inf:18},
        {c:"inf>15",r:"結晶が微かに振動。一部の情報が読み取れた。もっと知識があれば完全に同調できたのに。",hp:0,mn:0,inf:8},
        {c:"default",r:"結晶は沈黙したまま。知識の基盤がなく共鳴に至らない。何事もなく通り過ぎた。",hp:0,mn:-2,inf:2}
      ]}
    ]},

  {id:"e126",fl:[1,2,3],tp:"encounter",
    sit:"小部屋の壁に老人の肖像画。絵の口が動いた。「旅人よ、一つ忠告をしてやろう。だが忠告の質はお前の学び次第だ」",
    ch:[
      {t:"忠告を聞く",o:[
        {c:"inf>20",r:"「お前の知識なら分かるだろう──この先の三つ目の分岐は左が正解だ。そして第四層の泉は毒ではない」具体的で極めて有用な助言。",hp:0,mn:5,inf:16},
        {c:"inf>10",r:"「先に罠があるから気をつけろ」──漠然とした忠告だが無いよりマシだ。知識がもっとあれば詳しく聞けたのに。",hp:0,mn:3,inf:8},
        {c:"default",r:"「お前に教えることは……何もないな。まず目の前のことに集中しろ」素っ気ない忠告。それすら助かるのだが。",hp:0,mn:0,inf:3}
      ]},
      {t:"肖像画の正体を問う",o:[
        {c:"mn>30",r:"「良い質問だ。私はこの迷宮の初代管理者だ」──設計者の意図と迷宮の目的について語り始めた。",hp:0,mn:-3,inf:14},
        {c:"default",r:"「お前にはまだ早い」肖像画の口が閉じた。質問するだけの精神的余裕がなかったということか。",hp:0,mn:-5,inf:2}
      ]},
      {t:"無視して進む",o:[
        {c:"default",r:"「愚か者め」背後で老人の声。振り返ると普通の絵に戻っていた。もったいないことをしたかもしれない。",hp:0,mn:-3,inf:0}
      ]}
    ]},

  {id:"e127",fl:[3,4,5],tp:"rest",
    sit:"壁際に古い噴水。水は枯れているが、三つの蛇口のうち一つだけ微かに水滴が落ちている。蛇口の上にそれぞれ「身」「心」「知」と刻まれている。",
    ch:[
      {t:"「身」の蛇口を捻る",o:[
        {c:"hp>35",r:"温かい水が溢れ出した。体力が充実していると水も豊かに出る仕組みか。傷が癒え、体力も回復。",hp:14,mn:3,inf:0,fl:"remove:出血"},
        {c:"default",r:"チョロチョロと冷たい水。飲めるが回復は最小限。蛇口が体力に反応しているようだ。",hp:4,mn:0,inf:2}
      ]},
      {t:"「心」の蛇口を捻る",o:[
        {c:"mn>30",r:"澄んだ清水が勢いよく。精神が安定している者に安らぎを与える泉。恐怖も混乱も洗い流される。",hp:3,mn:14,inf:0,fl:"remove:恐怖"},
        {c:"default",r:"濁った水がポタポタと。飲むと少し気持ちが落ち着く程度。心が乱れていると水も濁るのか。",hp:0,mn:4,inf:2}
      ]},
      {t:"「知」の蛇口を捻る",o:[
        {c:"inf>20",r:"金色の液体が流れ出した。飲むと頭が冴え渡り、知識が整理される感覚。蓄積した情報が有機的に繋がった。",hp:3,mn:5,inf:14},
        {c:"default",r:"透明な水が少量。飲むと少し頭がすっきりした。だが大した効果はない。",hp:0,mn:2,inf:4}
      ]}
    ]},

  {id:"e128",fl:[4,5],tp:"exploration",
    sit:"通路の行き止まりに三つの扉。それぞれ鍵がかかっている。左の扉は蹴破れそうだが音が出る。中央は繊細な錠前で知識が要る。右の扉は鍵穴に手を入れると精神に干渉してくる。",
    ch:[
      {t:"左の扉を蹴破る",o:[
        {c:"hp>40",r:"一撃で蹴破った。轟音で何かを呼んだが、扉の先の情報を素早く回収して逃げ切れた。体力がものを言う。",hp:-5,mn:-3,inf:14},
        {c:"default",r:"蹴ったが壊れない。何度も蹴って轟音が響き渡った。扉は開いたが何かが来る足音。慌てて中身を一部だけ回収。",hp:-10,mn:-6,inf:5}
      ]},
      {t:"中央の錠前を解除する",o:[
        {c:"inf>28",r:"錠前の仕組みを知識で推理。静かに解錠。中は小さな書庫。騒音を立てず最高の収穫を得た。",hp:0,mn:5,inf:18},
        {c:"inf>15",r:"半分まで解除したが最後のピンが合わない。無理に回したら折れた。中身の一部だけ指で引き出した。",hp:-2,mn:-3,inf:8},
        {c:"default",r:"錠前の仕組みが全く分からない。ピックを折り、指を挟んだだけだった。",hp:-5,mn:-3,inf:0}
      ]},
      {t:"右の扉に手を入れる",o:[
        {c:"mn>40",r:"精神干渉を受けたが動じなかった。鍵穴が手を認識し扉が開く。安定した心の持ち主だけが通れる仕掛け。中に瞑想の間。",hp:5,mn:8,inf:10},
        {c:"mn>25",r:"干渉に耐えて扉は開いたが精神的消耗が大きい。部屋で少し休めた。",hp:3,mn:-5,inf:5},
        {c:"default",r:"干渉が幻覚に変わった。手を引き抜いた時には泣いていた。何を見たのか覚えていない。",hp:0,mn:-8,inf:2,fl:"add:恐怖"}
      ]}
    ]},

  {id:"e129",fl:[5],tp:"encounter",
    sit:"最終層の控え室のような空間。壁に鏡が三面。それぞれが異なる「もしも」の自分を映している。「体力に優れた自分」「精神が強い自分」「知恵深い自分」──一つを選べば一時的にその力を得る。",
    ch:[
      {t:"体力の自分を選ぶ",o:[
        {c:"hp>40",r:"鏡の中の自分と重なった。既に体力が充実していたため共鳴が強い。活力が爆発的に増幅された。",hp:18,mn:3,inf:0},
        {c:"default",r:"鏡の中の力強い自分と重なった。弱っていた体に力が注がれる。体力が低いほど落差が大きい。",hp:12,mn:0,inf:0,fl:"remove:負傷"}
      ]},
      {t:"精神の自分を選ぶ",o:[
        {c:"mn>35",r:"鏡の中の穏やかな自分と重なった。精神が共鳴し増幅。澄み切った心で最後の試練に臨める。",hp:0,mn:15,inf:3,fl:"remove:恐怖"},
        {c:"default",r:"鏡の中の自分に癒された。乱れた心が整えられる。弱い時ほど鏡は優しい。",hp:0,mn:10,inf:0,fl:"remove:混乱"}
      ]},
      {t:"知恵の自分を選ぶ",o:[
        {c:"inf>30",r:"鏡の中の知恵深い自分が全ての知識を整理し直してくれた。情報が昇華され、迷宮の全体像が完成する。",hp:3,mn:5,inf:15},
        {c:"default",r:"鏡の中の自分から基本的な情報を受け取った。知識が少なくても最低限の知恵は授けてくれる。",hp:0,mn:3,inf:10}
      ]}
    ]},

  // ═══ CHAIN EVENTS: 迷子の少女 (floors 2-3, 3-part) ═══
  {id:"e130",fl:[2,3],tp:"encounter",
    sit:"暗がりにうずくまる小さな人影。近づくと幼い少女──いや、少女の姿をした「何か」がこちらを見ている。瞳が異様に大きい。",
    ch:[
      {t:"声をかける",o:[
        {c:"inf>20",r:"瞳の異常に気づきつつも、穏やかに話しかけた。「…道を、教えて」と少女が囁く。手を取ると氷のように冷たい。",hp:0,mn:-5,inf:5,fl:"chain:e131"},
        {c:"default",r:"「助けて」と少女が手を伸ばす。反射的に掴むと、指先から冷気が走る。離せない。何かが始まった。",hp:-5,mn:-8,inf:3,fl:"chain:e131"}
      ]},
      {t:"警戒して距離を取る",o:[
        {c:"default",r:"少女がゆっくり立ち上がった。「…行かないで」その声が頭の中で反響する。立ち去ったが、背後に気配を感じ続ける。",hp:0,mn:-10,inf:4}
      ]},
      {t:"正体を見極める",o:[
        {c:"inf>25",r:"少女の足が地面に触れていないことに気づいた。迷宮が生み出した幻影だ。知識があれば惑わされない。",hp:0,mn:3,inf:10},
        {c:"default",r:"凝視した瞬間、少女の顔が歪んだ。絶叫が脳を貫く。幻影だが、精神へのダメージは本物だ。",hp:0,mn:-15,inf:6}
      ]}
    ]},
  {id:"e131",fl:[2,3],tp:"encounter",chainOnly:true,
    sit:"少女に導かれ、隠し通路に入った。壁には子供の手で描かれた矢印。少女は「もう少し…」と繰り返す。この先に何があるのか。",
    ch:[
      {t:"少女を信じて進む",o:[
        {c:"mn>30",r:"精神力で恐怖を抑え、少女について行く。通路の先に小部屋──壁一面に迷宮の地図が。少女が微笑む。",hp:0,mn:-8,inf:15,fl:"chain:e132"},
        {c:"default",r:"不安に耐えきれず足が止まった。少女が振り返る。「…怖いの？」その問いかけ自体が精神を蝕む。",hp:0,mn:-12,inf:5,fl:"chain:e132"}
      ]},
      {t:"少女に質問する",o:[
        {c:"inf>18",r:"「ここで何をしていたの？」少女の表情が曇る。「…忘れた。でも、大事なものがこの先にある」有用な情報だ。",hp:0,mn:-5,inf:10,fl:"chain:e132"},
        {c:"default",r:"少女は質問には答えず、ただ手を引く。逆らえない力。意志を保つのが精一杯だ。",hp:0,mn:-10,inf:3,fl:"chain:e132"}
      ]},
      {t:"引き返す",o:[
        {c:"default",r:"少女の手を振り払い、来た道を戻る。「…みんな、そうやって帰っていく」悲しげな声が耳に残る。",hp:0,mn:-8,inf:2}
      ]}
    ]},
  {id:"e132",fl:[2,3],tp:"encounter",chainOnly:true,
    sit:"小部屋の中央に古い人形。少女がそれを抱きしめると、姿が半透明になっていく。「これが私の…」迷宮に囚われた魂の残留思念だった。",
    ch:[
      {t:"少女を成仏させる",o:[
        {c:"mn>25",r:"「もう大丈夫だよ」と語りかけた。少女が微笑み、光の粒子になって消えた。温かい感覚が全身を包む。壁の地図が完全に読み取れる。",hp:10,mn:10,inf:18},
        {c:"default",r:"言葉が見つからない。少女は寂しそうに消えていった。部屋に残された地図からは、断片的な情報しか読み取れなかった。",hp:5,mn:5,inf:8}
      ]},
      {t:"人形を調べる",o:[
        {c:"inf>22",r:"人形には迷宮の核心に関する文字が刻まれていた。少女が消えた後、人形が砕け、中から小さな鍵が現れた。",hp:0,mn:-5,inf:20},
        {c:"default",r:"人形に触れた瞬間、冷気が腕を駆け上がる。少女の記憶の断片が流れ込む──苦痛の記憶だ。",hp:-8,mn:-12,inf:10}
      ]},
      {t:"立ち去る",o:[
        {c:"default",r:"少女の姿が完全に消える前に部屋を出た。背後で小さな泣き声。申し訳なさが精神を蝕む。",hp:0,mn:-10,inf:4}
      ]}
    ]},

  // ═══ CHAIN EVENTS: 影の追跡者 (floors 3-5, 3-part) ═══
  {id:"e133",fl:[3,4],tp:"encounter",
    sit:"背後に黒い影。振り返ると消える。だが足音は確かに聞こえる。一歩進むたびに、影も一歩近づいている気がする。",
    ch:[
      {t:"走って逃げる",o:[
        {c:"hp>40",r:"全力疾走で距離を稼いだ。だが影は追ってくる。どこかで決着をつけねば。",hp:-8,mn:-5,inf:0,fl:"chain:e134"},
        {c:"default",r:"走ろうとしたが体が重い。影が一瞬で間合いを詰めた。冷たい手が肩を掴む。",hp:-15,mn:-10,inf:0,fl:"chain:e134"}
      ]},
      {t:"立ち止まって対峙する",o:[
        {c:"mn>35",r:"恐怖を飲み込み、影と向き合った。影は一瞬たじろいだ。こちらの意志の強さに驚いたようだ。",hp:0,mn:-8,inf:6,fl:"chain:e134"},
        {c:"default",r:"振り返った瞬間、影の顔が見えた──自分と同じ顔。叫び声をあげてしまった。",hp:0,mn:-15,inf:3,fl:"chain:e134"}
      ]},
      {t:"罠を仕掛けて待ち伏せる",o:[
        {c:"inf>25",r:"周囲の地形を利用し、即席の罠を構築。影が引っかかった隙に距離を取った。知識は力だ。",hp:0,mn:-3,inf:8},
        {c:"default",r:"罠は不発。影が嗤う気配。恐怖で手が震え、精神が削られる。",hp:0,mn:-12,inf:2}
      ]}
    ]},
  {id:"e134",fl:[3,4,5],tp:"encounter",chainOnly:true,
    sit:"影は追跡を止めない。だが距離を保っている。まるで何かを待っているかのように。暗がりの中、影の輪郭がより鮮明になっていく。",
    ch:[
      {t:"影に話しかける",o:[
        {c:"mn>30",r:"「何が目的だ」と問うと、影が口を開いた。「…お前の恐怖を喰らう」迷宮が生んだ捕食者だ。正体が分かれば恐怖は薄れる。",hp:0,mn:5,inf:10,fl:"chain:e135"},
        {c:"default",r:"声をかけた瞬間、影が膨張した。恐怖に反応して強くなる存在。口を開いたのは失策だった。",hp:-5,mn:-12,inf:5,fl:"chain:e135"}
      ]},
      {t:"光源を作って照らす",o:[
        {c:"inf>20",r:"壁の燐光を集めて即席の光源を作った。影が後退する。弱点は光だ。",hp:0,mn:-5,inf:8,fl:"chain:e135"},
        {c:"default",r:"光を作ろうとしたが失敗。闇が深まり、影がより近づいた。",hp:0,mn:-10,inf:3,fl:"chain:e135"}
      ]},
      {t:"全力で振り切る",o:[
        {c:"hp>35",r:"体力にものを言わせ、狭い通路を縫うように駆け抜けた。影は狭所では追えないようだ。",hp:-10,mn:-3,inf:2},
        {c:"default",r:"逃走中に壁に激突。朦朧とする意識の中、影が覆いかぶさってくる。",hp:-18,mn:-8,inf:0,fl:"add:恐怖"}
      ]}
    ]},
  {id:"e135",fl:[3,4,5],tp:"encounter",chainOnly:true,
    sit:"追い詰められた。影が目の前に立ちはだかる。だがよく見ると、影の胸元に小さな光が脈打っている。弱点──あるいは核心。",
    ch:[
      {t:"光を掴み取る",o:[
        {c:"hp>30",r:"影の胸に手を突き入れた。灼熱の痛み。だが光を掴んだ瞬間、影は絶叫と共に霧散した。手の中に結晶が残る。",hp:-15,mn:8,inf:15},
        {c:"default",r:"手を伸ばしたが、影に弾かれた。それでも光の欠片に触れ、影は大きく怯んだ。逃げる隙ができた。",hp:-12,mn:-5,inf:8}
      ]},
      {t:"精神力で圧倒する",o:[
        {c:"mn>40",r:"恐怖を完全に克服し、影を直視した。「お前は俺の影だ。俺が消えろと言えば消える」影が縮み、消滅した。",hp:0,mn:-15,inf:12,fl:"remove:恐怖"},
        {c:"default",r:"精神を集中したが、影の圧に負けた。意識が一瞬飛ぶ。気づくと影はいなかったが、代償は大きい。",hp:-8,mn:-18,inf:5}
      ]},
      {t:"共存を選ぶ",o:[
        {c:"inf>30",r:"「お前も迷宮の一部だ。敵ではない」影が驚いたように動きを止め、やがて自分の影に溶け込んだ。不思議と力が湧く。",hp:5,mn:5,inf:10},
        {c:"default",r:"手を差し伸べたが、影は理解できないようだ。しばらく睨み合った後、互いに去った。",hp:0,mn:-8,inf:4}
      ]}
    ]},

  // ═══ CHAIN EVENTS: 壁の碑文 (floors 3-4, 2-part) ═══
  {id:"e136",fl:[3,4],tp:"exploration",
    sit:"壁一面に古代文字の碑文。部分的に読み取れるが、全文を解読するには時間が必要だ。だが通路の奥から何かが近づく音がする。",
    ch:[
      {t:"時間をかけて全文を解読する",o:[
        {c:"inf>30",r:"高い知識基盤のおかげで解読が捗る。碑文は迷宮の設計図の一部だった。だが近づく音も大きくなっている。",hp:0,mn:-8,inf:18,fl:"chain:e137"},
        {c:"default",r:"解読に集中するが、知識不足で半分しか読めない。音がすぐそこまで迫っている。",hp:0,mn:-12,inf:8,fl:"chain:e137"}
      ]},
      {t:"重要部分だけ素早く読む",o:[
        {c:"inf>20",r:"キーワードだけ拾い読みした。「核心」「鍵は三つ」「心を映す鏡」──断片だが有用な情報だ。",hp:0,mn:-3,inf:10},
        {c:"default",r:"急いで読んだが、ほとんど意味が取れなかった。焦りが精神を蝕む。",hp:0,mn:-8,inf:4}
      ]},
      {t:"碑文を無視して先へ急ぐ",o:[
        {c:"default",r:"知識より生存を優先した。碑文を後にすると、音は遠ざかった。安全だが、機会は失われた。",hp:0,mn:-2,inf:0}
      ]}
    ]},
  {id:"e137",fl:[3,4],tp:"exploration",chainOnly:true,
    sit:"碑文の最後の行を読んでいると、音の正体が現れた──壁を這う巨大な石の守護者。碑文を守っているのだ。知識を持ち出す者を排除するために。",
    ch:[
      {t:"碑文の知識で守護者を鎮める",o:[
        {c:"inf>28",r:"碑文に記された鎮静の言葉を唱えた。守護者が停止し、道を開けた。その先には宝物庫があった。",hp:5,mn:5,inf:20},
        {c:"default",r:"言葉を唱えたが発音が不正確。守護者は怒り、壁が崩れ始めた。辛うじて逃れたが代償は大きい。",hp:-15,mn:-10,inf:5}
      ]},
      {t:"守護者と戦う",o:[
        {c:"hp>40",r:"石の拳を避け、関節部の隙間を攻撃。動きが鈍ったところで脇をすり抜けた。碑文の知識は守れた。",hp:-18,mn:3,inf:5},
        {c:"default",r:"石の拳が直撃。壁に叩きつけられ、視界が明滅する。気づいた時には守護者はいなかったが、碑文の記憶も曖昧になっていた。",hp:-22,mn:-8,inf:-5,fl:"add:負傷"}
      ]},
      {t:"碑文を壊して守護者を混乱させる",o:[
        {c:"default",r:"碑文を蹴り壊した。守護者が混乱し、自壊を始めた。瓦礫を避けながら脱出。知識は失ったが、命は拾った。",hp:-8,mn:-5,inf:-3}
      ]}
    ]},

  // ═══ CHAIN EVENTS: 崩壊する実験室 (floors 4-5, 2-part) ═══
  {id:"e138",fl:[4,5],tp:"trap",
    sit:"古びた実験室。棚に並ぶ薬瓶、散乱する文書。だが床が不自然に傾いている──この部屋全体が罠だ。ゆっくりと天井が降りてくる。",
    ch:[
      {t:"薬瓶を素早く確認して脱出",o:[
        {c:"inf>25",r:"知識を頼りに有用な薬瓶を二本掴んだ。一本は回復薬、もう一本は…解読が必要だ。天井が迫る中、出口へ走る。",hp:8,mn:-5,inf:8,fl:"chain:e139"},
        {c:"default",r:"慌てて薬瓶を掴んだが、一本が割れて酸性の液体が手にかかった。叫びながら出口へ。",hp:-12,mn:-8,inf:3,fl:"chain:e139"}
      ]},
      {t:"文書だけ持って即座に脱出",o:[
        {c:"default",r:"紙束を掴んで全速力で走った。天井が背中をかすめる。辛くも脱出。文書は迷宮の古い研究記録だ。",hp:-5,mn:-3,inf:12,fl:"chain:e139"}
      ]},
      {t:"何も取らずに逃げる",o:[
        {c:"hp>30",r:"躊躇なく走った。体力があったおかげで余裕を持って脱出。背後で部屋が完全に圧壊する音。",hp:-3,mn:-5,inf:0},
        {c:"default",r:"逃げ遅れた。天井に挟まれかけ、必死で這い出る。全身に打撲。",hp:-18,mn:-10,inf:0,fl:"add:負傷"}
      ]}
    ]},
  {id:"e139",fl:[4,5],tp:"trap",chainOnly:true,
    sit:"脱出した通路の先に、実験室の主の私室があった。骸骨が机に突っ伏している。手元には最後の研究ノート──迷宮の核心に迫る内容だ。",
    ch:[
      {t:"研究ノートを精読する",o:[
        {c:"inf>30",r:"ノートの内容を完全に理解した。迷宮は人工物で、核心部に制御装置がある。脱出の鍵となる情報だ。",hp:0,mn:-8,inf:22},
        {c:"inf>20",r:"大部分は理解できた。迷宮の構造に関する貴重な知見を得た。だが最後のページだけが読めない。",hp:0,mn:-5,inf:15},
        {c:"default",r:"専門的すぎて理解が追いつかない。断片的な情報だけ拾ったが、集中力を大きく消耗した。",hp:0,mn:-12,inf:7}
      ]},
      {t:"骸骨の持ち物を調べる",o:[
        {c:"default",r:"ポケットから小さな鍵と地図の断片が出てきた。地図はこの先の安全な通路を示している。",hp:0,mn:-5,inf:10}
      ]},
      {t:"何も触らず立ち去る",o:[
        {c:"default",r:"死者の研究に触れることへの畏怖。だが立ち去る背中に、骸骨が「…持っていけ…」と囁いた気がした。幻聴だと信じたい。",hp:0,mn:-10,inf:2}
      ]}
    ]},

  // ═══ CHAIN EVENTS: 古い日記 (floors 1-2, 2-part) ═══
  {id:"e140",fl:[1,2],tp:"exploration",
    sit:"壁の隙間に挟まった手帳。過去の探索者の日記だ。震える字で書かれている。最後のページにはこう記されている──「三叉路では必ず左を選べ」",
    ch:[
      {t:"日記を丁寧に読む",o:[
        {c:"default",r:"探索者の記録は貴重な情報の宝庫だった。罠の位置、安全な休息所、危険な区域…だが後半は次第に狂気に染まっていく。",hp:0,mn:-8,inf:14,fl:"chain:e141"}
      ]},
      {t:"「左」の助言だけ記憶する",o:[
        {c:"default",r:"余計な情報は精神を蝕む。助言だけを記憶し、先を急いだ。賢明な判断かもしれない。",hp:0,mn:-2,inf:5}
      ]},
      {t:"日記を持っていく",o:[
        {c:"default",r:"手帳をポケットに入れた。重くはないが、持ち主の怨念のような冷たさを感じる。後で精読しよう。",hp:0,mn:-5,inf:8,fl:"chain:e141"}
      ]}
    ]},
  {id:"e141",fl:[1,2],tp:"exploration",chainOnly:true,
    sit:"日記の記述通り、三叉路に出た。左の通路は安全そうに見える。だが日記の最後のページの裏に、血文字で「嘘をついた。左は死ぬ」と書かれていたことに気づく。",
    ch:[
      {t:"それでも左を選ぶ",o:[
        {c:"inf>18",r:"血文字こそが嘘だと見抜いた。左の通路は確かに安全で、隠し部屋に繋がっていた。中には貴重な情報が。",hp:5,mn:5,inf:15},
        {c:"default",r:"左を進んだ。安全だった。血文字は最後の悪あがき──狂気に侵された者の虚言だったようだ。",hp:3,mn:3,inf:8}
      ]},
      {t:"右を選ぶ",o:[
        {c:"default",r:"血文字を信じて右へ。だがそこには罠が。日記の助言は正しかったのだ。最後の血文字に騙された。",hp:-12,mn:-8,inf:2,fl:"add:負傷"}
      ]},
      {t:"中央を選ぶ",o:[
        {c:"default",r:"どちらの情報も信用できない。第三の道を選んだ。険しいが安全。判断を他人に委ねない──それが生存の鉄則。",hp:-5,mn:3,inf:5}
      ]}
    ]},

  // ═══ STAT-REACTIVE EVENTS WAVE 3 (15 new events) ═══
  {id:"e142",fl:[1,2,3],tp:"encounter",
    sit:"傷だらけの探索者が壁にもたれている。「…水、くれ」と掠れた声。助ける余裕があるのか。自分の状況次第だ。",
    ch:[
      {t:"助ける",o:[
        {c:"hp>50",r:"体力に余裕がある。水と食料を分け与えた。感謝の印に、探索者は安全な通路の情報をくれた。",hp:-8,mn:8,inf:12},
        {c:"hp>30",r:"余裕はないが見捨てられない。水を渡すと、探索者が地図の断片をくれた。互いの生存を祈って別れた。",hp:-5,mn:5,inf:8},
        {c:"default",r:"自分も限界なのに水を渡した。探索者は感謝したが、あなたの方が先に倒れそうだ。",hp:-10,mn:3,inf:5}
      ]},
      {t:"情報だけ交換する",o:[
        {c:"inf>20",r:"「情報を交換しよう」持っている知識を共有すると、探索者も貴重な情報を教えてくれた。Win-Winだ。",hp:0,mn:3,inf:15},
        {c:"default",r:"情報を求めたが、探索者の意識が朦朧としていて有益な話は聞けなかった。",hp:0,mn:-5,inf:4}
      ]},
      {t:"見なかったことにする",o:[
        {c:"mn>30",r:"心を殺して通り過ぎた。精神力があるからこそ、冷酷な判断ができる。生存優先。",hp:0,mn:-8,inf:0},
        {c:"default",r:"見捨てた罪悪感が重い。背後から「…お前もすぐだ」という呪詛が聞こえた。",hp:0,mn:-15,inf:0}
      ]}
    ]},
  {id:"e143",fl:[2,3,4],tp:"trap",
    sit:"足元に複雑な紋様。踏んだ瞬間、空気が振動し始めた。紋様が発光し、三つの選択を迫る符号が浮かぶ──体力、精神、知識。一つを差し出せと。",
    ch:[
      {t:"体力を差し出す",o:[
        {c:"hp>45",r:"体力に自信がある。紋様にHPを捧げると、代わりに迷宮の秘密が流れ込んできた。良い取引だ。",hp:-20,mn:5,inf:18},
        {c:"hp>25",r:"余裕はないが体力を捧げた。情報は得たが、身体がふらつく。割に合ったか微妙だ。",hp:-15,mn:0,inf:10},
        {c:"default",r:"体力を差し出したが、ほとんど残っていなかった。紋様は不満げに少しの情報しか与えなかった。",hp:-10,mn:-5,inf:5}
      ]},
      {t:"精神を差し出す",o:[
        {c:"mn>40",r:"精神力が充実している。恐怖の幻覚を受け入れると、紋様が最深部の地図を映し出した。",hp:0,mn:-18,inf:20},
        {c:"mn>20",r:"精神を差し出すと、短い幻覚の後に情報が得られた。だが頭痛が止まらない。",hp:0,mn:-12,inf:10},
        {c:"default",r:"精神を差し出したが、そもそも余裕がない。幻覚に飲まれかけ、断片的な情報しか得られなかった。",hp:-5,mn:-10,inf:4}
      ]},
      {t:"知識を差し出す",o:[
        {c:"inf>30",r:"豊富な知識の一部を捧げた。紋様が輝き、体力と精神の両方が回復した。知識こそ最高の通貨だ。",hp:15,mn:12,inf:-15},
        {c:"inf>15",r:"知識を差し出すと、身体が軽くなった。情報値は減ったが、体が楽になった。",hp:10,mn:8,inf:-10},
        {c:"default",r:"差し出せる知識が乏しい。紋様はほとんど反応しなかった。時間の無駄だった。",hp:0,mn:-5,inf:-3}
      ]}
    ]},
  {id:"e144",fl:[3,4,5],tp:"encounter",
    sit:"天井から逆さに吊られた巨大な眼球。こちらを凝視している。視線を受けると、自分の弱点が見透かされていく感覚。",
    ch:[
      {t:"視線を受け入れて情報を得る",o:[
        {c:"mn>40",r:"精神力で視線を耐え抜いた。眼球と意識が繋がり、フロア全体の情報が流入。対価に見合う報酬だ。",hp:0,mn:-15,inf:22},
        {c:"mn>25",r:"なんとか視線を耐えたが、精神は削られた。断片的な情報は得たものの、目眩が止まらない。",hp:0,mn:-12,inf:12},
        {c:"default",r:"視線に耐えられなかった。意識が刈り取られ、目が覚めると知らない場所にいた。",hp:-5,mn:-18,inf:5,fl:"add:混乱"}
      ]},
      {t:"目を閉じて通り過ぎる",o:[
        {c:"inf>20",r:"眼球の弱点を知っている。目を閉じれば効力を失う。安全に通過し、壁の文字から情報も得た。",hp:0,mn:-3,inf:10},
        {c:"default",r:"目を閉じて歩いたが、壁に何度もぶつかった。眼球は追ってこなかったが、体は痛い。",hp:-8,mn:-5,inf:2}
      ]},
      {t:"眼球を攻撃する",o:[
        {c:"hp>45",r:"石を投げつけた。眼球が破裂し、中から結晶化した情報体が落ちてきた。知識の塊だ。",hp:-5,mn:5,inf:18},
        {c:"default",r:"攻撃を試みたが、視線で動きを封じられた。やがて眼球は去ったが、精神的ダメージは深い。",hp:-3,mn:-15,inf:3}
      ]}
    ]},
  {id:"e145",fl:[2,3],tp:"rest",
    sit:"小さな泉が湧いている。水は澄んでいるが、底に光る文字が見える。飲めば回復するだろうが、文字が気になる。",
    ch:[
      {t:"水を飲んで休む",o:[
        {c:"hp>35",r:"体力があるため、水の効果が十分に発揮された。傷が癒え、精神も安定した。文字は見なかったことにする。",hp:12,mn:8,inf:0},
        {c:"status:出血",r:"水で傷口を洗った。出血が止まり、暖かさが全身を巡る。この泉は癒しの力を持っている。",hp:15,mn:5,inf:0,fl:"remove:出血"},
        {c:"status:負傷",r:"傷ついた身体に水が染みる。痛みが和らぎ、身体が軽くなった。",hp:12,mn:3,inf:0,fl:"remove:負傷"},
        {c:"default",r:"水を飲むと体力が回復した。だが底の文字が水面に浮かび上がり、読まざるを得なかった──恐ろしい予言だ。",hp:10,mn:-8,inf:5}
      ]},
      {t:"文字を先に読む",o:[
        {c:"inf>25",r:"泉底の文字を解読した。迷宮の設計者が残した警告と、重要な情報が含まれていた。その上で安心して水を飲んだ。",hp:8,mn:5,inf:15},
        {c:"default",r:"文字を読もうとしたが、水面が揺れて読みづらい。集中しすぎて精神を消耗。水は飲めたが疲れた。",hp:8,mn:-5,inf:6}
      ]},
      {t:"泉に触れず先へ進む",o:[
        {c:"default",r:"罠かもしれない。泉を避けて進んだ。安全だが、喉の渇きが精神を蝕む。",hp:-3,mn:-5,inf:0}
      ]}
    ]},
  {id:"e146",fl:[3,4,5],tp:"trap",
    sit:"部屋の中央に天秤。左の皿に自分の血を、右の皿に自分の涙を求めている。両方捧げれば扉が開くが、片方だけでも反応するかもしれない。",
    ch:[
      {t:"血を捧げる（体力を代価に）",o:[
        {c:"hp>40",r:"指を切り、血を垂らした。天秤が傾き、壁の一部が開いた。体力の代償で安全な通路が現れた。",hp:-15,mn:3,inf:8},
        {c:"default",r:"血を捧げたが、体力不足で天秤の反応が弱い。通路は半分しか開かず、身体を捩じ込む必要がある。",hp:-12,mn:-5,inf:4,fl:"add:負傷"}
      ]},
      {t:"涙を捧げる（精神を代価に）",o:[
        {c:"mn>35",r:"迷宮での恐怖を思い出し、涙が溢れた。天秤が傾き、知識の結晶が出現。精神の代価で情報を得た。",hp:0,mn:-15,inf:15},
        {c:"default",r:"涙が出ない。無理に悲しい記憶を掘り起こし、なんとか涙を絞った。精神的ダメージは予想以上。",hp:0,mn:-12,inf:6}
      ]},
      {t:"両方捧げる",o:[
        {c:"hp>35",r:"血と涙の両方を捧げた。天秤が完全に均衡し、扉が大きく開いた。その先は安全な休息地帯──回復できる。",hp:-8,mn:-8,inf:12},
        {c:"default",r:"両方捧げようとしたが体が持たない。中途半端な供物に天秤が怒り、部屋全体が震動した。",hp:-15,mn:-12,inf:3}
      ]}
    ]},
  {id:"e147",fl:[1,2,3],tp:"exploration",
    sit:"分岐路。左は明るく平坦、右は暗く狭い。だがあなたの経験と直感が何かを告げている。",
    ch:[
      {t:"明るい左の道を行く",o:[
        {c:"inf>25",r:"明るい道こそ罠だと知識が告げる。あえて進み、予想通りの罠を無効化。安全に情報を得た。",hp:0,mn:3,inf:12},
        {c:"status:恐怖",r:"恐怖状態では暗い道に進めない。明るい道を選んだが、案の定、罠が作動。恐怖が判断を狂わせた。",hp:-12,mn:-5,inf:2},
        {c:"default",r:"平坦な道を進んだ。特に何もなく通過。安全だが、何も得られなかった。",hp:0,mn:-2,inf:2}
      ]},
      {t:"暗い右の道を行く",o:[
        {c:"mn>30",r:"精神力で暗闇を恐れず進んだ。狭い通路の先に隠し部屋。過去の探索者の遺品から貴重な情報を発見。",hp:-3,mn:-5,inf:15},
        {c:"hp>40",r:"暗がりを体力で突破。途中で穴に落ちかけたが、体力があったので持ちこたえた。小さな発見もあった。",hp:-8,mn:-3,inf:8},
        {c:"default",r:"暗闇に足を踏み入れたが、恐怖で引き返した。時間と精神を浪費しただけだった。",hp:0,mn:-10,inf:1}
      ]},
      {t:"壁を調べてから判断する",o:[
        {c:"inf>15",r:"壁の痕跡から、右が正解だと推測。的中し、安全に有益な道を進めた。知識は道標。",hp:0,mn:-3,inf:10},
        {c:"default",r:"壁を調べたが手がかりは掴めなかった。時間を無駄にし、結局勘で進むしかない。",hp:0,mn:-6,inf:3}
      ]}
    ]},
  {id:"e148",fl:[4,5],tp:"encounter",
    sit:"鏡の間。四方の鏡が異なるあなたを映している。一つは健康な姿、一つは狂気に染まった姿、一つは知恵に満ちた姿、一つは現在のあなた。現在の鏡だけがヒビ割れている。",
    ch:[
      {t:"健康な鏡に触れる",o:[
        {c:"hp<30",r:"鏡に手を触れると、体力が引き上げられる感覚。最も必要としていたものが与えられた。ヒビ割れた鏡が修復される音がする。",hp:20,mn:0,inf:0},
        {c:"default",r:"健康な鏡に触れた。体力は既に十分あったため、微かな回復に留まった。鏡は曇っていく。",hp:5,mn:0,inf:3}
      ]},
      {t:"狂気の鏡に触れる",o:[
        {c:"mn>40",r:"精神力があるからこそ、狂気を覗ける。鏡の中の狂った自分と対話し、迷宮の隠された真実を引き出した。",hp:0,mn:-12,inf:18},
        {c:"mn<20",r:"既に精神が限界に近い。鏡に触れた瞬間、狂気の自分と同化しかけた。辛うじて引き剥がしたが、深い傷が残る。",hp:0,mn:-15,inf:5,fl:"add:混乱"},
        {c:"default",r:"鏡の中の狂った自分が笑いかけてくる。不快だが、そこから迷宮の本質に関するヒントを読み取れた。",hp:0,mn:-8,inf:10}
      ]},
      {t:"知恵の鏡に触れる",o:[
        {c:"inf>30",r:"知恵の自分と共鳴。蓄積した知識が整理・昇華され、新たな洞察が生まれた。最高の取引だ。",hp:3,mn:3,inf:15},
        {c:"inf<15",r:"知恵の鏡に触れたが、映る自分は首を横に振った。「まだ足りない」知識不足を突きつけられ、精神が揺らぐ。",hp:0,mn:-10,inf:5},
        {c:"default",r:"知恵の自分から有用な情報を受け取った。だが「もっと学べ」という無言の圧が精神に重い。",hp:0,mn:-5,inf:10}
      ]}
    ]},
  {id:"e149",fl:[2,3,4],tp:"trap",
    sit:"通路の天井に亀裂。瓦礫が降り注ぎ始めた。奥に安全地帯が見えるが、距離がある。走るか、這うか、それとも──",
    ch:[
      {t:"全力で走り抜ける",o:[
        {c:"hp>45",r:"体力を活かして一気に駆け抜けた。瓦礫を浴びたが、頑丈な身体が守ってくれた。安全地帯に到達。",hp:-8,mn:0,inf:2},
        {c:"hp>25",r:"走ったが、途中で瓦礫に足を取られた。転びながらも安全地帯に辿り着いた。あと少し遅ければ。",hp:-15,mn:-5,inf:1},
        {c:"default",r:"走る体力がない。瓦礫の直撃を何度も受け、意識が朦朧とする中で這いずり出た。",hp:-22,mn:-8,inf:0,fl:"add:負傷"}
      ]},
      {t:"瓦礫のパターンを読んで避ける",o:[
        {c:"inf>25",r:"亀裂の走り方から落下パターンを予測。最小限の動きで安全に通過。知識が命を救った。",hp:0,mn:-3,inf:8},
        {c:"inf>15",r:"ある程度パターンは読めた。大きな瓦礫は避けたが小石に打たれた。それでも上出来だ。",hp:-5,mn:-3,inf:5},
        {c:"default",r:"パターンを読もうとしたが間に合わない。結局走って突破するしかなかった。",hp:-15,mn:-8,inf:2}
      ]},
      {t:"精神を集中して最適ルートを見出す",o:[
        {c:"mn>35",r:"冷静に最適ルートを計算。ジグザグに進み、ほぼ無傷で通過。精神の消耗だけで済んだ。",hp:-2,mn:-10,inf:5},
        {c:"default",r:"集中しようとしたが、轟音で思考が乱れる。パニックになりかけながらなんとか通過。",hp:-12,mn:-15,inf:1}
      ]}
    ]},
  {id:"e150",fl:[3,4,5],tp:"encounter",
    sit:"光る水晶の欠片が散らばる部屋。一つを拾うと、記憶が流れ込む──この迷宮で死んだ者たちの最期の記憶だ。情報源になるが、精神への負荷は計り知れない。",
    ch:[
      {t:"複数の欠片を拾う",o:[
        {c:"mn>45",r:"精神力の高さが防壁となり、記憶の奔流を制御できた。複数の死者の知識が統合され、迷宮の全体像が見えてくる。",hp:0,mn:-18,inf:25},
        {c:"mn>30",r:"三つまでは耐えられた。四つ目で意識が飛びかけ、手放した。それでも得た情報は莫大だ。",hp:0,mn:-15,inf:16},
        {c:"default",r:"二つ目で限界。他者の死の記憶が精神を蝕む。得た情報は少ないが、これ以上は危険だった。",hp:0,mn:-12,inf:8,fl:"add:恐怖"}
      ]},
      {t:"一つだけ慎重に選ぶ",o:[
        {c:"inf>25",r:"知識を頼りに、最も情報量が多そうな欠片を選んだ。的中──熟練探索者の記憶で、質の高い情報を得た。",hp:0,mn:-5,inf:14},
        {c:"default",r:"適当に選んだ欠片は、新米探索者の記憶だった。有益な情報は少ないが、共感できる部分もあった。",hp:0,mn:-5,inf:6}
      ]},
      {t:"欠片を避けて通過する",o:[
        {c:"default",r:"死者の記憶に触れるリスクを回避。欠片を踏まないように慎重に部屋を横切った。",hp:0,mn:-2,inf:0}
      ]}
    ]},
  {id:"e151",fl:[1,2,3],tp:"encounter",
    sit:"行き倒れた探索者のバックパック。中には回復アイテム、地図、護符の三つ。だが全て持つと重くて動けなくなる。一つだけ選べ。",
    ch:[
      {t:"回復アイテムを取る",o:[
        {c:"hp<30",r:"体力が危険域。迷わず回復アイテムを選んだ。傷が癒え、動ける身体に戻った。命の選択だった。",hp:20,mn:3,inf:0},
        {c:"status:出血",r:"出血を止めるには回復アイテムが最優先。処置すると出血が収まった。正しい判断だ。",hp:12,mn:0,inf:0,fl:"remove:出血"},
        {c:"default",r:"回復アイテムを使用。体力が回復し、余裕が生まれた。",hp:12,mn:0,inf:0}
      ]},
      {t:"地図を取る",o:[
        {c:"inf<15",r:"情報が不足している。地図を広げると、現在位置と安全な通路が判明。知識こそ生存の鍵。",hp:0,mn:3,inf:16},
        {c:"inf>30",r:"既に知識は豊富だが、地図はさらなる情報を提供してくれた。重複する部分も多いが、確認できて安心。",hp:0,mn:3,inf:8},
        {c:"default",r:"地図から有用な情報を得た。現在の知識と照合し、より正確な迷宮像を構築できた。",hp:0,mn:3,inf:12}
      ]},
      {t:"護符を取る",o:[
        {c:"status:呪い",r:"呪いに苦しんでいた。護符を握ると呪いが浄化されていく。これを待っていた。",hp:3,mn:8,inf:0,fl:"remove:呪い"},
        {c:"mn<20",r:"精神が限界に近い。護符の温かさが心を安定させた。護符の力で精神が回復する。",hp:0,mn:15,inf:0},
        {c:"default",r:"護符を首にかけると、安心感に包まれた。精神的な防護を得た気がする。",hp:3,mn:8,inf:2}
      ]}
    ]},
  {id:"e152",fl:[4,5],tp:"trap",
    sit:"部屋に入った瞬間、扉が閉まった。壁に三つのレバー。一つは体力で引く重いレバー、一つは精密な操作が必要な精神レバー、一つは暗号が刻まれた知識レバー。正解は一つ。",
    ch:[
      {t:"重いレバーを力で引く",o:[
        {c:"hp>50",r:"体力が充実している。渾身の力でレバーを引くと、扉が開いた。正解だ。腕は痛むが脱出できた。",hp:-10,mn:0,inf:3},
        {c:"hp>30",r:"力を込めてレバーを引いた。開いた──が、反動で腕を痛めた。脱出はできたものの、身体に負担が残る。",hp:-15,mn:0,inf:2},
        {c:"default",r:"力が足りずレバーが戻ってしまった。不正解の罰として床から刃が飛び出した。",hp:-20,mn:-5,inf:0,fl:"add:負傷"}
      ]},
      {t:"精神レバーを精密操作する",o:[
        {c:"mn>40",r:"集中力を研ぎ澄ませ、微細な操作でレバーを正確な位置に合わせた。カチリと音がし、扉が開いた。",hp:0,mn:-10,inf:5},
        {c:"mn>25",r:"操作に成功したが、精神の消耗が激しい。脱出できたが、頭痛が酷い。",hp:0,mn:-15,inf:3},
        {c:"default",r:"集中力が足りず手が震えた。不正解。壁から毒ガスが噴出し、意識が朦朧とする。",hp:-8,mn:-15,inf:0,fl:"add:混乱"}
      ]},
      {t:"暗号レバーの暗号を解く",o:[
        {c:"inf>35",r:"暗号は迷宮の古代言語。蓄積した知識で即座に解読し、正確にレバーを操作。扉が開き、ボーナスの情報も得た。",hp:0,mn:3,inf:12},
        {c:"inf>20",r:"暗号を部分的に解読。正解には至ったが、確信が持てないまま操作した。結果オーライだが心臓に悪い。",hp:0,mn:-8,inf:6},
        {c:"default",r:"暗号が全く読めない。適当に操作したら不正解。天井から重い石が落ちてきた。",hp:-18,mn:-5,inf:0}
      ]}
    ]},
  {id:"e153",fl:[2,3,4],tp:"rest",
    sit:"安全な小部屋。壁に描かれた壁画が穏やかに光っている。ここで何をするかは、今の状況次第だ。",
    ch:[
      {t:"身体を休める",o:[
        {c:"hp<30",r:"倒れるように横になった。壁画の光が傷を癒す。限界だった身体が回復していく。ここに来られて良かった。",hp:18,mn:5,inf:0},
        {c:"status:負傷",r:"負傷した箇所を手当てする時間がやっと取れた。壁画の光も手伝い、傷が塞がっていく。",hp:12,mn:3,inf:0,fl:"remove:負傷"},
        {c:"default",r:"ゆっくり身体を伸ばした。大きな回復ではないが、疲れが取れた。",hp:8,mn:3,inf:0}
      ]},
      {t:"瞑想する",o:[
        {c:"mn<25",r:"目を閉じて精神を整える。限界に近かった心が、壁画の光と共鳴し大きく回復した。今の自分に最も必要な選択だった。",hp:3,mn:18,inf:0,fl:"remove:恐怖"},
        {c:"status:混乱",r:"乱れた思考を整理する。壁画の規則的な光が思考のリズムを取り戻してくれた。",hp:0,mn:12,inf:0,fl:"remove:混乱"},
        {c:"default",r:"穏やかに瞑想。精神が整い、次の探索への準備が整った。",hp:3,mn:8,inf:0}
      ]},
      {t:"壁画を調べる",o:[
        {c:"inf>20",r:"壁画は迷宮の歴史を描いていた。解読すると、各層の危険と攻略法が読み取れた。貴重な情報源だ。",hp:3,mn:3,inf:15},
        {c:"default",r:"壁画を眺めたが、意味を理解するには知識が足りない。それでも美しい光に心が癒された。",hp:3,mn:5,inf:5}
      ]}
    ]},
  {id:"e154",fl:[3,4,5],tp:"encounter",
    sit:"迷宮の壁が脈動している。生きている。触れると温かく、鼓動を感じる。壁の一部が膨らみ、何かを押し出そうとしている。",
    ch:[
      {t:"壁から生まれるものを待つ",o:[
        {c:"mn>35",r:"精神力で恐怖を制御し、待った。壁から結晶体が生まれ落ちた。迷宮の記憶が詰まった宝石だ。",hp:0,mn:-10,inf:18},
        {c:"default",r:"待っていたら壁が破裂し、粘液が飛び散った。毒性はないが、精神的ダメージが大きい。壁の中には何もなかった。",hp:-5,mn:-12,inf:3}
      ]},
      {t:"壁を切り開く",o:[
        {c:"hp>40",r:"壁を殴りつけた。拳は痛むが、壁が裂け、中から古い遺物が転がり出た。迷宮の核心に関する手がかりだ。",hp:-12,mn:3,inf:14},
        {c:"default",r:"壁を殴ったが、壁が収縮して拳を締め付けた。引き抜くのに苦労し、手が腫れ上がった。",hp:-15,mn:-5,inf:2,fl:"add:負傷"}
      ]},
      {t:"壁に耳を当てて情報を得る",o:[
        {c:"inf>25",r:"壁の鼓動はモールス信号のようだ。知識を総動員して解読すると、最深部への近道が判明した。",hp:0,mn:-5,inf:16},
        {c:"default",r:"鼓動を聞いたが意味が分からない。だが壁の温もりに触れることで、少しだけ心が安らいだ。",hp:3,mn:3,inf:4}
      ]}
    ]},
  {id:"e155",fl:[1,2,3],tp:"trap",
    sit:"光る線が格子状に張り巡らされた回廊。触れれば焼かれる。向こう側に通路が見える。体格、集中力、知識──何を頼りに突破するか。",
    ch:[
      {t:"身体能力で潜り抜ける",o:[
        {c:"hp>45",r:"柔軟な身体で光線を避け、華麗に通過。体力のある者だけが選べるルートだ。",hp:-5,mn:0,inf:3},
        {c:"hp>25",r:"なんとか通過したが、何度か光線に触れた。焼けた痕が痛む。",hp:-15,mn:-3,inf:1},
        {c:"default",r:"光線を避けきれず、全身に火傷を負った。這うようにして通過。",hp:-22,mn:-5,inf:0,fl:"add:負傷"}
      ]},
      {t:"パターンを分析して安全地帯を見つける",o:[
        {c:"inf>25",r:"光線の周期を分析。消灯する一瞬のタイミングで安全に通過。知識が最良の盾だった。",hp:0,mn:-5,inf:10},
        {c:"inf>12",r:"部分的にパターンを読めた。完全ではないが、ダメージを最小限に抑えて通過。",hp:-8,mn:-5,inf:5},
        {c:"default",r:"分析を試みたが複雑すぎる。結局、勘で飛び込むしかなかった。",hp:-15,mn:-8,inf:2}
      ]},
      {t:"精神集中で痛みを遮断して突破",o:[
        {c:"mn>35",r:"痛覚を精神力で遮断。光線を受けながらも平然と歩く。身体にダメージはあるが、精神は揺るがない。",hp:-12,mn:-10,inf:2},
        {c:"default",r:"痛みの遮断に失敗。光線の灼熱感が精神を直撃し、悲鳴をあげてしまった。",hp:-15,mn:-15,inf:0}
      ]}
    ]},
  {id:"e156",fl:[4,5],tp:"encounter",
    sit:"自分と全く同じ姿の存在が現れた。分身──迷宮が生み出したコピーだ。同じ能力、同じ弱点を持つ。どう対処するか。",
    ch:[
      {t:"力で排除する",o:[
        {c:"hp>50",r:"同じ能力なら、体力で勝る今のうちに。先手を取り、分身を押し倒した。消滅する際に情報を残していった。",hp:-15,mn:5,inf:10},
        {c:"hp>30",r:"互角の戦い。辛くも勝ったが、まるで自分を殴っているような感覚に精神が削られた。",hp:-20,mn:-10,inf:5},
        {c:"default",r:"力で劣る。分身に打ちのめされ、嘲笑される。自分自身に負けた屈辱が精神を蝕む。",hp:-18,mn:-15,inf:2}
      ]},
      {t:"知識で出し抜く",o:[
        {c:"inf>30",r:"分身は能力はコピーしても、知識の使い方までは真似できない。策略で翻弄し、罠に嵌めた。知恵の勝利。",hp:0,mn:-5,inf:15},
        {c:"inf>18",r:"知識を武器にしたが、分身も同じ発想をする。だが一手先を読み、辛くも出し抜いた。",hp:-5,mn:-8,inf:8},
        {c:"default",r:"知識で対抗しようとしたが、同等の知識を持つ相手に通用しない。消耗戦の末、なんとか逃れた。",hp:-10,mn:-12,inf:3}
      ]},
      {t:"対話を試みる",o:[
        {c:"mn>40",r:"「お前は俺だ。戦う意味はない」分身が困惑し、やがて頷いた。融合すると、自分の中に眠る力が覚醒した。",hp:5,mn:-8,inf:12,fl:"remove:混乱"},
        {c:"default",r:"話しかけたが、分身は無言で襲いかかってきた。精神が足りない者との対話は成立しないようだ。",hp:-15,mn:-10,inf:3}
      ]}
    ]},

  // ═══ CROSS-RUN EVENTS: 前回の探索が影響するイベント ═══
  {id:"e157",fl:[1,2],tp:"encounter",metaCond:(m)=>m.lastRun?.cause==="体力消耗",
    sit:"壁に見覚えのある血痕。前回の探索で倒れた場所の近くだ。身体が覚えている──あの痛みを。だが、今回は同じ轍を踏まない。",
    ch:[
      {t:"前回の教訓を活かして慎重に進む",o:[
        {c:"inf>15",r:"前回の失敗を分析し、体力の配分を最適化。同じ罠を回避し、前回より遥かに効率的に進めた。",hp:5,mn:5,inf:12},
        {c:"default",r:"慎重に進んだ。前回ほどの無茶はしない。体力を温存しながら情報を集めた。",hp:3,mn:3,inf:8}
      ]},
      {t:"前回とは違うルートを試す",o:[
        {c:"default",r:"前回の通路を避け、別の道を選んだ。新しい発見があった。失敗は新たな道を開く。",hp:-3,mn:3,inf:10}
      ]},
      {t:"前回倒れた場所を確認する",o:[
        {c:"default",r:"あの場所に戻った。自分の持ち物の残骸が残っている。中に有用な情報のメモがあった。過去の自分からの贈り物だ。",hp:0,mn:-5,inf:15}
      ]}
    ]},
  {id:"e158",fl:[1,2],tp:"encounter",metaCond:(m)=>m.lastRun?.cause==="精神崩壊",
    sit:"壁の落書きに見覚えがある。前回、精神が崩壊する直前に自分が書いた文字だ。震える字で「ここから先は…」──続きは読めない。",
    ch:[
      {t:"精神を鍛え直して進む",o:[
        {c:"mn>25",r:"前回の恐怖を乗り越える。あの時の自分より強くなった。精神が研ぎ澄まされていく感覚がある。",hp:0,mn:8,inf:10},
        {c:"default",r:"壁の文字を見て動揺したが、深呼吸で落ち着いた。前回より確実に成長している。",hp:0,mn:3,inf:6}
      ]},
      {t:"落書きの続きを推測する",o:[
        {c:"inf>20",r:"文字の途切れ方と筆跡から、前回の自分が伝えたかった情報を復元できた。「この先、精神を蝕む罠あり」──貴重な警告だ。",hp:0,mn:-3,inf:18},
        {c:"default",r:"推測を試みたが確信が持てない。それでも前回の記憶の断片が、わずかな手がかりとなった。",hp:0,mn:-5,inf:8}
      ]}
    ]},
  {id:"e159",fl:[2,3,4],tp:"exploration",metaCond:(m)=>(m.totalDeaths??0)>=3,
    sit:"通路の壁に無数の傷跡。よく見ると、全て自分がつけたものだ。何度もここを通った証──死んでは戻り、死んでは戻り。だが今回は違う手応えがある。",
    ch:[
      {t:"傷跡のパターンから情報を読み取る",o:[
        {c:"inf>20",r:"過去の自分が残した傷跡は、実は道標だった。無意識に安全な通路を示していたのだ。死の記憶が導きとなった。",hp:0,mn:5,inf:20},
        {c:"default",r:"傷跡を辿ると、少しだけ通路の構造が見えてきた。過去の探索は無駄ではなかった。",hp:0,mn:3,inf:10}
      ]},
      {t:"新しい傷をつけて未来の自分へ情報を残す",o:[
        {c:"default",r:"壁に情報を刻んだ。今回倒れても、次の自分がこの情報を使える。死は終わりではなく、継承だ。",hp:-3,mn:5,inf:8}
      ]},
      {t:"傷跡を無視して新しい道を探す",o:[
        {c:"hp>35",r:"過去に縛られない。体力を活かして未踏の通路を発見。傷跡のない壁──ここは初めて来る場所だ。",hp:-8,mn:3,inf:14}
      ]}
    ]},
  {id:"e160",fl:[3,4,5],tp:"encounter",metaCond:(m)=>m.escapes>=1,
    sit:"一度生還した者だけが感じる気配。迷宮が「また来たのか」と語りかけている。生還者には、初回にはない特別な選択肢が見える。",
    ch:[
      {t:"迷宮と対話する",o:[
        {c:"mn>35",r:"精神力で迷宮の意志と接触。「お前は面白い。少し教えてやる」──このフロアの全ての罠の位置が頭に流れ込んだ。",hp:0,mn:-12,inf:25},
        {c:"default",r:"対話を試みたが、迷宮の意志は巨大すぎた。断片的な情報だけ得て、精神的に消耗した。",hp:0,mn:-15,inf:10}
      ]},
      {t:"生還者としての直感に従う",o:[
        {c:"inf>25",r:"一度生還した経験が直感を鋭くする。安全な道が光って見える──比喩ではなく、文字通り。",hp:3,mn:3,inf:15},
        {c:"default",r:"直感が囁く。「右は危険、左は安全」。半信半疑だが従った。正解だった。",hp:0,mn:3,inf:10}
      ]},
      {t:"迷宮の挑戦を受ける",o:[
        {c:"hp>40",r:"「ならば試してやる」迷宮が送り込んだ試練を体力で突破。報酬として最深部の情報を得た。",hp:-15,mn:5,inf:20},
        {c:"default",r:"挑戦を受けたが、実力不足で途中棄権。それでも挑んだことで迷宮からの僅かな敬意を感じた。",hp:-10,mn:-5,inf:8}
      ]}
    ]},
  {id:"e161",fl:[1,2,3],tp:"exploration",metaCond:(m)=>m.runs>=5,
    sit:"五度以上の探索で蓄積された記憶の残滓。壁のシミが地図に見える。天井の亀裂がルートに見える。経験が世界を変えて見せている。",
    ch:[
      {t:"記憶の地図に従う",o:[
        {c:"default",r:"過去の探索の記憶が重なり合い、最適ルートが浮かび上がった。経験とは最高の武器だ。",hp:0,mn:5,inf:16}
      ]},
      {t:"記憶にない道を探す",o:[
        {c:"inf>18",r:"五度来ても発見できなかった隠し通路を、知識と経験の融合で遂に発見。探索者としての成長を実感する。",hp:0,mn:-5,inf:20},
        {c:"default",r:"新しい道を探したが見つからない。だが壁の材質の変化に気づいた。次は見つけられるだろう。",hp:0,mn:-5,inf:8}
      ]}
    ]},
  {id:"e162",fl:[2,3,4],tp:"encounter",metaCond:(m)=>(m.endings?.length??0)>=2,
    sit:"複数のエンディングを経験した者にだけ見える部屋。壁に自分の過去の生還記録が刻まれている。迷宮がコレクターとして認めている。",
    ch:[
      {t:"記録を統合して新しい知見を得る",o:[
        {c:"inf>25",r:"過去の全ての脱出パターンを分析。共通点と相違点から、迷宮の本質に迫る洞察を得た。",hp:5,mn:5,inf:22},
        {c:"default",r:"記録を読み返すだけでも有益だった。過去の自分がどう判断したかを振り返り、今回に活かす。",hp:3,mn:3,inf:12}
      ]},
      {t:"まだ見ぬエンディングへのヒントを探す",o:[
        {c:"default",r:"壁の記録の余白に、未到達の結末を示唆する文字列を発見。全てのエンディングを見届けたくなった。",hp:0,mn:5,inf:15}
      ]}
    ]},
  {id:"e163",fl:[3,4,5],tp:"trap",metaCond:(m)=>m.bestFl>=4,
    sit:"以前第四層以降に到達した記憶が蘇る。この罠は見覚えがある──前回は引っかかったが、今回は構造を覚えている。",
    ch:[
      {t:"記憶通りに回避する",o:[
        {c:"inf>20",r:"完璧に覚えていた。罠を無効化し、さらに罠の構造から新しい情報まで読み取った。経験と知識の相乗効果だ。",hp:0,mn:3,inf:18},
        {c:"default",r:"大まかには覚えていた。完全な回避はできなかったが、前回よりダメージは遥かに少ない。",hp:-5,mn:0,inf:8}
      ]},
      {t:"罠を逆用して資源を得る",o:[
        {c:"hp>40",r:"罠の機構を逆転させ、防御装置として利用。さらに罠の素材から情報を抽出。高度な応用だ。",hp:-8,mn:5,inf:15},
        {c:"default",r:"逆用を試みたが機構が複雑すぎた。作動してしまいダメージを受けた。知識がまだ足りない。",hp:-15,mn:-5,inf:5}
      ]}
    ]},

  // ═══ FUSION CHAIN+STAT EVENTS: 呪いの祭壇 (floors 3-5, 3-part) ═══
  {id:"e164",fl:[3,4],tp:"trap",
    sit:"暗い部屋の中央に黒い祭壇。紫の炎が揺れている。祭壇には三つの窪みがあり、血、涙、知識のいずれかを捧げよと文字が刻まれている。近づくと呪いの気配が──",
    ch:[
      {t:"血を捧げる",o:[
        {c:"hp>45",r:"血を垂らすと祭壇が反応。紫の炎が赤く変わり、迷宮の深部の地図が浮かんだ。対価に見合う報酬だ。",hp:-18,mn:3,inf:15,fl:"chain:e165"},
        {c:"default",r:"血が足りない。祭壇が怒りを示し、呪いの霧が噴出。体力不足では供物として不十分だったようだ。",hp:-12,mn:-8,inf:3,fl:"add:呪い"}
      ]},
      {t:"涙を捧げる",o:[
        {c:"mn>40",r:"迷宮での恐怖を思い出し、祭壇に涙を落とした。炎が青く変わり、安全な通路が見えた。精神力が代価となった。",hp:0,mn:-15,inf:12,fl:"chain:e165"},
        {c:"default",r:"涙が出ない。乾ききった精神では供物にならない。祭壇から不気味な笑い声が響く。",hp:-5,mn:-12,inf:2,fl:"add:恐怖"}
      ]},
      {t:"知識を捧げる",o:[
        {c:"inf>30",r:"知識の一部を祭壇に捧げた。炎が金色に変わり、新たな知見が流れ込む。等価交換──いや、それ以上の報酬だ。",hp:3,mn:3,inf:-10,fl:"chain:e165"},
        {c:"default",r:"捧げられるほどの知識がない。祭壇は無反応。時間を無駄にしただけだった。",hp:0,mn:-8,inf:0}
      ]}
    ]},
  {id:"e165",fl:[3,4,5],tp:"trap",chainOnly:true,
    sit:"祭壇が完全に起動した。壁が動き、隠し部屋が現れる。中には古代の遺物──だが祭壇の守護者が立ちはだかる。呪いの力を操る存在だ。",
    ch:[
      {t:"守護者と対峙する",o:[
        {c:"hp>40",r:"体力で押し切った。守護者は崩壊し、遺物の力が身体に流れ込む。呪いの源を断ち切った。",hp:-20,mn:8,inf:12,fl:"chain:e166"},
        {c:"mn>35",r:"精神力で呪いの力を弾いた。守護者が怯んだ隙に遺物を手に取った。",hp:-8,mn:-15,inf:10,fl:"chain:e166"},
        {c:"default",r:"守護者の呪いに抵抗できなかった。吹き飛ばされ、壁に叩きつけられる。遺物には触れられず。",hp:-18,mn:-12,inf:3,fl:"add:呪い"}
      ]},
      {t:"交渉を試みる",o:[
        {c:"inf>28",r:"古代の言葉で語りかけた。守護者が目を丸くする。「…言葉を知る者は久しい」対話の道が開けた。",hp:0,mn:-8,inf:8,fl:"chain:e166"},
        {c:"default",r:"言葉が通じない。守護者は黙って呪いを放った。避けきれず、身体が痺れる。",hp:-10,mn:-15,inf:2,fl:"add:呪い"}
      ]}
    ]},
  {id:"e166",fl:[3,4,5],tp:"encounter",chainOnly:true,
    sit:"遺物──呪いを封じた水晶球。中に小さな影が蠢いている。破壊すれば呪いの力を解放、支配すれば自分の力にできるかもしれない。だが失敗すれば…",
    ch:[
      {t:"水晶球を破壊して呪いを浄化する",o:[
        {c:"hp>35",r:"渾身の力で水晶を砕いた。呪いの力が霧散し、浄化の光が広がる。全ての呪いが消え、身体に力が戻る。",hp:10,mn:10,inf:10,fl:"remove:呪い"},
        {c:"default",r:"水晶を割ったが、呪いの力が暴走。飛散する破片で傷を負い、呪いは部分的にしか消えなかった。",hp:-15,mn:-8,inf:5}
      ]},
      {t:"水晶球を支配して力を得る",o:[
        {c:"mn>45",r:"精神力で水晶内の呪いを制御。呪いが味方となり、暗闇が怖くなくなった。迷宮の一部と融合する感覚。",hp:5,mn:-18,inf:20,fl:"remove:恐怖"},
        {c:"mn>25",r:"部分的に支配に成功。呪いの力の一部を使えるようになったが、精神への負荷は大きい。",hp:0,mn:-15,inf:12},
        {c:"default",r:"支配に失敗。水晶内の呪いが逆流し、精神を蝕む。水晶は砕け散った。",hp:-10,mn:-20,inf:3,fl:"add:混乱"}
      ]},
      {t:"知識で分析してから判断する",o:[
        {c:"inf>35",r:"水晶の構造を完全に理解した。最適な方法で呪いの力を抽出し、制御された形で解放。完璧な処理だ。",hp:5,mn:5,inf:22,fl:"remove:呪い"},
        {c:"default",r:"分析を試みたが、水晶の構造は想像以上に複雑。時間をかけすぎて精神が削られた。",hp:0,mn:-12,inf:8}
      ]}
    ]},

  // ═══ FUSION CHAIN+STAT EVENTS: 時間の部屋 (floors 4-5, 2-part) ═══
  {id:"e167",fl:[4,5],tp:"exploration",
    sit:"時間の流れが歪んだ部屋。過去・現在・未来が同時に存在している。ここでの選択は、全てのステータスに影響を与える。",
    ch:[
      {t:"過去の自分と会話する",o:[
        {c:"hp>40",r:"過去の、まだ元気だった頃の自分と対話。「お前はまだやれる」と励まされ、体力が蘇る。",hp:15,mn:5,inf:5,fl:"chain:e168"},
        {c:"hp<25",r:"過去の元気な自分を見て、今の自分の衰弱を痛感。だが過去の自分が力の一部を分けてくれた。",hp:12,mn:-5,inf:3,fl:"chain:e168"},
        {c:"default",r:"過去の自分との対話は不思議な体験だった。少しだけ元気をもらった。",hp:8,mn:3,inf:5,fl:"chain:e168"}
      ]},
      {t:"未来の自分を覗く",o:[
        {c:"mn>35",r:"精神力で未来を覗いた。そこには生還した自分がいた。「この選択を間違えるな」具体的な助言を得た。",hp:0,mn:-12,inf:20,fl:"chain:e168"},
        {c:"mn<20",r:"精神が弱すぎて、見えた未来は暗闇だった。だがそれ自体が警告──精神力の回復を最優先すべきだ。",hp:0,mn:5,inf:8,fl:"chain:e168"},
        {c:"default",r:"未来は曖昧だったが、方向性は掴めた。完全には見えなくても、ヒントにはなる。",hp:0,mn:-5,inf:12,fl:"chain:e168"}
      ]},
      {t:"現在に集中する",o:[
        {c:"inf>25",r:"時間の歪みの中で、現在の情報を最大限に活用。周囲の構造を完全に把握した。",hp:3,mn:3,inf:15},
        {c:"default",r:"時間の歪みに惑わされず、今この瞬間に集中。混乱を避けて安全に通過した。",hp:0,mn:3,inf:5}
      ]}
    ]},
  {id:"e168",fl:[4,5],tp:"exploration",chainOnly:true,
    sit:"時間の部屋の奥。過去と未来が収束する一点に、時の結晶が浮かんでいる。触れれば自分の一部を書き換えられる──最も弱い部分を、最も強い部分で補える。",
    ch:[
      {t:"体力を犠牲に精神と知識を強化",o:[
        {c:"hp>40",r:"体力の余裕を、精神と知識に変換。バランスの取れた探索者になった。時の結晶が七色に光って消えた。",hp:-15,mn:12,inf:12},
        {c:"default",r:"体力を削りすぎた。変換は成功したが、身体がふらつく。",hp:-12,mn:8,inf:8}
      ]},
      {t:"精神を犠牲に体力と知識を強化",o:[
        {c:"mn>35",r:"精神の強さを体力と知識に変換。鋼の肉体と叡智を得た。精神は消耗したが、後悔はない。",hp:12,mn:-15,inf:12},
        {c:"default",r:"精神を削った代償が重い。変換は部分的にしか成功しなかった。",hp:8,mn:-12,inf:6}
      ]},
      {t:"知識を犠牲に体力と精神を強化",o:[
        {c:"inf>30",r:"蓄積した知識の一部を生命力に変換。身も心も回復した。知識は消えたが、生き残ることが最優先だ。",hp:15,mn:15,inf:-18},
        {c:"default",r:"変換する知識が少なく、効果は限定的。それでも体力と精神が少し回復した。",hp:8,mn:8,inf:-8}
      ]},
      {t:"結晶に触れない",o:[
        {c:"default",r:"リスクを避けた。結晶は静かに消えていった。安全だが、機会は失われた。",hp:0,mn:-3,inf:2}
      ]}
    ]},

  // ═══ FUSION CHAIN+STAT EVENTS: 生ける図書館 (floors 2-4, 3-part) ═══
  {id:"e169",fl:[2,3],tp:"exploration",
    sit:"壁一面の本棚が脈動している。本が自ら開閉し、文字が蠢いている。「生ける図書館」──迷宮が蓄積した全ての知識が詰まった場所。だが知識には対価が必要だ。",
    ch:[
      {t:"本を手に取って読む",o:[
        {c:"inf>20",r:"既存の知識基盤があるおかげで内容を正しく解釈できた。迷宮の設計思想に関する記述──これは貴重だ。",hp:0,mn:-8,inf:18,fl:"chain:e170"},
        {c:"default",r:"本を開いたが、文字が蠢いて読みづらい。断片的な情報しか得られなかったが、それでも有用だ。",hp:0,mn:-10,inf:8,fl:"chain:e170"}
      ]},
      {t:"図書館の管理者を呼ぶ",o:[
        {c:"mn>30",r:"精神力で呼びかけると、本棚の影から知識の精霊が現れた。「何を知りたい？」対話の機会を得た。",hp:0,mn:-5,inf:10,fl:"chain:e170"},
        {c:"default",r:"呼びかけたが応答がない。代わりに一冊の本が足元に落ちてきた。偶然か、導きか。",hp:0,mn:-8,inf:6,fl:"chain:e170"}
      ]},
      {t:"立ち去る",o:[
        {c:"default",r:"知識の誘惑は強いが、ここに長居するのは危険だ。図書館は去る者を追わない。",hp:0,mn:-3,inf:2}
      ]}
    ]},
  {id:"e170",fl:[2,3,4],tp:"exploration",chainOnly:true,
    sit:"図書館の奥に進むと、禁書の棚がある。赤い鎖で封じられた本──読めば強力な知識を得られるが、精神への負荷は計り知れない。",
    ch:[
      {t:"禁書を読む",o:[
        {c:"mn>40",r:"精神力の高さが防壁となり、禁書の内容を制御して読み取れた。迷宮の核心に関する究極の知識──これだけで生還率が跳ね上がる。",hp:0,mn:-20,inf:28,fl:"chain:e171"},
        {c:"mn>25",r:"途中まで読めたが、精神が限界に。急いで本を閉じた。得た知識は膨大だが、頭痛が酷い。",hp:0,mn:-15,inf:18,fl:"chain:e171"},
        {c:"default",r:"開いた瞬間、精神が削られた。一行しか読めず、本が自ら閉じた。「まだ早い」と言わんばかりに。",hp:-5,mn:-12,inf:6,fl:"add:混乱"}
      ]},
      {t:"通常の本をもっと読む",o:[
        {c:"inf>15",r:"禁書は避け、通常の本から情報を最大限に引き出した。リスクなしで得られる知識を効率的に吸収。",hp:0,mn:-5,inf:14},
        {c:"default",r:"通常の本でも十分有用だった。安全な選択で堅実に知識を積み重ねた。",hp:0,mn:-3,inf:8}
      ]}
    ]},
  {id:"e171",fl:[3,4,5],tp:"encounter",chainOnly:true,
    sit:"禁書の知識が波紋を呼んだ。図書館の守護者──巨大な知識の精霊が現れた。「その知識を持ち出すか、ここに返すか。選べ」",
    ch:[
      {t:"知識を持ち出す（守護者と戦う）",o:[
        {c:"hp>35",r:"守護者の攻撃を体力で耐え抜いた。精霊は消え、知識は完全に自分のものとなった。図書館が崩壊を始める中、脱出。",hp:-18,mn:5,inf:15},
        {c:"mn>35",r:"精神力で守護者の攻撃を弾いた。「…見事。その知識はお前に相応しい」守護者が認め、道を開けた。",hp:0,mn:-15,inf:18},
        {c:"default",r:"守護者の力に圧倒された。知識の一部は持ち出せたが、大部分は失われ、身体にも傷を負った。",hp:-15,mn:-12,inf:-5}
      ]},
      {t:"知識を返して平和的に去る",o:[
        {c:"default",r:"禁書の知識を本に戻した。守護者が頷き、代わりに安全な通路と小さな回復の祝福をくれた。",hp:10,mn:10,inf:-8,fl:"remove:混乱"}
      ]},
      {t:"知識を交渉材料にする",o:[
        {c:"inf>30",r:"「この知識の一部と、別の情報を交換しないか」守護者が考え込み、やがて同意。互いに有益な取引が成立した。",hp:3,mn:3,inf:12},
        {c:"default",r:"交渉を試みたが、守護者は無言で首を横に振った。選択を迫られ、仕方なく知識を返した。",hp:0,mn:-5,inf:-5}
      ]}
    ]},

  // ═══ NEW CHAIN EVENTS: 石像の試練 (floors 3-5, 3-part) ═══
  {id:"e172",fl:[3,4],tp:"encounter",
    sit:"三体の石像が並んでいる。戦士、賢者、僧侶。近づくと同時に目が光り、「一体を選べ。試練を与える」と響いた。",
    ch:[
      {t:"戦士の石像を選ぶ",o:[
        {c:"hp>40",r:"戦士の試練──力比べ。体力に自信がある。石の拳を受け止め、押し返した。「合格」石像が道を開けた。",hp:-12,mn:5,inf:5,fl:"chain:e173"},
        {c:"default",r:"石の拳が重い。弾き飛ばされたが、立ち上がった。「…不合格だが、根性は認める」傷だらけで次の試練へ。",hp:-20,mn:-5,inf:3,fl:"chain:e173"}
      ]},
      {t:"賢者の石像を選ぶ",o:[
        {c:"inf>28",r:"賢者の試練──謎解き。三つの問いに全て正解。「素晴らしい」石像が貴重な情報を授けてくれた。",hp:0,mn:-8,inf:18,fl:"chain:e173"},
        {c:"default",r:"問いの二つ目で詰まった。「惜しい」と賢者。部分的な情報だけ得て、次の試練へ。",hp:0,mn:-12,inf:8,fl:"chain:e173"}
      ]},
      {t:"僧侶の石像を選ぶ",o:[
        {c:"mn>35",r:"僧侶の試練──恐怖への耐性。幻覚の嵐を精神力で耐え抜いた。「見事な精神力」癒しの光が降り注ぐ。",hp:10,mn:-10,inf:5,fl:"chain:e173"},
        {c:"default",r:"幻覚に飲まれかけた。途中で正気を取り戻したが、精神は大きく削られた。",hp:3,mn:-18,inf:3,fl:"chain:e173"}
      ]}
    ]},
  {id:"e173",fl:[3,4,5],tp:"encounter",chainOnly:true,
    sit:"最初の試練を超えた。石像たちが動き、部屋の構造が変わる。「二つ目の試練──先ほど選ばなかったものから一つ」",
    ch:[
      {t:"戦士の試練に挑む",o:[
        {c:"hp>35",r:"二つ目の試練も体力で突破。「二つの力を持つ者よ」石像が感嘆。最終試練への扉が開く。",hp:-15,mn:3,inf:5,fl:"chain:e174"},
        {c:"default",r:"一つ目の試練で消耗した状態での力比べは厳しい。だが歯を食いしばって耐え抜いた。",hp:-18,mn:-5,inf:3,fl:"chain:e174"}
      ]},
      {t:"賢者の試練に挑む",o:[
        {c:"inf>25",r:"知識で回答。二つの試練を知恵で通過。「多才な者だ」賢者が微笑む。最終試練へ。",hp:0,mn:-5,inf:12,fl:"chain:e174"},
        {c:"default",r:"難問に苦戦。時間をかけて何とか正解を導き出した。精神的な消耗が大きい。",hp:0,mn:-12,inf:6,fl:"chain:e174"}
      ]},
      {t:"僧侶の試練に挑む",o:[
        {c:"mn>30",r:"精神の試練を二つ超えた。「揺るがぬ心だ」僧侶が認める。身体が軽くなり、最終試練へ。",hp:5,mn:-12,inf:5,fl:"chain:e174"},
        {c:"default",r:"二連続の精神試練は過酷。幻覚と戦いながら、辛うじて正気を保った。",hp:0,mn:-15,inf:3,fl:"chain:e174"}
      ]}
    ]},
  {id:"e174",fl:[3,4,5],tp:"encounter",chainOnly:true,
    sit:"三体の石像が融合し、巨大な守護者となった。「最終試練──全てを統合せよ。力・知・心の全てで応えよ」",
    ch:[
      {t:"全力で立ち向かう",o:[
        {c:"hp>30",r:"体力・知識・精神の全てを出し切った。守護者が崩壊し、中から古代の宝珠が現れた。全ステータスが強化される。",hp:-10,mn:-8,inf:-5},
        {c:"default",r:"力尽きかけたが、最後の一撃で守護者にヒビが入った。「…合格だ」完全勝利ではないが、報酬は得た。",hp:-15,mn:-10,inf:8}
      ]},
      {t:"知恵で守護者の弱点を突く",o:[
        {c:"inf>30",r:"二つの試練で学んだ守護者の構造的弱点を突いた。最小限の力で最大の効果。「これが真の強さか…」守護者が認め、膝をついた。",hp:0,mn:-5,inf:20},
        {c:"default",r:"弱点を狙ったが完全には当たらない。長期戦の末、何とか打ち破った。消耗は激しい。",hp:-12,mn:-12,inf:10}
      ]},
      {t:"心で語りかける",o:[
        {c:"mn>40",r:"「お前たちの試練は受けた。もう十分だろう」精神力で守護者の意志に直接語りかけた。守護者が涙を流し、全ての祝福を授けた。",hp:8,mn:-12,inf:15,fl:"remove:恐怖"},
        {c:"default",r:"語りかけたが、守護者は理解しなかった。最終的に体力勝負で何とかしのいだ。",hp:-18,mn:-8,inf:5}
      ]}
    ]},

  // ═══ NEW CHAIN EVENTS: 深淵の井戸 (floors 4-5, 2-part) ═══
  {id:"e175",fl:[4,5],tp:"exploration",
    sit:"底の見えない井戸。覗き込むと、深淵がこちらを覗き返している。井戸の縁に文字「声をかければ応える。何を問うか」",
    ch:[
      {t:"「出口はどこだ」と問う",o:[
        {c:"inf>25",r:"井戸が唸り、脱出ルートの映像が水面に映った。知識があるからこそ、映像を正確に読み取れた。",hp:0,mn:-10,inf:22,fl:"chain:e176"},
        {c:"default",r:"映像が映ったが、曖昧で理解できない。断片的な情報のみ。知識不足が悔やまれる。",hp:0,mn:-8,inf:8,fl:"chain:e176"}
      ]},
      {t:"「自分は生き延びられるか」と問う",o:[
        {c:"mn>30",r:"井戸の答え──「お前次第だ」。だがその声と共に、現在の体の状態を正確に把握できた。精神力のおかげで深淵に飲まれなかった。",hp:5,mn:-12,inf:10,fl:"chain:e176"},
        {c:"default",r:"「難しいだろう」と冷たい声。精神が大きく揺さぶられた。だが知りたくなかったわけではない。",hp:0,mn:-18,inf:5,fl:"chain:e176"}
      ]},
      {t:"井戸に触れない",o:[
        {c:"default",r:"深淵と対話するリスクを回避。安全だが、井戸はゆっくりと地面に沈んでいった。機会は二度と来ない。",hp:0,mn:-3,inf:2}
      ]}
    ]},
  {id:"e176",fl:[4,5],tp:"encounter",chainOnly:true,
    sit:"井戸の深淵から腕が伸びてきた。掴むか、退くか。腕の先には光る何かが握られている。",
    ch:[
      {t:"腕を掴んで引き上げる",o:[
        {c:"hp>35",r:"全力で引いた。腕の主は迷宮に囚われた過去の探索者の魂。感謝と共に、持っていた迷宮の鍵を渡してくれた。",hp:-10,mn:8,inf:18},
        {c:"default",r:"引こうとしたが力負け。逆に引きずり込まれかけた。辛うじて振りほどいたが、腕が握っていた何かは井戸に落ちた。",hp:-15,mn:-10,inf:3}
      ]},
      {t:"光るものだけ奪い取る",o:[
        {c:"inf>28",r:"腕の構造から、光るものの位置を正確に把握。素早く奪い取った。迷宮の深層地図の断片だ。",hp:-5,mn:-5,inf:20},
        {c:"default",r:"掴もうとした瞬間、腕が締め付けてきた。何とか光るものを掴んだが、手が痺れている。",hp:-12,mn:-8,inf:12}
      ]},
      {t:"退いて様子を見る",o:[
        {c:"mn>30",r:"冷静に観察した。腕は一定時間後に引っ込み、光るものだけが残された。焦らない者が勝つ。",hp:0,mn:-5,inf:15},
        {c:"default",r:"退いたら腕も光るものも消えた。安全だが、得るものはなかった。",hp:0,mn:-5,inf:2}
      ]}
    ]},

  // ═══ ADDITIONAL STAT-REACTIVE EVENTS WAVE 4 ═══
  {id:"e177",fl:[1,2,3],tp:"encounter",
    sit:"迷宮の壁に埋め込まれた宝石。赤・青・金の三色に輝いている。一つだけ取り外せるが、選択を間違えれば罠が作動する。",
    ch:[
      {t:"赤い宝石（体力系）を取る",o:[
        {c:"hp<30",r:"体力が枯渇している今、赤い宝石が最も必要だ。手に取ると温かさが広がり、傷が癒えていく。正解だ。",hp:18,mn:3,inf:0},
        {c:"hp>50",r:"体力は十分あるが赤を選んだ。宝石は輝きを失い、罰としてHPが少し削られた。必要としない者には与えないようだ。",hp:-8,mn:0,inf:3},
        {c:"default",r:"赤い宝石を取った。程々の回復。必要度に応じた反応のようだ。",hp:10,mn:0,inf:2}
      ]},
      {t:"青い宝石（精神系）を取る",o:[
        {c:"mn<25",r:"精神が限界に近い。青い宝石が呼んでいるのが分かった。触れた瞬間、心に静寂が戻った。",hp:0,mn:18,inf:0,fl:"remove:恐怖"},
        {c:"mn>45",r:"精神は安定している。青い宝石は冷たいだけで何も起こらなかった。余裕のある者には力を貸さないらしい。",hp:0,mn:-5,inf:3},
        {c:"default",r:"青い宝石が精神を安定させた。程々の回復だが、助かった。",hp:0,mn:10,inf:2}
      ]},
      {t:"金の宝石（情報系）を取る",o:[
        {c:"inf<15",r:"情報が圧倒的に不足。金の宝石が強く輝き、迷宮の構造情報が頭に流れ込んだ。知識飢餓が一気に解消された。",hp:0,mn:0,inf:20},
        {c:"inf>35",r:"知識は十分ある。金の宝石は暗く沈み、僅かな情報しか与えなかった。",hp:0,mn:0,inf:3},
        {c:"default",r:"金の宝石から情報を得た。適度な量の知識が流入。",hp:0,mn:0,inf:12}
      ]}
    ]},
  {id:"e178",fl:[2,3,4],tp:"trap",
    sit:"部屋の中央に三つの扉。扉には文字が刻まれている──「強者」「知者」「忍耐者」。扉の向こうにはそれぞれ異なる試練が待っている。",
    ch:[
      {t:"「強者」の扉を開ける",o:[
        {c:"hp>50",r:"力の試練。重い石を動かし通路を作る。体力に余裕があったため容易に突破。報酬として精神の回復を得た。",hp:-10,mn:12,inf:5},
        {c:"hp>30",r:"何とか石を動かしたが、腕と背中が悲鳴を上げている。通過はできたが体はボロボロ。",hp:-18,mn:5,inf:3},
        {c:"default",r:"石が重すぎる。何度も挑んだが動かない。諦めて戻る途中に罠が作動。",hp:-15,mn:-8,inf:0,fl:"add:負傷"}
      ]},
      {t:"「知者」の扉を開ける",o:[
        {c:"inf>30",r:"暗号の試練。三層構造の暗号を完全に解読。扉が開き、迷宮の設計図の一部が報酬として得られた。",hp:0,mn:5,inf:18},
        {c:"inf>15",r:"暗号の一層目は解けた。二層目で躓いたが、部分点として通路だけは開けてもらえた。",hp:0,mn:-5,inf:10},
        {c:"default",r:"暗号が全く分からない。適当に入力したら罰の電撃が走った。",hp:-10,mn:-10,inf:2}
      ]},
      {t:"「忍耐者」の扉を開ける",o:[
        {c:"mn>40",r:"恐怖に耐える試練。幻影の群れが襲いかかるが、精神力で平然と耐え抜いた。「見事」全ての幻影が消え、豊富な報酬が。",hp:8,mn:-12,inf:12},
        {c:"mn>20",r:"恐怖の幻影に耐えたが、途中で声を上げてしまった。不完全な通過だが、報酬は一部得られた。",hp:3,mn:-15,inf:5},
        {c:"default",r:"幻影に耐えきれず絶叫。試練失敗。罰として恐怖の刻印を刻まれた。",hp:0,mn:-18,inf:0,fl:"add:恐怖"}
      ]}
    ]},
  {id:"e179",fl:[3,4,5],tp:"encounter",
    sit:"自分の影が実体化して語りかけてくる。「お前の中で最も弱い部分を教えてやる」影はこちらのステータスを見透かしている。",
    ch:[
      {t:"影の指摘を受け入れる",o:[
        {c:"hp<25",r:"「体が限界だろう」影が体力の弱さを指摘。受け入れると、影が力の一部を分けてくれた。弱さを認めることが強さ。",hp:15,mn:3,inf:5},
        {c:"mn<25",r:"「心が折れかけている」影が精神の弱さを指摘。認めると、影が精神力を補填。弱さの自覚が回復の第一歩。",hp:0,mn:15,inf:5},
        {c:"inf<15",r:"「何も知らないな」影が知識の不足を指摘。認めると、影が基本知識を授けてくれた。謙虚さが学びを呼ぶ。",hp:3,mn:3,inf:15},
        {c:"default",r:"影が弱点を探したが見つからない。「…バランスが取れている。面白くない」影が不機嫌に消えた。小さな報酬のみ。",hp:3,mn:3,inf:5}
      ]},
      {t:"影を否定する",o:[
        {c:"mn>35",r:"「弱い部分などない」と言い切った。精神力の強さに影が怯んだ。だが嘘は精神を蝕む──本当に弱点はないのか？",hp:0,mn:-10,inf:8},
        {c:"default",r:"否定したが影は笑うだけ。「嘘つきめ」と囁き、精神を削って消えた。",hp:0,mn:-15,inf:3}
      ]}
    ]},
  {id:"e180",fl:[1,2],tp:"exploration",
    sit:"壁の隙間に小さな光。手を入れるか迷う。光は暖かそうだが、隙間の奥に何があるか分からない。",
    ch:[
      {t:"手を入れて光を掴む",o:[
        {c:"hp>35",r:"手を突っ込んだ。何かに刺されたが、光を掴んだ。小さな結晶──体力があったから痛みに耐えられた。情報を含む結晶だ。",hp:-8,mn:3,inf:12},
        {c:"inf>18",r:"光の正体を知識から推測。結晶の可能性が高い。慎重に手を入れ、安全に回収。知識があれば危険は減る。",hp:0,mn:0,inf:14},
        {c:"default",r:"手を入れた瞬間、何かに噛まれた。痛い。光は虫の発光だった。迷宮に騙された。",hp:-10,mn:-5,inf:2}
      ]},
      {t:"棒で突いてみる",o:[
        {c:"default",r:"近くの石で隙間を突いた。光が転がり出てきた。小さな発光キノコ。食べると少し体力が回復した。",hp:5,mn:0,inf:3}
      ]}
    ]},
  {id:"e181",fl:[2,3,4],tp:"rest",
    sit:"安全な空間に辿り着いた。だが完全な休息にはリスクがある──眠ると体力は回復するが、精神は夢に蝕まれる可能性がある。",
    ch:[
      {t:"深く眠る",o:[
        {c:"hp<30",r:"限界の体を横たえた。深い眠りの中で傷が癒えていく。夢は見なかった──疲労が夢さえも遠ざけた。",hp:20,mn:0,inf:0},
        {c:"mn>30",r:"精神力があるので悪夢を制御できた。良質な睡眠で体力も精神も回復。",hp:12,mn:5,inf:0},
        {c:"default",r:"眠ったが悪夢にうなされた。体力は回復したものの、精神が削られた。",hp:12,mn:-8,inf:0,fl:"add:恐怖"}
      ]},
      {t:"浅い休息だけ取る",o:[
        {c:"default",r:"壁にもたれて目を閉じた。完全な休息ではないが、体と心が少しだけ楽になった。",hp:6,mn:4,inf:0}
      ]},
      {t:"休息せず周囲を調べる",o:[
        {c:"inf>20",r:"休息より情報を優先。安全な空間だからこそ、ゆっくり壁の文字を読み解けた。貴重な発見だ。",hp:0,mn:-5,inf:16},
        {c:"default",r:"周囲を調べたが有益な情報はなかった。休息も取れず、体力だけが減っていく。",hp:-3,mn:-5,inf:3}
      ]}
    ]},
  {id:"e182",fl:[3,4,5],tp:"encounter",
    sit:"天井から降ってきた砂時計。砂が落ちきるまでに決断しなければならない。三つの通路──赤、青、金。時間がない。直感か、知識か、体力か。",
    ch:[
      {t:"赤の通路（体力で突破）",o:[
        {c:"hp>45",r:"赤の通路は炎の回廊。だが体力で駆け抜けた。砂時計が割れ、時間の束縛から解放された。",hp:-12,mn:5,inf:5},
        {c:"default",r:"炎に焼かれながら走った。通過はできたが、全身に火傷を負った。",hp:-20,mn:-5,inf:2,fl:"add:負傷"}
      ]},
      {t:"青の通路（精神で耐える）",o:[
        {c:"mn>40",r:"青の通路は精神の回廊。恐怖の幻影が襲うが、精神力で一蹴。砂時計を手に取り、情報源として活用。",hp:0,mn:-12,inf:15},
        {c:"default",r:"幻影に怯えながらも走り抜けた。砂時計が割れる音と共に、恐怖が消えた。代償は大きいが。",hp:0,mn:-18,inf:5}
      ]},
      {t:"金の通路（知識で解読）",o:[
        {c:"inf>30",r:"金の通路は暗号の回廊。壁の文字を走りながら読み取り、全ての罠を無効化。知識こそ最速の道。",hp:0,mn:-5,inf:18},
        {c:"default",r:"暗号が読みきれず、いくつかの罠に引っかかった。それでも通過できただけまし。",hp:-10,mn:-8,inf:8}
      ]}
    ]},
  {id:"e183",fl:[1,2,3],tp:"trap",
    sit:"床が透明になり、下に無数の歯車が見える。一歩踏み出すたびに歯車が動き、通路の構造が変わっていく。計算しながら進まないと永遠に彷徨うことになる。",
    ch:[
      {t:"歯車のパターンを計算して進む",o:[
        {c:"inf>22",r:"歯車の回転周期を計算。最短ルートを導き出し、無駄なく通過。知識がなければ不可能な芸当。",hp:0,mn:-5,inf:14},
        {c:"default",r:"計算を試みたが、変数が多すぎる。試行錯誤の末、なんとか通過。時間と精神を大きく消耗した。",hp:-5,mn:-12,inf:5}
      ]},
      {t:"直感と体力で強引に突破",o:[
        {c:"hp>40",r:"考えるより走る。歯車に挟まれそうになりながらも、体力で押し切った。知性は足りなくても肉体が補う。",hp:-12,mn:0,inf:3},
        {c:"default",r:"歯車に腕を挟まれた。引き抜けたが、傷が深い。力技にも限界がある。",hp:-18,mn:-5,inf:1,fl:"add:負傷"}
      ]},
      {t:"じっとして歯車が止まるのを待つ",o:[
        {c:"mn>30",r:"焦らず観察。一定時間後に歯車が停止するパターンを発見。待つという選択が最善だった。",hp:0,mn:-8,inf:10},
        {c:"default",r:"待ったが歯車は止まらない。焦りが精神を蝕む。結局走って突破するしかなかった。",hp:-10,mn:-12,inf:2}
      ]}
    ]},
  {id:"e184",fl:[4,5],tp:"encounter",
    sit:"自分の体の中から声がする。「もう限界だ」「いや、まだやれる」体と心が分裂しかけている。統合しなければ崩壊する。",
    ch:[
      {t:"体を優先する",o:[
        {c:"hp>40",r:"体力が充実している。「体が動くうちは戦える」身体を優先したら心も追いついてきた。",hp:5,mn:8,inf:3},
        {c:"hp<25",r:"限界の体を優先して休ませた。心は文句を言ったが、体が動かなければ何もできない。",hp:10,mn:-8,inf:0},
        {c:"default",r:"体を労った。完全な統合ではないが、身体と精神のバランスが少し改善した。",hp:5,mn:3,inf:2}
      ]},
      {t:"心を優先する",o:[
        {c:"mn>35",r:"精神が強ければ体は従う。心を落ち着かせたら、体の痛みも軽減された。心身一体。",hp:8,mn:5,inf:3},
        {c:"mn<20",r:"限界の精神を優先して立て直した。体は痛むが、心が折れていないなら動ける。",hp:-5,mn:12,inf:0},
        {c:"default",r:"心の声に耳を傾けた。「まだ終わらない」その決意が体にも伝わった。",hp:3,mn:5,inf:2}
      ]},
      {t:"知識で体と心を仲裁する",o:[
        {c:"inf>25",r:"身体と精神のメカニズムを理解している。両方に最適な配分でエネルギーを回す。完璧な統合。",hp:5,mn:5,inf:5},
        {c:"default",r:"理屈で解決しようとしたが、体と心は理屈で動かない。小さな妥協で何とか折り合いをつけた。",hp:2,mn:2,inf:3}
      ]}
    ]},

  // ═══ FLOOR 5 EXPANSION: 最深部専用イベント ═══
  {id:"e185",fl:[5],tp:"encounter",
    sit:"最深部の空気が変わった。壁から微かに光が漏れている──出口が近い証拠だ。だが、最後の試練が待ち構えている。影のような存在が通路を塞いでいる。",
    ch:[
      {t:"正面から突破する",o:[
        {c:"hp>40",r:"全力で突進。影が刃を振るうが、体力で受け止め、押し切った。出口への道が開けた。",hp:-18,mn:5,inf:5},
        {c:"default",r:"正面からは無謀だった。影の一撃をもろに受けたが、辛うじて通過。",hp:-25,mn:-8,inf:3}
      ]},
      {t:"精神力で影を消す",o:[
        {c:"mn>40",r:"「お前は私の恐怖が生んだ幻だ」精神力で影の正体を見破った。影は消え、道が開けた。",hp:0,mn:-15,inf:12},
        {c:"default",r:"影は幻ではなかった。精神攻撃は通用せず、逆に恐怖を植え付けられた。",hp:-8,mn:-20,inf:3,fl:"add:恐怖"}
      ]},
      {t:"情報から弱点を導き出す",o:[
        {c:"inf>35",r:"蓄積した知識から影の弱点を特定。光源を利用して影を消滅させた。知識こそが最強の武器。",hp:0,mn:-5,inf:15},
        {c:"default",r:"弱点を探したが時間がかかり、影の攻撃を受けてしまった。",hp:-15,mn:-10,inf:8}
      ]}
    ]},
  {id:"e186",fl:[5],tp:"trap",
    sit:"最深部の罠──天井と床が同時に迫ってくる。壁には小さな穴が等間隔で開いている。脱出方法は複数あるが、時間がない。",
    ch:[
      {t:"穴に身体をねじ込んで逃げる",o:[
        {c:"hp>35",r:"狭い穴に身体を押し込んだ。骨が軋むが、何とか通過。反対側に出ると、罠は止まった。",hp:-12,mn:3,inf:3},
        {c:"default",r:"穴に入ろうとしたが、途中で挟まった。圧迫されながら何とか抜け出したが、重傷を負った。",hp:-22,mn:-5,inf:0,fl:"add:負傷"}
      ]},
      {t:"壁の文字を読んで解除する",o:[
        {c:"inf>32",r:"壁に刻まれた解除コードを瞬時に解読。天井が止まり、安全に通過できた。最深部の罠すら知識で制する。",hp:0,mn:-3,inf:12},
        {c:"default",r:"文字を読もうとしたが間に合わない。慌てて飛び出し、ギリギリで挟まれずに済んだ。",hp:-10,mn:-10,inf:5}
      ]},
      {t:"精神を集中し最適な判断を下す",o:[
        {c:"mn>35",r:"パニックにならず冷静に分析。穴のサイズ、天井の速度、自分の体格。最適解を導き、余裕を持って脱出。",hp:-3,mn:-12,inf:8},
        {c:"default",r:"焦って判断を誤った。何とか脱出したが、精神的なダメージが大きい。",hp:-8,mn:-18,inf:2}
      ]}
    ]},
  {id:"e187",fl:[5],tp:"exploration",
    sit:"最深部に古代の祭壇がある。祭壇の上に三つの石板。それぞれに「身体」「精神」「知識」と刻まれている。ここで最後の強化ができそうだ。",
    ch:[
      {t:"「身体」の石板に触れる",o:[
        {c:"hp<30",r:"枯渇した体力に生命力が流れ込む。最も弱い部分を補う──祭壇の慈悲だ。",hp:20,mn:0,inf:0},
        {c:"default",r:"体力が強化された。最深部での戦いに備え、鋼の肉体を得る。",hp:12,mn:0,inf:3}
      ]},
      {t:"「精神」の石板に触れる",o:[
        {c:"mn<25",r:"崩壊寸前の精神が立て直された。祭壇が最も弱い者を救う。まだ戦える。",hp:0,mn:18,inf:0,fl:"remove:恐怖"},
        {c:"default",r:"精神が研ぎ澄まされた。最深部の恐怖にも動じない心を得た。",hp:0,mn:10,inf:3}
      ]},
      {t:"「知識」の石板に触れる",o:[
        {c:"inf<20",r:"知識不足が一気に解消。祭壇に蓄積された迷宮の情報が流れ込む。",hp:0,mn:0,inf:20},
        {c:"default",r:"更なる知識が加わった。迷宮の全体像が鮮明になっていく。",hp:0,mn:0,inf:12}
      ]}
    ]},
  {id:"e188",fl:[5],tp:"rest",
    sit:"最深部に奇跡的な安全地帯。温かい光が差し込み、心身が安らぐ。出口は近い──最後の休息を取るか、情報収集に充てるか。",
    ch:[
      {t:"心身を全力で休ませる",o:[
        {c:"hp<25",r:"瀕死の体を横たえた。温かい光が傷を癒す。奇跡的な回復──最後の戦いに備えよ。",hp:22,mn:8,inf:0,fl:"remove:負傷"},
        {c:"mn<25",r:"疲弊した精神が光に包まれる。心の傷が癒えていく。もう少しだ。",hp:5,mn:18,inf:0,fl:"remove:恐怖"},
        {c:"default",r:"体も心も十分に休めた。最後の安息──これが終わればもう休めない。",hp:10,mn:8,inf:2}
      ]},
      {t:"周囲を調査して情報を集める",o:[
        {c:"inf>25",r:"安全地帯の壁に出口への詳細な案内図が。知識基盤があるからこそ読み解ける。完璧な準備が整った。",hp:3,mn:3,inf:18},
        {c:"default",r:"壁の模様を調べたが、有益な情報は限られていた。それでも出口の方向は掴めた。",hp:0,mn:-3,inf:8}
      ]}
    ]},
  {id:"e189",fl:[4,5],tp:"rest",
    sit:"地下水脈に辿り着いた。清流が暗闇の中で青く光っている。水に触れると傷が癒える感覚があるが、飲むと幻覚が見えるという噂もある。",
    ch:[
      {t:"傷口を水で洗う",o:[
        {c:"status:負傷",r:"清流が傷口に沁みる。だが痛みの後、驚くほど傷が塞がった。地下水脈の浄化力は本物だ。",hp:15,mn:3,inf:0,fl:"remove:負傷"},
        {c:"status:出血",r:"止まらなかった出血が、水に触れた途端止まった。この水には特別な力がある。",hp:10,mn:3,inf:0,fl:"remove:出血"},
        {c:"default",r:"傷口を洗った。清流の冷たさが心地よく、体力が回復した。",hp:10,mn:3,inf:2}
      ]},
      {t:"一口飲む",o:[
        {c:"mn>30",r:"冷たい水が喉を通る。精神が澄み渡り、迷宮の構造がクリアに見えた。幻覚ではない──真実の視界だ。",hp:5,mn:5,inf:12},
        {c:"default",r:"飲んだ瞬間、視界が歪んだ。美しい幻覚の後、頭痛が残った。飲むべきではなかった。",hp:3,mn:-10,inf:5,fl:"add:混乱"}
      ]},
      {t:"水を持って行く",o:[
        {c:"default",r:"手で掬って持ち歩く。この先で必要になるかもしれない。僅かだが安心感がある。",hp:5,mn:5,inf:0}
      ]}
    ]},
  {id:"e190",fl:[5],tp:"encounter",
    sit:"最深部で鏡に映った自分と再会。だが鏡の中の自分は、全てのステータスが反転している──弱い部分が強く、強い部分が弱い。",
    ch:[
      {t:"鏡の自分と融合する",o:[
        {c:"hp>35",r:"融合を試みた。体力がある分、精神面が補完された。バランスの取れた状態に近づいた。",hp:-8,mn:12,inf:5},
        {c:"mn>35",r:"精神力がある分、体力面が補完された。鏡の自分と一つになり、全能感が湧く。",hp:12,mn:-8,inf:5},
        {c:"default",r:"融合は不完全だった。それでも、自分の弱点を客観的に理解できた。",hp:3,mn:3,inf:8}
      ]},
      {t:"鏡の自分から情報を得る",o:[
        {c:"inf>28",r:"鏡の自分は別の視点から迷宮を見ている。二つの視点を統合し、出口への最短経路を導出した。",hp:0,mn:-5,inf:18},
        {c:"default",r:"鏡の自分が何か伝えようとしているが、はっきり聞こえない。断片的な情報だけ得た。",hp:0,mn:-8,inf:8}
      ]},
      {t:"鏡を割る",o:[
        {c:"hp>30",r:"鏡を砕いた。破片が光となって散り、周囲を照らす。隠し通路が見えた。",hp:-5,mn:3,inf:10},
        {c:"default",r:"鏡を割ったが、破片で手を切った。光は一瞬だけ周囲を照らした。",hp:-10,mn:-3,inf:5}
      ]}
    ]},

  // ═══ FLOOR 4-5 CROSSRUN EXPANSION ═══
  {id:"e191",fl:[4,5],tp:"encounter",metaCond:(m)=>m.lastRun?.cause==="escape",
    sit:"前回の脱出ルートの痕跡が残っている。自分が通った道の空気が微かに違う──生還者だけが感じる残り香。このルートは知っている。",
    ch:[
      {t:"前回のルートを辿る",o:[
        {c:"inf>25",r:"前回の記憶と現在の知識を組み合わせた。ルートは変化しているが、構造のパターンは同じ。効率的に進めた。",hp:0,mn:5,inf:18},
        {c:"default",r:"前回のルートは部分的に変わっていた。それでも知っている部分は確実に通過できた。",hp:0,mn:3,inf:10}
      ]},
      {t:"前回とは違うルートで新発見を狙う",o:[
        {c:"hp>35",r:"未知の通路に踏み込んだ。前回の脱出者としての余裕が、冒険心を後押しする。新しい発見だ。",hp:-10,mn:5,inf:15},
        {c:"default",r:"新しいルートは予想以上に過酷だった。だが前回の経験が精神的な支えになった。",hp:-12,mn:-5,inf:8}
      ]}
    ]},
  {id:"e192",fl:[4,5],tp:"exploration",metaCond:(m)=>(m.clearedDiffs?.length??0)>=2,
    sit:"複数の難易度をクリアした者にだけ開く隠し部屋。壁に各難易度の攻略情報が網羅されている。迷宮が「熟練者」として認定した証。",
    ch:[
      {t:"攻略情報を全て吸収する",o:[
        {c:"mn>30",r:"膨大な情報を精神力で受け止めた。全難易度の罠配置、敵配置、最適ルート──全てが頭に入った。",hp:0,mn:-12,inf:25},
        {c:"default",r:"情報量が多すぎて全ては吸収できない。優先度の高い情報だけ選んで記憶した。",hp:0,mn:-15,inf:15}
      ]},
      {t:"体力回復を優先する",o:[
        {c:"default",r:"隠し部屋の安全な環境で休息。情報は二の次──まず生き残ることが大事だ。",hp:12,mn:8,inf:5}
      ]}
    ]},
  {id:"e193",fl:[4,5],tp:"encounter",metaCond:(m)=>(m.totalDeaths??0)>=5,
    sit:"何度も死んだ記憶が、この場所に残留思念として染みついている。自分の死体の幻影が語りかける。「もう何度目だ？」",
    ch:[
      {t:"幻影から教訓を聞く",o:[
        {c:"mn>25",r:"幻影は過去の全ての死因を語った。「同じ死に方はするな」具体的な回避方法まで教えてくれた。死は最大の教師。",hp:0,mn:-8,inf:20},
        {c:"default",r:"幻影の話は重く精神に響いた。だが得た知識は確実に生存率を上げる。",hp:0,mn:-15,inf:15}
      ]},
      {t:"幻影を振り切って進む",o:[
        {c:"hp>30",r:"「過去は振り返らない」自分の死体を踏み越えて前に進んだ。精神的に楽になった。",hp:-5,mn:8,inf:3},
        {c:"default",r:"幻影が追いすがる。必死に走って振り切ったが、精神的な消耗が大きい。",hp:-8,mn:-10,inf:2}
      ]}
    ]},

  // ═══ ADDITIONAL FLOOR 4-5 REST & STAT EVENTS ═══
  {id:"e194",fl:[4],tp:"rest",
    sit:"壁の隙間から暖かい風。奥に小さな洞窟がある。中は安全そうだが、入り口が狭く一度入ると出にくい。",
    ch:[
      {t:"洞窟で休む",o:[
        {c:"hp<35",r:"体を縮めて洞窟に入った。暖かい風に包まれ、深い眠りに落ちた。体力が大きく回復。",hp:18,mn:5,inf:0},
        {c:"default",r:"暖かい洞窟で休息。完全な回復ではないが、この環境では贅沢だ。",hp:10,mn:5,inf:0}
      ]},
      {t:"風の出どころを調べる",o:[
        {c:"inf>22",r:"暖かい風は地下の熱源から来ている。この情報から迷宮の構造を逆算。出口に近い方角が判明した。",hp:0,mn:-3,inf:15},
        {c:"default",r:"風の方向を記憶した。確証はないが、出口の方向の手がかりになるかもしれない。",hp:0,mn:-5,inf:6}
      ]}
    ]},
  {id:"e195",fl:[5],tp:"exploration",
    sit:"最深部の壁に埋め込まれた巨大な時計。針が逆回転している。時計の下に「解読すれば最短経路を示す」と刻まれている。",
    ch:[
      {t:"時計の暗号を解読する",o:[
        {c:"inf>30",r:"針の動きは暗号。回転パターンから座標を算出──出口への最短経路が判明。全ての謎が解けた。",hp:0,mn:-5,inf:20},
        {c:"inf>18",r:"部分的に解読。最短ではないが、有効なルートの候補が絞れた。",hp:0,mn:-8,inf:12},
        {c:"default",r:"暗号が複雑すぎる。長時間見つめた結果、精神だけが消耗した。",hp:0,mn:-12,inf:3}
      ]},
      {t:"時計を壊して部品を調べる",o:[
        {c:"hp>30",r:"力任せに時計を破壊。内部機構に迷宮のマッピングデータが刻まれていた。別のアプローチが功を奏した。",hp:-8,mn:3,inf:15},
        {c:"default",r:"壊したが、部品が散らばって情報が断片化。わずかな手がかりだけ得た。",hp:-10,mn:-5,inf:5}
      ]}
    ]},
  {id:"e196",fl:[5],tp:"trap",
    sit:"出口が見える──だが手前に光の壁。触れるとステータスが変動するランダムフィールド。突っ切るか、迂回路を探すか。",
    ch:[
      {t:"一気に突っ切る",o:[
        {c:"hp>45",r:"光の壁を体力で強行突破。激しい痛みの後、反対側に出た。出口まであと少し。",hp:-18,mn:-8,inf:0},
        {c:"default",r:"突っ切ったが、光が体力を大幅に奪った。這うようにして反対側へ。",hp:-25,mn:-10,inf:0}
      ]},
      {t:"光の法則を分析して安全に通過",o:[
        {c:"inf>35",r:"光の壁の波動パターンを分析。安全なタイミングで通過。無傷。これが知識の力だ。",hp:0,mn:-5,inf:10},
        {c:"inf>20",r:"パターンの一部を解読して通過。小さなダメージで済んだ。完全ではないが十分。",hp:-5,mn:-5,inf:8},
        {c:"default",r:"分析が追いつかない。適当なタイミングで飛び込んだら、案外軽傷で済んだ。",hp:-10,mn:-5,inf:3}
      ]},
      {t:"迂回路を探す",o:[
        {c:"mn>30",r:"冷静に周囲を観察。壁の隙間から迂回路を発見。時間はかかったが安全に通過。焦らない者が勝つ。",hp:-3,mn:-8,inf:8},
        {c:"default",r:"迂回路を探したが見つからない。結局突っ切るしかなかった。",hp:-15,mn:-8,inf:2}
      ]}
    ]},
];

const EVENTS = validateEvents(EV);

// ============================================================
// §7. CSS
// ============================================================

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#0a0a18;--card:rgba(14,14,28,0.92);--border:rgba(80,80,130,0.2);--text:#d0d0e0;--dim:#7878a0;--bright:#f0f0ff;--sans:-apple-system,BlinkMacSystemFont,'Segoe UI','Hiragino Sans',sans-serif;--serif:Georgia,'Hiragino Mincho ProN','Yu Mincho',serif}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
@keyframes glow{0%,100%{text-shadow:0 0 20px rgba(99,102,241,.3)}50%{text-shadow:0 0 50px rgba(99,102,241,.6),0 0 100px rgba(99,102,241,.15)}}
@keyframes goldGlow{0%,100%{text-shadow:0 0 20px rgba(251,191,36,.3)}50%{text-shadow:0 0 50px rgba(251,191,36,.6)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes shakeX{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
@keyframes ripple{0%{box-shadow:0 0 0 0 rgba(99,102,241,.4)}100%{box-shadow:0 0 0 14px rgba(99,102,241,0)}}
@keyframes breathe{0%,100%{opacity:.05}50%{opacity:.12}}
@keyframes dmgFlash{0%{background:rgba(239,68,68,.22)}100%{background:transparent}}
@keyframes healFlash{0%{background:rgba(74,222,128,.12)}100%{background:transparent}}
@keyframes glitch{0%{transform:translate(0)}20%{transform:translate(-2px,1px)}40%{transform:translate(2px,-1px)}60%{transform:translate(-1px,2px)}80%{transform:translate(1px,-1px)}100%{transform:translate(0)}}
@keyframes statusPulse{0%,100%{opacity:.7}50%{opacity:1}}
@keyframes slideIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
@keyframes floorReveal{0%{opacity:0;transform:scale(0.9)}50%{opacity:1}100%{opacity:1;transform:scale(1)}}
@keyframes endingGlow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.3)}}
@keyframes popIn{0%{transform:scale(0.8);opacity:0}50%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
@keyframes dangerPulse{0%,100%{opacity:.9}50%{opacity:.55}}
@keyframes kpPop{0%{transform:scale(1)}50%{transform:scale(1.25);color:#fbbf24}100%{transform:scale(1)}}
@keyframes bought{0%{background:rgba(74,222,128,.25);transform:scale(1.02)}100%{background:rgba(74,222,128,.06);transform:scale(1)}}
@keyframes countUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.btn{display:block;width:100%;padding:14px 18px;margin-bottom:10px;background:rgba(22,22,44,.7);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:14px;font-family:var(--sans);cursor:pointer;text-align:left;line-height:1.65;transition:all .2s;position:relative;overflow:hidden}
.btn:hover{background:rgba(40,40,70,.85);border-color:rgba(99,102,241,.35);transform:translateY(-2px);box-shadow:0 6px 24px rgba(99,102,241,.1)}
.btn:active{transform:translateY(0)}
.btn-p{background:linear-gradient(135deg,rgba(99,102,241,.14),rgba(139,92,246,.1));border-color:rgba(99,102,241,.35);color:#c4b5fd}
.btn-p:hover{background:linear-gradient(135deg,rgba(99,102,241,.25),rgba(139,92,246,.18));border-color:rgba(99,102,241,.5);box-shadow:0 6px 28px rgba(99,102,241,.18)}
.bar-t{width:100%;height:6px;background:rgba(25,25,50,.9);border-radius:4px;overflow:hidden}
.bar-f{height:100%;border-radius:4px;transition:width .6s cubic-bezier(.4,0,.2,1)}
.tag{display:inline-flex;align-items:center;gap:4px;font-size:10px;padding:3px 10px;border-radius:5px;font-family:var(--sans);font-weight:500}
.card{max-width:640px;width:100%;background:var(--card);border:1px solid var(--border);border-radius:16px;padding:28px 24px;position:relative;z-index:1;backdrop-filter:blur(12px)}
.divider{width:48px;height:1px;background:linear-gradient(90deg,transparent,#6366f1,transparent);margin:0 auto}
.log-e{font-size:11px;color:#707090;margin-bottom:6px;line-height:1.6;border-left:2px solid rgba(60,60,90,.25);padding:2px 0 4px 10px}
.cn{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:7px;background:linear-gradient(135deg,rgba(99,102,241,.15),rgba(139,92,246,.1));color:#a5b4fc;font-size:11px;margin-right:10px;flex-shrink:0;font-family:var(--sans);font-weight:700}
.shake{animation:shakeX .35s ease}
.dot{width:10px;height:10px;border-radius:50%;border:2px solid rgba(80,80,120,.3);transition:all .3s}
.dot.done{background:#6366f1;border-color:#6366f1;box-shadow:0 0 8px rgba(99,102,241,.5)}
.dot.now{border-color:#a5b4fc;animation:ripple 1.5s infinite}
.fb{display:inline-flex;align-items:center;gap:6px;font-size:11px;padding:5px 14px;border-radius:20px;font-family:var(--sans);font-weight:500}
.uc{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;margin-bottom:8px;border-radius:10px;transition:all .2s;border:1px solid var(--border);background:rgba(16,16,30,.5)}
.uc:hover{border-color:rgba(99,102,241,.25)}.uc.own{background:rgba(74,222,128,.06);border-color:rgba(74,222,128,.2)}
.vignette{position:fixed;inset:0;pointer-events:none;z-index:2;transition:box-shadow 1s}
.distort{animation:glitch .1s infinite}
.dmg-overlay{position:fixed;inset:0;pointer-events:none;z-index:3;animation:dmgFlash .4s ease-out}
.heal-overlay{position:fixed;inset:0;pointer-events:none;z-index:3;animation:healFlash .5s ease-out}
.progress-wrap{position:relative;margin:20px 0;height:8px;background:rgba(20,20,50,.8);border-radius:4px;overflow:visible}
.progress-fill{height:100%;border-radius:4px;transition:width 1s cubic-bezier(.4,0,.2,1);position:relative}
.progress-glow{position:absolute;right:-2px;top:-4px;width:16px;height:16px;border-radius:50%;filter:blur(6px)}
.sec{padding:12px 16px;background:rgba(8,8,20,.4);border-radius:10px;border:1px solid rgba(50,50,80,.12);margin-bottom:20px}
.sec-hd{font-size:11px;margin-bottom:10px;font-family:var(--sans);letter-spacing:2px}
.badge{font-size:10px;font-family:var(--sans);padding:3px 8px;border-radius:5px;display:inline-block}
.tc{text-align:center}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;font-size:12px;font-family:var(--sans)}
.flex-wrap-c{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
`;

const PAGE_STYLE = Object.freeze({ minHeight: "100vh", background: "linear-gradient(180deg,#080818 0%,#0c0c20 40%,#080812 100%)", color: "var(--text)", fontFamily: "var(--serif)", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 16px", position: "relative" });

// ============================================================
// §8. UI COMPONENTS (SRP: each component has single concern)
// ============================================================

// ── Layout ──

const Page = ({ children, particles }) => (
  <div style={PAGE_STYLE}><style>{CSS}</style>{particles}{children}</div>
);

// ── Reusable primitives (DRY: eliminate repeated JSX patterns) ──

/** Dark panel section with optional header. Replaces 10+ inline panel patterns. */
const Section = ({ label, color = "var(--dim)", style, children }) => (
  <div className="sec" style={style}>
    {label && <div className="sec-hd" style={{ color }}>{`── ${label} ──`}</div>}
    {children}
  </div>
);

/** Collection badge — locked/unlocked item in a grid. */
const Badge = ({ got, color, label, hiddenLabel = "???", style }) => (
  <span className="badge" style={{
    background: got ? `${color}15` : "rgba(30,30,50,.5)",
    border: `1px solid ${got ? `${color}30` : "rgba(40,40,60,.2)"}`,
    color: got ? color : "#353555", ...style,
  }}>{got ? label : hiddenLabel}</span>
);

/** Stat key-value pair for grids. */
const StatEntry = ({ label, color, value }) => (
  <div><span style={{ color: "var(--dim)" }}>{label}: </span><span style={{ color }}>{value}</span></div>
);

/** "戻る" button — appears on every sub-screen. */
const BackBtn = ({ onClick, label = "戻る", primary = false }) => (
  <button className={`btn ${primary ? "btn-p" : ""} tc`} style={{ marginTop: 16 }} onClick={onClick}>{label}</button>
);

/** Unlock/trophy/achievement item row. */
const UnlockRow = ({ icon, name, desc, own, locked, right, justBought }) => (
  <div className={`uc ${own ? "own" : ""}`} style={{ opacity: locked && !own ? 0.45 : 1, animation: justBought ? "bought .5s ease" : "none" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 20, opacity: own ? 1 : .5, filter: own ? "none" : "grayscale(1)" }}>{icon}</span>
      <div>
        <div style={{ fontSize: 14, color: own ? "#4ade80" : locked ? "#505070" : "var(--text)", fontFamily: "var(--sans)", fontWeight: 600 }}>{own && "✓ "}{locked && !own ? "???" : name}</div>
        <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 2, fontFamily: "var(--sans)" }}>{desc}</div>
      </div>
    </div>
    {right}
  </div>
);

// ── Game-specific components ──

const StatBar = ({ label, value, max, color, icon }) => {
  const critical = value < max * 0.25;
  const pct = Math.max(0, (value / max) * 100);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3, color: "var(--dim)", fontFamily: "var(--sans)" }}>
        <span>{icon} {label}{critical && <span style={{ color: "#ef4444", fontSize: 9, marginLeft: 4, animation: "dangerPulse 1s infinite" }}>⚠ 危険</span>}</span>
        <span style={{ color: critical ? "#f87171" : "var(--dim)", fontWeight: critical ? 700 : 400, animation: critical ? "dangerPulse 1s infinite" : "none" }}>{value}/{max}</span>
      </div>
      <div className="bar-t"><div className="bar-f" style={{ width: `${pct}%`, background: color, boxShadow: critical ? "0 0 8px rgba(239,68,68,.4)" : "none" }} /></div>
    </div>
  );
};

const StatusTag = ({ name }) => {
  const meta = STATUS_META[name] || { colors: ["#f87171", "rgba(248,113,113,0.08)", "rgba(248,113,113,0.18)"], tick: null };
  const hasTick = !!meta.tick;
  return (
    <span className="tag" style={{ color: meta.colors[0], background: meta.colors[1], border: `1px solid ${meta.colors[2]}`, animation: hasTick ? "statusPulse 2s infinite" : "none" }}>
      {hasTick ? "● " : ""}{name}
    </span>
  );
};

const Change = ({ value, label }) => {
  if (!value) return null;
  const pos = value > 0;
  return <span style={{ color: pos ? "#4ade80" : "#f87171", fontSize: 12, fontFamily: "var(--sans)", fontWeight: 600, animation: "countUp .3s ease" }}>{label} {pos ? "▲" : "▼"}{pos ? "+" : ""}{value}</span>;
};

const TypewriterText = ({ text, revealed, done, ready, skip, serif = true, minHeight = 80, mb = 28 }) => (
  <div onClick={!done ? skip : undefined} style={{ fontSize: 14.5, lineHeight: 2.1, color: "var(--text)", marginBottom: mb, letterSpacing: .5, cursor: !done ? "pointer" : "default", minHeight, fontFamily: serif ? "var(--serif)" : "var(--sans)", whiteSpace: "pre-wrap" }}>
    {revealed}{!done && <span style={{ animation: "pulse 1s infinite", color: "#818cf8" }}>▌</span>}
  </div>
);

const FloorProgress = ({ pct, color }) => (
  <div className="progress-wrap">
    <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, #6366f1, ${color})` }}>
      <div className="progress-glow" style={{ background: color }} />
    </div>
    <div style={{ position: "absolute", top: -18, display: "flex", width: "100%", justifyContent: "space-between", fontSize: 9, color: "var(--dim)", fontFamily: "var(--sans)" }}>
      {Array.from({ length: CFG.MAX_FLOOR }, (_, i) => i + 1).map(f => {
        const active = f <= Math.ceil(pct / (100 / CFG.MAX_FLOOR));
        return <span key={f} style={{ color: active ? color : "rgba(100,100,140,.3)", fontWeight: active ? 700 : 400, transition: "color .5s" }}>{f}F</span>;
      })}
    </div>
  </div>
);

const StatSummary = ({ player }) => (
  <div style={{ fontSize: 11, color: "#606090", fontFamily: "var(--sans)", lineHeight: 1.8 }}>
    <span style={{ color: "#f87171" }}>HP {player.hp}/{player.maxHp}</span>{"\u3000"}
    <span style={{ color: "#818cf8" }}>精神 {player.mn}/{player.maxMn}</span>{"\u3000"}
    <span style={{ color: "#fbbf24" }}>情報 {player.inf}</span>
    {player.st.length > 0 && (
      <div style={{ marginTop: 6, display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
        {player.st.map(s => <StatusTag key={s} name={s} />)}
      </div>
    )}
  </div>
);

const RecordPanel = ({ entries, borderColor = "rgba(50,50,80,.12)", labelColor = "var(--dim)", labelText }) => (
  <Section label={labelText} color={labelColor} style={{ background: "rgba(8,8,20,.5)", border: `1px solid ${borderColor}`, marginBottom: 24 }}>
    <div style={{ fontSize: 12, lineHeight: 2, fontFamily: "var(--sans)" }}>
      {entries.map((e, i) => <span key={i}>{e.label}: <span style={{ color: e.color }}>{e.value}</span>{i < entries.length - 1 && <br />}</span>)}
    </div>
  </Section>
);

const DiffCard = ({ d, hp, mn, inf, onSelect, cleared }) => (
  <button onClick={() => onSelect(d)} style={{
    display: "block", width: "100%", textAlign: "left", padding: "16px 18px", marginBottom: 10, borderRadius: 12,
    background: `linear-gradient(135deg, rgba(${d.id === "abyss" ? "180,40,40" : "99,102,241"},.08), rgba(20,20,40,.6))`,
    border: `1px solid ${d.color}33`, cursor: "pointer", transition: "all .25s", position: "relative", overflow: "hidden"
  }}
  onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${d.color}88`; e.currentTarget.style.boxShadow = `0 0 20px ${d.color}22`; }}
  onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${d.color}33`; e.currentTarget.style.boxShadow = "none"; }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 22 }}>{d.icon}</span>
        <div>
          <span style={{ fontSize: 16, fontWeight: 700, color: d.color, fontFamily: "var(--sans)" }}>{d.name}</span>
          <span style={{ fontSize: 11, color: "var(--dim)", marginLeft: 8, fontFamily: "var(--sans)" }}>{d.sub}</span>
          {cleared && <span style={{ fontSize: 9, color: d.color, marginLeft: 8, fontFamily: "var(--sans)", padding: "1px 6px", borderRadius: 4, background: `${d.color}18`, border: `1px solid ${d.color}30` }}>✓ クリア済</span>}
        </div>
      </div>
      <div style={{ textAlign: "right", fontFamily: "var(--sans)" }}>
        <div style={{ fontSize: 11, color: "#fbbf24" }}>脱出 +{d.kpWin}pt</div>
        <div style={{ fontSize: 10, color: "#706080" }}>失敗 +{d.kpDeath}pt</div>
      </div>
    </div>
    <p style={{ fontSize: 11, color: "#808098", lineHeight: 1.6, margin: "0 0 10px 32px", fontFamily: "var(--sans)" }}>{d.desc}</p>
    <div style={{ display: "flex", gap: 12, marginLeft: 32, fontSize: 10, fontFamily: "var(--sans)", flexWrap: "wrap" }}>
      <span style={{ color: "#f87171" }}>HP {hp}</span>
      <span style={{ color: "#818cf8" }}>精神 {mn}</span>
      <span style={{ color: "#fbbf24" }}>情報 {inf}</span>
      {d.drainMod !== 0 ? <span style={{ color: "#a78bfa" }}>侵蝕 {d.drainMod}/手</span> : <span style={{ color: "#4ade80" }}>侵蝕 なし</span>}
      {d.dmgMult !== 1 && <span style={{ color: d.dmgMult > 1 ? "#f59e0b" : "#4ade80" }}>被ダメ ×{d.dmgMult}</span>}
    </div>
  </button>
);

const DiffBadge = ({ diff }) => diff
  ? <span style={{ fontSize: 9, color: diff.color, fontFamily: "var(--sans)", opacity: .7 }}>{diff.icon}{diff.name}</span>
  : null;

const DiffLabel = ({ diff }) => diff
  ? <div style={{ fontSize: 11, color: diff.color, fontFamily: "var(--sans)", marginBottom: 8 }}>{diff.icon} {diff.name}モード</div>
  : null;

const FlagIndicator = ({ flag }) => {
  if (!flag) return null;
  const styles = { fontSize: 12, fontFamily: "var(--sans)", fontWeight: 600 };
  if (flag.startsWith("add:"))    return <span style={{ ...styles, color: "#f87171" }}>⚠ {flag.slice(4)}</span>;
  if (flag.startsWith("remove:")) return <span style={{ ...styles, color: "#4ade80" }}>✦ {flag.slice(7)} 回復</span>;
  if (flag === "shortcut")        return <span style={{ ...styles, color: "#c084fc" }}>⟫ 近道発見</span>;
  if (flag.startsWith("chain:"))  return <span style={{ ...styles, color: "#60a5fa" }}>… 続く</span>;
  return null;
};

const DrainDisplay = ({ drain }) => {
  if (!drain) return null;
  return (
    <div style={{ fontSize: 11, color: "#706080", fontFamily: "var(--sans)", marginBottom: 12, padding: "8px 12px", background: "rgba(80,30,30,.08)", borderRadius: 8, border: "1px solid rgba(80,30,30,.12)" }}>
      <span style={{ marginRight: 8 }}>⊘ 迷宮の侵蝕:</span>
      {drain.hp !== 0 && <span style={{ color: "#f87171", marginRight: 8 }}>HP{drain.hp}</span>}
      {drain.mn !== 0 && <span style={{ color: "#a78bfa" }}>精神{drain.mn}</span>}
    </div>
  );
};

const LogEntry = ({ entry }) => (
  <div className="log-e">
    <span style={{ color: FLOOR_META[entry.fl]?.color ?? "#818cf8", fontWeight: 600 }}>第{entry.fl}層-{entry.step}</span>
    <span style={{ margin: "0 6px", color: "#404060" }}>|</span>{entry.ch}
    <div style={{ marginTop: 2 }}>
      {entry.hp !== 0 && <span style={{ color: entry.hp > 0 ? "#4ade80" : "#f87171", marginRight: 8, fontSize: 10 }}>HP{entry.hp > 0 ? "+" : ""}{entry.hp}</span>}
      {entry.mn !== 0 && <span style={{ color: entry.mn > 0 ? "#a5b4fc" : "#f87171", marginRight: 8, fontSize: 10 }}>精神{entry.mn > 0 ? "+" : ""}{entry.mn}</span>}
      {entry.inf !== 0 && <span style={{ color: entry.inf > 0 ? "#fbbf24" : "#f87171", fontSize: 10 }}>情報{entry.inf > 0 ? "+" : ""}{entry.inf}</span>}
    </div>
  </div>
);

const StepDots = ({ current, total }) => (
  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
    {Array.from({ length: total }, (_, i) => (
      <div key={i} className={`dot ${i < current ? "done" : i === current ? "now" : ""}`} />
    ))}
  </div>
);

// ── Ending collection grid (DRY: used in victory + records) ──

const EndingGrid = ({ endings, collected }) => (
  <div className="flex-wrap-c">
    {endings.map(e => (
      <Badge key={e.id} got={collected?.includes(e.id)} color={e.color} label={`${e.icon} ${e.name}`} />
    ))}
  </div>
);

// ============================================================
// §9. CUSTOM HOOKS
// ============================================================

const useTextReveal = (text, audioOn) => {
  const [pos, setPos] = useState(0);
  const [ready, setReady] = useState(false);
  const timerRef = useRef(null);
  const tickRef  = useRef(0);

  useEffect(() => {
    if (!text) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPos(0); setReady(false); tickRef.current = 0;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setPos(p => {
        const n = Math.min(p + 2, text.length);
        tickRef.current++;
        if (audioOn && tickRef.current % 3 === 0) AudioEngine.sfx.tick();
        if (n >= text.length) { clearInterval(timerRef.current); setTimeout(() => setReady(true), 200); }
        return n;
      });
    }, 18);
    return () => clearInterval(timerRef.current);
  }, [text, audioOn]);

  const skip = useCallback(() => {
    if (!text) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setPos(text.length);
    setTimeout(() => setReady(true), 50);
  }, [text]);

  return { revealed: text?.slice(0, pos) ?? "", done: pos >= (text?.length ?? 0), ready, skip };
};

/** Persistent meta state — loads from storage, auto-saves on change, auto-unlocks trophies/achievements. */
const usePersistence = () => {
  const [meta, setMeta] = useState({ ...FRESH_META });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await Storage.load();
      if (s) setMeta(prev => {
        const m = { ...prev };
        for (const k of Object.keys(FRESH_META)) m[k] = s[k] ?? FRESH_META[k];
        return m;
      });
      setLoaded(true);
    })();
  }, []);

  // Auto-unlock trophy and achievement rewards
  useEffect(() => {
    if (!loaded) return;
    let changed = false;
    const next = [...meta.unlocked];
    for (const u of UNLOCKS) {
      if (next.includes(u.id)) continue;
      if (u.cat === "trophy" && u.req && meta.clearedDiffs.includes(u.req)) { next.push(u.id); changed = true; }
      if (u.cat === "trophy" && u.req && meta.endings?.includes(u.req))     { next.push(u.id); changed = true; }
      if (u.cat === "achieve" && u.achReq && u.achReq(meta))                { next.push(u.id); changed = true; }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (changed) setMeta(prev => ({ ...prev, unlocked: next }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.runs, meta.escapes, meta.totalEvents, meta.totalDeaths, meta.endings, meta.clearedDiffs, loaded]);

  useEffect(() => { if (loaded) Storage.save(meta); }, [meta, loaded]);

  const updateMeta = useCallback((updater) => setMeta(prev => ({ ...prev, ...updater(prev) })), []);

  /** Reset all data to initial state */
  const resetMeta = useCallback(async () => {
    const fresh = { ...FRESH_META, unlocked: [] };
    await Storage.save(fresh);
    setMeta(fresh);
  }, []);

  return { meta, updateMeta, resetMeta, loaded };
};

const useVisualFx = () => {
  const [shake, setShake]     = useState(false);
  const [overlay, setOverlay] = useState(null);
  const flash = useCallback((type, ms) => { setOverlay(type); setTimeout(() => setOverlay(null), ms); }, []);
  const doShake = useCallback(() => { setShake(true); setTimeout(() => setShake(false), 350); }, []);
  return { shake, overlay, flash, doShake };
};

// ============================================================
// §10. CONSTANTS (OCP: declarative data outside component)
// ============================================================

/** Unlock category definitions — drives unlock screen layout */
const UNLOCK_CATS = Object.freeze([
  { key: "basic",   label: "基本",       color: "#818cf8" },
  { key: "special", label: "特別（修羅クリアで解放）", color: "#fbbf24" },
  { key: "trophy",  label: "難易度クリア報酬", color: "#f97316" },
  { key: "achieve", label: "実績解放",    color: "#4ade80" },
]);

/** Death flavor texts — rotated by run count */
const DEATH_FLAVORS = Object.freeze({
  "体力消耗": [
    "肉体は限界を超えた。冷たい石の上に崩れ落ちる。",
    "最後に見たのは、天井の染みだった。",
    "もう一歩も動けない。迷宮が静かに闇を閉じる。",
  ],
  "精神崩壊": [
    "自分が誰かも分からなくなった。闇と一体になっていく。",
    "恐怖が全てを塗りつぶした。叫び声すら出ない。",
    "現実が崩壊する。美しい幻覚の中で、意識が遠のく。",
  ],
});

/** Contextual hints shown on game over — based on death cause, floor, and unlocks */
const DEATH_TIPS = Object.freeze({
  "体力消耗": [
    "体力回復の選択肢を優先してみよう。安息イベントは貴重な回復源だ。",
    "「鋼の心臓」「鉄の体躯」でHPを底上げすれば、少しだけ余裕が生まれる。",
    "被ダメージ軽減の継承は、長期的に大きな差を生む。",
    "情報値が高いと有利な選択肢が開放される。情報収集も生存の鍵。",
  ],
  "精神崩壊": [
    "精神力は回復手段が限られる。無理に戦わず、消耗を抑える判断も大切だ。",
    "「冷静沈着」「精神防壁」で精神の基盤を固めよう。",
    "迷宮の侵蝕が精神を蝕む。ドレイン無効化は高難度で必須級の継承だ。",
    "恐怖状態は精神を持続的に削る。状態異常の管理を意識しよう。",
  ],
  early: "最初の数回は死んで当然。死ぬたびに知見ポイントが貯まり、次の探索が少し楽になる。",
  mid: "第3層以降は状態異常と侵蝕が本格化する。情報値を高めて有利な選択肢を引き出そう。",
  late: "最深層に辿り着いたなら実力は十分。あとは最後まで冷静に判断を重ねるだけだ。",
});

/** Count active unlock effects for display */
const countActiveEffects = (unlocked) => unlocked.length;

/** Format improvement vs last run */
const formatImprovement = (current, last) => {
  if (!last) return null;
  const improvements = [];
  if (current.floor > last.floor) improvements.push(`到達層 ${last.floor}→${current.floor} ↑`);
  if (current.hp > (last.hp ?? 0)) improvements.push(`残HP ${last.hp ?? 0}→${current.hp} ↑`);
  return improvements.length > 0 ? improvements : null;
};

function GameInner() {
  const { meta, updateMeta, resetMeta, loaded } = usePersistence();

  // Run state
  const [phase,   setPhase]   = useState("title");
  const [player,  setPlayer]  = useState(null);
  const [event,   setEvent]   = useState(null);
  const [resTxt,  setResTxt]  = useState("");
  const [resChg,  setResChg]  = useState(null);
  const [drainInfo, setDrainInfo] = useState(null);
  const [floor,   setFloor]   = useState(1);
  const [step,    setStep]    = useState(0);
  const [usedIds, setUsedIds] = useState([]);
  const [log,     setLog]     = useState([]);
  const [diff,    setDiff]    = useState(null);
  const [ending,  setEnding]  = useState(null);
  const [isNewEnding, setIsNewEnding] = useState(false);
  const [isNewDiffClear, setIsNewDiffClear] = useState(false);
  const [chainNext, setChainNext] = useState(null);
  const [usedSecondLife, setUsedSecondLife] = useState(false);

  // UI state
  const [showLog, setShowLog] = useState(false);
  const [audioOn, setAudioOn] = useState(false);
  const { shake, overlay, flash, doShake } = useVisualFx();

  // Derived
  const fx          = useMemo(() => computeFx(meta.unlocked), [meta.unlocked]);
  const progressPct = useMemo(() => computeProgress(floor, step), [floor, step]);
  const floorMeta   = FLOOR_META[floor] ?? FLOOR_META[1];
  const floorColor  = floorMeta.color;
  const vignette    = useMemo(() => computeVignette(player), [player]);
  const lowMental   = player && player.mn < player.maxMn * 0.3;

  // Scroll to top on phase change (mobile UX)
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [phase]);

  // Text reveal
  const activeText = phase === "event" ? event?.sit : phase === "result" ? resTxt : null;
  const { revealed, done, ready, skip } = useTextReveal(activeText, audioOn);

  // Audio
  const enableAudio = useCallback(() => { AudioEngine.init(); AudioEngine.resume(); setAudioOn(true); }, []);
  const toggleAudio = useCallback(() => { if (audioOn) { setAudioOn(false); } else { AudioEngine.init(); AudioEngine.resume(); setAudioOn(true); } }, [audioOn]);
  const sfx = useCallback((fn) => { if (audioOn) fn(); }, [audioOn]);

  // Particles
  const Particles = useMemo(() => (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      {[...Array(20)].map((_, i) => <div key={i} style={{ position: "absolute", width: rand(1, 3), height: rand(1, 3), background: `rgba(${rand(100, 200)},${rand(120, 220)},${rand(180, 255)},${(rand(10, 25) / 100).toFixed(2)})`, borderRadius: "50%", left: `${rand(0, 100)}%`, top: `${rand(0, 100)}%`, animation: `float ${rand(8, 22)}s ease-in-out infinite ${rand(0, 10)}s` }} />)}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 80%,rgba(99,102,241,.04) 0%,transparent 60%)", animation: "breathe 8s ease-in-out infinite" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 20%,rgba(139,92,246,.03) 0%,transparent 50%)", animation: "breathe 12s ease-in-out infinite 3s" }} />
    </div>
  ), []);

  // ── GAME ACTIONS ──

  const startRun = useCallback(() => { enableAudio(); setPhase("diff_select"); }, [enableAudio]);

  const selectDiff = useCallback((d) => {
    setDiff(d); enableAudio();
    setPlayer(createPlayer(d, fx));
    setFloor(1); setStep(0); setUsedIds([]); setLog([]); setDrainInfo(null); setChainNext(null); setEnding(null); setIsNewEnding(false); setIsNewDiffClear(false); setUsedSecondLife(false);
    updateMeta(m => ({ runs: m.runs + 1 }));
    setPhase("floor_intro");
  }, [fx, enableAudio, updateMeta]);

  const enterFloor = useCallback(() => {
    sfx(AudioEngine.sfx.floor);
    setTimeout(() => sfx(() => AudioEngine.sfx.ambient(floor)), 500);
    if (chainNext) {
      const ce = findChainEvent(EVENTS, chainNext);
      if (ce) { setEvent(ce); setChainNext(null); setPhase("event"); return; }
    }
    const e = pickEvent(EVENTS, floor, usedIds, meta, fx);
    if (e) { setEvent(e); setPhase("event"); }
    else console.warn(`[enterFloor] No events for floor ${floor}`);
  }, [floor, usedIds, sfx, chainNext, meta, fx]);

  /** Handle player choice — uses processChoice for pure computation, then applies side effects. */
  const handleChoice = useCallback((idx) => {
    if (!event || !player) return;
    sfx(AudioEngine.sfx.choice);

    // Pure computation (§5)
    const { choice, outcome, mods, chainId, playerFlag, drained: rawDrained, drain, impact } = processChoice(event, idx, player, fx, diff);

    // SecondLife revival
    let drained = rawDrained;
    let didSecondLife = false;
    if (fx.secondLife && !usedSecondLife && (drained.hp <= 0 || drained.mn <= 0)) {
      drained = { ...drained, hp: Math.max(drained.hp, Math.ceil(drained.maxHp / 2)), mn: Math.max(drained.mn, Math.ceil(drained.maxMn / 2)) };
      setUsedSecondLife(true);
      didSecondLife = true;
      flash("heal", 800); sfx(AudioEngine.sfx.heal);
    }

    if (chainId) setChainNext(chainId);

    // Visual/audio feedback
    if (impact === "bigDmg" || impact === "dmg") {
      doShake(); flash("dmg", 400);
      sfx(impact === "bigDmg" ? AudioEngine.sfx.bigHit : AudioEngine.sfx.hit);
    } else if (impact === "heal") {
      flash("heal", 500); sfx(AudioEngine.sfx.heal);
    }
    if (playerFlag?.startsWith("add:"))    setTimeout(() => sfx(AudioEngine.sfx.status), 200);
    if (playerFlag?.startsWith("remove:")) setTimeout(() => sfx(AudioEngine.sfx.clear), 200);
    if (drain) setTimeout(() => sfx(AudioEngine.sfx.drain), 400);

    // State updates
    setLog(l => [...l, { fl: floor, step: step + 1, ch: choice.t, hp: mods.hp, mn: mods.mn, inf: mods.inf }]);
    setResTxt(didSecondLife ? outcome.r + "\n\n──「二度目の命」が発動した。致命の闇から引き戻される。" : outcome.r);
    setResChg({ hp: mods.hp, mn: mods.mn, inf: mods.inf, fl: outcome.fl });
    setPlayer(drained); setDrainInfo(drain); setPhase("result");
    updateMeta(m => ({ totalEvents: m.totalEvents + 1 }));

    // End-game: escape
    if (outcome.fl === "escape") {
      const end = determineEnding(drained, log, diff);
      setEnding(end);
      setIsNewEnding(!meta.endings?.includes(end.id));
      setIsNewDiffClear(!meta.clearedDiffs?.includes(diff.id));
      setTimeout(() => sfx(AudioEngine.sfx.victory), 500);
      setTimeout(() => {
        updateMeta(m => ({
          escapes: m.escapes + 1,
          kp: m.kp + (diff?.kpWin ?? 4) + end.bonusKp,
          bestFl: Math.max(m.bestFl, floor),
          endings: m.endings.includes(end.id) ? m.endings : [...m.endings, end.id],
          clearedDiffs: m.clearedDiffs.includes(diff.id) ? m.clearedDiffs : [...m.clearedDiffs, diff.id],
          lastRun: { cause: "escape", floor, ending: end.id, hp: drained.hp, mn: drained.mn, inf: drained.inf },
        }));
        setPhase("victory");
      }, 2500);
      return;
    }
    // End-game: death
    if (drained.hp <= 0 || drained.mn <= 0) {
      const deathCause = drained.hp <= 0 ? "体力消耗" : "精神崩壊";
      if (drained.mn <= 0 && drained.hp > 0) setResTxt(outcome.r + "\n\n……精神が限界に達した。意識が遠のき、迷宮の闇に呑まれていく。");
      setTimeout(() => sfx(AudioEngine.sfx.over), 800);
      setTimeout(() => {
        updateMeta(m => ({
          kp: m.kp + (diff?.kpDeath ?? 2), bestFl: Math.max(m.bestFl, floor),
          totalDeaths: (m.totalDeaths ?? 0) + 1,
          lastRun: { cause: deathCause, floor, ending: null, hp: drained.hp, mn: drained.mn, inf: drained.inf },
        }));
        setPhase("gameover");
      }, 2500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, player, fx, diff, floor, step, log, sfx, doShake, flash, updateMeta, usedSecondLife]);

  const proceed = useCallback(() => {
    if (!event) return;
    const ns = step + 1, nu = [...usedIds, event.id];
    setStep(ns); setUsedIds(nu); setDrainInfo(null);

    if (chainNext) {
      const ce = findChainEvent(EVENTS, chainNext);
      if (ce) { setEvent(ce); setChainNext(null); setPhase("event"); return; }
      setChainNext(null);
    }

    const isShort = resChg?.fl === "shortcut";
    const nf = isShort ? Math.min(floor + 2, CFG.MAX_FLOOR) : (ns >= CFG.EVENTS_PER_FLOOR ? floor + 1 : floor);

    if (nf > floor && nf <= CFG.MAX_FLOOR) {
      sfx(AudioEngine.sfx.levelUp); setFloor(nf); setStep(0); setPhase("floor_intro"); return;
    }
    if (nf > CFG.MAX_FLOOR) {
      const boss = EVENTS.find(e => e.id === CFG.BOSS_EVENT_ID);
      if (boss && !nu.includes(CFG.BOSS_EVENT_ID)) { setEvent(boss); setPhase("event"); return; }
    }
    const next = pickEvent(EVENTS, floor, nu, meta, fx);
    if (next) { setEvent(next); setPhase("event"); }
    else console.warn(`[proceed] No events left for floor ${floor}`);
  }, [event, step, usedIds, floor, resChg, sfx, chainNext, meta, fx]);

  const [lastBought, setLastBought] = useState(null);
  const doUnlock = useCallback((uid) => {
    const def = UNLOCKS.find(u => u.id === uid);
    if (!def || meta.unlocked.includes(uid) || meta.kp < def.cost) return;
    sfx(AudioEngine.sfx.heal);
    setLastBought(uid);
    setTimeout(() => setLastBought(null), 600);
    updateMeta(m => ({ unlocked: [...m.unlocked, uid], kp: m.kp - def.cost }));
  }, [meta, sfx, updateMeta]);

  // ── RENDER ──

  if (!loaded) return (
    <Page particles={null}>
      <div style={{ marginTop: "38vh", textAlign: "center" }}>
        <div style={{ fontSize: 24, letterSpacing: 6, color: "var(--bright)", marginBottom: 12, animation: "glow 3s ease-in-out infinite", opacity: .6 }}>迷宮の残響</div>
        <div style={{ fontSize: 11, color: "var(--dim)", fontFamily: "var(--sans)", animation: "pulse 1.5s infinite", letterSpacing: 2 }}>loading...</div>
      </div>
    </Page>
  );

  // ── TITLE ──
  if (phase === "title") {
    const activeTitle = meta.runs > 0 ? getActiveTitle(meta) : null;
    return (
    <Page particles={Particles}>
      <div className="card tc" style={{ marginTop: "6vh", animation: "fadeUp .8s ease" }}>
        <div style={{ fontSize: 10, letterSpacing: 8, color: "#818cf8", marginBottom: 20, fontFamily: "var(--sans)", opacity: .8 }}>TEXT EXPLORATION × JUDGMENT × ROGUELITE</div>
        <h1 style={{ fontSize: 38, fontWeight: 700, color: "var(--bright)", letterSpacing: 8, marginBottom: 10, animation: "glow 4s ease-in-out infinite", lineHeight: 1.5 }}>迷宮の残響</h1>
        {activeTitle && <div style={{ fontSize: 11, color: activeTitle.color, fontFamily: "var(--sans)", marginBottom: 4, letterSpacing: 2 }}>{activeTitle.icon} {activeTitle.name}</div>}
        <p style={{ fontSize: 13, color: "var(--dim)", lineHeight: 2, marginBottom: 8, fontFamily: "var(--sans)" }}>不確かな情報の中で選択を重ね<br />「生きて帰る」ための判断力を磨け</p>
        <div className="divider" style={{ margin: "20px auto" }} />
        <div style={{ fontSize: 11, color: "#505078", lineHeight: 1.8, marginBottom: 28, fontFamily: "var(--sans)" }}>
          <div style={{ marginBottom: 4 }}>全{CFG.MAX_FLOOR}層・{EVENTS.length}種のイベント・{ENDINGS.length}種のエンディング</div>
          <div style={{ color: "#606090" }}>{meta.runs === 0
            ? "死は終わりではない。得た知見は次の探索へ継承される。"
            : "探索は常に命懸け。第一層ですら油断は死を意味する。"
          }</div>
        </div>
        <button className="btn btn-p tc" style={{ fontSize: 16, padding: "16px", marginBottom: 12 }} onClick={startRun}>
          {meta.runs > 0 ? `${meta.runs + 1}回目の探索を開始` : "探索を開始する"}
        </button>
        {meta.runs > 0 && (() => {
          const buyable = UNLOCKS.filter(u => !meta.unlocked.includes(u.id) && u.cost > 0 && meta.kp >= u.cost && (!u.gate || meta.clearedDiffs?.includes(u.gate))).length;
          return <button className="btn tc" onClick={() => { enableAudio(); setPhase("unlocks"); }}>
            知見の継承{"\u3000"}<span style={{ color: "#fbbf24", fontFamily: "var(--sans)" }}>◈ {meta.kp}pt</span>
            {buyable > 0 && <span style={{ fontSize: 10, color: "#4ade80", marginLeft: 8, fontFamily: "var(--sans)" }}>({buyable}個解放可能)</span>}
          </button>;
        })()}
        {meta.runs > 0 && <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn tc" style={{ flex: 1, minWidth: 80 }} onClick={() => setPhase("titles")}>称号</button>
          <button className="btn tc" style={{ flex: 1, minWidth: 80 }} onClick={() => setPhase("records")}>実績</button>
        </div>}
        <button className="btn tc" style={{ fontSize: 12, color: "var(--dim)" }} onClick={() => setPhase("settings")}>⚙ 設定</button>
        {meta.runs > 0 && <div style={{ marginTop: 20, fontSize: 11, fontFamily: "var(--sans)", display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
          <span style={{ color: "#818cf8" }}>探索 {meta.runs}回</span>
          <span style={{ color: "#4ade80" }}>脱出 {meta.escapes}回</span>
          <span style={{ color: "#fbbf24" }}>最深 第{meta.bestFl}層</span>
          <span style={{ color: meta.escapes / meta.runs > 0.3 ? "#4ade80" : "#f87171" }}>生還率 {Math.round(meta.escapes / meta.runs * 100)}%</span>
          <span style={{ color: "#c084fc" }}>ED {meta.endings?.length ?? 0}/{ENDINGS.length}</span>
          <span style={{ color: "#60a5fa" }}>継承 {meta.unlocked.length}/{UNLOCKS.length}</span>
        </div>}
        {meta.clearedDiffs?.length > 0 && <div style={{ marginTop: 10, display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          {DIFFICULTY.map(d => {
            const cleared = meta.clearedDiffs.includes(d.id);
            return cleared ? <span key={d.id} style={{ fontSize: 10, color: d.color, fontFamily: "var(--sans)", padding: "2px 8px", borderRadius: 4, background: `${d.color}15`, border: `1px solid ${d.color}30` }}>{d.icon}{d.name}クリア</span> : null;
          })}
        </div>}
      </div>
      <p style={{ position: "relative", zIndex: 1, marginTop: 24, fontSize: 10, color: "#303050", fontFamily: "var(--sans)", letterSpacing: 2 }}>
        {meta.lastRun
          ? meta.lastRun.cause === "escape"
            ? `前回: 第${meta.lastRun.floor}層より生還 ── 今度はさらに深く`
            : `前回: 第${meta.lastRun.floor}層にて${meta.lastRun.cause} ── 次こそは`
          : "失敗は知見となり、次の探索に活きる"
        }
      </p>
    </Page>
  );
  }

  // ── DIFFICULTY SELECT ──
  if (phase === "diff_select") return (
    <Page particles={Particles}>
      <div className="card" style={{ marginTop: "4vh", animation: "fadeUp .5s ease" }}>
        <h2 style={{ fontSize: 22, color: "#c4b5fd", letterSpacing: 4, textAlign: "center", marginBottom: 6 }}>難易度選択</h2>
        <p style={{ fontSize: 11, color: "var(--dim)", textAlign: "center", marginBottom: 24, fontFamily: "var(--sans)" }}>高難度ほど獲得知見ポイントが増加する</p>
        {DIFFICULTY.map(d => (
          <DiffCard key={d.id} d={d}
            hp={CFG.BASE_HP + fx.hpBonus + d.hpMod}
            mn={CFG.BASE_MN + fx.mentalBonus + d.mnMod}
            inf={CFG.BASE_INF + fx.infoBonus}
            cleared={meta.clearedDiffs?.includes(d.id)}
            onSelect={selectDiff} />
        ))}
        <BackBtn onClick={() => setPhase("title")} />
      </div>
    </Page>
  );

  // ── UNLOCKS ──
  if (phase === "unlocks") return (
    <Page particles={Particles}>
      <div className="card" style={{ marginTop: 32, animation: "fadeUp .5s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, color: "#c4b5fd", letterSpacing: 3 }}>知見の継承</h2>
          <span key={meta.kp} style={{ fontSize: 14, color: "#fbbf24", fontFamily: "var(--sans)", fontWeight: 700, animation: "kpPop .3s ease" }}>◈ {meta.kp}pt</span>
        </div>
        <p style={{ fontSize: 12, color: "var(--dim)", marginBottom: 20, fontFamily: "var(--sans)", lineHeight: 1.7 }}>探索で得た知見を恒久的なアビリティとして解放する。</p>
        {UNLOCK_CATS.map(cat => {
          const items = UNLOCKS.filter(u => (u.cat ?? "basic") === cat.key);
          if (items.length === 0) return null;
          return (
            <div key={cat.key} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: cat.color, letterSpacing: 3, marginBottom: 10, fontFamily: "var(--sans)", fontWeight: 600, borderBottom: `1px solid ${cat.color}30`, paddingBottom: 6 }}>── {cat.label} ──</div>
              {items.map(u => {
                const own = meta.unlocked.includes(u.id);
                const af  = meta.kp >= u.cost;
                const trophyLocked = u.cat === "trophy" && u.req && !meta.clearedDiffs.includes(u.req) && !meta.endings?.includes(u.req);
                const achieveLocked = u.cat === "achieve" && u.achReq && !u.achReq(meta);
                const gateLocked = u.gate && !meta.clearedDiffs?.includes(u.gate);
                const locked = trophyLocked || achieveLocked || gateLocked;
                const lockDesc = gateLocked ? `${DIFFICULTY.find(d=>d.id===u.gate)?.name ?? u.gate}をクリアして解放`
                  : achieveLocked ? u.achDesc
                  : trophyLocked ? `${DIFFICULTY.find(d=>d.id===u.req)?.name ?? u.req}難度をクリアして解放`
                  : u.desc;
                const descText = locked && !own ? lockDesc : u.desc;
                return (
                  <UnlockRow key={u.id} icon={u.icon} name={u.name} desc={descText} own={own} locked={locked} justBought={lastBought === u.id}
                    right={
                      own ? null
                      : locked ? <span style={{ fontSize: 10, color: "#505070", fontFamily: "var(--sans)" }}>🔒</span>
                      : u.cost === 0 ? <span style={{ fontSize: 11, color: "#4ade80", fontFamily: "var(--sans)" }}>自動解放</span>
                      : <button onClick={() => doUnlock(u.id)} disabled={!af} style={{ padding: "7px 16px", fontSize: 12, borderRadius: 8, fontFamily: "var(--sans)", cursor: af ? "pointer" : "default", background: af ? "rgba(99,102,241,.15)" : "rgba(20,20,35,.3)", border: `1px solid ${af ? "rgba(99,102,241,.4)" : "rgba(40,40,60,.2)"}`, color: af ? "#a5b4fc" : "#353555", transition: "all .2s", fontWeight: 600 }}>{u.cost}pt</button>
                    }
                  />
                );
              })}
            </div>
          );
        })}
        <div style={{ fontSize: 10, color: "#505070", fontFamily: "var(--sans)", textAlign: "center", marginTop: 16, marginBottom: 8, lineHeight: 1.7 }}>
          {meta.unlocked.length}/{UNLOCKS.length} 解放済
          {meta.unlocked.length === UNLOCKS.length && <span style={{ color: "#4ade80", marginLeft: 8 }}>── 全解放達成 ──</span>}
        </div>
         <BackBtn onClick={() => setPhase("title")} />
      </div>
    </Page>
  );

  // ── TITLES (称号選択) ──
  if (phase === "titles") {
    const unlocked = getUnlockedTitles(meta);
    const active = getActiveTitle(meta);
    return (
    <Page particles={Particles}>
      <div className="card" style={{ marginTop: 32, animation: "fadeUp .5s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, color: "#c4b5fd", letterSpacing: 3 }}>称号</h2>
          <span style={{ fontSize: 12, color: active.color, fontFamily: "var(--sans)" }}>{active.icon} {active.name}</span>
        </div>
        <p style={{ fontSize: 12, color: "var(--dim)", marginBottom: 20, fontFamily: "var(--sans)", lineHeight: 1.7 }}>獲得した称号をタイトル画面に表示できる。条件を満たすと新しい称号が解放される。</p>
        {TITLES.map(t => {
          const isUnlocked = unlocked.includes(t);
          const isActive = active.id === t.id;
          return (
            <div key={t.id} className={`uc ${isActive ? "own" : ""}`} style={{ opacity: isUnlocked ? 1 : 0.35, cursor: isUnlocked ? "pointer" : "default" }}
              onClick={() => { if (isUnlocked) updateMeta(() => ({ title: t.id })); }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 20, filter: isUnlocked ? "none" : "grayscale(1)" }}>{isUnlocked ? t.icon : "?"}</span>
                <div>
                  <div style={{ fontSize: 14, color: isActive ? t.color : isUnlocked ? "var(--text)" : "#505070", fontFamily: "var(--sans)", fontWeight: 600 }}>
                    {isActive && "▸ "}{isUnlocked ? t.name : "???"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 2, fontFamily: "var(--sans)" }}>
                    {isUnlocked ? t.desc : "条件を満たすと解放"}
                  </div>
                </div>
              </div>
              {isUnlocked && !isActive && <span style={{ fontSize: 10, color: "#818cf8", fontFamily: "var(--sans)", padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(99,102,241,.3)", background: "rgba(99,102,241,.08)" }}>選択</span>}
              {isActive && <span style={{ fontSize: 10, color: t.color, fontFamily: "var(--sans)", fontWeight: 700 }}>使用中</span>}
            </div>
          );
        })}
        <div style={{ fontSize: 11, color: "var(--dim)", textAlign: "center", marginTop: 12, fontFamily: "var(--sans)" }}>{unlocked.length} / {TITLES.length} 解放済</div>
        <BackBtn onClick={() => setPhase("title")} />
      </div>
    </Page>
  );
  }

  // ── RECORDS (実績・記録確認 — declarative data-driven) ──
  if (phase === "records") {
    const unlockedTitles = getUnlockedTitles(meta);
    const survivalRate = meta.runs > 0 ? Math.round(meta.escapes / meta.runs * 100) : 0;
    return (
    <Page particles={Particles}>
      <div className="card" style={{ marginTop: 32, animation: "fadeUp .5s ease" }}>
        <h2 style={{ fontSize: 20, color: "#c4b5fd", letterSpacing: 3, marginBottom: 20 }}>実績・記録</h2>

        <Section label="累計記録">
          <div className="grid-2">
            <StatEntry label="探索回数" color="#818cf8" value={meta.runs} />
            <StatEntry label="生還回数" color="#4ade80" value={meta.escapes} />
            <StatEntry label="死亡回数" color="#f87171" value={meta.totalDeaths ?? 0} />
            <StatEntry label="生還率" color={survivalRate > 30 ? "#4ade80" : "#f87171"} value={`${survivalRate}%`} />
            <StatEntry label="最深到達" color="#fbbf24" value={`第${meta.bestFl}層`} />
            <StatEntry label="累計イベント" color="#c084fc" value={meta.totalEvents} />
            <StatEntry label="知見ポイント" color="#fbbf24" value={`◈ ${meta.kp}pt`} />
            <StatEntry label="継承解放数" color="#60a5fa" value={`${meta.unlocked.length}/${UNLOCKS.length}`} />
          </div>
        </Section>

        <Section label="難易度クリア">
          <div className="flex-wrap-c" style={{ gap: 8 }}>
            {DIFFICULTY.map(d => {
              const cleared = meta.clearedDiffs?.includes(d.id);
              return <span key={d.id} style={{ fontSize: 11, fontFamily: "var(--sans)", padding: "4px 12px", borderRadius: 6, background: cleared ? `${d.color}15` : "rgba(30,30,50,.5)", border: `1px solid ${cleared ? `${d.color}40` : "rgba(40,40,60,.3)"}`, color: cleared ? d.color : "#353555" }}>{d.icon} {d.name} {cleared ? "✓" : "─"}</span>;
            })}
          </div>
        </Section>

        <Section label={`エンディング回収 (${meta.endings?.length ?? 0}/${ENDINGS.length})`}>
          <EndingGrid endings={ENDINGS} collected={meta.endings} />
        </Section>

        <Section label="難易度クリア報酬" color="#f97316">
          {UNLOCKS.filter(u => u.cat === "trophy").map(u => {
            const own = meta.unlocked.includes(u.id);
            return <UnlockRow key={u.id} icon={u.icon} name={own ? u.name : "???"} desc={own ? u.desc : `${DIFFICULTY.find(d=>d.id===u.req)?.name ?? u.req}難度をクリアして解放`} own={own} locked={!own}
              right={own ? <span style={{ fontSize: 10, color: "#4ade80" }}>達成</span> : <span style={{ fontSize: 10, color: "#505070" }}>🔒</span>} />;
          })}
        </Section>

        <Section label="実績解放" color="#4ade80">
          {UNLOCKS.filter(u => u.cat === "achieve").map(u => {
            const own = meta.unlocked.includes(u.id);
            return <UnlockRow key={u.id} icon={u.icon} name={own ? u.name : "???"} desc={own ? u.desc : u.achDesc} own={own} locked={!own}
              right={own ? <span style={{ fontSize: 10, color: "#4ade80" }}>達成</span> : <span style={{ fontSize: 10, color: "#505070" }}>🔒</span>} />;
          })}
        </Section>

        <Section label={`称号 (${unlockedTitles.length}/${TITLES.length})`} color="#c084fc">
          <div className="flex-wrap-c">
            {TITLES.map(t => <Badge key={t.id} got={unlockedTitles.includes(t)} color={t.color} label={`${t.icon} ${t.name}`} />)}
          </div>
        </Section>

        <BackBtn onClick={() => setPhase("title")} />
      </div>
    </Page>
  );
  }

  // ── SETTINGS ──
  if (phase === "settings") return (
    <Page particles={Particles}>
      <div className="card" style={{ marginTop: 32, animation: "fadeUp .5s ease" }}>
        <h2 style={{ fontSize: 20, color: "#c4b5fd", letterSpacing: 3, marginBottom: 20 }}>設定</h2>

        <Section label="サウンド">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontFamily: "var(--sans)", color: "var(--text)" }}>効果音</span>
            <button onClick={toggleAudio} style={{
              padding: "6px 18px", borderRadius: 20, fontSize: 12, fontFamily: "var(--sans)", fontWeight: 600, cursor: "pointer", transition: "all .2s", border: "1px solid",
              background: audioOn ? "rgba(74,222,128,.12)" : "rgba(40,40,60,.5)",
              borderColor: audioOn ? "rgba(74,222,128,.3)" : "rgba(60,60,90,.3)",
              color: audioOn ? "#4ade80" : "var(--dim)",
            }}>{audioOn ? "♪ ON" : "♪ OFF"}</button>
          </div>
        </Section>

        <Section>
          <div style={{ fontSize: 13, color: "var(--text)", fontFamily: "var(--sans)", fontWeight: 600, marginBottom: 8 }}>ゲーム情報</div>
          <div style={{ fontSize: 11, color: "var(--dim)", fontFamily: "var(--sans)", lineHeight: 1.8 }}>
            <div>バージョン: v6</div>
            <div>イベント数: {EVENTS.length}</div>
            <div>エンディング: {ENDINGS.length}種</div>
            <div>知見の継承: {UNLOCKS.length}種</div>
            <div>称号: {TITLES.length}種</div>
          </div>
        </Section>

        <div className="sec" style={{ background: "rgba(60,10,10,.2)", border: "1px solid rgba(248,113,113,.15)" }}>
          <div style={{ fontSize: 13, color: "#f87171", fontFamily: "var(--sans)", fontWeight: 600, marginBottom: 8 }}>⚠ データリセット</div>
          <p style={{ fontSize: 11, color: "var(--dim)", fontFamily: "var(--sans)", lineHeight: 1.8, marginBottom: 12 }}>
            全ての進行データ（探索回数、知見ポイント、解放済みアビリティ、称号、エンディング記録、難易度クリア記録）を完全に消去し、初期状態に戻します。この操作は取り消せません。
          </p>
          <button className="btn tc" style={{ color: "#f87171", borderColor: "rgba(248,113,113,.3)" }} onClick={() => setPhase("reset_confirm1")}>
            データを初期化する…
          </button>
        </div>

        <BackBtn onClick={() => setPhase("title")} />
      </div>
    </Page>
  );

  // ── RESET CONFIRM STEP 1 ──
  if (phase === "reset_confirm1") return (
    <Page particles={Particles}>
      <div className="card tc" style={{ marginTop: "10vh", animation: "fadeUp .5s ease", borderColor: "rgba(248,113,113,.2)" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ fontSize: 20, color: "#f87171", letterSpacing: 3, marginBottom: 12 }}>本当に初期化しますか？</h2>
        <p style={{ fontSize: 12, color: "var(--dim)", fontFamily: "var(--sans)", lineHeight: 1.8, marginBottom: 8 }}>
          以下のデータが全て失われます：
        </p>
        <div style={{ fontSize: 11, fontFamily: "var(--sans)", color: "#f87171", lineHeight: 1.8, marginBottom: 20, textAlign: "left", padding: "8px 16px", background: "rgba(248,113,113,.05)", borderRadius: 8, border: "1px solid rgba(248,113,113,.1)" }}>
          <div>• 探索 {meta.runs}回分の記録</div>
          <div>• 知見ポイント ◈ {meta.kp}pt</div>
          <div>• 解放済みアビリティ {meta.unlocked.length}個</div>
          <div>• エンディング回収 {meta.endings?.length ?? 0}種</div>
          <div>• 難易度クリア記録 {meta.clearedDiffs?.length ?? 0}種</div>
          <div>• 称号 {getUnlockedTitles(meta).length}種</div>
        </div>
        <button className="btn tc" style={{ color: "#f87171", borderColor: "rgba(248,113,113,.4)", fontWeight: 700 }} onClick={() => setPhase("reset_confirm2")}>
          それでも初期化する
        </button>
        <button className="btn btn-p tc" style={{ marginTop: 8 }} onClick={() => setPhase("settings")}>やめる</button>
      </div>
    </Page>
  );

  // ── RESET CONFIRM STEP 2 (Final) ──
  if (phase === "reset_confirm2") return (
    <Page particles={Particles}>
      <div className="card tc" style={{ marginTop: "10vh", animation: "fadeUp .5s ease", borderColor: "rgba(248,113,113,.4)" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔥</div>
        <h2 style={{ fontSize: 22, color: "#ff0040", letterSpacing: 3, marginBottom: 16, animation: "pulse 2s infinite" }}>最終確認</h2>
        <p style={{ fontSize: 14, color: "#f87171", fontFamily: "var(--sans)", lineHeight: 1.8, marginBottom: 24, fontWeight: 600 }}>
          この操作は取り消せません。<br />全てのデータが完全に消去されます。
        </p>
        <button className="btn tc" style={{ color: "#ff0040", borderColor: "rgba(255,0,64,.5)", background: "rgba(255,0,64,.08)", fontWeight: 700, fontSize: 14, padding: "14px" }} onClick={async () => {
          await resetMeta();
          setPhase("title");
        }}>
          完全に初期化する
        </button>
        <button className="btn btn-p tc" style={{ marginTop: 12, fontSize: 14, padding: "14px" }} onClick={() => setPhase("settings")}>やめて戻る</button>
      </div>
    </Page>
  );

  // ── FLOOR INTRO ──
  if (phase === "floor_intro") return (
    <Page particles={Particles}>
      <div className="card tc" style={{ marginTop: "10vh", animation: "floorReveal .9s ease" }}>
        <div style={{ fontSize: 11, color: floorColor, letterSpacing: 8, marginBottom: 14, fontFamily: "var(--sans)", opacity: .8, fontWeight: 600 }}>FLOOR {floor}</div>
        <h2 style={{ fontSize: 32, color: floorColor, letterSpacing: 6, marginBottom: 10, animation: "glow 3s ease-in-out infinite", lineHeight: 1.5, textShadow: `0 0 30px ${floorColor}40` }}>{floorMeta.name}</h2>
        <p style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.8, marginBottom: 20, fontFamily: "var(--sans)" }}>{floorMeta.desc}</p>
        <DiffLabel diff={diff} />
        {meta.unlocked.length > 0 && <div style={{ fontSize: 10, color: "#818cf8", fontFamily: "var(--sans)", marginBottom: 12, opacity: .7 }}>継承効果 {meta.unlocked.length}個 有効</div>}
        <FloorProgress pct={progressPct} color={floorColor} />
        {player && <div style={{ marginTop: 24, marginBottom: 20 }}><StatSummary player={player} /></div>}
        {chainNext && <div style={{ fontSize: 11, color: "#60a5fa", fontFamily: "var(--sans)", marginBottom: 12, animation: "pulse 2s infinite" }}>… 何かが待ち構えている</div>}
        <button className="btn btn-p tc" style={{ fontSize: 15 }} onClick={enterFloor}>
          {floor === 1 ? "迷宮に踏み込む" : `第${floor}層へ降りる`}
        </button>
      </div>
    </Page>
  );

  // ── EVENT / RESULT ──
  if ((phase === "event" || phase === "result") && player) {
    const evType = event ? EVENT_TYPE[event.tp] : null;
    const isChainEvent = event?.chainOnly;
    return (
      <Page particles={Particles}>
        <div className="vignette" style={vignette} />
        {overlay === "dmg" && <div className="dmg-overlay" />}
        {overlay === "heal" && <div className="heal-overlay" />}

        {/* Status panel */}
        <div className={`card ${shake ? "shake" : ""}`} style={{ padding: "16px 20px", marginBottom: 12, animation: "fadeIn .3s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <div className="fb" style={{ background: `${floorColor}12`, border: `1px solid ${floorColor}25`, color: floorColor }}>
                <span style={{ fontWeight: 700 }}>第{floor}層</span><span style={{ opacity: .5 }}>|</span><span>{floorMeta.name}</span>
              </div>
              <DiffBadge diff={diff} />
              {isChainEvent && <span style={{ fontSize: 9, color: "#60a5fa", fontFamily: "var(--sans)", opacity: .8 }}>連続</span>}
            </div>
            <StepDots current={step} total={CFG.EVENTS_PER_FLOOR} />
          </div>
          <StatBar label="体力" value={player.hp} max={player.maxHp} color={player.hp < player.maxHp * .25 ? "#ef4444" : "linear-gradient(90deg,#ef4444,#f87171)"} icon="❤" />
          <StatBar label="精神力" value={player.mn} max={player.maxMn} color={player.mn < player.maxMn * .25 ? "#7c3aed" : "linear-gradient(90deg,#6366f1,#818cf8)"} icon="◈" />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4, flexWrap: "wrap", gap: 6 }}>
            <div style={{ fontSize: 11, color: "var(--dim)", fontFamily: "var(--sans)" }}>📖 情報: <span style={{ color: "#fbbf24", fontWeight: 700 }}>{player.inf}</span></div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{player.st.map(s => <StatusTag key={s} name={s} />)}</div>
          </div>
          <div style={{ marginTop: 10, height: 3, background: "rgba(20,20,50,.8)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progressPct}%`, background: `linear-gradient(90deg,#6366f1,${floorColor})`, borderRadius: 2, transition: "width .5s" }} />
          </div>
          <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 9, color: "#404060", fontFamily: "var(--sans)" }}>全体進捗 {Math.round(progressPct)}%</span>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button onClick={toggleAudio} style={{ fontSize: 10, color: audioOn ? "#4ade80" : "#404060", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--sans)", transition: "color .2s" }}>{audioOn ? "♪" : "♪×"}</button>
              <button onClick={() => setShowLog(!showLog)} style={{ fontSize: 10, color: "var(--dim)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--sans)" }}>{showLog ? "閉じる ▲" : "ログ ▼"}</button>
            </div>
          </div>
          {showLog && <div style={{ marginTop: 8, maxHeight: 180, overflowY: "auto", background: "rgba(0,0,0,.25)", borderRadius: 8, padding: 12 }}>
            {log.length === 0
              ? <div style={{ fontSize: 11, color: "#404060", fontFamily: "var(--sans)" }}>ログなし</div>
              : log.slice().reverse().map((l, i) => <LogEntry key={i} entry={l} />)}
          </div>}
        </div>

        {/* Main event card */}
        <div className={`card ${lowMental ? "distort" : ""}`} style={{ animation: "fadeUp .4s" }}>
          {phase === "event" && event && <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              {evType && <span className="tag" style={{ color: evType.colors[0], background: evType.colors[1], border: `1px solid ${evType.colors[2]}`, letterSpacing: 3, fontSize: 10, fontWeight: 600 }}>{evType.label}</span>}
              {isChainEvent && <span className="tag" style={{ color: "#60a5fa", background: "rgba(96,165,250,.08)", border: "1px solid rgba(96,165,250,.2)", fontSize: 10 }}>連鎖</span>}
              <span style={{ fontSize: 10, color: "#404060", fontFamily: "var(--sans)" }}>#{(floor - 1) * CFG.EVENTS_PER_FLOOR + step + 1}/{CFG.MAX_FLOOR * CFG.EVENTS_PER_FLOOR}</span>
            </div>
            <TypewriterText text={event.sit} revealed={revealed} done={done} ready={ready} skip={skip} />
            {done && ready && <div style={{ animation: "fadeUp .4s" }}>
              <div className="sec-hd" style={{ color: "#505078" }}>── 行動を選択 ──</div>
              {event.ch.map((c, i) => {
                const conds = c.o?.filter(o => o.c !== "default").map(o => o.c) ?? [];
                const hint = player.inf >= 15 && conds.length > 0
                  ? conds[0].startsWith("hp") ? "❤" : conds[0].startsWith("mn") ? "◈" : conds[0].startsWith("inf") ? "📖" : conds[0].startsWith("status") ? "●" : null
                  : null;
                return <button key={i} className="btn" onClick={() => handleChoice(i)} style={{ display: "flex", alignItems: "flex-start", animation: `slideIn .3s ease ${i * 0.08}s both` }}>
                  <span className="cn">{i + 1}</span>
                  <span style={{ flex: 1 }}>{c.t}</span>
                  {hint && <span style={{ fontSize: 9, opacity: .4, marginLeft: 6, alignSelf: "center" }} title="条件あり">{hint}</span>}
                </button>;
              })}
            </div>}
          </>}

          {phase === "result" && <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span className="tag" style={{ color: "#fbbf24", background: "rgba(251,191,36,.08)", border: "1px solid rgba(251,191,36,.2)", letterSpacing: 3, fontSize: 10, fontWeight: 600 }}>結 果</span>
            </div>
            <TypewriterText text={resTxt} revealed={revealed} done={done} ready={ready} skip={skip} mb={24} minHeight={60} />
            {done && ready && resChg && <div style={{ animation: "fadeUp .3s" }}>
              {(() => {
                const net = (resChg.hp ?? 0) + (resChg.mn ?? 0) + (resChg.inf ?? 0);
                const borderClr = net > 0 ? "rgba(74,222,128,.18)" : net < 0 ? "rgba(248,113,113,.15)" : "rgba(50,50,80,.15)";
                const bgClr = net > 0 ? "rgba(74,222,128,.03)" : net < 0 ? "rgba(248,113,113,.03)" : "rgba(8,8,20,.5)";
                return (
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 12, padding: "12px 16px", background: bgClr, borderRadius: 10, border: `1px solid ${borderClr}` }}>
                    {resChg.hp !== 0  && <Change value={resChg.hp} label="HP" />}
                    {resChg.mn !== 0  && <Change value={resChg.mn} label="精神" />}
                    {resChg.inf !== 0 && <Change value={resChg.inf} label="情報" />}
                    <FlagIndicator flag={resChg.fl} />
                  </div>
                );
              })()}
              <DrainDisplay drain={drainInfo} />
              {player.hp > 0 && player.mn > 0 && resChg.fl !== "escape" && (() => {
                const remaining = CFG.EVENTS_PER_FLOOR - step;
                const nextFloorFlag = step >= CFG.EVENTS_PER_FLOOR && floor < CFG.MAX_FLOOR;
                return (
                  <div style={{ fontSize: 10, color: "#505070", fontFamily: "var(--sans)", marginBottom: 10, display: "flex", gap: 12, justifyContent: "center" }}>
                    {remaining > 0 && <span>この層 残り{remaining}イベント</span>}
                    {nextFloorFlag && <span style={{ color: floorColor }}>→ 第{floor + 1}層へ</span>}
                  </div>
                );
              })()}
              {player.hp > 0 && player.mn > 0 && resChg.fl !== "escape" && <button className="btn btn-p tc" onClick={proceed}>先に進む</button>}
            </div>}
          </>}
        </div>
      </Page>
    );
  }

  // ── GAME OVER ──
  if (phase === "gameover") {
    const deathCause = player?.hp <= 0 ? "体力消耗" : "精神崩壊";
    const flavors = DEATH_FLAVORS[deathCause];
    const flavor = flavors[meta.runs % flavors.length];
    return (
    <Page particles={Particles}>
      <div className="card tc" style={{ marginTop: "8vh", animation: "fadeUp .8s" }}>
        <div style={{ fontSize: 10, color: "#f87171", letterSpacing: 6, marginBottom: 14, fontFamily: "var(--sans)", fontWeight: 600 }}>EXPLORATION FAILED</div>
        <h2 style={{ fontSize: 30, color: "var(--bright)", letterSpacing: 5, marginBottom: 10, lineHeight: 1.5 }}>探索失敗</h2>
        <DiffLabel diff={diff} />
        <p style={{ fontSize: 13, color: "#a0a0c0", lineHeight: 1.9, marginBottom: 12, fontFamily: "var(--sans)", whiteSpace: "pre-wrap" }}>{flavor}</p>
        <p style={{ fontSize: 11, color: "var(--dim)", marginBottom: 24, fontFamily: "var(--sans)" }}>しかし、得た知見は失われない。</p>
        <div className="divider" style={{ margin: "0 auto 24px" }} />
        <RecordPanel labelText="探索記録" entries={[
          { label: "到達",       color: floorColor, value: `${floorMeta.name}（第${floor}層）` },
          { label: "通過イベント", color: "#fbbf24", value: `${log.length}件` },
          { label: "全体進捗",   color: "#818cf8", value: `${Math.round(progressPct)}%` },
          { label: "死因",       color: "#f87171", value: deathCause },
          ...(usedSecondLife ? [{ label: "二度目の命", color: "#fbbf24", value: "発動済（使い切り）" }] : []),
          { label: "状態異常",   color: player?.st.length > 0 ? "#f87171" : "#4ade80", value: player?.st.length > 0 ? player.st.join("・") : "なし" },
        ]} />
        <div style={{ padding: "10px 16px", background: "rgba(74,222,128,.04)", borderRadius: 10, border: "1px solid rgba(74,222,128,.1)", marginBottom: 16, animation: "popIn .4s ease .3s both" }}>
          <div style={{ fontSize: 12, color: "#4ade80", fontFamily: "var(--sans)", fontWeight: 700, textAlign: "center" }}>
            獲得知見 +{diff?.kpDeath ?? 2}pt
            <span style={{ fontSize: 10, color: "#706080", fontWeight: 400, marginLeft: 6 }}>（合計 {meta.kp}pt）</span>
          </div>
        </div>
        <Section style={{ background: "rgba(99,102,241,.04)", border: "1px solid rgba(99,102,241,.1)", marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: "#818cf8", fontFamily: "var(--sans)", fontWeight: 600, marginBottom: 6, letterSpacing: 1 }}>💡 助言</div>
          <p style={{ fontSize: 11, color: "var(--dim)", fontFamily: "var(--sans)", lineHeight: 1.8, margin: 0 }}>
            {DEATH_TIPS[deathCause][meta.runs % DEATH_TIPS[deathCause].length]}
          </p>
          <p style={{ fontSize: 10, color: "#505070", fontFamily: "var(--sans)", lineHeight: 1.6, marginTop: 6, margin: 0 }}>
            {floor <= 2 ? DEATH_TIPS.early : floor <= 4 ? DEATH_TIPS.mid : DEATH_TIPS.late}
          </p>
        </Section>
        <button className="btn btn-p tc" style={{ fontSize: 15 }} onClick={startRun}>再び挑む</button>
        {meta.kp > 0 && <button className="btn tc" onClick={() => setPhase("unlocks")}>知見の継承 ◈ {meta.kp}pt</button>}
        <button className="btn tc" onClick={() => setPhase("title")}>タイトル</button>
      </div>
    </Page>
  );
  }

  // ── VICTORY (Multi-Ending) ──
  if (phase === "victory") {
    const end = ending ?? ENDINGS[ENDINGS.length - 1];
    const totalKp = (diff?.kpWin ?? 4) + end.bonusKp;
    return (
      <Page particles={Particles}>
        <div className="card tc" style={{ marginTop: "6vh", animation: "fadeUp .8s", borderColor: `${end.color}30` }}>
          <div style={{ fontSize: 10, color: end.color, letterSpacing: 6, marginBottom: 8, fontFamily: "var(--sans)", fontWeight: 600 }}>{end.sub}</div>
          <div style={{ fontSize: 48, marginBottom: 12, animation: "endingGlow 3s ease-in-out infinite", lineHeight: 1 }}>{end.icon}</div>

          {isNewEnding && <div style={{ display: "inline-block", padding: "2px 12px", borderRadius: 12, fontSize: 10, fontFamily: "var(--sans)", fontWeight: 700, background: `${end.color}20`, border: `1px solid ${end.color}40`, color: end.color, marginBottom: 8, letterSpacing: 2, animation: "pulse 2s infinite" }}>★ NEW ENDING ★</div>}
          {isNewDiffClear && <div style={{ display: "inline-block", padding: "2px 12px", borderRadius: 12, fontSize: 10, fontFamily: "var(--sans)", fontWeight: 700, background: `${diff?.color ?? "#818cf8"}20`, border: `1px solid ${diff?.color ?? "#818cf8"}40`, color: diff?.color ?? "#818cf8", marginBottom: 8, marginLeft: isNewEnding ? 6 : 0, letterSpacing: 2, animation: "pulse 2s infinite 0.3s" }}>🏆 {diff?.name}初クリア</div>}

          <h2 style={{ fontSize: 28, color: end.color, letterSpacing: 5, marginBottom: 8, lineHeight: 1.5, textShadow: `0 0 30px ${end.color}40` }}>{end.name}</h2>
          <DiffLabel diff={diff} />
          <p style={{ fontSize: 13, color: "#a0a0c0", lineHeight: 2, marginBottom: 24, fontFamily: "var(--sans)", whiteSpace: "pre-wrap" }}>{end.desc}</p>
          <div style={{ width: 80, height: 2, background: end.gradient, margin: "0 auto 24px", borderRadius: 2 }} />

          <RecordPanel labelText="生還記録" labelColor={end.color} borderColor={`${end.color}20`} entries={[
            { label: "エンディング", color: end.color, value: end.name },
            { label: "難易度",     color: diff?.color ?? "#818cf8", value: `${diff?.icon ?? ""}${diff?.name ?? "通常"}` },
            { label: "残存HP",     color: "#f87171", value: `${player?.hp}/${player?.maxHp}` },
            { label: "残存精神",   color: "#818cf8", value: `${player?.mn}/${player?.maxMn}` },
            { label: "情報値",     color: "#fbbf24", value: `${player?.inf}` },
            { label: "状態異常",   color: player?.st.length > 0 ? "#f87171" : "#4ade80", value: player?.st.length > 0 ? player.st.join("・") : "なし" },
            ...(usedSecondLife ? [{ label: "二度目の命", color: "#fbbf24", value: "発動（復活1回消費）" }] : []),
            { label: "通過イベント", color: "#c084fc", value: `${log.length}件` },
          ]} />

          <div style={{ padding: "12px 16px", background: "rgba(251,191,36,.05)", borderRadius: 10, border: "1px solid rgba(251,191,36,.12)", marginBottom: 20, animation: "popIn .4s ease .3s both" }}>
            <div style={{ fontSize: 13, color: "#fbbf24", fontFamily: "var(--sans)", fontWeight: 700, textAlign: "center" }}>
              獲得知見 +{totalKp}pt
              <span style={{ fontSize: 10, color: "#706080", fontWeight: 400, marginLeft: 6 }}>（基本{diff?.kpWin ?? 4} + ED{end.bonusKp}）</span>
            </div>
            <div style={{ fontSize: 11, color: "#706080", fontFamily: "var(--sans)", textAlign: "center", marginTop: 4 }}>合計: {meta.kp}pt</div>
          </div>

          <Section label="エンディング回収" style={{ background: "rgba(8,8,20,.5)" }}>
            <EndingGrid endings={ENDINGS} collected={meta.endings} />
            <div style={{ fontSize: 10, color: "var(--dim)", marginTop: 8, fontFamily: "var(--sans)" }}>
              {meta.endings?.length ?? 0} / {ENDINGS.length} 回収済
            </div>
          </Section>

          <button className="btn btn-p tc" style={{ fontSize: 15 }} onClick={startRun}>新たな探索へ</button>
          <button className="btn tc" onClick={() => setPhase("unlocks")}>知見の継承 ◈ {meta.kp}pt</button>
          <button className="btn tc" onClick={() => setPhase("title")}>タイトル</button>
        </div>
      </Page>
    );
  }

  return null;
}

export function LabyrinthEchoGame() {
  return <ErrorBoundary><GameInner /></ErrorBoundary>;
}
