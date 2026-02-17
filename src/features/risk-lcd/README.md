# RISK LCD

## 概要

液晶ゲーム機風の3レーン回避アクション×ローグライトゲーム。
レトロな LCD 筐体の中で、予告を読み、障害を回避しながら高スコアを目指す。
ステージ間で獲得するパークを重ねてビルドを構築し、リスクとリターンのバランスで勝負。

## 操作方法

- **← / → キー**: プレイヤーをレーン移動
- **スペース / Enter**: 決定（メニュー選択・パーク選択）
- **↑ / ↓ キー**: メニュー / リスト項目の選択
- **クリック / タップ**: メニュー項目・リスト項目を直接クリック/タップで選択・実行
- **タッチスワイプ**: 左右で移動、上下で項目選択

## ゲームモード

### GAME START（通常モード）

メインのゲームモード。全6ステージ（裏ステージはアンロック購入で解禁）をクリアして高スコアを目指す。
初回プレイ時はチュートリアルが表示される。

### DAILY（デイリーチャレンジ）

毎日変わるシード付きチャレンジモード。同日に全プレイヤーが同一条件（モディファイア・障害パターン・パーク候補）でプレイ可能。

- **日替わり条件**: 日付ベースのシード（FNV-1a ハッシュ → mulberry32 PRNG）で決定論的に生成
- **報酬**: 初回プレイ +50 PT、自己ベスト更新時 差分の10%
- **再プレイ**: 同日中は何度でもプレイ可能（同一条件）

### PRACTICE（練習モード）

ステージ1のみ、スコア非記録、PT非獲得の気軽な練習モード。
操作感やゲームシステムの確認に最適。

## ゲームシステム

### 基本ルール

- 3レーン×8セグメントのフィールドで障害を回避
- 各レーンには倍率（×1〜×8）が割り当てられ、安全に回避したレーンの倍率に応じてスコア獲得
- 予告システムにより、障害が来るレーンが段階的に表示される
- 全6ステージ（裏ステージはアンロック購入で解禁）

### プレイスタイル

| スタイル | 特徴 |
|---|---|
| STANDARD | バランス型（初期所持） |
| ハイリスク信者 | 最大×8 / 1レーン避難所化 / 死亡PT+50% |
| 慎重派 | 安全×3 / クリアBONUS+100% |
| 瞬間判断型 | 移動CD-40% / 予告+2 / 加速+25% |
| 一発逆転型 | 各ST1回シールド / 発動後5CY凍結 |

### パーク（ステージ間選択）

ステージクリア時に BUFF パークまたは RISK パークから選択。
BUFF はシールド・予告強化・スコアUP、RISK は高倍率と引き換えにデメリットを受ける。
パークを重ねることでビルドが形成され、プレイごとに異なる戦略が楽しめる。

### モディファイア

ステージ開始時にランダムで付与される特殊条件:

- **DOUBLE THREAT**: 同時障害+50%
- **RUSH HOUR**: 速度+20%
- **BONUS ROUND**: 全得点×2
- **FOG OF WAR**: 予告-1段
- **CALM BEFORE STORM**: 前半緩速 / 終盤加速

### ショップ（UNLOCK）

ゲームで獲得した PT を使ってスタイルやアンロックを購入:

- スタイル追加（4種）
- UI 強化（危険強調・タイミングバー・アート強化）
- ゲームプレイ強化（初期シールド・スタイル複合・選択肢拡張・基本報酬UP）
- 上位アンロック（裏ステージ・神託の目・黄金のオーラ）

## チュートリアル

初回プレイ時（`tutorialDone === false && plays === 0`）に自動で4ステップのチュートリアルを表示:

1. **予告を読め**: セグメント表示の見方
2. **回避せよ**: レーン移動操作
3. **倍率とスコア**: リスク＆リターンの仕組み
4. **ビルドを構築**: パーク選択の基本

既存ユーザー（プレイ回数 > 0）はマイグレーションにより自動スキップ。

## リザルト共有

ゲーム終了後のリザルト画面から、プレイ結果を共有可能:

- **SHARE ボタン**: Web Share API（`navigator.share`）対応ブラウザで SNS 等に共有
- **COPY ボタン**: クリップボードに共有テキストをコピー（"COPIED!" フィードバック表示）

### 共有テキスト形式

```
RISK LCD [DAILY 2026-02-18] STAGE 4 / 12500pts
Build: St|Vu+SR
```

### ビルドコード

スタイルとパークの組み合わせを短縮コードで表現:

| 種別 | ID | コード |
|------|-----|--------|
| スタイル | standard | St |
| スタイル | highrisk | HR |
| スタイル | cautious | Ca |
| スタイル | quick | Qu |
| スタイル | reversal | Re |
| パーク | vis_up | Vu |
| パーク | gamble | Gk |
| パーク | shield_regen | SR |
| ... | ... | ... |

### 共有URL

URLクエリパラメータベースで共有データを伝達:

```
?d=2026-02-18&s=12500&b=St|Vu+SR&g=<ghost-base64url>
```

- `d`: デイリーID（デイリーモード時のみ）
- `s`: スコア
- `b`: ビルドコード
- `g`: ゴーストデータ（Base64url エンコード済み）

## ゴーストデータ

### データ記録

ゲームプレイ中、各サイクルのプレイヤーレーン位置を `GameState.ghostLog` に記録。

### 圧縮方式

ランレングス圧縮（RLE）+ Base64url エンコード:

1. 連続する同一レーン値をペア (lane, count) に圧縮
2. 各ペアを1バイトにパック（上位2bit: lane、下位6bit: count、最大63連続）
3. バイト列を Base64url でエンコード（パディングなし）

### クラス

