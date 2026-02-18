# IPNE 5ステージ制 + ストーリー進行 — 詳細仕様書

## 1. ステージ設定パラメータ

### 1.1 迷路生成パラメータ

| パラメータ | S1 | S2 | S3 | S4 | S5 |
|---|---|---|---|---|---|
| 迷路サイズ（width x height） | 80x80 | 85x85 | 90x90 | 95x95 | 100x100 |
| BSP深度（maxDepth） | 6 | 6 | 7 | 7 | 7 |
| ループ数（loopCount） | 2 | 2 | 3 | 3 | 4 |
| 最小部屋サイズ（minRoomSize） | 6 | 6 | 6 | 6 | 6 |
| 最大部屋サイズ（maxRoomSize） | 10 | 10 | 10 | 10 | 10 |
| 通路幅（corridorWidth） | 3 | 3 | 3 | 3 | 3 |

### 1.2 敵配置パラメータ

| パラメータ | S1 | S2 | S3 | S4 | S5 |
|---|---|---|---|---|---|
| patrol（巡回） | 10 | 12 | 14 | 16 | 18 |
| charge（突進） | 6 | 8 | 10 | 12 | 14 |
| ranged（遠距離） | 5 | 6 | 8 | 10 | 12 |
| specimen（検体） | 4 | 5 | 6 | 7 | 8 |
| ミニボス | 0 | 0 | 2 | 2 | 3 |
| ボス | 1 | 1 | 1 | 1 | 0 |
| メガボス | 0 | 0 | 0 | 0 | 1 |
| 敵合計（ボス含む） | 26 | 32 | 41 | 48 | 56 |

### 1.3 敵スケーリング倍率

| パラメータ | S1 | S2 | S3 | S4 | S5 |
|---|---|---|---|---|---|
| HP倍率 | 1.0 | 1.3 | 1.6 | 2.0 | 2.5 |
| ダメージ倍率 | 1.0 | 1.2 | 1.4 | 1.7 | 2.0 |
| 速度倍率 | 1.0 | 1.1 | 1.15 | 1.2 | 1.25 |

**適用方法**: 各敵のベースパラメータ（`ENEMY_CONFIGS`）に倍率を乗算。小数点以下は切り上げ（HP）または切り捨て（速度は元の精度を維持）。

**適用例（Stage 3 のパトロール敵）**:
- HP: 4 × 1.6 = 6.4 → 7（切り上げ）
- damage: 1 × 1.4 = 1.4 → 1（切り捨て）
- speed: 2 × 1.15 = 2.3

### 1.4 ギミック配置パラメータ

| パラメータ | S1 | S2 | S3 | S4 | S5 |
|---|---|---|---|---|---|
| 罠数（trapCount） | 10 | 12 | 15 | 18 | 22 |
| 壁数（wallCount） | 6 | 8 | 10 | 16 | 12 |
| レベル上限 | 11 | 12 | 13 | 14 | 15 |

### 1.5 罠比率（全ステージ共通）

| 種類 | 比率 |
|------|------|
| ダメージ罠 | 40% |
| 移動妨害罠 | 30% |
| テレポート罠 | 30% |

### 1.6 壁比率

| 種類 | S1〜S3 | S4（特殊） | S5 |
|------|--------|-----------|-----|
| 破壊可能壁 | 50% | 60% | 50% |
| すり抜け壁 | 30% | 30% | 30% |
| 透明壁 | 20% | 10% | 20% |

---

## 2. Stage 4 特殊仕様

Stage 4 は壁ギミックが特に多い「壁の迷宮」ステージ。

### 2.1 設計意図

- プレイヤーに「壁ギミックの攻略」を強制するステージ
- 破壊可能壁が多く、攻撃力ビルドの価値が高まる
- すり抜け壁も一定数あり、盗賊の視認能力が活きる

### 2.2 パラメータ詳細

