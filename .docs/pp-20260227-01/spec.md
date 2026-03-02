# 原始進化録 (PRIMAL PATH) ブラッシュアップ — 技術仕様

> **注**: 本仕様は実装計画段階のものです。実装時に以下の変更が行われました。
>
> **型名の省略**: 実装では既存コードの省略記法に合わせて型名を短縮しています。
> | spec 名 | 実装名 | ファイル |
> |---------|--------|---------|
> | `ActiveSkillId` | `ASkillId` | types.ts |
> | `SkillEffect` | `SkillFx` | types.ts |
> | `SkillState` | `SkillSt` | types.ts |
> | `ActiveBuff` | `ABuff` | types.ts |
> | `DamagePopup` | `DmgPopup` | types.ts |
> | `applyActiveSkill()` | `applySkill()` | game-logic.ts |
> | `calcSynergyBonuses()` | `applySynergyBonuses()` | game-logic.ts |
>
> **追加された型・フィールド**（spec に未記載だったもの）:
> - `EventCost` に `hp_damage` 型を追加（types.ts）
> - `RandomEventDef` に `situationText` フィールドを追加（types.ts）
> - `AwakeningVisual`, `AwakeningSymbol` インターフェース（sprites.ts）
>
> **定数値の変更**:
> - `EVENT_CHANCE`: 0.2 → 0.3（プレイテストで調整）
> - `EVENT_MIN_BATTLES`: 2 → 1（早期イベント体験のため）
>
> **追加された関数**（spec に未記載だったもの）:
> - `dominantCiv()`, `getEffectHintColor()`, `getEffectHintIcon()`, `formatEventResult()`, `computeEventResult()`, `getAwakeningVisual()`

## 1. 型定義

### 1.1 アクティブスキル

```typescript
// types.ts に追加

/** アクティブスキルID */
export type ActiveSkillId =
  | 'fire_burst'     // 技術: 炎の爆発（全体ダメージ）
  | 'nature_heal'    // 生活: 自然の癒し（全員HP回復）
  | 'blood_rage'     // 儀式: 血の狂乱（ATK大幅上昇、HP減少）
  | 'shield_wall'    // 調和: 盾の壁（次の被ダメージ50%軽減）

/** アクティブスキル定義 */
export interface ActiveSkillDef {
  id: ActiveSkillId;
  name: string;                  // 表示名（日本語）
  description: string;           // 効果説明
  civType: CivType | 'bal';      // 必要な文明タイプ（bal = 調和）
  requiredCivLevel: number;      // 解放に必要な文明レベル
  cooldownBattles: number;       // クールダウン（バトル数）
  effect: SkillEffect;           // スキル効果
  sfxKey: string;                // 効果音キー
}

/** スキル効果 */
export type SkillEffect =
  | { type: 'damage_all'; baseDamage: number; multiplier: number }
  | { type: 'heal_all'; baseHeal: number; allyHealRatio: number }
  | { type: 'buff_self'; atkMultiplier: number; hpCost: number; duration: number }
  | { type: 'shield'; damageReduction: number; duration: number }

/** ランステートに追加するスキル使用状況 */
export interface SkillState {
  available: ActiveSkillId[];     // 解放済みスキル
  cooldowns: Record<ActiveSkillId, number>;  // 残りクールダウン
  activeBuffs: ActiveBuff[];      // 発動中のバフ
}

/** 発動中のバフ */
export interface ActiveBuff {
  skillId: ActiveSkillId;
  remainingTurns: number;
  effect: SkillEffect;
}
```

### 1.2 シナジーシステム

```typescript
// types.ts に追加

/** シナジータグ */
export type SynergyTag =
  | 'fire'       // 火: 燃焼・爆発系
  | 'ice'        // 氷: 凍結・減速系
  | 'regen'      // 再生: HP回復系
  | 'shield'     // 盾: 防御・軽減系
  | 'hunt'       // 狩り: 攻撃・会心系
  | 'spirit'     // 霊: 特殊・覚醒系
  | 'tribe'      // 部族: 仲間強化系
  | 'wild';      // 野生: ランダム・確率系

/** シナジーボーナス定義 */
export interface SynergyBonusDef {
  tag: SynergyTag;
  /** タグ2個揃った時の小ボーナス */
  tier1: {
    name: string;
    description: string;
    effect: SynergyEffect;
  };
  /** タグ3個揃った時の大ボーナス */
  tier2: {
    name: string;
    description: string;
    effect: SynergyEffect;
  };
}

/** シナジー効果（単一または複合） */
export type SynergyEffect =
  | { type: 'stat_bonus'; stat: 'atk' | 'hp' | 'def' | 'cr'; value: number }
  | { type: 'damage_multiplier'; target: 'burn' | 'all'; multiplier: number }
  | { type: 'heal_bonus'; ratio: number }
  | { type: 'ally_bonus'; stat: 'atk' | 'hp'; value: number }
  | { type: 'special'; id: string }
  | { type: 'compound'; effects: SynergyEffect[] }  // Tier2 の複合効果用

/** 発動中のシナジー情報 */
export interface ActiveSynergy {
  tag: SynergyTag;
  count: number;         // 所持タグ数
  tier: 0 | 1 | 2;      // 0=未発動, 1=小, 2=大
  bonusName: string;     // ボーナス名
}

/** 進化定義の拡張 */
// 既存の Evolution 型に以下を追加
// 注: 実コードのフィールド名は省略形（n=name, d=description, t=civType, r=rarity, e=effect）
export interface Evolution {
  // ... 既存フィールド (n, d, t, r, e) ...
  tags?: SynergyTag[];   // シナジータグ（0〜2個）
}
```

### 1.3 ランダムイベント

