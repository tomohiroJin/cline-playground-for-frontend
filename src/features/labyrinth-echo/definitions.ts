/**
 * 迷宮の残響 - ゲーム定義・設定
 *
 * LabyrinthEchoGame.tsx §4, §6a, §10 から抽出。
 * フロアメタ、イベント種別、称号、エンディング、定数定義を提供する。
 */
import { DIFFICULTY, UNLOCKS } from './game-logic';
import type { Player, DifficultyDef, MetaState } from './game-logic';
import type { EventTypeDef } from './events/event-utils';

// ── 型定義 ──────────────────────────────────────────

/** フロアメタ定義 */
export interface FloorMetaDef {
  name: string;
  desc: string;
  color: string;
}

/** エンディング定義 */
export interface EndingDef {
  id: string;
  name: string;
  sub: string;
  desc: string;
  cond: (player: Player, log: LogEntry[], diff: DifficultyDef | null) => boolean;
  color: string;
  icon: string;
  bonusKp: number;
  gradient: string;
}

/** 称号定義 */
export interface TitleDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  cond: (meta: MetaState) => boolean;
  desc: string;
}

/** ログエントリー定義 */
export interface LogEntry {
  fl: number;
  step: number;
  ch: string;
  hp: number;
  mn: number;
  inf: number;
  flag?: string;
}

/** アンロックカテゴリ定義 */
export interface UnlockCatDef {
  key: string;
  label: string;
  color: string;
}

// ============================================================
// §4. GAME CONFIGURATION
// ============================================================

/** フロアメタ — 名前・説明・色はオリジナルデザインに準拠 */
export const FLOOR_META: Readonly<Record<number, FloorMetaDef>> = Object.freeze({
  1: { name: "表層回廊",   desc: "迷宮の入口。油断すれば、ここで終わる。",                              color: "#60a5fa" },
  2: { name: "灰色の迷路", desc: "光が途絶えた。静寂と恐怖が支配する灰色の世界。",                      color: "#a0a0b8" },
  3: { name: "深淵の間",   desc: "空間が歪む。常識が通用しない。帰還率は三割を切る。",                  color: "#c084fc" },
  4: { name: "忘却の底",   desc: "記憶が曖昧になる。自分が何者か忘れていく。",                          color: "#f472b6" },
  5: { name: "迷宮の心臓", desc: "迷宮の核心。ここから生還した者は、極めて少ない。",                    color: "#fbbf24" },
});

export const EVENT_TYPE: Readonly<Record<string, EventTypeDef>> = Object.freeze({
  exploration: { label: "探 索", colors: ["#38bdf8", "rgba(56,189,248,0.08)",  "rgba(56,189,248,0.2)"]  },
  encounter:   { label: "遭 遇", colors: ["#fbbf24", "rgba(251,191,36,0.08)",  "rgba(251,191,36,0.2)"]  },
  trap:        { label: "罠",    colors: ["#f87171", "rgba(248,113,113,0.08)", "rgba(248,113,113,0.2)"] },
  rest:        { label: "安 息", colors: ["#4ade80", "rgba(74,222,128,0.08)",  "rgba(74,222,128,0.2)"]  },
});

/** 初期メタ状態の正規形 — init とリセットの単一ソース (DRY) */
export const FRESH_META = Object.freeze({
  runs: 0, escapes: 0, kp: 0, unlocked: [], bestFl: 0,
  totalEvents: 0, endings: [], clearedDiffs: [], totalDeaths: 0,
  lastRun: null, title: null,
});

// ============================================================
// §6a. DEFINITIONS (Titles, Endings)
// ============================================================