- **`GhostRecorder`**: 記録用。`record(lane)` でログ追加、`compress()` で圧縮文字列を生成
- **`GhostPlayer`**: 再生用。コンストラクタで展開、`getPosition(tick)` で任意 tick のレーン位置を取得

## 技術詳細

### ファイル構成

```
src/features/risk-lcd/
  index.ts                        # barrel export
  types.ts                        # 型定義（ScreenId/GameState/StyleDef/DailyData 等）
  constants/
    game-config.ts                # ステージ/スタイル/パーク/ショップ/ランク/メニュー等の定数
    ascii-art.ts                  # キャラクターASCIIアート（8状態×複数フレーム）
    emotion-art.ts                # エモーションパネルアート（7状態×複数フレーム）
    index.ts                      # barrel export
  utils/
    random.ts                     # Rand ユーティリティ（int/pick/chance/shuffle）
    seeded-random.ts              # SeededRand（mulberry32 PRNG）/ dateToSeed / getDailyId
    game-logic.ts                 # 純粋関数（スコア計算/ランク判定/スタイルマージ等）
    share.ts                      # 共有URL エンコード/デコード、ビルドコード変換
    ghost.ts                      # ゴーストデータ記録・RLE圧縮・Base64url変換
    random.test.ts                # Rand のユニットテスト
    game-logic.test.ts            # 純粋関数のユニットテスト
    seeded-random.test.ts         # SeededRand のユニットテスト
    share.test.ts                 # 共有ユーティリティのユニットテスト
    ghost.test.ts                 # ゴーストデータのユニットテスト
    index.ts                      # barrel export
  hooks/
    useStore.ts                   # localStorage 永続化（PT/スタイル/装備/ベスト/デイリー/チュートリアル）
    useAudio.ts                   # Web Audio API でのビープ音/SE 生成
    useInput.ts                   # キーボード/タッチ入力ハンドリング
    useGameEngine.ts              # メインゲームループ（状態管理/RNG管理/入力ディスパッチ）
    useStore.test.ts              # useStore のユニットテスト
    index.ts                      # barrel export
    phases/
      types.ts                    # フェーズ共通型（PhaseContext/RngApi）
      usePerkPhase.ts             # パーク選択フェーズ
      useResultPhase.ts           # リザルトフェーズ（通常/デイリー/練習モード対応）
      useRunningPhase.ts          # ゲーム実行フェーズ（RNG注入/ゴースト記録対応）
      useShopPhase.ts             # ショップフェーズ
      index.ts                    # barrel export
  components/
    styles.ts                     # styled-components（LCD カラー/フォント/アニメーション）
    DeviceFrame.tsx               # ゲーム機筐体（ベゼル/ブランドロゴ）
    ControlButtons.tsx            # LEFT/ACTION/RIGHT 3ボタンUI
    LcdScreen.tsx                 # LCD画面コンテナ（スキャンライン/反射効果）
    ListPanel.tsx                 # 共通リストパネル
    CharacterArt.tsx              # ASCIIアート表示
    EmotionPanel.tsx              # エモーションパネル表示
    TitleScreen.tsx               # タイトル画面（6メニュー項目）
    DailyScreen.tsx               # デイリーチャレンジ画面（日次条件表示/開始）
    TutorialScreen.tsx            # チュートリアル画面（4ステップ）
    StyleListScreen.tsx           # プレイスタイル選択/装備画面
    UnlockShopScreen.tsx          # PTアンロックショップ画面
    HelpScreen.tsx                # カテゴリ別ヘルプ画面
    GameHud.tsx                   # スコア/ステージ/コンボ/シールド表示
    LaneGrid.tsx                  # 3レーン×8セグメントグリッド
    GameScreen.tsx                # ゲーム画面統合
    AnnounceOverlay.tsx           # ステージ開始/クリア演出
    PerkSelectScreen.tsx          # パーク選択画面
    ResultScreen.tsx              # リザルト画面（共有ボタン/モード別表示）
    RiskLcdGame.tsx               # 全画面統合メインコンポーネント
    RiskLcdGame.test.tsx          # 基本レンダリングテスト
src/pages/RiskLcdPage.tsx         # ページラッパー
```

### 状態管理

- `useRef<GameState>` でミュータブルなゲーム状態を管理（高速な更新に対応）
- `useState<RenderState>` で描画トリガーを管理（必要な時だけ再レンダリング）
- `useStore` で localStorage への永続化（セーブデータのマイグレーション対応）

### RNG（乱数生成）アーキテクチャ

通常モードでは `Rand`（`Math.random` ベース）を、デイリーモードでは `SeededRand`（mulberry32 PRNG）を使用。
`RngApi` インターフェースで統一し、`PhaseContext.rng` ref を通じて全フェーズフックに注入。

```typescript
interface RngApi {
  int(n: number): number;
  pick<T>(a: readonly T[]): T;
  chance(p: number): boolean;
  shuffle<T>(a: readonly T[]): T[];
  random(): number;
}
```

### 使用技術

- **styled-components**: LCD 風 UI（スキャンライン/反射/ピクセルフォント）
- **Web Audio API**: オシレーターベースのビープ音/SE（16種類の効果音）
- **Web Share API**: リザルト共有（対応ブラウザのみ）
- **Web Fonts**: Silkscreen（ピクセルフォント）、Orbitron（テクノフォント）
- **タイマーベース制御**: setTimeout / useRef による精密なビート制御
- **ローグライト要素**: ランダムパーク選択/モディファイア/スタイル組み合わせ
- **決定論的RNG**: mulberry32 PRNG + FNV-1a ハッシュによるシード生成
- **データ圧縮**: ランレングス符号化 + Base64url によるゴーストデータ圧縮