```typescript
// types.ts に追加

/** イベントID */
export type EventId =
  | 'bone_merchant'    // 骨の商人
  | 'ancient_shrine'   // 古代の祠
  | 'lost_ally'        // 迷い仲間
  | 'poison_swamp'     // 毒沼
  | 'mystery_fossil'   // 謎の化石
  | 'beast_den'        // 獣の巣穴
  | 'starry_night'     // 星降る夜
  | 'cave_painting';   // 古代の壁画

/** イベント選択肢 */
export interface EventChoice {
  label: string;                 // 選択肢テキスト
  description: string;           // 効果の事前ヒント
  effect: EventEffect;           // 実際の効果
  riskLevel: 'safe' | 'risky' | 'dangerous';  // リスク表示用
  cost?: { type: 'bone'; amount: number };     // 選択肢のコスト（骨等）。不足時は選択不可
}

/** イベント効果 */
export type EventEffect =
  | { type: 'stat_change'; stat: 'hp' | 'atk' | 'def'; value: number }
  | { type: 'heal'; amount: number }
  | { type: 'damage'; amount: number }
  | { type: 'bone_change'; amount: number }
  | { type: 'add_ally'; allyTemplate: string }
  | { type: 'random_evolution' }
  | { type: 'civ_level_up'; civType: CivType | 'dominant' }  // 'dominant' = プレイヤーの最高文明を動的決定
  | { type: 'nothing' }

/** ランダムイベント定義 */
export interface RandomEventDef {
  id: EventId;
  name: string;                  // イベント名
  description: string;           // フレーバーテキスト
  choices: EventChoice[];        // 2〜3択
  biomeAffinity?: BiomeId[];     // 出現しやすいバイオーム（未指定=均等）
  minBiomeCount?: number;        // 出現条件: 最低バイオーム数
}

/** ゲームフェーズに追加 */
// 既存の GamePhase に 'event' を追加
export type GamePhase =
  | 'title' | 'diff' | 'how' | 'tree' | 'biome' | 'evo'
  | 'battle' | 'awakening' | 'prefinal' | 'ally_revive' | 'over'
  | 'event';  // 新規追加

/** ゲームステートに追加 */
// 既存の GameState に以下を追加
export interface GameState {
  // ... 既存フィールド ...
  currentEvent: RandomEventDef | undefined;  // 発生中のイベント
}
```

### 1.4 ラン統計・実績

```typescript
// types.ts に追加

/** ラン統計 */
export interface RunStats {
  id: string;                    // ランID（タイムスタンプベース）
  date: string;                  // ISO日時
  result: 'victory' | 'defeat'; // 結果
  difficulty: number;            // 難易度
  biomeCount: number;            // 到達バイオーム数
  totalKills: number;            // 撃破敵数
  maxDamage: number;             // 最大ダメージ
  totalDamageDealt: number;      // 総ダメージ
  totalDamageTaken: number;      // 総被ダメージ
  totalHealing: number;          // 総回復量
  evolutionCount: number;        // 取得進化数
  synergyCount: number;          // 発動シナジー数
  eventCount: number;            // 遭遇イベント数
  skillUsageCount: number;       // スキル使用回数
  boneEarned: number;            // 獲得骨数
  playtimeSeconds: number;       // プレイ時間（秒）
  awakening: string | undefined; // 発動した覚醒タイプ
  challengeId: string | undefined; // チャレンジID（通常ランはundefined）
}

/** 実績定義 */
export interface AchievementDef {
  id: string;
  name: string;                  // 実績名
  description: string;           // 解除条件の説明
  icon: string;                  // 絵文字アイコン
  condition: AchievementCondition;
}

/** 実績条件 */
export type AchievementCondition =
  | { type: 'first_clear' }
  | { type: 'clear_count'; count: number }
  | { type: 'clear_difficulty'; difficulty: number }
  | { type: 'all_difficulties_cleared' }
  | { type: 'all_awakenings' }
  | { type: 'max_damage'; threshold: number }
  | { type: 'total_kills'; count: number }
  | { type: 'synergy_tier2'; tag: SynergyTag }
  | { type: 'all_synergies_tier1' }
  | { type: 'event_count'; count: number }
  | { type: 'challenge_clear'; challengeId: string }
  | { type: 'no_damage_boss' }
  | { type: 'speed_clear'; maxSeconds: number }
  | { type: 'bone_hoarder'; amount: number }
  | { type: 'full_tree' }

/** 実績状態 */
export interface AchievementState {
  id: string;
  unlocked: boolean;
  unlockedDate: string | undefined;
}

/** チャレンジ定義 */
export interface ChallengeDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  modifiers: ChallengeModifier[];
}

/** チャレンジ修飾子 */
export type ChallengeModifier =
  | { type: 'hp_multiplier'; value: number }        // 初期HP倍率
  | { type: 'max_evolutions'; count: number }        // 進化回数上限
  | { type: 'speed_limit'; maxSeconds: number }      // 制限時間
  | { type: 'no_healing' }                           // 回復禁止
  | { type: 'enemy_multiplier'; stat: 'atk' | 'hp'; value: number }  // 敵強化
```

---

## 2. 定数定義

### 2.1 アクティブスキル定義

```typescript
// constants.ts に追加

export const ACTIVE_SKILLS: readonly ActiveSkillDef[] = Object.freeze([
  {
    id: 'fire_burst',
    name: '炎の爆発',
    description: '敵全体に火のダメージを与える',
    civType: 'tech',
    requiredCivLevel: 3,
    cooldownBattles: 2,
    effect: { type: 'damage_all', baseDamage: 30, multiplier: 1.5 },
    sfxKey: 'skill_fire',
  },
  {
    id: 'nature_heal',
    name: '自然の癒し',
    description: 'プレイヤーと全仲間のHPを回復する',
    civType: 'life',
    requiredCivLevel: 3,
    cooldownBattles: 3,
    effect: { type: 'heal_all', baseHeal: 40, allyHealRatio: 0.5 },
    sfxKey: 'skill_heal',
  },
  {
    id: 'blood_rage',
    name: '血の狂乱',
    description: 'HPを犠牲にATKを大幅上昇（3ターン）',
    civType: 'rit',
    requiredCivLevel: 3,
    cooldownBattles: 2,
    effect: { type: 'buff_self', atkMultiplier: 2.0, hpCost: 20, duration: 3 },
    sfxKey: 'skill_rage',
  },
  {
    id: 'shield_wall',
    name: '盾の壁',
    description: '次の被ダメージを50%軽減（2ターン）',
    civType: 'bal',
    requiredCivLevel: 4,
    cooldownBattles: 3,
    effect: { type: 'shield', damageReduction: 0.5, duration: 2 },
    sfxKey: 'skill_shield',
  },
]);
```

### 2.2 シナジーボーナス定義

