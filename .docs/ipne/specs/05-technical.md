# IPNE 技術仕様

## アーキテクチャ概要

### 技術スタック

- React + TypeScript + styled-components
- Canvas ベースの描画
- フロントエンド完結（サーバーサイド不要）

### コーディング規約

- `any` 不使用
- `null` 不使用
- `as const` と Union 型で定数管理
- コメント・docstringは日本語

---

## ディレクトリ構成

```
src/
├── pages/
│   ├── IpnePage.tsx           # メインページコンポーネント
│   ├── IpnePage.styles.ts     # スタイル定義
│   └── IpnePage.test.tsx      # UIテスト
├── features/
│   └── ipne/
│       ├── index.ts           # エクスポート
│       ├── types.ts           # 型定義
│       ├── mazeGenerator.ts   # 迷路生成（BSP）
│       ├── pathfinder.ts      # 経路探索・距離計算
│       ├── autoMapping.ts     # 自動マッピング
│       ├── viewport.ts        # ビューポート/カメラ計算
│       ├── movement.ts        # 連続移動機能
│       ├── player.ts          # プレイヤーロジック
│       ├── enemy.ts           # 敵生成・管理
│       ├── enemySpawner.ts    # 敵配置ロジック
│       ├── enemyAI.ts         # 敵AIロジック
│       ├── combat.ts          # 戦闘・ダメージ処理
│       ├── item.ts            # アイテム生成・効果
│       ├── collision.ts       # 衝突判定
│       ├── trap.ts            # 罠システム
│       ├── wall.ts            # 壁ギミック
│       ├── progression.ts     # 成長システム
│       ├── class.ts           # 職業システム
│       ├── timer.ts           # タイマーシステム
│       ├── record.ts          # 記録管理
│       ├── tutorial.ts        # チュートリアル
│       ├── feedback.ts        # フィードバック
│       ├── ending.ts          # エンディング分岐
│       ├── debug.ts           # デバッグモード
│       └── audio/             # 音声システム
│           ├── index.ts           # エクスポート
│           ├── audioContext.ts    # AudioContext管理
│           ├── soundEffect.ts     # 効果音生成・再生
│           ├── bgm.ts             # BGM生成・再生
│           └── audioSettings.ts   # 設定管理
```

---

## 迷路生成

### アルゴリズム: BSP（Binary Space Partitioning）

BSPアルゴリズムを使用して、部屋と通路で構成された迷路を生成する。

### 生成パラメータ

| パラメータ | 値 |
|-----------|-----|
| グリッドサイズ | 80x80タイル |
| 部屋数 | 8〜32程度（maxDepth=5） |
| 部屋サイズ | 6x6〜10x10程度 |
| 通路幅 | 3〜4タイル |
| ループ | 2箇所 |

### 生成要件

- 必ずスタートからゴールまで到達可能
- 袋小路は許容（適度な迷い）
- 完全な一本道はNG（探索感がない）
- 広すぎる空間はNG（ダレる）

### スタート/ゴール配置

| 配置 | ルール |
|------|--------|
| スタート | 迷路の外周付近の部屋内 |
| ゴール | スタートから最遠地点（BFSによる経路長） |
| ボス | ゴールと同じ部屋 |

### 生成安定化

| 項目 | 条件 |
|------|------|
| スタート周辺 | 半径3タイル以内にボス・チャージ・ダメージ罠なし |
| 再生成上限 | 最大5回 |
| 検証対象 | 敵配置、罠配置 |

---

## ビューポート・カメラシステム

### 基本方針

**メイン画面では迷路全体を表示しない。プレイヤー周辺のみを表示する。**

### ビューポート設定

| 項目 | 値 |
|------|-----|
| 表示タイル数（横） | 15タイル |
| 表示タイル数（縦） | 11タイル |
| タイルサイズ | 48px（固定） |
| Canvas解像度 | 720x528px |

