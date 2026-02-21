# LAP DRAFT RACING フェーズ0+1 詳細仕様書

> 文書ID: LDR-20260221-01-SPEC
> 作成日: 2026-02-21
> 対象: フェーズ0（操作感改善）+ フェーズ1（コア体験）
> ステータス: ドラフト

---

## 目次

1. [状態遷移の変更](#1-状態遷移の変更)
2. [ドリフトシステム](#2-ドリフトシステム)
3. [HEAT（ニアミスボーナス）システム](#3-heatニアミスボーナスシステム)
4. [壁ヒットペナルティ改善](#4-壁ヒットペナルティ改善)
5. [コース個性化](#5-コース個性化)
6. [ドラフトカードシステム](#6-ドラフトカードシステム)
7. [ゴーストシステム](#7-ゴーストシステム)
8. [ハイライトシステム](#8-ハイライトシステム)
9. [型定義一覧](#9-型定義一覧)

---

## 1. 状態遷移の変更

### 1.1 現行の状態遷移

```
menu → countdown → race → result
```

`RacingGame.tsx` の `state` 変数で管理:

- `'menu'`: コース・モード・設定選択（`useIdle` で8秒後にデモ開始）
- `'countdown'`: 3.5秒カウントダウン（`Config.timing.countdown`）
- `'race'`: レース進行（全ラップ完了まで）
- `'result'`: 結果表示・花火・コンフェッティ演出

### 1.2 新しい状態遷移

```
menu → countdown → race ⇄ draft → result
```

- **`'draft'`（新規）**: ラップ完了時にカード選択画面を表示
  - `race` → `draft`: 各ラップ完了時（最終ラップ除く）に遷移
  - `draft` → `race`: カード選択完了後にレース再開

### 1.3 状態遷移ルール

| 遷移 | トリガー | 条件 |
|------|---------|------|
| `menu` → `countdown` | スタートボタン押下 | コース・モード選択済み |
| `countdown` → `race` | カウントダウン完了（3.5秒） | — |
| `race` → `draft` | ラップ完了（いずれかのプレイヤー） | 最終ラップでない かつ `Options.laps` > 1 |
| `draft` → `race` | カード選択完了（全プレイヤー） | タイマー切れも含む |
| `race` → `result` | 最終ラップ完了（いずれかのプレイヤーが `laps` に到達） | — |
| `result` → `menu` | 戻るボタン押下 / ESC | — |

### 1.4 draft 状態の詳細

- レースは一時停止（`requestAnimationFrame` ループ停止）
- 2P モード時: P1 → P2 の順にカードを選択（各15秒タイマー）
- CPU モード時: プレイヤーがカード選択後、CPU は即座に自動選択
- タイマー切れ時: ランダムにカードが自動選択される
- デモモード時: ドラフトをスキップ（ランダム自動選択、UI 表示なし）

---

## 2. ドリフトシステム

### 2.1 入力の追加

`hooks.ts` の `useInput` にハンドブレーキキーを追加:

| キー | 対象 | 用途 |
|------|------|------|
| `Space` | P1（CPU 対戦時） / 共通 | ハンドブレーキ |
| `ShiftLeft` | P1（2P 対戦時） | P1 ハンドブレーキ |
| `ShiftRight` / `Enter` | P2（2P 対戦時） | P2 ハンドブレーキ |

### 2.2 発動条件

| 条件 | 値 | 備考 |
|------|-----|------|
| 入力 | ハンドブレーキキー押下中 | `keys.current` で判定 |
| 最低速度 | `speed >= 0.4`（Player.speed スケール 0〜1） | — |
| ステアリング | 左右入力あり（ニュートラルではドリフト非発動） | — |

### 2.3 物理挙動

ドリフト中の挙動は以下の3段階で制御する:

#### フェーズA: ドリフト開始（0〜0.3秒）

```
角速度倍率 = DRIFT.ANGLE_MULTIPLIER (1.8)
  → Config.game.turnRate (0.065) × 1.8 = 0.117 実効旋回速度
速度維持率 = DRIFT.SPEED_RETAIN (0.92)
```

- ステアリング入力の角速度を `1.8倍` に増幅
- 速度は毎フレーム `× 0.92` で緩やかに減衰

#### フェーズB: ドリフト維持（0.3秒〜）

```
スリップ角 = 実際の進行方向 − 車体の向き（Utils.normalizeAngle で正規化）
スリップ率 = Utils.clamp(|スリップ角| / DRIFT.MAX_SLIP_ANGLE, 0, 1)
横力 = スリップ率 × DRIFT.LATERAL_FORCE (0.15)
```

- スリップ角に応じた横力が発生
- 車体は進行方向と異なる向きを維持（ドリフト感）

#### フェーズC: ドリフト終了（ハンドブレーキ離し）

```
ブースト = DRIFT.BOOST_BASE + (ドリフト継続時間 × DRIFT.BOOST_PER_SEC)
ブースト上限 = DRIFT.BOOST_MAX (0.3)
ブースト適用時間 = DRIFT.BOOST_DURATION (0.5秒)
```

- ドリフト時間に比例したブーストを付与
- ブーストは `0.5秒` かけて線形に減衰

### 2.4 ドリフト中の制約

- 壁との接触（`Track.getInfo().onTrack === false`）: ドリフト即終了、ブーストなし
- 他車との衝突（`Logic.handleCollision()` 発動時）: ドリフト即終了、ブーストなし
- 速度低下: `speed < 0.2` でドリフト自動終了

### 2.5 データ構造

```typescript
interface DriftState {
  active: boolean;        // ドリフト中かどうか
  duration: number;       // 継続時間（秒）
  slipAngle: number;      // 現在のスリップ角（ラジアン）
  boostRemaining: number; // ブースト残り時間（秒）
  boostPower: number;     // 現在のブースト力
}
```

### 2.6 定数パラメータ

```typescript
const DRIFT = {
  MIN_SPEED: 0.4,
  ANGLE_MULTIPLIER: 1.8,
  SPEED_RETAIN: 0.92,
  MAX_SLIP_ANGLE: Math.PI / 4,  // 45度
  LATERAL_FORCE: 0.15,
  BOOST_BASE: 0.05,
  BOOST_PER_SEC: 0.1,
  BOOST_MAX: 0.3,
  BOOST_DURATION: 0.5,
} as const;
```

### 2.7 視覚エフェクト

- **タイヤスモーク**: ドリフト中、後輪位置からグレーのパーティクルを放出
  - `Entity.particle()` パターンを踏襲して `Entity.driftSmoke()` を追加
  - 放出頻度: 毎フレーム 2〜3 個
  - パーティクル寿命: 0.3〜0.5 秒
  - 色: `rgba(180, 180, 180, 0.6)` → フェードアウト
  - パーティクル上限: `Config.game.maxParticles` (200) 内で管理
- **タイヤ痕**: ドリフト軌跡を半透明の黒線で描画（フレームごとに減衰）

### 2.8 サウンド

`SoundEngine` に以下のメソッドを追加:

- `driftStart()`: タイヤスキール音（高周波ノイズ 0.3秒）
- `driftLoop(active)`: 持続的なタイヤ音（`updateEngine()` パターンを参考に OscillatorNode で実装）
- `driftBoost()`: 短い加速音（周波数上昇 0.2秒）

---

## 3. HEAT（ニアミスボーナス）システム

### 3.1 概要

壁や対戦車に接近して走行することでHEATゲージが蓄積され、MAX になるとブーストが発動する。リスクとリワードのバランスを提供するシステム。

### 3.2 ニアミス判定

#### 壁ニアミス

```
壁距離 = Track.getInfo(player.x, player.y, points).dist
ニアミス判定 = 壁距離 > Config.game.trackWidth (55) - HEAT.WALL_THRESHOLD (25)
             && Track.getInfo().onTrack === true  // トラック上にいること
```

#### 対戦車ニアミス

```
車間距離 = Utils.dist(p1.x, p1.y, p2.x, p2.y)
ニアミス判定 = 車間距離 < HEAT.CAR_THRESHOLD (40)
             && 車間距離 > Config.game.collisionDist (25)  // 衝突判定未満
```

### 3.3 ゲージ計算式

```
蓄積量 = (1 - 距離 / しきい値) × HEAT.GAIN_RATE × deltaTime
自然減衰 = HEAT.DECAY_RATE × deltaTime
ゲージ値 = Utils.clamp(前フレーム値 + 蓄積量 - 自然減衰, 0, 1)
```

- ゲージ範囲: `0.0`（空） 〜 `1.0`（MAX）
- 距離が近いほど蓄積量が大きい（距離反比例）

### 3.4 ブースト発動

| 項目 | 値 |
|------|-----|
| 発動条件 | ゲージ = 1.0 |
| ブースト力 | HEAT.BOOST_POWER (0.25) |
| ブースト時間 | HEAT.BOOST_DURATION (0.8秒) |
| 発動後ゲージ | 0.0 にリセット |
| クールダウン | HEAT.COOLDOWN (1.0秒) — 発動後この時間ゲージ蓄積なし |

### 3.5 データ構造

```typescript
interface HeatState {
  gauge: number;          // 現在のゲージ値 (0〜1)
  boostRemaining: number; // ブースト残り時間（秒）
  boostPower: number;     // 現在のブースト力
  cooldown: number;       // クールダウン残り時間（秒）
}
```

### 3.6 定数パラメータ

```typescript
const HEAT = {
  WALL_THRESHOLD: 25,
  CAR_THRESHOLD: 40,
  GAIN_RATE: 0.8,
  DECAY_RATE: 0.15,
  BOOST_POWER: 0.25,
  BOOST_DURATION: 0.8,
  COOLDOWN: 1.0,
} as const;
```

### 3.7 ゲージ UI

- 画面下部、各プレイヤーの名前の近くに横バー表示
- バーサイズ: 幅 80px × 高さ 8px
- 色遷移: 青 (0〜0.3) → 黄 (0.3〜0.7) → 赤 (0.7〜1.0)
- MAX 到達時: バーが白点滅 → ブースト発動エフェクト
- `Render.rect()` を活用した描画

### 3.8 サウンド

`SoundEngine` に以下のメソッドを追加:

- `heatCharge()`: 低いハム音（ゲージ量に比例して音量上昇）
- `heatMax()`: チャージ完了音（高周波チャイム）
- `heatBoost()`: 加速音（ピッチ違いのブースト音）

---

## 4. 壁ヒットペナルティ改善

### 4.1 現行の挙動（`game-logic.ts` の `movePlayer`）

```
壁に接触 (onTrack === false) → speed = 0（完全停止） → wallStuck++
wallStuck >= Config.game.wallWarpThreshold (10) → トラック中央にワープ
速度回復: Config.game.speedRecovery (0.02) ずつ回復
```

**問題点**: 完全停止がストレスフル。壁に引っかかると操作不能感が生じる。

### 4.2 新しい挙動: スライドベクトル方式

#### 壁接触時の処理フロー

```
1. Track.getInfo() で最近接セグメントと方向 dir を取得
2. セグメント方向から壁法線ベクトル N を計算（track.ts に getNormal() 追加）
3. 現在の速度ベクトル V = (cos(angle) × speed, sin(angle) × speed)
4. スライドベクトル S = V - (V・N) × N  // 法線成分を除去
5. 速度スカラーに減速率を適用
6. プレイヤーをスライドベクトル方向に移動
```

#### 段階的減速

| 接触段階 | 条件 | 減速率 |
|---------|------|--------|
| 軽接触 | wallStuck = 1 | × 0.85 |
| 中接触 | wallStuck = 2〜3 | × 0.70 |
| 強接触 | wallStuck >= 4 | × 0.50 |

#### ワープしきい値の調整

```
現行: wallWarpThreshold = 10
新規: wallWarpThreshold = 15（スライドで脱出しやすくなるため猶予を増やす）
```

### 4.3 壁接触エフェクト

- **火花**: 現行の `Entity.spark()` を流用（色を壁側の色に変更）
- **画面シェイク**: 接触段階に応じて振幅を調整（既存のシェイク処理を拡張）
  - 軽接触: 振幅 1px
  - 中接触: 振幅 2px
  - 強接触: 振幅 4px

### 4.4 壁接触サウンド

- 現行の `SoundEngine.wall()` を維持
- 接触段階に応じて音量を変更（軽→小、強→大）

---

## 5. コース個性化

### 5.1 環境効果定義

各コースの既存 `deco` プロパティに対応する固有の環境効果を定義する。

| コース | deco | 環境効果 | 物理影響 |
|--------|------|---------|---------|
| Forest | `'forest'` | 落ち葉（低グリップ区間） | 摩擦係数 × 0.85、特定セグメントのみ |
| City | `'city'` | 雨天（全体的に滑りやすい） | 摩擦係数 × 0.90、ドリフト角度 +10% |
| Mountain | `'mountain'` | 標高差（上り減速/下り加速） | セグメント傾斜に応じて速度 ±5% |
| Beach | `'beach'` | 砂地（コーナー外側で減速） | トラック外縁20%で摩擦係数 × 0.70 |
| Night | `'night'` | 視界制限（前方のみ明るい） | 描画時にビネットエフェクト適用 |
| Snow | `'snow'` | 氷面（全体的に低グリップ） | 摩擦係数 × 0.75、ドリフト角度 +20% |

### 5.2 データ構造

```typescript
interface CourseEffect {
  name: string;
  frictionMultiplier: number;      // 摩擦係数倍率（1.0 = 変化なし）
  driftAngleBonus: number;         // ドリフト角度ボーナス（ラジアン）
  speedModifier: number;           // 速度修正（加減算、0 = 変化なし）
  visualEffect: 'none' | 'rain' | 'leaves' | 'snow' | 'vignette';
  segmentBased: boolean;           // セグメントごとに効果が異なるか
}
```

### 5.3 効果適用タイミング

- 毎フレームの `Logic.movePlayer()` 呼び出し前に環境効果を計算
- `applyEffect(player, courseEffect, segment)` で物理パラメータを一時修正
  - `segment` は `Track.getInfo().seg` から取得
- フレーム終了時にパラメータを元に戻す（副作用なし）

### 5.4 視覚エフェクト

| エフェクト | 描画方法 | 参考実装 |
|-----------|---------|---------|
| 落ち葉 | 小さな楕円パーティクル（茶/オレンジ）がゆっくり流れる | `Render.ellipse()` 活用 |
| 雨 | 斜めの白線パーティクルが画面上部から降下 | `Render.rect()` で細長い矩形 |
| 雪（既存拡張） | 白丸パーティクルの降下速度・密度を増加 | `Render.circle()` 活用 |
| ビネット | Canvas のラジアルグラデーションで画面端を暗く | Canvas API 直接使用 |

---

## 6. ドラフトカードシステム

### 6.1 概要

各ラップ完了時に3枚のカードから1枚を選択し、次のラップに効果を適用する。カードの組み合わせにより毎回異なるレース展開が生まれるローグライト的メカニクス。

### 6.2 カード一覧（15枚）

#### スピード系（5枚）

| ID | 名前 | レアリティ | 効果 |
|----|------|----------|------|
| `SPD_01` | ニトロブースト | R | 最高速度 +15%（1ラップ） |
| `SPD_02` | ターボチャージ | SR | 加速力 +25%（1ラップ） |
| `SPD_03` | スリップストリーム | R | 相手の後方で速度 +10%（`Utils.dist()` < 80px） |
| `SPD_04` | ロケットスタート | SR | ラップ開始直後3秒間、速度 +30% |
| `SPD_05` | オーバードライブ | SSR | 最高速度 +10%、加速力 +10%、ドリフトブースト +20% |

#### ハンドリング系（4枚）

| ID | 名前 | レアリティ | 効果 |
|----|------|----------|------|
| `HDL_01` | グリップタイヤ | R | 旋回速度 +20%（`turnRate` × 1.2） |
| `HDL_02` | ドリフトマスター | SR | ドリフトブースト +50%、ドリフト最低速度条件 -20% |
| `HDL_03` | エアロパーツ | R | コーナリング中の減速 -30% |
| `HDL_04` | フルチューン | SSR | 旋回速度 +15%、ドリフトブースト +30%、壁減速 -20% |

#### 防御系（3枚）

| ID | 名前 | レアリティ | 効果 |
|----|------|----------|------|
| `DEF_01` | バンパーガード | R | 壁ヒット減速を50%軽減 |
| `DEF_02` | シールド | SR | 次の1回の衝突（壁/車）を完全無効化 |
| `DEF_03` | リカバリーブースト | R | 壁ヒット後に小ブースト（0.15、0.3秒） |

#### 特殊系（3枚）

| ID | 名前 | レアリティ | 効果 |
|----|------|----------|------|
| `SPC_01` | HEAT チャージャー | SR | HEAT 蓄積速度 ×2（`HEAT.GAIN_RATE` 倍率） |
| `SPC_02` | ゴーストビジョン | R | ゴーストの走行ラインを可視化（最適ライン参考） |
| `SPC_03` | ワイルドカード | SSR | ランダムに2枚のカード効果を同時発動 |

### 6.3 レアリティとドロー確率

| レアリティ | 枚数 | ドロー確率 |
|-----------|------|-----------|
| R（レア） | 8枚 | 60% |
| SR（スーパーレア） | 5枚 | 30% |
| SSR（ウルトラレア） | 2枚 | 10% |

### 6.4 デッキ管理

```
1. レース開始時: 全15枚からデッキを生成（シャッフル）
2. 各ラップ終了時: デッキから確率に基づいて3枚ドロー
3. プレイヤーが1枚選択 → 選択したカードは除外
4. 残り2枚はデッキに戻す
5. デッキが3枚未満になったら全15枚で再生成
```

### 6.5 効果適用

- カード効果は選択した次のラップ開始時に適用
- 効果は1ラップ持続（そのラップ終了時に自動解除）
- 複数ラップで同系統カードを選んだ場合: **加算**（乗算ではない）
  - 例: ニトロブースト(+15%) + ターボチャージ(+25%) = 最高速度+15%、加速力+25%
- SSR カードの効果も1ラップ限定

### 6.6 カードデータ構造

```typescript
interface Card {
  id: string;               // カードID（例: 'SPD_01'）
  name: string;             // カード名
  category: 'speed' | 'handling' | 'defense' | 'special';
  rarity: 'R' | 'SR' | 'SSR';
  description: string;      // 効果説明文
  effect: CardEffect;       // 効果パラメータ
  icon: string;             // アイコン識別子
}

interface CardEffect {
  speedMultiplier?: number;       // 最高速度倍率（例: 1.15 = +15%）
  accelMultiplier?: number;       // 加速力倍率
  turnMultiplier?: number;        // 旋回速度倍率
  driftBoostMultiplier?: number;  // ドリフトブースト倍率
  wallDamageMultiplier?: number;  // 壁ダメージ倍率（< 1 で軽減）
  heatGainMultiplier?: number;    // HEAT蓄積速度倍率
  shieldCount?: number;           // シールド回数
  specialType?: string;           // 特殊効果タイプ
  duration?: number;              // 効果時間（秒、ラップ全体ではない場合）
}

interface DeckState {
  pool: Card[];          // 残りデッキ
  hand: Card[];          // 現在の手札（3枚）
  active: CardEffect[];  // 現在適用中の効果
  history: Card[];       // 選択済みカード履歴
}
```

### 6.7 カード選択 UI（DraftCardUI コンポーネント）

#### レイアウト

```
┌─────────────────────────────────────────┐
│           ラップ N 完了!                 │
│         カードを1枚選んでください         │
│         残り時間: 12秒                   │
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ [icon]  │ │ [icon]  │ │ [icon]  │  │
│  │         │ │         │ │         │  │
│  │ カード名 │ │ カード名 │ │ カード名 │  │
│  │ ──────  │ │ ──────  │ │ ──────  │  │
│  │ 効果説明 │ │ 効果説明 │ │ 効果説明 │  │
│  │         │ │         │ │         │  │
│  │  [R]    │ │  [SR]   │ │  [R]    │  │
│  └─────────┘ └─────────┘ └─────────┘  │
│                                         │
│    ← →キーで選択    Enter/Spaceで決定    │
└─────────────────────────────────────────┘
```

Canvas サイズ: `Config.canvas.width` (900) × `Config.canvas.height` (700) 内にオーバーレイ描画

#### 操作方法

| モード | 操作 |
|--------|------|
| 1P / CPU対戦 | ←→ でカード選択、Enter/Space で決定 |
| 2P 対戦（P1） | A/D でカード選択、W で決定 |
| 2P 対戦（P2） | ←→ でカード選択、Enter で決定 |

#### アニメーション

- カード登場: 下からスライドイン（0.3秒、イージング）
- ホバー: 選択中のカードが上に浮き上がり（+8px）、光彩エフェクト
- 選択確定: 選択カードが拡大 → フラッシュ → 吸収エフェクト
- 未選択カード: フェードアウト

---

## 7. ゴーストシステム

### 7.1 概要

プレイヤーの走行データを記録し、過去のベスト走行を半透明の車体として再生する。自己ベストとの比較や、上達の実感を提供する。

### 7.2 記録仕様

#### 記録データ（フレーム単位）

```typescript
interface GhostFrame {
  x: number;      // X座標
  y: number;      // Y座標
  angle: number;  // 車体角度（ラジアン）
  speed: number;  // 速度（Player.speed）
  lap: number;    // 現在のラップ数（Player.lap）
  t: number;      // レース開始からの経過時間（ms）
}
```

#### 記録頻度

- **3フレームに1回**記録（60fps 想定で実質 20fps）
  - データ量を 1/3 に削減
  - 再生時はフレーム間線形補間で滑らかに

#### 記録タイミング

- `state === 'race'` の間のみ記録（`'draft'` 状態中は記録停止）
- `'countdown'` 終了時にタイムスタンプ `t = 0` で記録開始

### 7.3 再生仕様

#### 再生ロジック

```
1. 現在の経過時間 t からゴーストフレームを二分探索で検索
2. t が2フレーム間にある場合、線形補間で位置・角度を計算
3. 補間された位置に半透明ゴースト車体を描画
```

#### 補間計算

```typescript
// f1, f2: 隣接するゴーストフレーム
// t: 現在時刻
const ratio = (t - f1.t) / (f2.t - f1.t);
const ghostX = f1.x + (f2.x - f1.x) * ratio;
const ghostY = f1.y + (f2.y - f1.y) * ratio;
const ghostAngle = Utils.normalizeAngle(f1.angle + Utils.normalizeAngle(f2.angle - f1.angle) * ratio);
```

### 7.4 保存仕様

#### localStorage キー設計

```
ghost_{courseIndex}_{mode} = JSON.stringify(GhostData)
```

- 例: `ghost_0_cpu` = Forest コースの CPU 対戦ベスト
- 既存の `bests` 保存パターン（`RacingGame.tsx`）を踏襲

#### 保存データ

```typescript
interface GhostData {
  frames: GhostFrame[];
  totalTime: number;     // 総レース時間（ms）
  course: number;        // コースインデックス (0-5)
  laps: number;          // 周回数
  date: string;          // 記録日時（ISO 8601）
  playerName: string;    // プレイヤー名（Player.name）
}
```

#### 保存ルール

- レース完了時（`state: 'race' → 'result'`）に、既存のベストタイムと比較
- ベストタイムを更新した場合のみ保存（上書き）
- コース × モードごとに1件のみ保存（容量制限）

#### データサイズ見積もり

```
1フレーム ≒ 40バイト（JSON）
5周 × 60秒/周 × 20fps = 6,000フレーム
1レース ≒ 240KB
6コース × 2モード = 12件 → 最大 約2.9MB
```

### 7.5 描画仕様

- 既存の `Render.kart()` を流用
- 透明度: `ctx.globalAlpha = 0.3`
- 色: プレイヤーカラーの彩度を50%に下げた色
- ゴースト車体にはネームタグ "GHOST" を表示
- ゴースト車体は `Logic.handleCollision()` の対象外

### 7.6 GhostToggle UI

- メニュー画面（`state === 'menu'`）に ON/OFF トグルを配置
- デフォルト: OFF
- ゴーストデータがない場合: トグル無効（グレーアウト）
- `VolumeCtrl` コンポーネントと同じスタイルパターンを踏襲

---

## 8. ハイライトシステム

### 8.1 概要

レース中の名場面を自動検出し、通知バナーとして表示する。レース終了後のリザルト画面（`state === 'result'`）でハイライトサマリーを表示し、SNS シェアの素材とする。

### 8.2 イベント定義（6種）

#### 8.2.1 ドリフトボーナス

```
検出条件: DriftState.duration >= 1.5秒 かつ ドリフト終了時
スコア: floor(DriftState.duration × 100)
通知テキスト: "ドリフトボーナス! +{score}pt"
```

#### 8.2.2 HEAT ブースト

```
検出条件: HeatState.gauge が 1.0 に到達（ブースト発動時）
スコア: 150（固定）
通知テキスト: "HEAT BOOST! +150pt"
```

#### 8.2.3 ニアミス回避

```
検出条件: Track.getInfo().dist > trackWidth - 10 の状態で0.5秒以上走行（壁接触なし）
スコア: floor(ニアミス時間 × 200)
通知テキスト: "ニアミス回避! +{score}pt"
```

#### 8.2.4 逆転

```
検出条件: Player.progress による順位が2位→1位に変化した瞬間
スコア: 300（固定）
通知テキスト: "逆転! +300pt"
```

#### 8.2.5 ファステストラップ

```
検出条件: 直前のラップタイム（Player.lapTimes の最新）がそのレース中の最速ラップを更新
スコア: 200（固定）
通知テキスト: "ファステストラップ! +200pt"
```

#### 8.2.6 フォトフィニッシュ

```
検出条件: ゴール時、1位と2位のタイム差 < 0.5秒
スコア: 500（固定）
通知テキスト: "フォトフィニッシュ! +500pt"
```

### 8.3 データ構造

```typescript
type HighlightType =
  | 'drift_bonus'
  | 'heat_boost'
  | 'near_miss'
  | 'overtake'
  | 'fastest_lap'
  | 'photo_finish';

interface HighlightEvent {
  type: HighlightType;
  player: number;     // プレイヤーインデックス（0 or 1）
  lap: number;        // 発生ラップ（Player.lap）
  time: number;       // レース開始からの経過時間（ms）
  score: number;      // 獲得スコア
  message: string;    // 通知テキスト
}
```

### 8.4 通知 UI

- Canvas 上部中央（`Config.canvas.width / 2`）に通知バナーを描画
- 表示時間: 2秒（0.3秒フェードイン + 1.4秒表示 + 0.3秒フェードアウト）
- 複数イベント同時発生時: キュー管理（先入先出、最大3つまで）
- 色: イベント種別ごとに異なる背景色

| イベント | 背景色 |
|---------|--------|
| ドリフトボーナス | オレンジ `#FF8C00` |
| HEAT ブースト | 赤 `#FF2020` |
| ニアミス回避 | 黄 `#FFD700` |
| 逆転 | 紫 `#9B59B6` |
| ファステストラップ | 緑 `#2ECC71` |
| フォトフィニッシュ | 白 `#FFFFFF` |

### 8.5 リザルト画面表示

レース終了後の `state === 'result'` 画面に、ハイライトサマリーセクションを追加:

```
┌──────────────────────────────────┐
│          レース結果               │
│   1位: Player 1  1:23.45        │
│   2位: Player 2  1:25.67        │
│                                  │
│       ─── ハイライト ───          │
│   ドリフトボーナス × 3  +850pt   │
│   HEAT ブースト × 2     +300pt   │
│   逆転 × 1              +300pt   │
│   ファステストラップ × 1 +200pt   │
│                                  │
│   合計ハイライトスコア: 1,650pt   │
└──────────────────────────────────┘
```

既存の `Render.fireworks()` / コンフェッティ描画と共存する形で表示。

---

## 9. 型定義一覧

以下は `types.ts` に追加する型定義の一覧です。

```typescript
// === ゲーム状態拡張 ===

type GamePhase = 'menu' | 'countdown' | 'race' | 'draft' | 'result';

// === ドリフトシステム ===

interface DriftState {
  active: boolean;
  duration: number;
  slipAngle: number;
  boostRemaining: number;
  boostPower: number;
}

// === HEAT システム ===

interface HeatState {
  gauge: number;
  boostRemaining: number;
  boostPower: number;
  cooldown: number;
}

// === コース環境効果 ===

interface CourseEffect {
  name: string;
  frictionMultiplier: number;
  driftAngleBonus: number;
  speedModifier: number;
  visualEffect: 'none' | 'rain' | 'leaves' | 'snow' | 'vignette';
  segmentBased: boolean;
}

// === ドラフトカード ===

type CardCategory = 'speed' | 'handling' | 'defense' | 'special';
type CardRarity = 'R' | 'SR' | 'SSR';

interface CardEffect {
  speedMultiplier?: number;
  accelMultiplier?: number;
  turnMultiplier?: number;
  driftBoostMultiplier?: number;
  wallDamageMultiplier?: number;
  heatGainMultiplier?: number;
  shieldCount?: number;
  specialType?: string;
  duration?: number;
}

interface Card {
  id: string;
  name: string;
  category: CardCategory;
  rarity: CardRarity;
  description: string;
  effect: CardEffect;
  icon: string;
}

interface DeckState {
  pool: Card[];
  hand: Card[];
  active: CardEffect[];
  history: Card[];
}

// === ゴースト ===

interface GhostFrame {
  x: number;
  y: number;
  angle: number;
  speed: number;
  lap: number;
  t: number;
}

interface GhostData {
  frames: GhostFrame[];
  totalTime: number;
  course: number;
  laps: number;
  date: string;
  playerName: string;
}

// === ハイライト ===

type HighlightType =
  | 'drift_bonus'
  | 'heat_boost'
  | 'near_miss'
  | 'overtake'
  | 'fastest_lap'
  | 'photo_finish';

interface HighlightEvent {
  type: HighlightType;
  player: number;
  lap: number;
  time: number;
  score: number;
  message: string;
}

// === Player 型拡張 ===
// 既存の Player interface に以下のフィールドを追加:
//   drift: DriftState;
//   heat: HeatState;
//   activeCards: CardEffect[];
//   shieldCount: number;
```
