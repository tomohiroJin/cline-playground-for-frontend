# Air Hockey ブラッシュアップ仕様書

## Phase 1: 基盤改善＋ゲームフィール強化

### 1.0 レスポンシブデザイン対応

**概要**: Canvas サイズを画面に自動フィットさせ、Size 選択 UI を廃止する。デバイスを問わず快適なプレイ体験を提供する。

**現状の問題**:
- Canvas サイズが固定値（300x600 / 450x900）の2択で手動選択
- スマートフォンでは小さすぎ、大画面デスクトップでは余白が多い
- スコアボードの `max-width: 300px` が Canvas 幅と連動していない
- `CanvasSize` 型と `SIZE_CONFIGS` が複数ファイルに伝搬し、コードが冗長

**設計方針**:
- **Canvas 内部解像度は固定**（450x900）で統一。物理演算・座標系を安定させる
- **CSS で画面サイズに応答的にスケーリング**。`aspect-ratio` + `max-height` + `width: 100%` で親コンテナに自動フィット
- **Size 選択 UI を完全廃止**。`CanvasSize` 型・`SIZE_CONFIGS`・`SIZE_OPTIONS`・`getConstants()` の size 引数を削除
- 入力座標変換は既存の `rect.width / rect.height` 比率計算をそのまま利用（CSS スケーリングに自動対応）

**仕様**:

Canvas 解像度:
- 内部解像度: 450x900（固定）
- 物理演算の全定数をこの解像度に統一（現在の large 設定相当、scale=1.5）

CSS スケーリング:
- `width: 100%` + `max-width: 450px`（内部解像度と一致）
- `max-height: calc(100vh - 100px)`（スコアボード等の余白を確保）
- `aspect-ratio: 1 / 2`（450:900 = 1:2 を維持）
- `height: auto`（アスペクト比に従って自動計算）
- 小画面（幅 < 450px）: 幅いっぱいに拡大、高さはアスペクト比で自動算出
- 大画面: `max-width` で上限を制限し、中央寄せ

スコアボード:
- `max-width` を Canvas と同じ `450px` に変更
- `width: 100%` でキャンバスと幅を揃える

タイトル画面 / リザルト画面:
- Size 選択セクションを完全削除
- `canvasSize` / `setCanvasSize` プロップを削除

**定数の再設計（getConstants の簡素化）**:

```
// 変更前
export const getConstants = (size: CanvasSize = 'standard'): GameConstants => {
  const cfg = SIZE_CONFIGS[size];  // standard: 300x600, large: 450x900
  ...
};

// 変更後
export const CONSTANTS: GameConstants = {
  CANVAS: { WIDTH: 450, HEIGHT: 900 },
  SIZES: { MALLET: 42, PUCK: 21, ITEM: 24 },
  PHYSICS: { FRICTION: 0.998, MIN_SPEED: 1.5, MAX_POWER: 12 },
  TIMING: { ... },
  CPU: { easy: 1.5, normal: 3.5, hard: 6 },
  FEVER: { MAX_EXTRA_PUCKS: 2 },
};
```

- `getConstants(size)` 関数 → `CONSTANTS` 定数オブジェクトに簡素化
- `SIZE_CONFIGS` / `SizeConfig` / `CanvasSize` 型を削除
- 各ファイルの `getConstants(canvasSize)` 呼び出しを `CONSTANTS` 参照に置換

**影響ファイル**:

| ファイル | 変更内容 |
|---------|---------|
| `core/types.ts` | `CanvasSize` 型、`SizeConfig` 型を削除 |
| `core/constants.ts` | `SIZE_CONFIGS` 廃止、`getConstants()` → `CONSTANTS` 定数に簡素化 |
| `core/config.ts` | `SIZE_OPTIONS` 削除 |
| `styles.ts` | `GameCanvas` をレスポンシブ CSS に変更、`ScoreBoardContainer` の `max-width` 更新 |
| `components/Field.tsx` | `canvasSize` プロップ削除、固定解像度で描画 |
| `components/TitleScreen.tsx` | Size 選択セクション削除、`canvasSize`/`setCanvasSize` プロップ削除 |
| `components/Scoreboard.tsx` | スタイル調整（幅の追従） |
| `hooks/useInput.ts` | `canvasSize` パラメータ削除、`CONSTANTS` 直接参照 |
| `hooks/useGameLoop.ts` | `canvasSize` パラメータ削除、`CONSTANTS` 直接参照 |
| `AirHockeyGame.tsx` | `canvasSize` 状態削除、関連プロップの整理 |
| `core/entities.ts` | `getConstants()` → `CONSTANTS` に置換 |
| `core/physics.ts` | `getConstants()` → `CONSTANTS` に置換 |
| `core/ai.ts` | `getConstants()` → `CONSTANTS` に置換 |
| `renderer.ts` | `getConstants()` → `CONSTANTS` に置換 |
| `core/config.ts` | 障害物座標をスケール済み座標（x1.5）に更新 |

**入力座標変換（変更不要の確認）**:
- `useInput.ts` の座標変換は `rect.width / rect.height` でブラウザ上の表示サイズから Canvas 内部座標に変換しており、CSS スケーリングに自動対応する
- ただし `canvasSize` パラメータ経由で `getConstants` を呼ぶ部分は `CONSTANTS` 直接参照に変更が必要

**テスト影響**:
- `core/entities.test.ts`: `getConstants()` → `CONSTANTS` に更新
- `core/Physics.test.ts`: `CONSTANTS` 参照に更新
- `core/AI.test.ts`: `getConstants()` 呼び出しの削除
- `core/items.test.ts`: 変更不要（定数を直接使用していない）
- `AirHockeyPage.test.tsx`: Size 選択が消えるため該当テストがあれば削除

### 1.1 カウントダウン演出

**概要**: ゲーム開始時に「3 → 2 → 1 → GO!」のカウントダウンを表示し、開始の盛り上がりを演出する。

**仕様**:
- ゲーム開始後、3秒間のカウントダウンを表示
- カウントダウン中はパック・マレットの移動を停止
- 各数字は拡大→縮小のアニメーション付き
- 「GO!」はネオンカラーでフラッシュ表示
- カウントダウン毎にSE再生（既存 `sound.start` を分割）

**影響ファイル**:
- `core/types.ts`: `GamePhase` 型追加（`countdown | playing | paused | finished`）
- `hooks/useGameLoop.ts`: カウントダウンフェーズの処理追加
- `renderer.ts`: `drawCountdown()` メソッド追加
- `AirHockeyGame.tsx`: フェーズ状態管理

### 1.2 画面シェイク

**概要**: ゴール時・強いヒット時にキャンバスを振動させ、インパクトを強調する。

**仕様**:
- ゴール時: 強シェイク（振幅 8px、持続 300ms）
- 強打ヒット時（速度閾値超過）: 弱シェイク（振幅 3px、持続 150ms）
- シェイクは CSS transform で実装（Canvas 内描画に影響しない）
- タイマー管理で自然に減衰

**影響ファイル**:
- `core/types.ts`: `ShakeState` 型追加
- `hooks/useGameLoop.ts`: シェイクトリガー追加
- `styles.ts`: シェイクアニメーション CSS 追加
- `components/Field.tsx`: シェイク状態の適用

### 1.3 パック速度ビジュアル

**概要**: パックの速度に応じてビジュアルを変化させ、スピード感を演出する。

**仕様**:
- 速度閾値:
  - 通常（< 6）: 白色、トレイル長 8
  - 高速（6〜10）: 黄色、トレイル長 12、グロー追加
  - 超高速（> 10）: 赤色、トレイル長 16、強グロー、残像エフェクト
- 速度に応じたトレイルの太さ変化
- 超高速時はパック周囲にスピードライン描画

**影響ファイル**:
- `renderer.ts`: `drawPuck()` / `drawPuckTrail()` の速度対応拡張
- `core/constants.ts`: 速度閾値の定数追加

### 1.4 BGM 追加

**概要**: Web Audio API を使用してゲーム中のBGMを動的生成する。