### カメラ動作

| 動作 | 説明 |
|------|------|
| 追従 | プレイヤーを画面中央に配置 |
| クランプ | マップ端ではビューポートが画面外を表示しない |
| スクロール | プレイヤー移動に追従してスムーズにスクロール |

---

## 敵AIシステム

### 状態遷移

```typescript
type EnemyState = 'idle' | 'patrol' | 'chase' | 'attack' | 'flee' | 'return' | 'knockback';
```

### 状態の説明

| 状態 | 説明 |
|------|------|
| idle | 待機状態 |
| patrol | 巡回状態（設定されたパスを移動） |
| chase | 追跡状態（プレイヤーを追いかける） |
| attack | 攻撃状態 |
| flee | 逃走状態（プレイヤーから離れる） |
| return | 帰還状態（初期位置に戻る） |
| knockback | ノックバック状態 |

### 敵タイプ別AI

#### パトロール型

1. 設定されたパスを巡回
2. 視認範囲内にプレイヤーを発見 → chase
3. 追跡距離を超える or 3秒間見失う → return
4. 初期位置に到達 → patrol

#### チャージ型

1. 視認範囲内にプレイヤーを発見 → chase
2. 一直線に高速接近
3. 追跡距離を超える → return

#### レンジド型

1. 視認範囲内にプレイヤーを発見
2. 理想距離（3〜4タイル）を維持
3. プレイヤーが近づいたら後退
4. 攻撃範囲内で遠距離攻撃

#### スペシメン型

1. 視認範囲内にプレイヤーを発見 → flee
2. プレイヤーから離れる方向に高速移動

---

## 衝突判定

### タイルベース判定

| 判定 | 説明 |
|------|------|
| 壁判定 | 移動先タイルが壁かどうか |
| 敵判定 | 移動先タイルに敵がいるかどうか |
| 罠判定 | 移動先タイルに罠があるかどうか |
| アイテム判定 | 移動先タイルにアイテムがあるかどうか |

### 接触判定

| 判定 | 処理 |
|------|------|
| 敵との接触 | ダメージ発生、無敵時間開始 |
| アイテムとの接触 | アイテム取得、効果発動 |
| 罠との接触 | 罠発動、効果適用 |
| ゴールとの接触 | クリア判定 |

---

## 経路探索

### アルゴリズム: BFS（幅優先探索）

- 最短経路の計算に使用
- スタートからゴールまでの距離計算
- 敵のプレイヤー追跡経路計算

### 用途

| 用途 | 説明 |
|------|------|
| ゴール配置 | スタートから最遠地点の計算 |
| 敵追跡 | プレイヤーへの経路計算 |
| デバッグ | 最短経路表示 |

---

## データ永続化

### localStorage キー

| キー | 内容 |
|------|------|
| `ipne_best_warrior` | 戦士ベスト記録 |
| `ipne_best_thief` | 盗賊ベスト記録 |
| `ipne_best_overall` | 総合ベスト記録 |
| `ipne_tutorial_completed` | チュートリアル完了フラグ |
| `ipne_audio_settings` | 音声設定（JSON） |

### 記録データ構造

```typescript
interface GameRecord {
  time: number;            // クリアタイム（ミリ秒）
  level: number;           // 到達レベル
  killCount: number;       // 撃破数
  playerClass: PlayerClassValue;  // 職業
  rating: RatingValue;     // 評価（S/A/B/C/D）
  timestamp: number;       // 記録日時
}
```

---

## 型定義例

### Direction

```typescript
const Direction = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
} as const;

type DirectionValue = (typeof Direction)[keyof typeof Direction];
```

### TileType

```typescript
const TileType = {
  FLOOR: 'floor',
  WALL: 'wall',
  START: 'start',
  GOAL: 'goal',
} as const;

type TileTypeValue = (typeof TileType)[keyof typeof TileType];
```

### GameState