```typescript
// constants.ts に追加

export const SYNERGY_BONUSES: readonly SynergyBonusDef[] = Object.freeze([
  {
    tag: 'fire',
    tier1: {
      name: '灼熱の魂',
      description: '火傷ダメージ+30%',
      effect: { type: 'damage_multiplier', target: 'burn', multiplier: 1.3 },
    },
    tier2: {
      name: '業火の化身',
      description: '火傷ダメージ2倍 + ATK+10',
      effect: { type: 'compound', effects: [
        { type: 'damage_multiplier', target: 'burn', multiplier: 2.0 },
        { type: 'stat_bonus', stat: 'atk', value: 10 },
      ]},
    },
  },
  {
    tag: 'ice',
    tier1: {
      name: '凍てつく風',
      description: 'DEF+5',
      effect: { type: 'stat_bonus', stat: 'def', value: 5 },
    },
    tier2: {
      name: '永久凍土',
      description: 'DEF+12 + 環境ダメージ無効',
      effect: { type: 'compound', effects: [
        { type: 'stat_bonus', stat: 'def', value: 12 },
        { type: 'special', id: 'env_immune' },
      ]},
    },
  },
  {
    tag: 'regen',
    tier1: {
      name: '生命の息吹',
      description: '再生HP+50%',
      effect: { type: 'heal_bonus', ratio: 0.5 },
    },
    tier2: {
      name: '不死の泉',
      description: '再生HP2倍 + 毎ターン仲間も小回復',
      effect: { type: 'compound', effects: [
        { type: 'heal_bonus', ratio: 1.0 },
        { type: 'ally_bonus', stat: 'hp', value: 3 },
      ]},
    },
  },
  {
    tag: 'shield',
    tier1: {
      name: '硬い皮膚',
      description: 'DEF+3',
      effect: { type: 'stat_bonus', stat: 'def', value: 3 },
    },
    tier2: {
      name: '岩の守護',
      description: 'DEF+8 + 仲間DEF+5',
      effect: { type: 'compound', effects: [
        { type: 'stat_bonus', stat: 'def', value: 8 },
        { type: 'ally_bonus', stat: 'hp', value: 5 },
      ]},
    },
  },
  {
    tag: 'hunt',
    tier1: {
      name: '鋭い爪',
      description: 'ATK+8',
      effect: { type: 'stat_bonus', stat: 'atk', value: 8 },
    },
    tier2: {
      name: '捕食者の本能',
      description: 'ATK+15 + 会心率+10',
      effect: { type: 'compound', effects: [
        { type: 'stat_bonus', stat: 'atk', value: 15 },
        { type: 'stat_bonus', stat: 'cr', value: 10 },
      ]},
    },
  },
  {
    tag: 'spirit',
    tier1: {
      name: '霊的感応',
      description: '覚醒ゲージ+1',
      effect: { type: 'special', id: 'awakening_boost' },
    },
    tier2: {
      name: '祖霊との交信',
      description: '覚醒効果1.5倍',
      effect: { type: 'special', id: 'awakening_power' },
    },
  },
  {
    tag: 'tribe',
    tier1: {
      name: '部族の絆',
      description: '仲間ATK+5',
      effect: { type: 'ally_bonus', stat: 'atk', value: 5 },
    },
    tier2: {
      name: '大部族の誇り',
      description: '仲間ATK+12 + 仲間HP+15',
      effect: { type: 'compound', effects: [
        { type: 'ally_bonus', stat: 'atk', value: 12 },
        { type: 'ally_bonus', stat: 'hp', value: 15 },
      ]},
    },
  },
  {
    tag: 'wild',
    tier1: {
      name: '野生の勘',
      description: '会心率+5',
      effect: { type: 'stat_bonus', stat: 'cr', value: 5 },
    },
    tier2: {
      name: '獣の覚醒',
      description: '会心率+12 + ATK+10',
      effect: { type: 'compound', effects: [
        { type: 'stat_bonus', stat: 'cr', value: 12 },
        { type: 'stat_bonus', stat: 'atk', value: 10 },
      ]},
    },
  },
]);
```

### 2.3 ランダムイベント定義

```typescript
// constants.ts に追加

export const RANDOM_EVENTS: readonly RandomEventDef[] = Object.freeze([
  {
    id: 'bone_merchant',
    name: '骨の商人',
    description: '奇妙な商人が骨と引き換えに力を分けてくれるという。',
    choices: [
      {
        label: '骨30で取引する',
        description: '骨を消費してATK+8を得る',
        effect: { type: 'stat_change', stat: 'atk', value: 8 },
        riskLevel: 'safe',
        cost: { type: 'bone', amount: 30 },
      },
      {
        label: '骨50で大取引する',
        description: '骨を多く消費して大きな力を得る',
        effect: { type: 'stat_change', stat: 'atk', value: 18 },
        riskLevel: 'risky',
        cost: { type: 'bone', amount: 50 },
      },
      {
        label: '立ち去る',
        description: '何も起こらない',
        effect: { type: 'nothing' },
        riskLevel: 'safe',
      },
    ],
  },
  {
    id: 'ancient_shrine',
    name: '古代の祠',
    description: '苔むした祠から微かな光が漏れている。祈りを捧げるか？',
    choices: [
      {
        label: '祈りを捧げる',
        description: '最もレベルの高い文明が1上がる',
        effect: { type: 'civ_level_up', civType: 'dominant' },  // 実装時: プレイヤーの最高文明レベルを参照して動的決定
        riskLevel: 'safe',
      },
      {
        label: '祠を調べる',
        description: 'ランダムな進化を得るかもしれない',
        effect: { type: 'random_evolution' },
        riskLevel: 'risky',
      },
      {
        label: '通り過ぎる',
        description: '何も起こらない',
        effect: { type: 'nothing' },
        riskLevel: 'safe',
      },
    ],
  },
  {
    id: 'lost_ally',
    name: '迷い仲間',
    description: '傷ついた仲間が助けを求めている。',
    choices: [
      {
        label: '助ける',
        description: '仲間が加入する（空きがある場合）',
        effect: { type: 'add_ally', allyTemplate: 'random' },
        riskLevel: 'safe',
      },
      {
        label: '立ち去る',
        description: '何も起こらない',
        effect: { type: 'nothing' },
        riskLevel: 'safe',
      },
    ],
  },
  {
    id: 'poison_swamp',
    name: '毒沼',
    description: '足元に毒々しい沼が広がっている。突っ切るか迂回するか…',
    choices: [
      {
        label: '突っ切る',
        description: 'ダメージを受けるが、先に進める',
        effect: { type: 'damage', amount: 25 },
        riskLevel: 'dangerous',
      },
      {
        label: '迂回して薬草を探す',
        description: 'HPを回復できるかもしれない',
        effect: { type: 'heal', amount: 15 },
        riskLevel: 'safe',
      },
    ],
    biomeAffinity: ['grassland'],
  },
  {
    id: 'mystery_fossil',
    name: '謎の化石',
    description: '地面に埋まった巨大な化石を発見した。',
    choices: [
      {
        label: '掘り出す',
        description: 'DEFが上がるかもしれない',
        effect: { type: 'stat_change', stat: 'def', value: 5 },
        riskLevel: 'safe',
      },
      {
        label: '骨として持ち帰る',
        description: '骨を入手する',
        effect: { type: 'bone_change', amount: 20 },
        riskLevel: 'safe',
      },
    ],
  },
  {
    id: 'beast_den',
    name: '獣の巣穴',
    description: '巨大な獣の巣穴を見つけた。中に何かありそうだが…',
    choices: [
      {
        label: '探索する',
        description: 'リスクを取って大きな報酬を得る',
        effect: { type: 'stat_change', stat: 'atk', value: 12 },
        riskLevel: 'dangerous',
      },
      {
        label: '見なかったことにする',
        description: '何も起こらない',
        effect: { type: 'nothing' },
        riskLevel: 'safe',
      },
    ],
    biomeAffinity: ['volcano'],
  },
  {
    id: 'starry_night',
    name: '星降る夜',
    description: '空一面の星明かりの下、不思議な力が身体を包む。',
    choices: [
      {
        label: '瞑想する',
        description: 'HP を大幅回復する',
        effect: { type: 'heal', amount: 40 },
        riskLevel: 'safe',
      },
      {
        label: '星に願いをかける',
        description: 'ランダムな効果が起きる',
        effect: { type: 'random_evolution' },
        riskLevel: 'risky',
      },
    ],
  },
  {
    id: 'cave_painting',
    name: '古代の壁画',
    description: '洞窟の壁に文明の記録が描かれている。',
    choices: [
      {
        label: '技術の壁画を読む',
        description: '技術レベル+1',
        effect: { type: 'civ_level_up', civType: 'tech' },
        riskLevel: 'safe',
      },
      {
        label: '生活の壁画を読む',
        description: '生活レベル+1',
        effect: { type: 'civ_level_up', civType: 'life' },
        riskLevel: 'safe',
      },
      {
        label: '儀式の壁画を読む',
        description: '儀式レベル+1',
        effect: { type: 'civ_level_up', civType: 'rit' },
        riskLevel: 'safe',
      },
    ],
    biomeAffinity: ['glacier'],
  },
]);

/** イベント発生確率 */
export const EVENT_CHANCE = 0.2;  // 20%

/** イベント発生チェック不可のバトル数（序盤を除外） */
export const EVENT_MIN_BATTLES = 2;
```

