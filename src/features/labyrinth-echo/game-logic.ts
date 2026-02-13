// @ts-nocheck
/**
 * 迷宮の残響 - ゲームロジック（純粋関数）
 *
 * LabyrinthEchoGame.tsx §4-§5 から抽出した状態非依存のロジック。
 * テスト容易性と再利用性のために分離。
 */

// ── 契約（DbC） ──────────────────────────────────────

/** Design-by-Contract assertion — throws on violation */
export const invariant = (cond, ctx, detail = "") => {
  if (!cond) {
    const msg = `[迷宮の残響] Invariant violation in ${ctx}${detail ? `: ${detail}` : ""}`;
    console.error(msg);
    throw new Error(msg);
  }
};

// ── ゲーム設定 ────────────────────────────────────────

export const CFG = Object.freeze({
  EVENTS_PER_FLOOR: 3,
  MAX_FLOOR: 5,
  BASE_HP: 55,
  BASE_MN: 35,
  BASE_INF: 5,
  BOSS_EVENT_ID: "e030",
});

export const DIFFICULTY = Object.freeze([
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

export const STATUS_META = Object.freeze({
  "負傷": { colors: ["#f87171", "rgba(248,113,113,0.08)", "rgba(248,113,113,0.18)"], tick: null },
  "混乱": { colors: ["#c084fc", "rgba(192,132,252,0.08)", "rgba(192,132,252,0.18)"], tick: null },
  "出血": { colors: ["#fb7185", "rgba(251,113,133,0.08)", "rgba(251,113,133,0.18)"], tick: { hp: -5, mn: 0 } },
  "恐怖": { colors: ["#a78bfa", "rgba(167,139,250,0.08)", "rgba(167,139,250,0.18)"], tick: { hp: 0, mn: -4 } },
  "呪い": { colors: ["#fb923c", "rgba(251,146,60,0.08)",  "rgba(251,146,60,0.18)"],  tick: null },
});

export const UNLOCKS = Object.freeze([
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

// ── 純粋ゲームロジック ────────────────────────────────

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const rand  = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
export const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

/** FX key classification for merge strategy */
export const FX_MULT = new Set(["infoMult", "healMult", "mnReduce", "hpReduce"]);
export const FX_BOOL = new Set(["dangerSense", "bleedReduce", "drainImmune", "curseImmune", "secondLife", "chainBoost", "negotiator", "mentalSense"]);
export const FX_DEFAULTS = Object.freeze({ hpBonus: 0, mentalBonus: 0, infoBonus: 0, infoMult: 1, healMult: 1, dangerSense: false, mnReduce: 1, bleedReduce: false, drainImmune: false, hpReduce: 1, curseImmune: false, secondLife: false, chainBoost: false, negotiator: false, mentalSense: false });

/**
 * Merge all unlock effects into a single FX object.
 * @pre  each id in unlockIds exists in UNLOCKS
 * @post returned object has every key in FX_DEFAULTS
 */
export const computeFx = (unlockIds) => {
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
export const createPlayer = (diff, fx) => {
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
export const evalCond = (cond, player, fx) => {
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
export const resolveOutcome = (choice, player, fx) => {
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
export const applyModifiers = (outcome, fx, diff, playerStatuses) => {
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
export const applyToPlayer = (player, { hp, mn, inf }, flag) => {
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
export const computeDrain = (player, fx, diff) => {
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
export const classifyImpact = (hp, mn) => {
  if (hp < -15) return "bigDmg";
  if (hp < 0 || mn < -10) return "dmg";
  if (hp > 0) return "heal";
  return null;
};

/** Overall progress 0-100 */
export const computeProgress = (floor, step) =>
  Math.min(100, ((floor - 1) * CFG.EVENTS_PER_FLOOR + step) / (CFG.MAX_FLOOR * CFG.EVENTS_PER_FLOOR) * 100);