```typescript
const GameState = {
  TITLE: 'title',
  CLASS_SELECT: 'classSelect',
  PROLOGUE: 'prologue',
  TUTORIAL: 'tutorial',
  GAME: 'game',
  LEVEL_UP: 'levelUp',
  CLEAR: 'clear',
  GAME_OVER: 'gameOver',
} as const;

type GameStateValue = (typeof GameState)[keyof typeof GameState];
```

---

## 音声システム

### 技術基盤

Web Audio APIを使用した8bit風レトロサウンド生成。

| 項目 | 内容 |
|------|------|
| API | Web Audio API |
| Safari対応 | webkitAudioContext |
| 波形タイプ | sine, square, sawtooth, triangle |
| 音量制御 | GainNode |

### iOS/モバイル対応

ブラウザの自動再生ポリシーに対応。

| 項目 | 内容 |
|------|------|
| 初期状態 | AudioContext suspended |
| 有効化 | ユーザー操作時に `audioContext.resume()` |
| UI | 音声未有効時は「タップしてゲームを開始」表示、有効後に「ゲームを開始」ボタン表示 |

### 効果音一覧

| 効果音 | 波形 | 周波数 | 長さ | 音量(gain) |
|--------|------|--------|------|------------|
| プレイヤーダメージ | sawtooth | 200→80Hz | 0.2s | 0.5 |
| 敵撃破 | square | 400→800Hz | 0.15s | 0.45 |
| ボス撃破 | square | メロディ C→E→G→C6 | 0.5s | 0.5 |
| ゲームクリア | square | メロディ | 2s | 0.5 |
| ゲームオーバー | sawtooth | メロディ | 3s | 0.45 |
| レベルアップ | sine | メロディ | 1s | 0.5 |
| 攻撃命中 | square | 600Hz | 0.08s | 0.4 |
| アイテム取得 | sine | 800→1200Hz | 0.1s | 0.35 |
| 回復 | sine | 600→900Hz | 0.15s | 0.35 |
| 罠発動 | sawtooth | 150→300Hz | 0.15s | 0.45 |

### BGM一覧

| BGM | 波形 | テンポ | ループ | 用途 |
|-----|------|--------|--------|------|
| タイトル | sine | 遅め | ○ | タイトル画面 |
| ゲーム | triangle | 速め | ○ | ゲームプレイ中 |
| クリア | square | 速め | × | クリア画面 |
| ゲームオーバー | sawtooth | 遅め | × | ゲームオーバー画面 |

### 音量設定

```typescript
interface AudioSettings {
  masterVolume: number;  // 0.0〜1.0
  seVolume: number;      // 0.0〜1.0
  bgmVolume: number;     // 0.0〜1.0
  isMuted: boolean;
}
```

実効音量 = masterVolume × (seVolume or bgmVolume) × (isMuted ? 0 : 1)

### 効果音トリガーポイント

| イベント | 効果音 |
|---------|--------|
| 敵接触・被弾 | プレイヤーダメージ |
| 通常敵撃破 | 敵撃破 |
| ボス撃破 | ボス撃破 |
| 攻撃命中 | 攻撃命中 |
| アイテム取得 | アイテム取得 |
| 回復アイテム | 回復 |
| レベルアップ | レベルアップ |
| 罠発動 | 罠発動 |
| ゲームクリア | ゲームクリア |
| ゲームオーバー | ゲームオーバー |

---

## テスト方針

### 単体テスト対象

- 迷路生成
- 経路探索
- 衝突判定
- 敵AI
- 成長システム
- タイマー
- 記録管理
- 音声設定
- 効果音（モック使用）
- BGM（モック使用）

### UI統合テスト対象

- ページ描画
- 画面遷移
- ユーザー操作

### テスト要件

- TDD（テスト駆動開発）を推奨
- 純粋ロジックは `src/features/ipne/` に分離してテスト可能に
- `npm test` で全テストがパスすること