### 2.4 実績定義

```typescript
// constants.ts に追加

export const ACHIEVEMENTS: readonly AchievementDef[] = Object.freeze([
  {
    id: 'first_clear',
    name: '原始の証',
    description: '初めてゲームをクリアする',
    icon: '🦴',
    condition: { type: 'first_clear' },
  },
  {
    id: 'clear_10',
    name: '歴戦の狩人',
    description: '10回クリアする',
    icon: '🏹',
    condition: { type: 'clear_count', count: 10 },
  },
  {
    id: 'clear_hard',
    name: '氷河期の生存者',
    description: '難易度「氷河期」をクリアする',
    icon: '❄️',
    condition: { type: 'clear_difficulty', difficulty: 1 },
  },
  {
    id: 'clear_nightmare',
    name: '大災厄を越えし者',
    description: '難易度「大災厄」をクリアする',
    icon: '🌋',
    condition: { type: 'clear_difficulty', difficulty: 2 },
  },
  {
    id: 'clear_myth',
    name: '神話の刻印者',
    description: '難易度「神話世界」をクリアする',
    icon: '⚡',
    condition: { type: 'clear_difficulty', difficulty: 3 },
  },
  {
    id: 'all_difficulties',
    name: '全知全能',
    description: '全難易度をクリアする',
    icon: '👑',
    condition: { type: 'all_difficulties_cleared' },
  },
  {
    id: 'all_awakenings',
    name: '覚醒の極み',
    description: '全種類の覚醒を達成する',
    icon: '✨',
    condition: { type: 'all_awakenings' },
  },
  {
    id: 'big_damage',
    name: '原始の一撃',
    description: '1回の攻撃で100ダメージを与える',
    icon: '💥',
    condition: { type: 'max_damage', threshold: 100 },
  },
  {
    id: 'mass_slayer',
    name: '百獣の王',
    description: '累計100体の敵を撃破する',
    icon: '🦁',
    condition: { type: 'total_kills', count: 100 },
  },
  {
    id: 'fire_master',
    name: '炎のシナジーマスター',
    description: '「火」シナジーTier2を発動する',
    icon: '🔥',
    condition: { type: 'synergy_tier2', tag: 'fire' },
  },
  {
    id: 'all_synergies',
    name: 'シナジーコレクター',
    description: '全シナジーのTier1を発動する',
    icon: '🧬',
    condition: { type: 'all_synergies_tier1' },
  },
  {
    id: 'event_explorer',
    name: '好奇心旺盛',
    description: '累計10回イベントに遭遇する',
    icon: '🗺️',
    condition: { type: 'event_count', count: 10 },
  },
  {
    id: 'speed_runner',
    name: '疾風のごとく',
    description: '5分以内にクリアする',
    icon: '🏃',
    condition: { type: 'speed_clear', maxSeconds: 300 },
  },
  {
    id: 'bone_collector',
    name: '骨の収集家',
    description: '累計1000骨を集める',
    icon: '💀',
    condition: { type: 'bone_hoarder', amount: 1000 },
  },
  {
    id: 'full_tree',
    name: '文明の完成者',
    description: '文明ツリーを全解放する',
    icon: '🌳',
    condition: { type: 'full_tree' },
  },
]);
```

### 2.5 チャレンジ定義

```typescript
// constants.ts に追加

export const CHALLENGES: readonly ChallengeDef[] = Object.freeze([
  {
    id: 'fragile',
    name: '脆き肉体',
    description: '初期HPが半分。被ダメージ+25%。克服すれば真の強者。',
    icon: '💔',
    modifiers: [
      { type: 'hp_multiplier', value: 0.5 },
      { type: 'enemy_multiplier', stat: 'atk', value: 1.25 },
    ],
  },
  {
    id: 'minimalist',
    name: '原始回帰',
    description: '進化は最大5回まで。限られた選択で最善を尽くせ。',
    icon: '🪨',
    modifiers: [
      { type: 'max_evolutions', count: 5 },
    ],
  },
  {
    id: 'time_trial',
    name: '生存競争',
    description: '10分以内にクリアせよ。時間切れは即敗北。',
    icon: '⏱️',
    modifiers: [
      { type: 'speed_limit', maxSeconds: 600 },
    ],
  },
]);
```