export const TITLES: readonly TitleDef[] = Object.freeze([
  // Starter
  { id: "t00", name: "迷い人",         icon: "🚶", color: "#808098", cond: () => true, desc: "全ての探索者が最初に持つ称号" },
  // Run milestones
  { id: "t01", name: "初探索者",       icon: "🔰", color: "#4ade80", cond: (m: MetaState) => m.runs >= 1,  desc: "初めての探索を終えた" },
  { id: "t02", name: "冒険者",         icon: "⚔",  color: "#818cf8", cond: (m: MetaState) => m.runs >= 5,  desc: "5回の探索を経験した" },
  { id: "t03", name: "熟練探索者",     icon: "🗡",  color: "#c084fc", cond: (m: MetaState) => m.runs >= 15, desc: "15回の探索を経験した" },
  { id: "t04", name: "歴戦の勇者",     icon: "🏛",  color: "#fbbf24", cond: (m: MetaState) => m.runs >= 30, desc: "30回の探索を経験した" },
  { id: "t05", name: "伝説の探索者",   icon: "👑",  color: "#ff0040", cond: (m: MetaState) => m.runs >= 50, desc: "50回の探索を経験した" },
  // Escape milestones
  { id: "t06", name: "生還者",         icon: "🌿", color: "#4ade80", cond: (m: MetaState) => m.escapes >= 1, desc: "初めて迷宮から生還した" },
  { id: "t07", name: "迷宮踏破者",     icon: "🏆", color: "#fbbf24", cond: (m: MetaState) => m.escapes >= 10, desc: "10回生還を果たした" },
  { id: "t08", name: "不死身",         icon: "☀",  color: "#fde68a", cond: (m: MetaState) => m.escapes >= 20, desc: "20回生還した不滅の存在" },
  // Death milestones
  { id: "t09", name: "七転八起",       icon: "🔄", color: "#f87171", cond: (m: MetaState) => (m.totalDeaths ?? 0) >= 7, desc: "7回死んでも立ち上がった" },
  { id: "t10", name: "不死鳥",         icon: "🔥", color: "#f97316", cond: (m: MetaState) => (m.totalDeaths ?? 0) >= 15, desc: "15回の死から蘇り続ける者" },
  // Difficulty
  { id: "t11", name: "挑戦者の誇り",   icon: "⚔",  color: "#818cf8", cond: (m: MetaState) => m.clearedDiffs?.includes("normal"), desc: "挑戦者難度をクリアした" },
  { id: "t12", name: "求道の極み",     icon: "🔥", color: "#f59e0b", cond: (m: MetaState) => m.clearedDiffs?.includes("hard"), desc: "求道者難度をクリアした" },
  { id: "t13", name: "修羅を超えし者", icon: "💀", color: "#ef4444", cond: (m: MetaState) => m.clearedDiffs?.includes("abyss"), desc: "修羅難度をクリアした" },
  { id: "t14", name: "全難度制覇",     icon: "💎", color: "#ff0040", cond: (m: MetaState) => DIFFICULTY.every(d => m.clearedDiffs?.includes(d.id)), desc: "全ての難易度をクリアした" },
  // Ending collection
  { id: "t15", name: "語り部",         icon: "📖", color: "#c084fc", cond: (m: MetaState) => (m.endings?.length ?? 0) >= 3, desc: "3つのエンディングを見た" },
  { id: "t16", name: "運命の紡ぎ手",   icon: "🌌", color: "#a78bfa", cond: (m: MetaState) => (m.endings?.length ?? 0) >= 6, desc: "6つのエンディングを見た" },
  { id: "t17", name: "全てを見た者",   icon: "🌟", color: "#fde68a", cond: (m: MetaState) => (m.endings?.length ?? 0) >= ENDINGS.length, desc: "全エンディングを回収した" },
  // Special
  { id: "t18", name: "知見の守護者",   icon: "◈",  color: "#60a5fa", cond: (m: MetaState) => m.unlocked.length >= 20, desc: "20個の知見を解放した" },
  { id: "t19", name: "完全なる継承者", icon: "✨", color: "#fbbf24", cond: (m: MetaState) => m.unlocked.length >= UNLOCKS.length, desc: "全ての知見を解放した" },
  { id: "t20", name: "修羅の覇者",     icon: "💀👑", color: "#ff0040", cond: (m: MetaState) => m.endings?.includes("abyss_perfect"), desc: "修羅で完全なる帰還を達成した" },
]);

/** メタ状態の解放済み称号を全取得 */
export const getUnlockedTitles = (meta: MetaState): TitleDef[] => TITLES.filter(t => t.cond(meta));

