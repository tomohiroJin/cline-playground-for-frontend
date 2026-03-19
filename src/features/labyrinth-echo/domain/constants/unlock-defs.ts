/**
 * 迷宮の残響 - アンロック定義
 *
 * 知見によるアンロック項目とカテゴリを定義する。
 */
import type { UnlockDef, UnlockCategory } from '../models/unlock';
import type { MetaState } from '../models/meta-state';

/** アンロックカテゴリ定義 */
export interface UnlockCatDef {
  readonly key: UnlockCategory;
  readonly label: string;
  readonly color: string;
}

/** アンロック定義一覧 */
export const UNLOCKS: readonly UnlockDef[] = Object.freeze([
  // ── 基本（BASIC: total cost ~130, always available） ──
  { id: "u1",  name: "探索者の直感", description: "初期情報値 +3",          cost: 3,  icon: "◈",  category: "basic", effects: { infoBonus: 3 } },
  { id: "u2",  name: "鋼の心臓",     description: "初期HP +5",             cost: 3,  icon: "♥",  category: "basic", effects: { hpBonus: 5 } },
  { id: "u3",  name: "冷静沈着",     description: "初期精神力 +4",         cost: 3,  icon: "◎",  category: "basic", effects: { mentalBonus: 4 } },
  { id: "u4",  name: "古文書の知識", description: "情報取得量 +10%",       cost: 6,  icon: "✧",  category: "basic", effects: { infoMult: 1.1 } },
  { id: "u5",  name: "回復体質",     description: "回復効果 +12%",         cost: 6,  icon: "✦",  category: "basic", effects: { healMult: 1.12 } },
  { id: "u6",  name: "危機察知",     description: "HP低下時、条件判定が緩和", cost: 8, icon: "⚡", category: "basic", effects: { dangerSense: true } },
  { id: "u7",  name: "精神防壁",     description: "精神ダメージ -8%",      cost: 6,  icon: "◉",  category: "basic", effects: { mnReduce: 0.92 } },
  { id: "u8",  name: "止血の知識",   description: "出血ダメージ半減",       cost: 4,  icon: "❋",  category: "basic", effects: { bleedReduce: true } },
  { id: "u9",  name: "鉄の体躯",     description: "初期HP +8",             cost: 5,  icon: "♦",  category: "basic", effects: { hpBonus: 8 } },
  { id: "u10", name: "瞑想の心得",   description: "初期精神力 +6",         cost: 5,  icon: "☯",  category: "basic", effects: { mentalBonus: 6 } },
  { id: "u11", name: "博識",         description: "初期情報値 +5",         cost: 5,  icon: "📖", category: "basic", effects: { infoBonus: 5 } },
  { id: "u12", name: "不屈の意志",   description: "精神ドレイン無効化",     cost: 10, icon: "☀",  category: "basic", effects: { drainImmune: true } },
  { id: "u13", name: "頑強な肉体",   description: "HPダメージ -5%",        cost: 8,  icon: "🛡",  category: "basic", effects: { hpReduce: 0.95 } },
  { id: "u14", name: "迷宮の記憶",   description: "情報取得量 +15%",       cost: 8,  icon: "🔮", category: "basic", effects: { infoMult: 1.15 } },
  { id: "u15", name: "生存本能",     description: "初期HP +12",            cost: 8,  icon: "💪", category: "basic", effects: { hpBonus: 12 } },
  { id: "u16", name: "深淵の耐性",   description: "初期精神力 +8",         cost: 7,  icon: "🌙", category: "basic", effects: { mentalBonus: 8 } },
  { id: "u17", name: "解読者の目",   description: "初期情報値 +6",         cost: 7,  icon: "👁",  category: "basic", effects: { infoBonus: 6 } },
  { id: "u18", name: "応急手当",     description: "回復効果 +15%（重複可）", cost: 8, icon: "💊", category: "basic", effects: { healMult: 1.15 } },
  { id: "u19", name: "鋼の精神",     description: "精神ダメージ -12%（重複可）", cost: 10, icon: "🧠", category: "basic", effects: { mnReduce: 0.88 } },
  { id: "u20", name: "不死身の体",   description: "HPダメージ -8%（重複可）",   cost: 10, icon: "⛊",  category: "basic", effects: { hpReduce: 0.92 } },
  // ── 特別（SPECIAL: 修羅クリア必須、高コスト） ──
  { id: "u21", name: "二度目の命",   description: "HP/精神が0になった時、一度だけ半分回復して復活", cost: 35, icon: "🔄", category: "special", gateRequirement: "abyss", effects: { secondLife: true } },
  { id: "u22", name: "呪い耐性",     description: "呪い状態異常を完全無効化",   cost: 18, icon: "🛡",  category: "special", gateRequirement: "abyss", effects: { curseImmune: true } },
  { id: "u23", name: "連鎖の記憶",   description: "連続イベントの発生確率が上昇", cost: 15, icon: "🔗", category: "special", gateRequirement: "abyss", effects: { chainBoost: true } },
  { id: "u24", name: "交渉術",       description: "遭遇イベントの精神条件が緩和", cost: 18, icon: "🤝", category: "special", gateRequirement: "abyss", effects: { negotiator: true } },
  { id: "u25", name: "第六感",       description: "精神低下時、精神条件判定を緩和", cost: 22, icon: "👁‍🗨", category: "special", gateRequirement: "abyss", effects: { mentalSense: true } },
  { id: "u26", name: "歴戦の傷",     description: "初期HP +12、初期精神力 +10", cost: 28, icon: "⚔",  category: "special", gateRequirement: "abyss", effects: { hpBonus: 12, mentalBonus: 10 } },
  { id: "u27", name: "叡智の結晶",   description: "初期情報値 +6、情報取得量 +10%", cost: 25, icon: "💎", category: "special", gateRequirement: "abyss", effects: { infoBonus: 6, infoMult: 1.1 } },
  { id: "u28", name: "全ダメージ軽減",description: "HPダメージ -5%、精神ダメージ -5%", cost: 25, icon: "🌀", category: "special", gateRequirement: "abyss", effects: { hpReduce: 0.95, mnReduce: 0.95 } },
  { id: "u29", name: "迷宮の寵児",   description: "全初期ステータス +5",    cost: 40, icon: "✨", category: "special", gateRequirement: "abyss", effects: { hpBonus: 5, mentalBonus: 5, infoBonus: 5 } },
  { id: "u30", name: "完全回復",     description: "回復効果 +20%（重複可）", cost: 22, icon: "💚", category: "special", gateRequirement: "abyss", effects: { healMult: 1.2 } },
  // ── 難易度クリア報酬（TROPHY: 勲章的な微効果） ──
  { id: "u31", name: "探索者の証",   description: "全初期ステータス +1",    cost: 0, icon: "🌿", category: "trophy", difficultyRequirement: "easy",   effects: { hpBonus: 1, mentalBonus: 1, infoBonus: 1 } },
  { id: "u32", name: "挑戦者の証",   description: "回復効果 +5%、情報取得量 +5%", cost: 0, icon: "⚔",  category: "trophy", difficultyRequirement: "normal", effects: { healMult: 1.05, infoMult: 1.05 } },
  { id: "u33", name: "求道者の証",   description: "全ステータス +2、HPダメージ -2%", cost: 0, icon: "🔥", category: "trophy", difficultyRequirement: "hard",   effects: { hpBonus: 2, mentalBonus: 2, infoBonus: 2, hpReduce: 0.98 } },
  { id: "u34", name: "修羅の証",     description: "全ステータス +3、全ダメージ -3%", cost: 0, icon: "💀", category: "trophy", difficultyRequirement: "abyss", effects: { hpBonus: 3, mentalBonus: 3, infoBonus: 3, hpReduce: 0.97, mnReduce: 0.97 } },
  { id: "u35", name: "完全制覇の印", description: "全ステータス +5、回復 +8%、情報 +8%", cost: 0, icon: "👑", category: "trophy", difficultyRequirement: "abyss_perfect", effects: { hpBonus: 5, mentalBonus: 5, infoBonus: 5, healMult: 1.08, infoMult: 1.08 } },
  // ── 実績解放（ACHIEVEMENT: 条件厳格化、微効果） ──
  { id: "u36", name: "百戦錬磨",     description: "全初期ステータス +2",    cost: 0, icon: "🏅", category: "achieve", achievementCondition: (m: MetaState) => m.runs >= 20,   achievementDescription: "20回探索する", effects: { hpBonus: 2, mentalBonus: 2, infoBonus: 2 } },
  { id: "u37", name: "生還の達人",   description: "回復効果 +8%、精神ダメージ -3%", cost: 0, icon: "🏆", category: "achieve", achievementCondition: (m: MetaState) => m.escapes >= 8, achievementDescription: "8回生還する", effects: { healMult: 1.08, mnReduce: 0.97 } },
  { id: "u38", name: "博覧強記",     description: "初期情報値 +3、情報取得量 +8%", cost: 0, icon: "📚", category: "achieve", achievementCondition: (m: MetaState) => m.totalEvents >= 80, achievementDescription: "累計80イベントをクリアする", effects: { infoBonus: 3, infoMult: 1.08 } },
  { id: "u39", name: "死線を越えて", description: "全ダメージ -3%",          cost: 0, icon: "☠",  category: "achieve", achievementCondition: (m: MetaState) => m.totalDeaths >= 15, achievementDescription: "15回死亡する", effects: { hpReduce: 0.97, mnReduce: 0.97 } },
  { id: "u40", name: "エンディングコレクター", description: "全初期ステータス +3", cost: 0, icon: "🎭", category: "achieve", achievementCondition: (m: MetaState) => m.endings.length >= 8, achievementDescription: "8種類のEDを見る", effects: { hpBonus: 3, mentalBonus: 3, infoBonus: 3 } },
]);

/** アンロックカテゴリ定義 — アンロック画面のレイアウトを駆動 */
export const UNLOCK_CATS: readonly UnlockCatDef[] = Object.freeze([
  { key: "basic",   label: "基本",       color: "#818cf8" },
  { key: "special", label: "特別（修羅クリアで解放）", color: "#fbbf24" },
  { key: "trophy",  label: "難易度クリア報酬", color: "#f97316" },
  { key: "achieve", label: "実績解放",    color: "#4ade80" },
]);