### 2.6 進化カードへのシナジータグ付与

```typescript
// constants.ts の既存 EVOS 配列の各進化に tags フィールドを追加

// 例: 既存進化へのタグ追加マッピング
export const EVOLUTION_TAGS: Record<string, SynergyTag[]> = {
  // 技術系
  'sharp_stone':     ['hunt'],
  'fire_starter':    ['fire'],
  'bone_weapon':     ['hunt', 'tribe'],
  'torch_bearer':    ['fire'],
  // 生活系
  'herb_gather':     ['regen'],
  'hide_armor':      ['shield'],
  'tribal_bond':     ['tribe'],
  'spirit_dance':    ['spirit'],
  // 儀式系
  'blood_offering':  ['wild'],
  'spirit_call':     ['spirit'],
  'beast_taming':    ['wild', 'tribe'],
  'ice_ritual':      ['ice'],
  // ... 全24種に割り当て
};

// 新規進化カード6種
// 注: 実コードの Evolution 型は省略記法（n=name, d=description, t=civType, r=rarity, e=effect）
// 以下は可読性のため説明的な名前で記述。実装時は既存パターンに合わせること
export const NEW_EVOS: readonly Evolution[] = Object.freeze([
  {
    n: '霜の牙',
    d: '凍てつく牙で攻撃力と防御力が上がる',
    t: 'tech',
    r: 0,
    e: { atk: 6, def: 3 },   // 実際の EvoEffect 形式に合わせる
    tags: ['ice', 'hunt'],
  },
  {
    n: '野火の種',
    d: '制御不能の炎が敵を焼き尽くす',
    t: 'tech',
    r: 1,
    e: { atk: 10, burn: 0.25 },
    tags: ['fire', 'wild'],
  },
  {
    n: '根の盾',
    d: '大地の根が守りと再生を与える',
    t: 'life',
    r: 0,
    e: { def: 5, regen: 3 },
    tags: ['shield', 'regen'],
  },
  {
    n: '祖霊の祝福',
    d: '祖先の霊が仲間を強化する',
    t: 'life',
    r: 1,
    e: { hp: 20, ally_atk: 5 },
    tags: ['spirit', 'tribe'],
  },
  {
    n: '血の熱狂',
    d: '血に酔い、攻撃と会心が高まる',
    t: 'rit',
    r: 0,
    e: { atk: 8, cr: 5 },
    tags: ['wild', 'hunt'],
  },
  {
    n: '凍れる祈り',
    d: '氷の祈りで身を守りながら力を得る',
    t: 'rit',
    r: 1,
    e: { def: 8, atk: 5 },
    tags: ['ice', 'spirit'],
  },
]);
```

### 2.7 新規SFX定義

```typescript
// constants.ts に追加

// 既存 SFX_DEFS に7種追加
export const NEW_SFX_DEFS = Object.freeze({
  skill_fire: {
    notes: [
      { freq: 200, dur: 0.05, gain: 0.06 },
      { freq: 400, dur: 0.08, gain: 0.08 },
      { freq: 600, dur: 0.06, gain: 0.05 },
    ],
    wave: 'sawtooth' as const,
  },
  skill_heal: {
    notes: [
      { freq: 523, dur: 0.1, gain: 0.05 },
      { freq: 659, dur: 0.1, gain: 0.05 },
      { freq: 784, dur: 0.15, gain: 0.06 },
    ],
    wave: 'sine' as const,
  },
  skill_rage: {
    notes: [
      { freq: 150, dur: 0.08, gain: 0.08 },
      { freq: 200, dur: 0.06, gain: 0.1 },
      { freq: 100, dur: 0.1, gain: 0.08 },
    ],
    wave: 'square' as const,
  },
  skill_shield: {
    notes: [
      { freq: 300, dur: 0.1, gain: 0.04 },
      { freq: 400, dur: 0.08, gain: 0.05 },
      { freq: 500, dur: 0.12, gain: 0.04 },
    ],
    wave: 'triangle' as const,
  },
  synergy_activate: {
    notes: [
      { freq: 440, dur: 0.08, gain: 0.05 },
      { freq: 554, dur: 0.08, gain: 0.05 },
      { freq: 659, dur: 0.12, gain: 0.06 },
    ],
    wave: 'sine' as const,
  },
  event_appear: {
    notes: [
      { freq: 330, dur: 0.1, gain: 0.04 },
      { freq: 440, dur: 0.15, gain: 0.05 },
    ],
    wave: 'triangle' as const,
  },
  achievement_unlock: {
    notes: [
      { freq: 523, dur: 0.08, gain: 0.05 },
      { freq: 659, dur: 0.08, gain: 0.06 },
      { freq: 784, dur: 0.1, gain: 0.06 },
      { freq: 1047, dur: 0.15, gain: 0.07 },
    ],
    wave: 'sine' as const,
  },
});
```

---

## 3. ゲームロジック仕様

> **注: 実コードとの名称マッピング**
>
> 本仕様書では可読性のため説明的な名前を使用しています。
> 実装時は既存コードの省略記法に合わせてください。
>
> | 本仕様の表記 | 実コードの表記 | 説明 |
> |-------------|--------------|------|
> | `run.battleCount` | `run.bc` | バトルカウント（※`bc` は既存で「骨カウント」の意味もあるため、新規プロパティ `btlCount` として追加を推奨） |
> | `run.currentBiome` | `run.cBT` | 現在のバイオームタイプ (`BiomeIdExt`) |
> | `run.civLevels[type]` | `run.cT` / `run.cL` / `run.cR` | 文明レベル（tech/life/rit）。ヘルパー `civLvs(r)` で `{ tech, life, rit }` 形式に変換可能 |
> | `run.allies` | `run.al` | 味方配列 |
> | `run.eventCount` | 新規追加 | イベント遭遇数（RunState に新規フィールドとして追加） |
> | `run.skillState` | 新規追加 | スキル使用状況（RunState に新規フィールドとして追加） |
>
> **TickEvent 型の拡張**
>
> 既存の `TickEvent` ユニオン型に以下を追加:
> ```typescript
> | { type: 'skill_damage'; value: number }
> | { type: 'skill_heal'; value: number }
> | { type: 'skill_buff'; value: number }
> | { type: 'skill_shield'; value: number }
> | { type: 'event_triggered'; eventId: EventId }
> | { type: 'achievement_unlocked'; achievementId: string }
> | { type: 'synergy_activated'; tag: SynergyTag; tier: 1 | 2 }
> ```