| 項目 | 値 | 備考 |
|------|-----|------|
| 壁数 | 16 | 他ステージの約2倍 |
| 破壊可能壁比率 | 60% | 10個（= 16 × 0.6） |
| すり抜け壁比率 | 30% | 5個（= 16 × 0.3） |
| 透明壁比率 | 10% | 1個（= 16 × 0.1） |

---

## 3. メガボス仕様

Stage 5 にのみ出現する最終ボス。通常ボスより大幅に強化。

### 3.1 パラメータ

```typescript
const MEGA_BOSS_CONFIG = {
  hp: 80,
  damage: 6,
  speed: 1.8,
  detectionRange: 12,
  chaseRange: 20,
  attackRange: 4,
} as const;
```

### 3.2 通常ボスとの比較

| パラメータ | 通常ボス | メガボス | 備考 |
|-----------|---------|---------|------|
| HP | 35 | 80 | 約2.3倍 |
| ダメージ | 4 | 6 | 1.5倍 |
| 速度 | 1.5 | 1.8 | やや速い |
| 感知範囲 | 8 | 12 | 広範囲 |
| 追跡範囲 | 15 | 20 | 長距離追跡 |
| 攻撃範囲 | 3 | 4 | 広め |

### 3.3 スプライト仕様

| 項目 | 値 |
|------|-----|
| 表示サイズ | 通常敵の1.5倍（72px相当） |
| 色 | 深紫 `#3b0764` |
| 形状 | 大きな円 + 外周にパルスエフェクト |
| 死亡時 | 大きめの死亡エフェクト |

### 3.4 AI挙動

- 通常ボスと同じ追跡型AIをベースにする
- 感知範囲・追跡範囲が広いため、逃げ切りが困難
- Stage 5 の広大な迷路（100x100）を活かした長距離追跡

---

## 4. ミニボス仕様

Stage 3〜5 に出現する中間的な強敵。

### 4.1 パラメータ

```typescript
const MINI_BOSS_CONFIG = {
  hp: 15,
  damage: 3,
  speed: 2,
  detectionRange: 7,
  chaseRange: 12,
  attackRange: 2,
} as const;
```

### 4.2 EnemyType への追加

```typescript
export const EnemyType = {
  // 既存
  PATROL: 'patrol',
  CHARGE: 'charge',
  RANGED: 'ranged',
  SPECIMEN: 'specimen',
  BOSS: 'boss',
  // 新規
  MINI_BOSS: 'mini_boss',
  MEGA_BOSS: 'mega_boss',
} as const;
```

### 4.3 ミニボスの特徴

| 項目 | 値 |
|------|-----|
| ドロップ | 大回復アイテム（確定） |
| 表示サイズ | 通常敵の1.2倍 |
| 色 | 暗赤紫 `#6b2136` |
| AI | 通常ボスと同等の追跡型 |
| 配置 | ゴール部屋以外のランダムな部屋 |

---

## 5. ステージ報酬選択肢

各ステージクリア時（Stage 1〜4）に、以下の報酬から1つを選択。

### 5.1 報酬一覧

| # | 報酬 | 効果 | 説明テキスト |
|---|------|------|-------------|
| 1 | 最大HP強化 | maxHp +5 & 現在HP +5 | 「探索の経験が生命力を高めた」 |
| 2 | 攻撃力強化 | attackPower +1 | 「戦闘の記憶が攻撃を鋭くした」 |
| 3 | 攻撃距離強化 | attackRange +1 | 「間合いの感覚が研ぎ澄まされた」 |
| 4 | 移動速度強化 | moveSpeed +1 | 「足運びが迷宮に適応した」 |
| 5 | 攻撃速度強化 | attackSpeed -0.1 | 「反応速度が一段上がった」 |
| 6 | 回復量強化 | healBonus +1 | 「回復の効率が改善された」 |

### 5.2 報酬とレベルアップ選択の違い

