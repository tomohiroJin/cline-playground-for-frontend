/**
 * 迷宮の残響 - 難易度定義
 *
 * 各難易度の設定値を新DifficultyDef型で定義する。
 */
import type { DifficultyDef } from '../models/difficulty';

/** 難易度定義一覧 */
export const DIFFICULTY: readonly DifficultyDef[] = Object.freeze([
  {
    id: "easy",
    name: "探索者",
    subtitle: "初心者向け",
    color: "#4ade80",
    icon: "🌿",
    description: "体力・精神にゆとりがあり、迷宮の侵蝕も穏やか。物語を楽しみたい方に。",
    modifiers: { hpMod: 12, mnMod: 8, drainMod: 0, dmgMult: 0.7 },
    rewards: { kpOnDeath: 1, kpOnWin: 2 },
  },
  {
    id: "normal",
    name: "挑戦者",
    subtitle: "標準難度",
    color: "#818cf8",
    icon: "⚔",
    description: "均衡の取れた難易度。判断力と運の両方が試される。",
    modifiers: { hpMod: 0, mnMod: 0, drainMod: -1, dmgMult: 1 },
    rewards: { kpOnDeath: 1, kpOnWin: 3 },
  },
  {
    id: "hard",
    name: "求道者",
    subtitle: "上級者向け",
    color: "#f59e0b",
    icon: "🔥",
    description: "初期値が低く侵蝕が激しい。知識と経験を総動員しなければ生還は困難。",
    modifiers: { hpMod: -15, mnMod: -12, drainMod: -3, dmgMult: 1.35 },
    rewards: { kpOnDeath: 2, kpOnWin: 5 },
  },
  {
    id: "abyss",
    name: "修羅",
    subtitle: "最高難度",
    color: "#ef4444",
    icon: "💀",
    description: "全てが致命的。一つの判断ミスが死に直結する。真の強者のみが挑む領域。",
    modifiers: { hpMod: -25, mnMod: -20, drainMod: -5, dmgMult: 1.8 },
    rewards: { kpOnDeath: 3, kpOnWin: 8 },
  },
]);