/** アクティブ称号オブジェクトを取得 */
export const getActiveTitle = (meta: MetaState): TitleDef => {
  if (meta.title) { const found = TITLES.find(t => t.id === meta.title); if (found?.cond(meta)) return found; }
  const unlocked = getUnlockedTitles(meta);
  return unlocked[unlocked.length - 1] ?? TITLES[0];
};

export const ENDINGS: readonly EndingDef[] = Object.freeze([
  // ── 難易度固有エンディング（最高優先度） ──
  { id: "abyss_perfect", name: "修羅の覇者", sub: "LORD OF CARNAGE",
    desc: "修羅──死と隣り合わせの極限。その全てを制し、傷なく、狂わず、全てを知り尽くした。\n迷宮が震えている。恐怖しているのだ、お前という存在に。\nこの偉業を成し遂げた者は、歴史上ただ一人。",
    cond: (p: Player, _log: LogEntry[], d: DifficultyDef | null) => d?.id === "abyss" && p.hp > p.maxHp * 0.7 && p.mn > p.maxMn * 0.7 && p.inf > 35,
    color: "#ff0040", icon: "💀👑", bonusKp: 6, gradient: "linear-gradient(135deg, #ff0040, #fbbf24, #ff0040)" },
  { id: "abyss_clear", name: "修羅を超えし者", sub: "BEYOND THE ABYSS",
    desc: "最高難度「修羅」を生還した。\n全てが牙を剥く世界で、お前は立っていた。\nその名は畏怖と共に語り継がれるだろう。",
    cond: (_p: Player, _log: LogEntry[], d: DifficultyDef | null) => d?.id === "abyss",
    color: "#ef4444", icon: "💀", bonusKp: 4, gradient: "linear-gradient(135deg, #ef4444, #b91c1c, #7f1d1d)" },
  { id: "hard_clear", name: "求道の果て", sub: "END OF ASCETICISM",
    desc: "求道者の道は険しかった。\nだが、その険しさこそが鍛えてくれた。\n迷宮の深淵を覗き、なお正気を保つ者──それが求道者だ。",
    cond: (_p: Player, _log: LogEntry[], d: DifficultyDef | null) => d?.id === "hard",
    color: "#f59e0b", icon: "🔥", bonusKp: 2, gradient: "linear-gradient(135deg, #f59e0b, #d97706, #92400e)" },
  // ── 汎用エンディング ──
  { id: "perfect",  name: "完全なる帰還",   sub: "THE PERFECT RETURN",
    desc: "傷ひとつなく、正気を保ち、迷宮の全てを理解した上での脱出。\nこれ以上ない完璧な探索だった。",
    cond: (p: Player, _log: LogEntry[]) => p.hp > p.maxHp * 0.7 && p.mn > p.maxMn * 0.7 && p.inf > 35,
    color: "#fde68a", icon: "👑", bonusKp: 2, gradient: "linear-gradient(135deg, #fbbf24, #f59e0b)" },
  { id: "scholar",  name: "知識の導き",     sub: "GUIDED BY WISDOM",
    desc: "蓄積した知識が道を照らした。\n迷宮の秘密を胸に、あなたは光の中へ歩み出す。",
    cond: (p: Player) => p.inf >= 40,
    color: "#fbbf24", icon: "📖", bonusKp: 2, gradient: "linear-gradient(135deg, #fbbf24, #f97316)" },
  { id: "iron",     name: "不屈の生還",     sub: "UNYIELDING SURVIVOR",
    desc: "傷だらけでも折れなかった。痛みを超え、意志の力だけで帰還を果たした。",
    cond: (p: Player) => p.hp > p.maxHp * 0.5 && p.st.length > 0,
    color: "#f97316", icon: "🔥", bonusKp: 2, gradient: "linear-gradient(135deg, #f97316, #ef4444)" },
  { id: "battered", name: "満身創痍の脱出", sub: "BARELY ALIVE",
    desc: "意識が朦朧とする中、最後の一歩を踏み出した。\n生きている。それだけが、全てだ。",
    cond: (p: Player) => p.hp <= p.maxHp * 0.25 && p.hp > 0,
    color: "#ef4444", icon: "💔", bonusKp: 1, gradient: "linear-gradient(135deg, #ef4444, #991b1b)" },
  { id: "madness",  name: "狂気の淵より",   sub: "EDGE OF MADNESS",
    desc: "現実と幻覚の境界が曖昧なまま出口に辿り着いた。\n自分の名前を思い出すのに、数分かかった。",
    cond: (p: Player) => p.mn <= p.maxMn * 0.25 && p.mn > 0,
    color: "#a78bfa", icon: "🌀", bonusKp: 1, gradient: "linear-gradient(135deg, #a78bfa, #6d28d9)" },
  { id: "cursed",   name: "呪われし帰還者", sub: "CURSED RETURNER",
    desc: "脱出は果たした。だが迷宮の呪いは身体に刻まれたまま。\nあの闇の一部が、今もあなたの中にいる。",
    cond: (p: Player) => p.st.includes("呪い") || (p.st.includes("出血") && p.st.includes("恐怖")),
    color: "#fb923c", icon: "⛧", bonusKp: 2, gradient: "linear-gradient(135deg, #fb923c, #9a3412)" },
  { id: "veteran",  name: "歴戦の探索者",   sub: "SEASONED EXPLORER",
    desc: "数多の困難を乗り越え、迷宮の深奥から帰還した。\nあなたの経験は、後に続く者の道標となるだろう。",
    cond: (_p: Player, log: LogEntry[]) => log.length >= 13,
    color: "#c084fc", icon: "⚔", bonusKp: 1, gradient: "linear-gradient(135deg, #c084fc, #7c3aed)" },
  { id: "standard", name: "生還",           sub: "ESCAPE",
    desc: "生きて帰った。それは紛れもない勝利だ。\n迷宮を知る者として、あなたはまた一歩強くなった。",
    cond: () => true,
    color: "#4ade80", icon: "✦", bonusKp: 0, gradient: "linear-gradient(135deg, #4ade80, #16a34a)" },
]);