| 項目 | レベルアップ選択 | ステージ報酬 |
|------|----------------|-------------|
| タイミング | 撃破数到達時 | ステージクリア時 |
| 選択肢数 | 5（上限到達時はグレーアウト） | 6（最大HP追加） |
| 上限 | STAT_LIMITS に従う | STAT_LIMITS に従う |
| HP効果 | なし | maxHp +5 は即座にHP回復も伴う |
| ポイント消費 | レベルが1上がる | なし（ボーナス） |

### 5.3 上限判定

報酬選択時にも `STAT_LIMITS` を参照し、上限に達している選択肢はグレーアウトする。

- 最大HPには上限を設けない（5ステージ × +5 = 最大+20）
- 攻撃力は既存仕様どおり上限なし（`STAT_LIMITS` に `attackPower` は含まれていない）
- 他はレベルアップと同じ上限（attackRange:3, moveSpeed:8, attackSpeed:0.5, healBonus:5）

---

## 6. レベル11〜15 キルカウントテーブル

### 6.1 追加テーブル

| レベルアップ | 必要撃破数 | 累計撃破数 |
|-------------|-----------|-----------|
| 10 → 11 | 5 | 30 |
| 11 → 12 | 6 | 36 |
| 12 → 13 | 7 | 43 |
| 13 → 14 | 8 | 51 |
| 14 → 15 | 9 | 60 |

### 6.2 完全テーブル（Lv1〜15）

```typescript
export const KILL_COUNT_TABLE: Record<number, number> = {
  1: 0,    // 初期状態
  2: 1,
  3: 3,
  4: 5,
  5: 7,
  6: 10,
  7: 13,
  8: 17,
  9: 21,
  10: 25,
  // 5ステージ拡張
  11: 30,
  12: 36,
  13: 43,
  14: 51,
  15: 60,
};
```

### 6.3 MAX_LEVEL の変更

```typescript
// 変更前
export const MAX_LEVEL = 10;

// 変更後
export const MAX_LEVEL = 15;
```

### 6.4 ステージ別レベル上限

各ステージにはレベル上限があり、そのステージ内ではこの上限を超えてレベルアップできない。

| ステージ | レベル上限 | 累計撃破数上限 |
|---------|----------|--------------|
| S1 | 11 | 30 |
| S2 | 12 | 36 |
| S3 | 13 | 43 |
| S4 | 14 | 51 |
| S5 | 15 | 60 |

**注意**: ステージ報酬によるステータス上昇はレベルとは無関係のため、レベル上限には影響しない。

---

## 7. 評価閾値の再調整

### 7.1 変更前（1ステージ基準）

| 評価 | 閾値 |
|------|------|
| S | 2分以内 |
| A | 3分以内 |
| B | 5分以内 |
| C | 8分以内 |
| D | 8分超 |

### 7.2 変更後（5ステージ合計基準）

| 評価 | 閾値 | 平均ステージ時間 |
|------|------|----------------|
| S | 10分以内 | 2分/ステージ |
| A | 15分以内 | 3分/ステージ |
| B | 25分以内 | 5分/ステージ |
| C | 40分以内 | 8分/ステージ |
| D | 40分超 | — |

### 7.3 実装

```typescript
// 変更後
export const RATING_THRESHOLDS = {
  S: 600000,   // 10分
  A: 900000,   // 15分
  B: 1500000,  // 25分
  C: 2400000,  // 40分
} as const;
```

### 7.4 タイマー挙動

- ステージ間（STAGE_CLEAR / STAGE_STORY / STAGE_REWARD 画面）ではタイマーを **一時停止**
- ゲームプレイ中（GAME 画面）のみ時間が加算
- 合計5ステージ分のゲームプレイ時間で評価を計算

---

## 8. ストーリーテキスト

### 8.1 ストーリーデータ型

```typescript
interface StoryScene {
  id: string;
  title: string;
  lines: string[];
  /** 将来の画像挿入用。未設定時は undefined */
  imageKey?: string;
}
```