**仕様**:
- ゲーム中: アップテンポなループBGM
- フィーバー時: BGMのテンポアップ＋音色変化
- メニュー/リザルト: BGMなし（SE のみ）
- 音量はデフォルト 0.15（SE より控えめ）
- BGM ON/OFF トグル（タイトル画面）

**影響ファイル**:
- `core/sound.ts`: BGM 生成・制御メソッド追加
- `AirHockeyGame.tsx`: BGM 状態管理
- `components/TitleScreen.tsx`: BGM トグルボタン

### 1.5 サウンド改善

**概要**: ヒット音を速度に応じて変化させ、より豊かな音響体験を提供する。

**仕様**:
- ヒット音: 速度に応じて周波数と音量を変化（強打 = 高音・大音量）
- ゴール音: 自チーム得点時は3音ファンファーレ、失点時は下降音
- コンボ時: 音程が上がっていく
- 壁バウンス: 角度に応じた微妙な音程変化

**影響ファイル**:
- `core/sound.ts`: 各メソッドにパラメータ追加

---

## Phase 2: ゲームプレイ深化

### 2.1 ポーズ機能

**概要**: ゲーム中にポーズ（一時停止）できるようにする。

**仕様**:
- スコアボード横の Menu ボタンの隣にポーズボタン追加
- キーボード: Escape / P キーでトグル
- ポーズ中: ゲームループ停止、半透明オーバーレイ表示
- ポーズ中のオプション: 「Resume」「Restart」「Back to Menu」
- ポーズ解除時: 1秒のカウントダウン後に再開

**影響ファイル**:
- `core/types.ts`: `GamePhase` に `paused` 追加
- `hooks/useGameLoop.ts`: ポーズ状態での描画処理
- `renderer.ts`: `drawPauseOverlay()` 追加
- `components/Scoreboard.tsx`: ポーズボタン追加

### 2.2 新アイテム追加

**概要**: アイテムの種類を増やしてゲームプレイのバリエーションを拡大する。

**新アイテム仕様**:

| アイテム | ID | 効果 | 持続 | アイコン | 色 |
|---------|-----|------|------|---------|-----|
| Shield | `shield` | ゴール前にバリア（1回防御で消滅） | 1回限り | 🛡 | #FFD700 |
| Magnet | `magnet` | マレットがパックを引き寄せる | 5秒 | 🧲 | #FF6B35 |
| Big | `big` | 対象のマレットが1.5倍に拡大 | 8秒 | ⬆ | #00FF88 |

- Shield: ゴールライン上に半透明バリアを描画。パック衝突で破壊（破壊パーティクル付き）
- Magnet: マレット周囲に磁場エフェクト描画。パックに微弱な引力を適用
- Big: マレット半径を1.5倍に。視覚的にサイズアニメーション

**影響ファイル**:
- `core/types.ts`: `ItemType` に新タイプ追加、`EffectState` 拡張
- `core/config.ts`: ITEMS 配列に追加
- `core/items.ts`: 新アイテムエフェクトロジック
- `renderer.ts`: バリア・磁場・サイズ変更の描画
- `hooks/useGameLoop.ts`: 新エフェクトの物理演算統合

### 2.3 コンボシステム強化

**概要**: 連続得点に報酬を与え、攻めのモチベーションを高める。

**仕様**:
- 連続得点カウント（相手が得点するとリセット）
- コンボ表示: 「x2 COMBO!」「x3 COMBO!」等
- コンボに応じた演出強化:
  - x2: パーティクル量 1.5倍
  - x3: 画面フラッシュ色変化
  - x5+: 特別エフェクト（レインボーフラッシュ）
- フィーバーモードとの連動: コンボ x3 以上でフィーバー突入時間を短縮

**影響ファイル**:
- `core/types.ts`: `ComboState` 型追加
- `hooks/useGameLoop.ts`: コンボ判定ロジック
- `renderer.ts`: `drawCombo()` メソッド追加

### 2.4 カムバックメカニクス

**概要**: 大差がついた時に劣勢側を微妙にアシストし、逆転の可能性を残す。

**仕様**:
- 発動条件: スコア差が 3 以上
- 効果（劣勢側）:
  - マレット半径が 10% 拡大
  - ゴールサイズが 10% 縮小（守りやすくなる）