### 3.1 シナジー計算（game-logic.ts に追加）

```typescript
/**
 * ランのシナジー状況を計算する
 *
 * @param evolutions - 取得済み進化の配列
 * @returns 発動中のシナジー配列
 */
export const calcSynergies = (evolutions: Evolution[]): ActiveSynergy[] => {
  // 1. 全進化のタグを集計
  const tagCounts = new Map<SynergyTag, number>();
  for (const evo of evolutions) {
    for (const tag of evo.tags ?? []) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  // 2. 各タグについてシナジー発動判定
  const result: ActiveSynergy[] = [];
  for (const bonus of SYNERGY_BONUSES) {
    const count = tagCounts.get(bonus.tag) ?? 0;
    if (count >= 2) {
      const tier = count >= 3 ? 2 : 1;
      const bonusDef = tier === 2 ? bonus.tier2 : bonus.tier1;
      result.push({
        tag: bonus.tag,
        count,
        tier: tier as 1 | 2,
        bonusName: bonusDef.name,
      });
    }
  }
  return result;
};

/**
 * シナジーボーナスをステータスに反映する
 *
 * @param run - 現在のランステート
 * @param synergies - 発動中シナジー配列
 * @returns ボーナス適用済みの実効ステート（表示用）
 */
export const applySynergyBonuses = (
  run: RunState,
  synergies: ActiveSynergy[]
): { atkBonus: number; defBonus: number; hpBonus: number; crBonus: number; burnMultiplier: number } => {
  let atkBonus = 0, defBonus = 0, hpBonus = 0, crBonus = 0, burnMultiplier = 1;

  /** 単一効果を適用するヘルパー */
  const applyEffect = (effect: SynergyEffect): void => {
    switch (effect.type) {
      case 'stat_bonus':
        if (effect.stat === 'atk') atkBonus += effect.value;
        if (effect.stat === 'def') defBonus += effect.value;
        if (effect.stat === 'hp') hpBonus += effect.value;
        if (effect.stat === 'cr') crBonus += effect.value;
        break;
      case 'damage_multiplier':
        if (effect.target === 'burn') burnMultiplier *= effect.multiplier;
        break;
      case 'heal_bonus':
        // 再生計算で参照
        break;
      case 'ally_bonus':
        // 仲間ステータス計算で参照
        break;
      case 'compound':
        for (const sub of effect.effects) applyEffect(sub);
        break;
    }
  };

  for (const syn of synergies) {
    const bonusDef = SYNERGY_BONUSES.find(b => b.tag === syn.tag);
    if (!bonusDef) continue;
    const effect = syn.tier === 2 ? bonusDef.tier2.effect : bonusDef.tier1.effect;
    applyEffect(effect);
  }

  return { atkBonus, defBonus, hpBonus, crBonus, burnMultiplier };
};
```

### 3.2 アクティブスキル処理

```typescript
/**
 * アクティブスキルを発動する
 *
 * @param run - 現在のランステート
 * @param skillId - 発動するスキルID
 * @returns 更新後のランステートとイベント配列
 */
export const applyActiveSkill = (
  run: RunState,
  skillId: ActiveSkillId
): { nextRun: RunState; events: TickEvent[] } => {
  const skillDef = ACTIVE_SKILLS.find(s => s.id === skillId);
  if (!skillDef) return { nextRun: run, events: [] };

  const next = deepCloneRun(run);
  const events: TickEvent[] = [];

  switch (skillDef.effect.type) {
    case 'damage_all':
      // 敵に baseDamage × multiplier のダメージ（敵が存在する場合のみ）
      if (next.en) {
        const dmg = Math.floor(skillDef.effect.baseDamage * skillDef.effect.multiplier);
        next.en.hp = Math.max(0, next.en.hp - dmg);
        events.push({ type: 'skill_damage', value: dmg });
      }
      break;

    case 'heal_all':
      // プレイヤー + 仲間を回復
      const heal = skillDef.effect.baseHeal;
      next.hp = Math.min(next.mhp, next.hp + heal);
      for (const a of next.al) {  // 実コードのフィールド名
        if (a.hp > 0) {
          a.hp = Math.min(a.mhp, a.hp + Math.floor(heal * skillDef.effect.allyHealRatio));
        }
      }
      events.push({ type: 'skill_heal', value: heal });
      break;

    case 'buff_self':
      // ATK倍率バフ、HP消費
      next.hp -= skillDef.effect.hpCost;
      next.skillState.activeBuffs.push({
        skillId,
        remainingTurns: skillDef.effect.duration,
        effect: skillDef.effect,
      });
      events.push({ type: 'skill_buff', value: skillDef.effect.atkMultiplier });
      break;

    case 'shield':
      // 被ダメージ軽減バフ
      next.skillState.activeBuffs.push({
        skillId,
        remainingTurns: skillDef.effect.duration,
        effect: skillDef.effect,
      });
      events.push({ type: 'skill_shield', value: skillDef.effect.damageReduction });
      break;
  }

  // クールダウン設定
  next.skillState.cooldowns[skillId] = skillDef.cooldownBattles;

  return { nextRun: next, events };
};
```

### 3.3 ランダムイベント判定

