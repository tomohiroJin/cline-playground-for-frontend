# Racing Game（レーシングゲーム）

## 概要

トップダウンビューのレーシングゲーム。
チェックポイントを通過してラップタイムを競う。
環境に応じたデコレーション生成やパーティクルエフェクトで臨場感を演出。

## ゲームモード

| モード | 説明 |
|--------|------|
| ソロ | 1人でタイムアタック |
| 2人対戦 | ローカル2人対戦 |
| CPU対戦 | CPUと対戦（難易度3段階） |
| キャンペーン | 全8ステージを順に攻略するステージクリア型モード |

### キャンペーンモード

メニューの CAMPAIGN から起動する、制限時間制のステージ攻略モード:

- **全8ステージ**: ステージごとに固有のコース・難易度・持ち時間が設定され、クリアで次のステージが解放される
- **タイムシステム**: 初期持ち時間からのカウントダウン。チェックポイント通過でタイムボーナスが加算され、時間切れでミス
- **残機制**: 初期残機3。セッション内で引き継がれる
- **ランク判定**: クリアタイムに応じて GOLD / SILVER / BRONZE を判定
- **分岐ルート**: 一部のステージ（3 / 5 / 8）は2つのルートから選択できる（BranchSelectScreen）
- **進捗の永続化**: ベストタイム・ランク・解放ステージを localStorage に保存
- **専用 UI**: ステージセレクト画面、ステージイントロ、クリア / ゲームオーバー演出、エンディング画面

## 操作方法

### 2人対戦

| 操作 | P1 | P2 |
|------|----|----|
| 旋回 | A / D | ← / → |
| ドリフト | 左Shift | 右Shift / Enter |

### CPU対戦・ソロ

| 操作 | キー |
|------|------|
| 旋回 | A / D または ← / → |
| ドリフト | Space |

### 共通操作

- **P**: ポーズ / 再開
- **ESC**: ポーズ中 → メニューに戻る / リザルト画面 → メニューに戻る
- **モバイル**: タッチボタン操作

## 主な機能

### コース

フォレスト / シティ / マウンテン / ビーチ / ナイト / スノー / キャニオン / ハイウェイ

各コースに固有の環境エフェクト（摩擦係数変化、ビジュアルエフェクト）が適用されます。

### ドリフトシステム

ハンドブレーキ + 旋回でドリフトを開始。継続時間に応じてドリフトブーストが蓄積され、ドリフト終了時に加速ブーストが発動します。

### HEAT システム

壁や相手車両との接近でHEATゲージが蓄積。MAXまで貯まると自動でブーストが発動します。

### ドラフトカードシステム

- ラップ完了時にカード3枚を提示、1枚を選択して次のラップに効果を適用
- スピード系（5枚）、ハンドリング系（4枚）、防御系（3枚）、特殊系（2枚）の全14枚
- レアリティ: R / SR / SSR（出現確率に差あり）
- CPUモードではCPUが自動選択し、選択カードが通知バナーで表示されます

### カード効果の適用

以下のカード効果がゲームロジックに反映されます:

| 効果 | 説明 |
|------|------|
| speedMultiplier | 最高速度倍率 |
| accelMultiplier | 加速力倍率 |
| turnMultiplier | 旋回速度倍率 |
| driftBoostMultiplier | ドリフトブースト倍率 |
| wallDamageMultiplier | 壁ダメージ軽減 |
| heatGainMultiplier | HEAT蓄積速度倍率 |
| shieldCount | 衝突無効化回数 |

### ハイライトシステム

レース中の特筆すべきプレイを自動検出し、スコアとして集計:

- ドリフトボーナス / HEAT ブースト / ニアミス / 追い越し / ファステストラップ / フォトフィニッシュ

### 壁衝突処理

段階的な減速ペナルティとスライドベクトル方式の壁処理を採用。壁に接触し続けると自動的にトラック上にワープして復帰します。

## 既知の不具合

以下の問題が確認されていますが、現時点では未修正です:

### 1. はやい/ふつうスピードでコーナーから脱出できない場合がある

高速でコーナーに突入した際、壁処理の押し出し方向とプレイヤーの進行方向が噛み合わず、コーナーから抜け出せなくなることがあります。壁減速の強化やワープ閾値の短縮を行いましたが、特定のコーナー形状では依然として発生します。

**影響**: シティコースやナイトコースの急カーブで顕著
**回避策**: ゆっくりスピードでプレイするか、コーナー手前で早めに減速する

### 2. 2P対戦でどちらか一方のラップ完了時に両者がカード選択できる

2P対戦モードにおいて、P1またはP2のいずれかがラップを完了すると、その時点で両者にカード選択画面が表示されます。本来はラップを完了したプレイヤーのみがカード選択できるべきですが、現在の実装ではドラフト発動がプレイヤー単位ではなくラウンド単位で管理されているため、両者が選択対象になります。

**影響**: 2P対戦モード（laps > 1 かつカードON時）
**回避策**: カードをOFFにして対戦する

## 技術詳細

### ファイル構成

レイヤードアーキテクチャ（domain / application / infrastructure / presentation）で構成:

```
src/features/racing-game/
  domain/                 # ドメイン層（純粋関数、外部依存なし）
    player/               #   プレイヤー（player, drift, heat, cpu-strategy）
    race/                 #   レース進行（checkpoint, lap-counter, collision, rank,
                          #   lives, time-limit, stage, stage-catalog, campaign-progress 等）
    track/                #   トラック（course, course-effect, track, wall-physics）
    card/                 #   ドラフトカード（card-catalog, card-effect, deck）
    highlight/            #   ハイライト検出（event-detector, highlight）
    shared/               #   共通ユーティリティ（math-utils, random, assertions）
  application/            # アプリケーション層
    game-orchestrator.ts  #   ゲーム全体のオーケストレーション
    campaign-runtime.ts   #   キャンペーンのセッション内状態
    ports/                #   外部依存の抽象（renderer, audio, input, storage, campaign-progress）
    use-cases/            #   ユースケース（campaign-tick, handle-stage-clear 等）
  infrastructure/         # インフラ層（ポート実装）
    renderer/             #   Canvas 描画（canvas-renderer + 分割レンダラー群）
    audio/                #   Web Audio 実装（sound-engine）
    input/                #   キーボード / タッチアダプタ
    storage/              #   localStorage（score-repository, campaign-progress-repository）
  presentation/           # プレゼンテーション層
    RacingGameNew.tsx     #   通常レース画面
    RacingGameCampaign.tsx#   キャンペーンモード画面
    hooks/                #   useGameLoop, useCampaignSession, useCampaignGameLoop 等
    components/           #   MenuPanel, ResultPanel, VolumeControl
  components/
    campaign/             # キャンペーン用 UI（StageSelectScreen, BranchSelectScreen,
                          #   EndingScreen, StageHud, 各種オーバーレイ）
  __tests__/              # 層別ユニットテスト + integration/（レース・ドラフト・キャンペーンフロー）
  RacingGame.tsx          # エントリコンポーネント（モード切替）
  index.ts                # barrel export
  types.ts / constants.ts / entities.ts / game-logic.ts /
  renderer.ts / audio.ts / track.ts / utils.ts 等   # 旧フラット構成（後方互換で残存）
src/pages/RacingGamePage.tsx  # ページコンポーネント（薄いラッパー）
```

### 状態管理

- React Hooks（`useState`, `useRef`, `useEffect`）
- カスタムフックによるゲーム状態管理
- ゲームループ内の変数は `useRef` で管理し、React の再レンダリングとの依存を最小化

### 使用技術

- **Canvas 2D**: トップダウン描画
- **Web Audio API**: エンジン音・衝突音の動的生成
- **パーティクルシステム**: スパーク、紙吹雪、ドリフトスモーク
- **デコレーション生成**: コースに応じた環境オブジェクト（木、建物、山、ビーチ、雪）
