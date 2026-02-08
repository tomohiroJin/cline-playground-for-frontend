# RISK LCD

## 概要

液晶ゲーム機風の3レーン回避アクション×ローグライトゲーム。
レトロな LCD 筐体の中で、予告を読み、障害を回避しながら高スコアを目指す。
ステージ間で獲得するパークを重ねてビルドを構築し、リスクとリターンのバランスで勝負。

## 操作方法

- **← / → キー**: プレイヤーをレーン移動
- **スペース / Enter**: 決定（メニュー選択・パーク選択）
- **↑ / ↓ キー**: メニュー / リスト項目の選択
- **タッチ操作**: 左右スワイプで移動、タップで決定

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

## 技術詳細

### ファイル構成

```
src/features/risk-lcd/
  index.ts                        # barrel export
  types.ts                        # 型定義（ScreenId/GameState/StyleDef 等）
  constants/
    game-config.ts                # ステージ/スタイル/パーク/ショップ/ランク等の定数
    ascii-art.ts                  # キャラクターASCIIアート（8状態×複数フレーム）
    emotion-art.ts                # エモーションパネルアート（7状態×複数フレーム）
    index.ts                      # barrel export
  utils/
    random.ts                     # Rand ユーティリティ（int/pick/chance/shuffle）
    game-logic.ts                 # 純粋関数（スコア計算/ランク判定/スタイルマージ等）
    random.test.ts                # Rand のユニットテスト
    game-logic.test.ts            # 純粋関数のユニットテスト
    index.ts                      # barrel export
  hooks/
    useStore.ts                   # localStorage 永続化（PT/スタイル/装備/ベストスコア）
    useAudio.ts                   # Web Audio API でのビープ音/SE 生成
    useInput.ts                   # キーボード/タッチ入力ハンドリング
    useGameEngine.ts              # メインゲームループ（状態管理/衝突判定/パーク適用）
    useStore.test.ts              # useStore のユニットテスト
    index.ts                      # barrel export
  components/
    styles.ts                     # styled-components（LCD カラー/フォント/アニメーション）
    DeviceFrame.tsx               # ゲーム機筐体（ベゼル/ブランドロゴ）
    ControlButtons.tsx            # LEFT/ACTION/RIGHT 3ボタンUI
    LcdScreen.tsx                 # LCD画面コンテナ（スキャンライン/反射効果）
    ListPanel.tsx                 # 共通リストパネル
    CharacterArt.tsx              # ASCIIアート表示
    EmotionPanel.tsx              # エモーションパネル表示
    TitleScreen.tsx               # タイトル画面
    StyleListScreen.tsx           # プレイスタイル選択/装備画面
    UnlockShopScreen.tsx          # PTアンロックショップ画面
    HelpScreen.tsx                # カテゴリ別ヘルプ画面
    GameHud.tsx                   # スコア/ステージ/コンボ/シールド表示
    LaneGrid.tsx                  # 3レーン×8セグメントグリッド
    GameScreen.tsx                # ゲーム画面統合
    AnnounceOverlay.tsx           # ステージ開始/クリア演出
    PerkSelectScreen.tsx          # パーク選択画面
    ResultScreen.tsx              # リザルト画面
    RiskLcdGame.tsx               # 全画面統合メインコンポーネント
    RiskLcdGame.test.tsx          # 基本レンダリングテスト
src/pages/RiskLcdPage.tsx         # ページラッパー
```

### 状態管理

- `useRef<GameState>` でミュータブルなゲーム状態を管理（高速な更新に対応）
- `useState<RenderState>` で描画トリガーを管理（必要な時だけ再レンダリング）
- `useStore` で localStorage への永続化（セーブデータのマイグレーション対応）

### 使用技術

- **styled-components**: LCD 風 UI（スキャンライン/反射/ピクセルフォント）
- **Web Audio API**: オシレーターベースのビープ音/SE（16種類の効果音）
- **Web Fonts**: Silkscreen（ピクセルフォント）、Orbitron（テクノフォント）
- **タイマーベース制御**: setTimeout / useRef による精密なビート制御
- **ローグライト要素**: ランダムパーク選択/モディファイア/スタイル組み合わせ
