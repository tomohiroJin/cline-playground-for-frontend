# 原始進化録（PRIMAL PATH）

## 概要

三大文明を育て進化を重ねる自動戦闘ローグライト。
シナジービルド・ランダムイベント・実績＆チャレンジで毎回異なる冒険が待つ。
周回プレイで骨（通貨）を蓄積し、文明ツリーを解放して高難易度に挑戦する。

## 操作方法

- **マウスクリック**: 選択肢を選択、メニュー操作
- **スキルボタン**: バトル中に画面下部のスキルボタンをクリックで発動（クールダウンあり）
- **速度ボタン**: ×1 / ×2 / ×4 / ×8 で自動戦闘スピードを変更
- **一時停止ボタン**: ⏸ で戦闘を一時停止

## ゲームシステム

- **難易度**: 原始（Normal）/ 氷河期（Hard）/ 大災厄（Very Hard）/ 神話世界（Extreme）
- **バイオーム**: 草原（バランス）/ 氷河（技術有利）/ 火山（儀式有利）の3種
- **文明ツリー**: 8段階の永続強化ツリー（ATK, HP, DEF, 会心, 骨, 環境耐性, 仲間, 特殊）
- **覚醒**: 文明レベルが一定に達すると小覚醒・大覚醒が発動（技術/生活/儀式/調和の4種）
- **仲間**: 文明タイプに応じた味方が加入（火の狩人, 回復役, 盾役, 狂戦士 等）
- **最終ボス**: 3バイオーム攻略後、覚醒タイプに応じた最終ボスと対決
- **進化カード**: 30種。シナジータグ付きのカードを組み合わせてビルドを構築
- **シナジー**: 8タグ（火・氷・再生・盾・狩り・霊・部族・野生）× Tier1/Tier2 ボーナス
- **アクティブスキル**: 4種（炎の爆発・自然の癒し・血の狂乱・盾の壁）。文明Lv3以上で解放
- **ランダムイベント**: 8種（バトル後20%確率）。バイオーム固有の出現傾向あり
- **実績**: 15個のマイルストーン（初クリア、全難易度制覇、シナジーマスター等）
- **チャレンジ**: 3種の特殊ルール（HP半減、進化制限、タイムアタック）
- **ラン統計**: プレイ履歴の記録と閲覧（最新50件保持）

## 技術詳細

### ファイル構成

```
src/features/primal-path/
  types.ts              # 型定義
  constants.ts          # ゲームデータ定数（Object.freeze）
  game-logic.ts         # 純粋関数（戦闘・進化・ツリー・シナジー・イベント・実績計算）
  sprites.ts            # Canvas 描画関数（ピクセルアート・背景・ダメージポップアップ）
  audio.ts              # Web Audio SFX / BGM エンジン
  storage.ts            # localStorage ラッパー（セーブ・統計・実績・チャレンジ）
  contracts.tsx         # DbC アサーション・ErrorBoundary
  styles.ts             # styled-components & keyframes アニメーション
  hooks.ts              # カスタムフック（useGameState, useBattle, useAudio, useOverlay, usePersistence）
  PrimalPathGame.tsx    # メインオーケストレータ
  index.ts              # barrel export
  components/
    shared.tsx            # 共通UI（ProgressBar, HpBar, StatPreview, CivBadge, AllyList）
    Overlay.tsx           # 通知オーバーレイ
    TitleScreen.tsx       # タイトル画面
    DifficultyScreen.tsx  # 難易度選択
    HowToPlayScreen.tsx   # 遊び方
    TreeScreen.tsx        # 文明ツリー
    BiomeSelectScreen.tsx # バイオーム選択
    EvolutionScreen.tsx   # 進化カード選択（シナジータグ表示）
    BattleScreen.tsx      # 自動戦闘（Canvas + スキル + 速度制御 + ログ）
    EventScreen.tsx       # ランダムイベント（リスク表示・コスト制約）
    AwakeningScreen.tsx   # 覚醒演出
    PreFinalScreen.tsx    # 最終ボス準備
    AllyReviveScreen.tsx  # 仲間復活
    StatsScreen.tsx       # ラン統計閲覧
    AchievementScreen.tsx # 実績一覧
    ChallengeScreen.tsx   # チャレンジモード選択
    GameOverScreen.tsx    # リザルト
  __tests__/
    game-logic.test.ts       # 純粋関数テスト
    synergy.test.ts          # シナジー計算テスト
    events.test.ts           # ランダムイベントテスト
    achievements.test.ts     # 実績・チャレンジテスト
    active-skills.test.ts    # アクティブスキルテスト
    storage.test.ts          # 永続化テスト
    sprites.test.ts          # スプライト描画テスト
    audio-bgm.test.ts        # BGM テスト
    BattleScreen.test.tsx    # 戦闘画面コンポーネントテスト
    EvolutionScreen.test.tsx # 進化画面コンポーネントテスト
    EventScreen.test.tsx     # イベント画面コンポーネントテスト
    HowToPlayScreen.test.tsx # 遊び方画面コンポーネントテスト
src/pages/PrimalPathPage.tsx  # ページコンポーネント（薄いラッパー）
```

### 状態管理

- `useReducer` + `gameReducer` によるフェーズベースの中央ステート管理
- reducer は純粋関数 `game-logic.ts` を呼ぶだけでテスト容易
- フェーズ遷移で旧UIは unmount されるため、ダブルクリックガード不要

### 使用技術

- **Web Audio API**: AudioEngine による効果音（ヒット、クリティカル、キル、回復、進化、死亡、ボス、勝利）+ BGM（バイオーム別3曲 + ボス曲 + タイトル曲）
- **Canvas**: ピクセルアートスプライト描画（プレイヤー、敵、味方、タイトル）+ バイオーム背景 + ダメージポップアップ
- **styled-components**: スコープ付きスタイル & keyframes アニメーション
- **Design-by-Contract (DbC)**: `invariant` によるアサーション
- **ErrorBoundary**: クラスコンポーネントによるエラーハンドリング
- **localStorage**: セーブデータ永続化（骨、文明ツリー、クリア回数、実績、チャレンジ、統計）

### テスト

- 12スイート / 329テスト（Jest + React Testing Library）
- TDD Red-Green-Refactor サイクルで実装
- 純粋関数テスト + コンポーネントテストのハイブリッド構成
