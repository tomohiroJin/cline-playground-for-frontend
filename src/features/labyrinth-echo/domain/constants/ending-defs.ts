/**
 * 迷宮の残響 - エンディング定義
 *
 * エンディング判定条件と死亡時のフレーバーテキスト・ヒントを定義する。
 */
import type { EndingDef } from '../models/ending';
import type { Player } from '../models/player';
import type { LogEntry } from '../models/game-state';
import { getPlayerStatuses } from '../models/compat';

/** プレイヤーのステータス配列を安全に取得する（共通ヘルパー経由） */
const getStatuses = (p: Player): readonly string[] =>
  getPlayerStatuses(p);

/** エンディング定義一覧（最初にマッチしたものが優先される） */
export const ENDINGS: readonly EndingDef[] = Object.freeze([
  // ── 難易度固有エンディング（最高優先度） ──
  {
    id: "abyss_perfect", name: "修羅の覇者", subtitle: "LORD OF CARNAGE",
    description: "修羅──死と隣り合わせの極限。その全てを制し、傷なく、狂わず、全てを知り尽くした。\n迷宮が震えている。恐怖しているのだ、お前という存在に。\nこの偉業を成し遂げた者は、歴史上ただ一人。",
    cond: (p: Player, _log: LogEntry[], d) => d?.id === "abyss" && p.hp > p.maxHp * 0.7 && p.mn > p.maxMn * 0.7 && p.inf > 35,
    color: "#ff0040", icon: "💀👑", bonusKp: 6, gradient: "linear-gradient(135deg, #ff0040, #fbbf24, #ff0040)",
  },
  {
    id: "abyss_clear", name: "修羅を超えし者", subtitle: "BEYOND THE ABYSS",
    description: "最高難度「修羅」を生還した。\n全てが牙を剥く世界で、お前は立っていた。\nその名は畏怖と共に語り継がれるだろう。",
    cond: (_p: Player, _log: LogEntry[], d) => d?.id === "abyss",
    color: "#ef4444", icon: "💀", bonusKp: 4, gradient: "linear-gradient(135deg, #ef4444, #b91c1c, #7f1d1d)",
  },
  {
    id: "hard_clear", name: "求道の果て", subtitle: "END OF ASCETICISM",
    description: "求道者の道は険しかった。\nだが、その険しさこそが鍛えてくれた。\n迷宮の深淵を覗き、なお正気を保つ者──それが求道者だ。",
    cond: (_p: Player, _log: LogEntry[], d) => d?.id === "hard",
    color: "#f59e0b", icon: "🔥", bonusKp: 2, gradient: "linear-gradient(135deg, #f59e0b, #d97706, #92400e)",
  },
  // ── 汎用エンディング ──
  {
    id: "perfect", name: "完全なる帰還", subtitle: "THE PERFECT RETURN",
    description: "傷ひとつなく、正気を保ち、迷宮の全てを理解した上での脱出。\nこれ以上ない完璧な探索だった。",
    cond: (p: Player) => p.hp > p.maxHp * 0.7 && p.mn > p.maxMn * 0.7 && p.inf > 35,
    color: "#fde68a", icon: "👑", bonusKp: 2, gradient: "linear-gradient(135deg, #fbbf24, #f59e0b)",
  },
  {
    id: "scholar", name: "知識の導き", subtitle: "GUIDED BY WISDOM",
    description: "蓄積した知識が道を照らした。\n迷宮の秘密を胸に、あなたは光の中へ歩み出す。",
    cond: (p: Player) => p.inf >= 40,
    color: "#fbbf24", icon: "📖", bonusKp: 2, gradient: "linear-gradient(135deg, #fbbf24, #f97316)",
  },
  {
    id: "iron", name: "不屈の生還", subtitle: "UNYIELDING SURVIVOR",
    description: "傷だらけでも折れなかった。痛みを超え、意志の力だけで帰還を果たした。",
    cond: (p: Player) => p.hp > p.maxHp * 0.5 && getStatuses(p).length > 0,
    color: "#f97316", icon: "🔥", bonusKp: 2, gradient: "linear-gradient(135deg, #f97316, #ef4444)",
  },
  {
    id: "battered", name: "満身創痍の脱出", subtitle: "BARELY ALIVE",
    description: "意識が朦朧とする中、最後の一歩を踏み出した。\n生きている。それだけが、全てだ。",
    cond: (p: Player) => p.hp <= p.maxHp * 0.25 && p.hp > 0,
    color: "#ef4444", icon: "💔", bonusKp: 1, gradient: "linear-gradient(135deg, #ef4444, #991b1b)",
  },
  {
    id: "madness", name: "狂気の淵より", subtitle: "EDGE OF MADNESS",
    description: "現実と幻覚の境界が曖昧なまま出口に辿り着いた。\n自分の名前を思い出すのに、数分かかった。",
    cond: (p: Player) => p.mn <= p.maxMn * 0.25 && p.mn > 0,
    color: "#a78bfa", icon: "🌀", bonusKp: 1, gradient: "linear-gradient(135deg, #a78bfa, #6d28d9)",
  },
  {
    id: "cursed", name: "呪われし帰還者", subtitle: "CURSED RETURNER",
    description: "脱出は果たした。だが迷宮の呪いは身体に刻まれたまま。\nあの闇の一部が、今もあなたの中にいる。",
    cond: (p: Player) => getStatuses(p).includes("呪い") || (getStatuses(p).includes("出血") && getStatuses(p).includes("恐怖")),
    color: "#fb923c", icon: "⛧", bonusKp: 2, gradient: "linear-gradient(135deg, #fb923c, #9a3412)",
  },
  {
    id: "veteran", name: "歴戦の探索者", subtitle: "SEASONED EXPLORER",
    description: "数多の困難を乗り越え、迷宮の深奥から帰還した。\nあなたの経験は、後に続く者の道標となるだろう。",
    cond: (_p: Player, log: LogEntry[]) => log.length >= 13,
    color: "#c084fc", icon: "⚔", bonusKp: 1, gradient: "linear-gradient(135deg, #c084fc, #7c3aed)",
  },
  {
    id: "standard", name: "生還", subtitle: "ESCAPE",
    description: "生きて帰った。それは紛れもない勝利だ。\n迷宮を知る者として、あなたはまた一歩強くなった。",
    cond: () => true,
    color: "#4ade80", icon: "✦", bonusKp: 0, gradient: "linear-gradient(135deg, #4ade80, #16a34a)",
  },
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