- 視覚的にはほとんどわからない程度の変化
- スコア差が 2 以下に縮まったら解除

**影響ファイル**:
- `hooks/useGameLoop.ts`: カムバック判定とパラメータ調整
- `renderer.ts`: マレット描画時のサイズ反映

### 2.5 試合統計

**概要**: 試合中の各種データを記録し、リザルトで表示する。

**記録項目**:
- ヒット数（プレイヤー/CPU）
- 最高パック速度
- アイテム取得数
- セーブ数（ゴールライン付近でのヒット）
- 試合時間

**影響ファイル**:
- `core/types.ts`: `MatchStats` 型追加
- `hooks/useGameLoop.ts`: 統計記録ロジック
- `components/ResultScreen.tsx`: 統計表示 UI
- `AirHockeyGame.tsx`: 統計状態管理

---

## Phase 3: リプレイ性・UX 向上

### 3.1 実績システム

**実績一覧**:

| ID | 名前 | 条件 |
|----|------|------|
| `first_win` | 初勝利 | 初めて CPU に勝利 |
| `perfect` | パーフェクト | 無失点で勝利 |
| `streak_3` | 3連勝 | 3回連続で勝利 |
| `streak_5` | 5連勝 | 5回連続で勝利 |
| `hard_win` | ハードモード制覇 | Hard で勝利 |
| `all_fields` | フィールドマスター | 全フィールドで勝利 |
| `comeback` | 大逆転 | 3点差以上から逆転勝利 |
| `speed_demon` | スピードデーモン | パック速度 15 以上を記録 |
| `item_master` | アイテムコレクター | 全種類のアイテムを使用 |

**影響ファイル**:
- 新規: `core/achievements.ts`（実績定義・判定・保存）
- `components/ResultScreen.tsx`: 解除通知表示
- `components/TitleScreen.tsx`: 実績一覧表示ボタン

### 3.2 リザルト画面強化

**仕様**:
- 勝利時: 紙吹雪エフェクト（既存 ConfettiOverlay 活用検討）
- 統計のアニメーション表示（数値カウントアップ）
- 「REPLAY」ボタン追加（同条件で即再戦）
- 新規実績解除時のポップアップ
- MVP 演出（最も印象的なスタッツをハイライト）

### 3.3 画面トランジション

**仕様**:
- menu → game: フェードアウト → カウントダウン
- game → result: スローモーション演出 → フェードイン
- result → menu: スライドトランジション
- CSS transition / keyframes で実装

### 3.4 音量設定

**仕様**:
- タイトル画面に音量設定セクション追加
- BGM / SE を個別にスライダーで調整（0〜100%）
- 設定は localStorage に保存
- ミュートボタン（全音オフ）

### 3.5 チュートリアル改善

**仕様**:
- 初回プレイ時のみインタラクティブチュートリアル
- ステップ形式:
  1. 「マレットを動かしてみよう」（マウス/タッチ操作）
  2. 「パックを打ち返そう」（パックがゆっくり飛んでくる）
  3. 「ゴールに入れよう」（ゴール位置をハイライト）
  4. 「アイテムを使おう」（アイテムの説明）
- スキップ可能
- 完了フラグを localStorage に保存

---

## Phase 4: 発展的機能

### 4.1 キーボード操作対応

- WASD / 矢印キーでマレット移動
- 速度はマウスより遅め（公平性のため）
- キーボードモード時は移動速度を制限

### 4.2 難易度オートアジャスト

- 3連敗で自動的に1段階下げる提案を表示
- 3連勝で1段階上げる提案を表示
- 手動変更を尊重（提案を断れる）

### 4.3 フィールド/アイテムアンロック

- 初期利用可能: Original, Wide, 基本アイテム3種
- 勝利数やアチーブメントでアンロック
- アンロック時の演出

### 4.4 デイリーチャレンジ

- 毎日異なる特殊ルール（例: アイテム大量、小さいゴール、高速パック）
- 日付ベースのシード値で全ユーザー共通条件
- クリア報酬