/**
 * 脱出時のプレイヤー状態からエンディングを決定。
 * 最初にマッチしたエンディングが優先される。
 * @pre player.hp > 0 && player.mn > 0
 */
export const determineEnding = (player: Player, log: LogEntry[], diff: DifficultyDef | null): EndingDef => {
  for (const e of ENDINGS) {
    if (e.cond(player, log, diff)) return e;
  }
  return ENDINGS[ENDINGS.length - 1];
};

// ============================================================
// §10. CONSTANTS
// ============================================================

/** アンロックカテゴリ定義 — アンロック画面のレイアウトを駆動 */
export const UNLOCK_CATS: readonly UnlockCatDef[] = Object.freeze([
  { key: "basic",   label: "基本",       color: "#818cf8" },
  { key: "special", label: "特別（修羅クリアで解放）", color: "#fbbf24" },
  { key: "trophy",  label: "難易度クリア報酬", color: "#f97316" },
  { key: "achieve", label: "実績解放",    color: "#4ade80" },
]);

/** 死亡フレーバーテキスト — ラン数で回転 */
export const DEATH_FLAVORS = Object.freeze({
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

/** ゲームオーバー時のコンテキストヒント — 死因、フロア、アンロック状態に基づく */
export const DEATH_TIPS = Object.freeze({
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

/** アクティブなアンロック効果の数を表示用にカウント */
export const countActiveEffects = (unlocked: string[]): number => unlocked.length;

/** 前回ランとの改善をフォーマット */
export const formatImprovement = (current: { floor: number; hp: number }, last: { floor: number; hp?: number } | null): string[] | null => {
  if (!last) return null;
  const improvements: string[] = [];
  if (current.floor > last.floor) improvements.push(`到達層 ${last.floor}→${current.floor} ↑`);
  if (current.hp > (last.hp ?? 0)) improvements.push(`残HP ${last.hp ?? 0}→${current.hp} ↑`);
  return improvements.length > 0 ? improvements : null;
};
