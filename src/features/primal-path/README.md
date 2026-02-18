# 原始進化録（PRIMAL PATH）

## 概要

文明を選び、進化を重ねて最終ボスに挑む自動戦闘ローグライト。
技術・生活・儀式の三大文明を育て、覚醒して神話を刻め。
周回プレイで骨（通貨）を蓄積し、文明ツリーを解放して高難易度に挑戦する。

## 操作方法

- **マウスクリック**: 選択肢を選択、メニュー操作

## 技術詳細

### ファイル構成

```
src/features/primal-path/
  types.ts              # 型定義
  constants.ts          # ゲームデータ定数（Object.freeze）
  game-logic.ts         # 純粋関数（戦闘・進化・ツリー計算）
  sprites.ts            # Canvas 描画関数（ピクセルアート）
  audio.ts              # Web Audio SFX エンジン
  storage.ts            # localStorage ラッパー
  contracts.tsx         # DbC アサーション・ErrorBoundary
  styles.ts             # styled-components & keyframes
  hooks.ts              # カスタムフック（useGameState, useBattle, useAudio, useOverlay, usePersistence）
  PrimalPathGame.tsx    # メインオーケストレータ
  index.ts              # barrel export
  components/
    shared.tsx          # 共通UIコンポーネント（ProgressBar, HpBar, StatPreview, CivBadge, AllyList）
    Overlay.tsx         # 通知オーバーレイ
    TitleScreen.tsx     # タイトル画面
    DifficultyScreen.tsx  # 難易度選択
    HowToPlayScreen.tsx   # 遊び方
    TreeScreen.tsx      # 文明ツリー
    BiomeSelectScreen.tsx # バイオーム選択
    EvolutionScreen.tsx   # 進化カード選択
    BattleScreen.tsx    # 自動戦闘（Canvas + ステータス + ログ）
    AwakeningScreen.tsx   # 覚醒演出
    PreFinalScreen.tsx    # 最終ボス準備
    AllyReviveScreen.tsx  # 仲間復活
    GameOverScreen.tsx    # リザルト
  __tests__/
    game-logic.test.ts  # 純粋関数テスト（44テスト）
    storage.test.ts     # 永続化テスト（5テスト）
src/pages/PrimalPathPage.tsx  # ページコンポーネント（薄いラッパー）
```

### 状態管理

- `useReducer` + `gameReducer` によるフェーズベースの中央ステート管理
- reducer は純粋関数 `game-logic.ts` を呼ぶだけでテスト容易
- フェーズ遷移で旧UIは unmount されるため、ダブルクリックガード不要

### 使用技術

- **Web Audio API**: AudioEngine による効果音（ヒット、クリティカル、キル、回復、進化、死亡、ボス、勝利）
- **Canvas**: ピクセルアートスプライト描画（プレイヤー、敵、味方、タイトル）
- **styled-components**: スコープ付きスタイル & keyframes アニメーション
- **Design-by-Contract (DbC)**: `invariant` によるアサーション
- **ErrorBoundary**: クラスコンポーネントによるエラーハンドリング
- **localStorage**: セーブデータ永続化（骨、文明ツリー、クリア回数）

## ゲームシステム

- **難易度**: 原始（Normal）/ 氷河期（Hard）/ 大災厄（Very Hard）/ 神話世界（Extreme）
- **バイオーム**: 草原（バランス）/ 氷河（技術有利）/ 火山（儀式有利）の3種
- **文明ツリー**: 8段階の永続強化ツリー（ATK, HP, DEF, 会心, 骨, 環境耐性, 仲間, 特殊）
- **覚醒**: 文明レベルが一定に達すると小覚醒・大覚醒が発動（技術/生活/儀式/調和の4種）
- **仲間**: 文明タイプに応じた味方が加入（火の狩人, 回復役, 盾役, 狂戦士 等）
- **最終ボス**: 3バイオーム攻略後、覚醒タイプに応じた最終ボスと対決