### 8.2 プロローグ（ストーリー #0）

> **タイトル**: 「調査開始」
>
> - 調査だけのはずだった。
> - 突如出現したこのダンジョンは、入るたびに内部構造が変化する。
> - 最深部の「核」に到達し、この異常構造体の封鎖を解除する。
> - それが、今回の任務だ。
> - ――入口は、もう閉じている。

*（既存のプロローグテキストをベースに、5ステージ構成への導入を加味）*

### 8.3 ステージ間ストーリー

#### ストーリー #1（Stage 1 クリア後）

> **タイトル**: 「第一層突破」
>
> - 最初の核の反応が消えた。
> - だが、奥にはさらに深い層が続いている。
> - 構造が安定しかけた壁の向こうに、新たな通路が開いた。
> - ――まだ、先がある。

#### ストーリー #2（Stage 2 クリア後）

> **タイトル**: 「深部への接近」
>
> - 二つ目の核も沈黙した。
> - 迷宮の反応が明らかに変わっている。
> - 壁の紋様が複雑になり、通路の構造が不規則になってきた。
> - まるで、侵入者を拒んでいるかのように。

#### ストーリー #3（Stage 3 クリア後）

> **タイトル**: 「異変」
>
> - 三つ目の核を停止させた。
> - 周囲の空気が変質している。壁が不自然に増殖している。
> - ここから先は、迷宮そのものが防衛行動を取っている。
> - 慎重に、だが確実に進まなければならない。

#### ストーリー #4（Stage 4 クリア後）

> **タイトル**: 「最深部へ」
>
> - 四つ目の核が崩壊し、最後の封鎖が解けた。
> - この先に、迷宮の中枢がある。
> - 今まで以上に強い反応体の気配。
> - ――これが、最後の調査になる。

#### ストーリー #5（Stage 5 クリア後 → FINAL_CLEAR へ遷移前）

> **タイトル**: 「封鎖解除」
>
> - 最後の核が停止し、迷宮全体が静まりかえった。
> - 入口方向の封鎖が完全に解除された。
> - 長い調査が、ようやく終わる。

### 8.4 エンディングテキスト（評価別）

最終クリア画面（FINAL_CLEAR）で表示。評価に応じたエピローグ。

| 評価 | タイトル | テキスト |
|------|---------|---------|
| S | 伝説の調査記録 | 全5層を驚異的な速さで踏破した。この調査記録は、後の探索者たちの指針となるだろう。 |
| A | 優秀な調査報告 | 確かな実力で全層を制覇した。解析班からも高い評価が寄せられている。 |
| B | 堅実な踏破記録 | 着実に5つの層を攻略した。得られたデータは今後の調査に大きく貢献する。 |
| C | 生還報告 | 幾度も危機を乗り越え、全層を踏破した。何より、生きて帰れたことが最大の成果だ。 |
| D | 辛勝の脱出記録 | 長い戦いの末、ようやく迷宮の封鎖が解除された。記録に残る限りの困難を極めた調査だった。 |

### 8.5 ゲームオーバーテキスト（変更なし）

```typescript
const GAME_OVER_TEXT: EpilogueText = {
  title: '冒険の終わり',
  text: '迷宮の闇に飲み込まれた。だが、これで終わりではない。再び挑戦しよう。',
};
```

---

## 9. StageConfig 型定義

### 9.1 インターフェース

```typescript
/** ステージ番号（1〜5） */
export type StageNumber = 1 | 2 | 3 | 4 | 5;

/** ステージ設定 */
export interface StageConfig {
  /** ステージ番号 */
  stage: StageNumber;
  /** ステージ名（表示用） */
  name: string;
  /** 迷路設定 */
  maze: MazeConfig;
  /** 敵配置数 */
  enemies: {
    patrol: number;
    charge: number;
    ranged: number;
    specimen: number;
    miniBoss: number;
  };
  /** 敵スケーリング倍率 */
  scaling: {
    hp: number;
    damage: number;
    speed: number;
  };
  /** ギミック配置 */
  gimmicks: GimmickPlacementConfig;
  /** このステージでのレベル上限 */
  maxLevel: number;
  /** ボスタイプ（通常 or メガ） */
  bossType: 'boss' | 'mega_boss';
}
```