```typescript
/**
 * バトル後にイベントを発生させるか判定する
 *
 * @param run - 現在のランステート
 * @param rng - 乱数関数（0〜1）
 * @returns 発生するイベント（undefinedなら発生なし）
 */
export const rollEvent = (
  run: RunState,
  rng: () => number = Math.random
): RandomEventDef | undefined => {
  // 序盤はイベント発生しない（battleCount = 実コードでは btlCount として追加予定）
  if (run.btlCount < EVENT_MIN_BATTLES) return undefined;

  // 確率チェック
  if (rng() > EVENT_CHANCE) return undefined;

  // バイオームアフィニティを考慮して候補をフィルタ
  const currentBiome = run.cBT;  // 実コードのフィールド名
  const candidates = RANDOM_EVENTS.filter(e => {
    if (e.minBiomeCount && run.bc < e.minBiomeCount) return false;
    return true;
  });

  // バイオームアフィニティがあるイベントを優先（2倍の重み）
  const weighted: RandomEventDef[] = [];
  for (const evt of candidates) {
    weighted.push(evt);
    if (evt.biomeAffinity?.includes(currentBiome)) {
      weighted.push(evt); // 重複追加で確率2倍
    }
  }

  if (weighted.length === 0) return undefined;
  const idx = Math.floor(rng() * weighted.length);
  return weighted[idx];
};

/**
 * イベント選択肢の効果を適用する
 *
 * @param run - 現在のランステート
 * @param choice - 選択した選択肢
 * @param rng - 乱数関数
 * @returns 更新後のランステート
 */
export const applyEventChoice = (
  run: RunState,
  choice: EventChoice,
  rng: () => number = Math.random
): RunState => {
  const next = deepCloneRun(run);
  const eff = choice.effect;

  switch (eff.type) {
    case 'stat_change':
      if (eff.stat === 'hp') next.mhp += eff.value;
      if (eff.stat === 'atk') next.atk += eff.value;
      if (eff.stat === 'def') next.def += eff.value;
      break;
    case 'heal':
      next.hp = Math.min(next.mhp, next.hp + eff.amount);
      break;
    case 'damage':
      next.hp = Math.max(1, next.hp - eff.amount);
      break;
    case 'bone_change':
      // 骨の増減はsave側で処理
      break;
    case 'add_ally':
      // 仲間追加ロジック（空きがある場合のみ）
      break;
    case 'random_evolution':
      // ランダム進化1つを即時適用
      break;
    case 'civ_level_up':
      // 指定文明レベル+1（実コードでは cT/cL/cR を個別に更新）
      // 'dominant' の場合は最高レベルの文明を選択
      {
        const targetCiv = eff.civType === 'dominant'
          ? dominantCiv(next)  // 実装時: 最高レベルの文明タイプを返すヘルパー
          : eff.civType;
        if (targetCiv === 'tech') next.cT += 1;
        else if (targetCiv === 'life') next.cL += 1;
        else if (targetCiv === 'rit') next.cR += 1;
      }
      break;
    case 'nothing':
      break;
  }

  next.eventCount = (next.eventCount ?? 0) + 1;
  return next;
};
```

### 3.4 実績判定

```typescript
/**
 * 実績の解除条件をチェックする
 *
 * @param achievement - 実績定義
 * @param stats - 累計統計データ
 * @param currentRun - 現在のラン統計（ラン終了時）
 * @returns 解除されたか
 */
export const checkAchievement = (
  achievement: AchievementDef,
  stats: AggregateStats,
  currentRun: RunStats
): boolean => {
  const c = achievement.condition;
  switch (c.type) {
    case 'first_clear':
      return currentRun.result === 'victory';
    case 'clear_count':
      return stats.totalClears >= c.count;
    case 'clear_difficulty':
      return stats.clearedDifficulties.includes(c.difficulty);
    case 'all_difficulties_cleared':
      return stats.clearedDifficulties.length >= 4;
    case 'all_awakenings':
      return stats.achievedAwakenings.length >= 4;
    case 'max_damage':
      return currentRun.maxDamage >= c.threshold;
    case 'total_kills':
      return stats.totalKills >= c.count;
    case 'synergy_tier2':
      return stats.achievedSynergiesTier2.includes(c.tag);
    case 'all_synergies_tier1':
      return stats.achievedSynergiesTier1.length >= SYNERGY_BONUSES.length;
    case 'event_count':
      return stats.totalEvents >= c.count;
    case 'challenge_clear':
      return stats.clearedChallenges.includes(c.challengeId);
    case 'no_damage_boss':
      return currentRun.result === 'victory' && stats.lastBossDamageTaken === 0;
    case 'speed_clear':
      return currentRun.result === 'victory' && currentRun.playtimeSeconds <= c.maxSeconds;
    case 'bone_hoarder':
      return stats.totalBoneEarned >= c.amount;
    case 'full_tree':
      return stats.treeCompletionRate >= 1.0;
  }
};
```

---

## 4. コンポーネント設計

### 4.1 EventScreen（新規）

