/**
 * 迷宮の残響 - 称号定義
 *
 * 称号の解放条件と表示情報を定義する。
 */
import type { MetaState } from '../models/meta-state';
import { DIFFICULTY } from './difficulty-defs';
import { ENDINGS } from './ending-defs';
import { UNLOCKS } from './unlock-defs';

/** 称号定義 */
export interface TitleDef {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly color: string;
  readonly cond: (meta: MetaState) => boolean;
  readonly desc: string;
}

/** 称号定義一覧 */
export const TITLES: readonly TitleDef[] = Object.freeze([
  // 初期称号
  { id: "t00", name: "迷い人",         icon: "🚶", color: "#808098", cond: () => true, desc: "全ての探索者が最初に持つ称号" },
  // 探索回数マイルストーン
  { id: "t01", name: "初探索者",       icon: "🔰", color: "#4ade80", cond: (m: MetaState) => m.runs >= 1,  desc: "初めての探索を終えた" },
  { id: "t02", name: "冒険者",         icon: "⚔",  color: "#818cf8", cond: (m: MetaState) => m.runs >= 5,  desc: "5回の探索を経験した" },
  { id: "t03", name: "熟練探索者",     icon: "🗡",  color: "#c084fc", cond: (m: MetaState) => m.runs >= 15, desc: "15回の探索を経験した" },
  { id: "t04", name: "歴戦の勇者",     icon: "🏛",  color: "#fbbf24", cond: (m: MetaState) => m.runs >= 30, desc: "30回の探索を経験した" },
  { id: "t05", name: "伝説の探索者",   icon: "👑",  color: "#ff0040", cond: (m: MetaState) => m.runs >= 50, desc: "50回の探索を経験した" },
  // 生還マイルストーン
  { id: "t06", name: "生還者",         icon: "🌿", color: "#4ade80", cond: (m: MetaState) => m.escapes >= 1,  desc: "初めて迷宮から生還した" },
  { id: "t07", name: "迷宮踏破者",     icon: "🏆", color: "#fbbf24", cond: (m: MetaState) => m.escapes >= 10, desc: "10回生還を果たした" },
  { id: "t08", name: "不死身",         icon: "☀",  color: "#fde68a", cond: (m: MetaState) => m.escapes >= 20, desc: "20回生還した不滅の存在" },
  // 死亡マイルストーン
  { id: "t09", name: "七転八起",       icon: "🔄", color: "#f87171", cond: (m: MetaState) => m.totalDeaths >= 7,  desc: "7回死んでも立ち上がった" },
  { id: "t10", name: "不死鳥",         icon: "🔥", color: "#f97316", cond: (m: MetaState) => m.totalDeaths >= 15, desc: "15回の死から蘇り続ける者" },
  // 難易度クリア
  { id: "t11", name: "挑戦者の誇り",   icon: "⚔",  color: "#818cf8", cond: (m: MetaState) => m.clearedDifficulties.includes("normal"), desc: "挑戦者難度をクリアした" },
  { id: "t12", name: "求道の極み",     icon: "🔥", color: "#f59e0b", cond: (m: MetaState) => m.clearedDifficulties.includes("hard"),   desc: "求道者難度をクリアした" },
  { id: "t13", name: "修羅を超えし者", icon: "💀", color: "#ef4444", cond: (m: MetaState) => m.clearedDifficulties.includes("abyss"),  desc: "修羅難度をクリアした" },
  { id: "t14", name: "全難度制覇",     icon: "💎", color: "#ff0040", cond: (m: MetaState) => DIFFICULTY.every(d => m.clearedDifficulties.includes(d.id)), desc: "全ての難易度をクリアした" },
  // エンディング収集
  { id: "t15", name: "語り部",         icon: "📖", color: "#c084fc", cond: (m: MetaState) => m.endings.length >= 3, desc: "3つのエンディングを見た" },
  { id: "t16", name: "運命の紡ぎ手",   icon: "🌌", color: "#a78bfa", cond: (m: MetaState) => m.endings.length >= 6, desc: "6つのエンディングを見た" },
  { id: "t17", name: "全てを見た者",   icon: "🌟", color: "#fde68a", cond: (m: MetaState) => m.endings.length >= ENDINGS.length, desc: "全エンディングを回収した" },
  // 特殊
  { id: "t18", name: "知見の守護者",   icon: "◈",  color: "#60a5fa", cond: (m: MetaState) => m.unlocked.length >= 20, desc: "20個の知見を解放した" },
  { id: "t19", name: "完全なる継承者", icon: "✨", color: "#fbbf24", cond: (m: MetaState) => m.unlocked.length >= UNLOCKS.length, desc: "全ての知見を解放した" },
  { id: "t20", name: "修羅の覇者",     icon: "💀👑", color: "#ff0040", cond: (m: MetaState) => m.endings.includes("abyss_perfect"), desc: "修羅で完全なる帰還を達成した" },
]);