### 9.2 設定データ例（Stage 1）

```typescript
const STAGE_1: StageConfig = {
  stage: 1,
  name: '第一層',
  maze: {
    width: 80,
    height: 80,
    minRoomSize: 6,
    maxRoomSize: 10,
    corridorWidth: 3,
    maxDepth: 6,
    loopCount: 2,
  },
  enemies: {
    patrol: 10,
    charge: 6,
    ranged: 5,
    specimen: 4,
    miniBoss: 0,
  },
  scaling: {
    hp: 1.0,
    damage: 1.0,
    speed: 1.0,
  },
  gimmicks: {
    trapCount: 10,
    trapRatio: { damage: 0.4, slow: 0.3, teleport: 0.3 },
    wallCount: 6,
    wallRatio: { breakable: 0.5, passable: 0.3, invisible: 0.2 },
  },
  maxLevel: 11,
  bossType: 'boss',
};
```

---

## 10. データ永続化仕様

### 10.1 ステージ間引き継ぎデータ構造

```typescript
/** ステージ間で引き継ぐプレイヤーデータ */
interface StageCarryOver {
  level: number;
  killCount: number;
  hp: number;
  maxHp: number;
  hasKey: false; // 常にfalseでリセット
  stats: PlayerStats;
  playerClass: PlayerClassValue;
  stageRewards: StageRewardHistory[];
  // 注意: タイマー（GameTimer）はこの構造に含まない。
  // ステージ間は既存の pause/resume で一時停止し、合計時間として継続する（セクション7.4参照）。
}

/** ステージ報酬履歴 */
interface StageRewardHistory {
  stage: StageNumber;
  reward: StageRewardType;
}

type StageRewardType =
  | 'max_hp'
  | 'attack_power'
  | 'attack_range'
  | 'move_speed'
  | 'attack_speed'
  | 'heal_bonus';
```

### 10.2 ゲームオーバー時のリセット

ゲームオーバー時は **全てのデータをリセット** してステージ1からやり直し。

| リセット対象 | 説明 |
|-------------|------|
| currentStage | 1 にリセット |
| レベル | 1 にリセット |
| 撃破数 | 0 にリセット |
| 能力値 | 職業の初期値にリセット |
| HP/maxHp | 職業の初期値にリセット |
| ステージ報酬 | 全消去 |
| タイマー | リセット |
| マップ/敵/アイテム | 新規生成 |

### 10.3 localStorage キー（変更なし）

既存の記録保存キーは変更しない。記録データの `GameRecord` に `stagesCleared` フィールドを追加検討するが、後方互換性を維持する。

```typescript
// 変更前（現行の types.ts）
export interface GameRecord {
  time: number;
  rating: RatingValue;
  playerClass: PlayerClassValue;
  date: string;
}

// 変更後（オプショナルフィールド追加、後方互換性維持）
export interface GameRecord {
  time: number;
  rating: RatingValue;
  playerClass: PlayerClassValue;
  date: string;
  stagesCleared?: number; // 5ステージ制で追加
}
```

---

## 11. 将来の画像挿入仕様

### 11.1 画像ファイル仕様

| 項目 | 値 |
|------|-----|
| 形式 | WebP（推奨） / PNG（フォールバック） |
| サイズ | 最大 720x528px（Canvas 解像度に合わせる） |
| 配置場所 | `src/assets/images/` |
| 命名規則 | `ipne_story_{stage}.webp`（例: `ipne_story_1.webp`） |

### 11.2 ストーリー画像の配置箇所