```
┌─────────────────────────────────┐
│                                 │
│     🗺️ 星降る夜                │
│                                 │
│ 空一面の星明かりの下、           │
│ 不思議な力が身体を包む。         │
│                                 │
│ ┌───────────────────────────┐   │
│ │ 🟢 瞑想する               │   │
│ │ → HP を大幅回復する       │   │
│ └───────────────────────────┘   │
│ ┌───────────────────────────┐   │
│ │ 🟡 星に願いをかける       │   │
│ │ → ランダムな効果が起きる  │   │
│ └───────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

Props:
```typescript
interface EventScreenProps {
  event: RandomEventDef;
  onChoose: (choice: EventChoice) => void;
}
```

### 4.2 StatsScreen（新規）

```
┌─────────────────────────────────┐
│     📊 ラン統計                  │
│                                 │
│ 総プレイ回数: 42                │
│ 総クリア回数: 28                │
│ クリア率: 66%                   │
│ 最高ダメージ: 156               │
│ 総撃破数: 534                   │
│ 総獲得骨: 4,280                 │
│                                 │
│ ── 直近のラン ──                │
│ #42 ✅ 大災厄 / 技術覚醒 3:45  │
│ #41 ❌ 氷河期 / 2バイオーム     │
│ #40 ✅ 原始   / 調和覚醒 2:10  │
│ ...                             │
│                                 │
│        [🔙 戻る]                │
└─────────────────────────────────┘
```

### 4.3 AchievementScreen（新規）

```
┌─────────────────────────────────┐
│     🏆 実績 (8/15)              │
│                                 │
│ ✅ 🦴 原始の証                  │
│    初めてゲームをクリアする      │
│ ✅ 🏹 歴戦の狩人                │
│    10回クリアする               │
│ ✅ ❄️ 氷河期の生存者            │
│    難易度「氷河期」をクリアする   │
│ 🔒 🌋 大災厄を越えし者          │
│    難易度「大災厄」をクリアする   │
│ 🔒 ⚡ 神話の刻印者              │
│    難易度「神話世界」をクリアする │
│ ...                             │
│                                 │
│        [🔙 戻る]                │
└─────────────────────────────────┘
```

### 4.4 BattleScreen 改修

既存の BattleScreen に以下を追加:

```
┌─────────────────────────────────┐
│ [HP ████████░░] 65/100          │
│ ATK:25 DEF:8 (🔥+30% 🛡+3)    │  ← シナジーアイコン
│                                 │
│   [Canvas: スプライト]           │
│   [-45] ← ダメージポップアップ   │
│   [敵HPバー ██████░░░]          │  ← 敵HP表示
│                                 │
│ ── バトルログ ──                │
│ 攻撃! 32ダメージ（会心!）       │
│ 敵の攻撃! 15ダメージ            │
│                                 │
│ [🔥炎] [🌿癒] [💀狂] [🛡盾]   │  ← スキルボタン
│ [×1] [×2] [×4] [×8] [⏸]       │  ← 速度+一時停止
└─────────────────────────────────┘
```

### 4.5 EvolutionScreen 改修

既存の EvolutionScreen にシナジー情報を追加:

```
┌─────────────────────────────────┐
│     進化を選択                   │
│                                 │
│ シナジー: 🔥×2(灼熱の魂)       │  ← 現在のシナジー状況
│          🏹×1(あと1つ!)        │
│                                 │
│ ┌──────────┐ ┌──────────┐       │
│ │ 霜の牙   │ │ 野火の種 │       │
│ │ 🧊🏹     │ │ 🔥🌿     │      │  ← タグアイコン
│ │ ATK+6    │ │ ATK+10   │       │
│ │ DEF+3    │ │ 火傷+25% │       │
│ └──────────┘ └──────────┘       │
│ ┌──────────┐                    │
│ │ 根の盾   │                    │
│ │ 🛡♻️     │                    │
│ │ DEF+5    │                    │
│ │ 再生+3   │                    │
│ └──────────┘                    │
└─────────────────────────────────┘
```

---

## 5. ストレージ設計

### 5.1 localStorage キー追加

| キー | 型 | 用途 | Phase |
|------|----|------|-------|
| `primal-path-v7` | `SaveData` | 既存セーブデータ（互換維持） | 既存 |
| `primal-path-stats` | `RunStats[]` | ラン統計（最新50件） | Phase 4 |
| `primal-path-achievements` | `AchievementState[]` | 実績解除状態 | Phase 4 |
| `primal-path-aggregate` | `AggregateStats` | 累計統計（撃破数、骨総数等） | Phase 4 |

### 5.2 累計統計

```typescript
/** 累計統計（実績判定に使用。localStorage に JSON 保存するため Set は使わない） */
export interface AggregateStats {
  totalRuns: number;
  totalClears: number;
  totalKills: number;
  totalBoneEarned: number;
  totalEvents: number;
  clearedDifficulties: number[];
  achievedAwakenings: string[];       // 覚醒タイプ名の配列
  achievedSynergiesTier1: SynergyTag[];  // Tier1 発動済みタグ配列
  achievedSynergiesTier2: SynergyTag[];  // Tier2 発動済みタグ配列
  clearedChallenges: string[];
  treeCompletionRate: number;
  lastBossDamageTaken: number;
}
```

### 5.3 データ量見積り

| データ | 1件あたり | 最大件数 | 合計 |
|--------|----------|---------|------|
| SaveData | ~2KB | 1 | ~2KB |
| RunStats | ~300B | 50 | ~15KB |
| AchievementState | ~50B | 15 | ~750B |
| AggregateStats | ~200B | 1 | ~200B |
| **合計** | | | **~18KB** |

localStorage の5MB制限に対して十分余裕あり。

---

## 6. ゲームフロー変更

### 6.1 変更後のフロー

```
Title → [統計] → StatsScreen → Title
     → [実績] → AchievementScreen → Title
     → [挑戦] → ChallengeScreen → Difficulty → ...
     → [開始] → Difficulty → Biome → Evolution → Battle
                                         ↑        ↓
                                         └── Event (20%確率) ──→ Evolution
                                                                ↓
                                    Ally Revive ← Boss Clear ← Battle
                                         ↓
                                    Next Biome or Final Boss
                                         ↓
                               Game Over → Stats Recording → Achievement Check → Title
```

### 6.2 タイトル画面メニュー追加

```
[はじめる]         ← 既存
[遊び方]           ← 既存
[文明ツリー]       ← 既存
[ラン統計]         ← 新規（Phase 4）
[実績]             ← 新規（Phase 4）
[挑戦モード]       ← 新規（Phase 4）
```

---

## 7. ダメージポップアップ仕様

### 7.1 Canvas 描画

```typescript
/** ダメージポップアップ */
interface DamagePopup {
  value: number;              // ダメージ値
  x: number;                  // 表示X座標
  y: number;                  // 表示Y座標（上方に移動）
  color: string;              // 色（通常: #fff, 会心: #ff4444, 回復: #44ff44）
  fontSize: number;           // フォントサイズ（通常: 14, 会心: 20）
  alpha: number;              // 透明度（1.0 → 0.0）
  lifetime: number;           // 残りフレーム数
}

/** 最大同時表示数 */
const MAX_POPUPS = 5;

/** ポップアップ寿命（tickフレーム数） */
const POPUP_LIFETIME = 8;
```

### 7.2 アニメーション

- 初期位置: スプライトの上部
- 移動: Y座標を毎tick 3px 上昇
- フェード: alpha を lifetime に比例して 1.0 → 0.0
- 会心時: フォントサイズを 20px に拡大 + 赤色
- 回復時: 緑色 + 「+」プレフィックス

---

## 8. 背景・天候エフェクト仕様

### 8.1 バイオーム背景

| バイオーム | 背景グラデーション | 天候パーティクル |
|-----------|------------------|----------------|
| 草原 | `#1a3a1a → #2d5a2d → #1a3a1a` | なし（デフォルト） |
| 氷河 | `#0a1a2a → #1a3a5a → #0a1a2a` | 雪の結晶（白い小さな円が落下） |
| 火山 | `#2a0a0a → #5a1a1a → #2a0a0a` | 火の粉（オレンジの小さな粒が上昇） |

### 8.2 天候パーティクル（CSSベース）

```css
@keyframes snowfall {
  0% { transform: translateY(-10px) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(720px) rotate(360deg); opacity: 0; }
}

@keyframes ember {
  0% { transform: translateY(720px) scale(1); opacity: 0; }
  10% { opacity: 0.8; }
  90% { opacity: 0.3; }
  100% { transform: translateY(-10px) scale(0.3); opacity: 0; }
}
```

パーティクル数: 15〜20個。CSS animation で制御し、Canvas 描画負荷を避ける。