| ストーリーID | ファイル名 | 用途 |
|-------------|-----------|------|
| story_0 | `ipne_story_prologue.webp` | プロローグ背景 |
| story_1 | `ipne_story_1.webp` | Stage 1 クリア後 |
| story_2 | `ipne_story_2.webp` | Stage 2 クリア後 |
| story_3 | `ipne_story_3.webp` | Stage 3 クリア後 |
| story_4 | `ipne_story_4.webp` | Stage 4 クリア後 |
| story_5 | `ipne_story_5.webp` | Stage 5 クリア後（エンディング前） |

### 11.3 画像読み込み方式

既存の `ending.ts` と同じ方式を採用：

```typescript
// story.ts 内で import
import storyPrologue from '../../assets/images/ipne_story_prologue.webp';
import story1 from '../../assets/images/ipne_story_1.webp';
// ...

// 画像が存在しない場合は undefined を返す（段階的に追加可能）
export function getStoryImage(storyId: string): string | undefined {
  return STORY_IMAGES[storyId];
}
```

### 11.4 画像未設定時の表示

画像が未設定の場合、ストーリー画面は **テキストのみの暗い背景** で表示する。画像の追加は将来のタスクとして独立して実施可能。

---

## 12. 画面コンポーネント仕様

### 12.1 STAGE_CLEAR 画面

| 項目 | 仕様 |
|------|------|
| 表示タイミング | ステージ1〜5 のゴール到達時 |
| 表示内容 | 「Stage X クリア！」テキスト、ステージ番号、ステータスサマリー |
| タイマー | 一時停止 |
| BGM | クリアジングル再生 |
| 遷移先 | 「次へ」ボタン → STAGE_STORY |
| 自動遷移 | なし（ボタン押下で遷移） |

### 12.2 STAGE_STORY 画面

| 項目 | 仕様 |
|------|------|
| 表示タイミング | STAGE_CLEAR の後 |
| 表示内容 | ストーリーテキスト（タイトル + 本文行）、背景画像（あれば） |
| タイマー | 一時停止 |
| BGM | なし（静寂） |
| 遷移先 | 「次へ」ボタン → STAGE_REWARD（Stage 1〜4）/ FINAL_CLEAR（Stage 5） |
| テキスト表示 | 行ごとにフェードイン（0.5秒間隔） |

### 12.3 STAGE_REWARD 画面

| 項目 | 仕様 |
|------|------|
| 表示タイミング | STAGE_STORY の後（Stage 1〜4 のみ） |
| 表示内容 | 6つの報酬選択肢、各選択肢の効果説明 |
| タイマー | 一時停止 |
| BGM | なし |
| 遷移先 | 選択完了 → GAME（次ステージ） |
| 上限到達 | 選択肢がグレーアウト |

### 12.4 FINAL_CLEAR 画面

| 項目 | 仕様 |
|------|------|
| 表示タイミング | Stage 5 のストーリー後 |
| 表示内容 | 評価ランク、合計クリアタイム、エピローグテキスト、画像/動画 |
| タイマー | 停止 |
| BGM | クリアジングル |
| 遷移先 | 「タイトルに戻る」→ TITLE |
| 既存からの変更 | Clear.tsx をベースに FINAL_CLEAR 用に拡張 |

---

## 13. ScreenState 拡張の完全定義

```typescript
export const ScreenState = {
  TITLE: 'title',
  CLASS_SELECT: 'class_select',
  PROLOGUE: 'prologue',
  GAME: 'game',
  DYING: 'dying',
  GAME_OVER: 'game_over',
  // 5ステージ制で追加
  STAGE_CLEAR: 'stage_clear',
  STAGE_STORY: 'stage_story',
  STAGE_REWARD: 'stage_reward',
  FINAL_CLEAR: 'final_clear',
} as const;
```

**注意**: 既存の `CLEAR: 'clear'` は `FINAL_CLEAR: 'final_clear'` に変更。既存のテスト・コードで `ScreenState.CLEAR` を参照している箇所は全て更新が必要。
