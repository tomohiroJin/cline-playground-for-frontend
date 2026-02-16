# 仕様書: 原始進化録 (PRIMAL PATH) React コンポーネント化

## 1. 機能仕様

### 1.1 ゲームページ (`/primal-path`)

#### 画面構成

- ゲーム本体は React コンポーネントとして直接描画される（iframe 廃止済み）
- ページラッパーは `position: fixed; inset: 0` でフルスクリーン

#### ゲーム表示領域

| 項目 | デスクトップ | モバイル (≤500px) |
|------|------------|------------------|
| 幅 | 480px | 100vw |
| 高さ | 720px | 100vh |
| 配置 | 画面中央 | 全画面 |
| 背景 | #0a0a12 (ゲームに合わせた暗い背景) | 同左 |

#### アーキテクチャ

- Labyrinth Echo パターン準拠の React コンポーネント構成
- `useReducer` によるフェーズベースの中央ステート管理
- 純粋関数による戦闘ロジック（`game-logic.ts`）
- Canvas によるスプライト描画（`sprites.ts`）
- styled-components によるスコープ付きスタイル
- Web Audio API による SFX 再生（`audio.ts`）
- localStorage による永続化（`storage.ts`）

### 1.2 ホーム画面 (GameListPage)

#### ゲームカード仕様

| 項目 | 値 |
|------|-------|
| タイトル | 原始進化録 - PRIMAL PATH |
| 説明文 | 文明を選び、進化を重ねて最終ボスに挑む自動戦闘ローグライト。技術・生活・儀式の三大文明を育て、覚醒して神話を刻め。 |
| ルート | `/primal-path` |
| 背景 | `$customBg` グラデーションプレースホルダー |
| aria-label | `原始進化録 - PRIMAL PATH ゲームをプレイする` |

### 1.3 ルーティング仕様

| 項目 | 値 |
|------|-------|
| パス | `/primal-path` |
| コンポーネント | `PrimalPathPage` |
| 読み込み方式 | `React.lazy()` (コード分割) |
| チャンク名 | `PrimalPathPage` |

## 2. ファイル仕様

### 2.1 ファイル構成

```
src/features/primal-path/
├── index.ts                          # PrimalPathGame re-export
├── PrimalPathGame.tsx                # メインオーケストレータ
├── types.ts                          # 全型定義
├── constants.ts                      # ゲームデータ定数（Object.freeze）
├── game-logic.ts                     # 純粋関数（戦闘・進化・ツリー計算）
├── sprites.ts                        # Canvas 描画関数
├── audio.ts                          # Web Audio SFX エンジン
├── storage.ts                        # localStorage ラッパー
├── contracts.tsx                     # 不変条件アサーション・ErrorBoundary
├── styles.ts                         # styled-components & keyframes
├── hooks.ts                          # useGameState, useBattle, useOverlay, useAudio
├── components/
│   ├── Overlay.tsx                   # 通知オーバーレイ
│   ├── TitleScreen.tsx               # タイトル画面
│   ├── DifficultyScreen.tsx          # 難易度選択
│   ├── HowToPlayScreen.tsx           # 遊び方
│   ├── TreeScreen.tsx                # 文明ツリー
│   ├── BiomeSelectScreen.tsx         # バイオーム選択
│   ├── EvolutionScreen.tsx           # 進化選択
│   ├── BattleScreen.tsx              # 自動戦闘
│   ├── AwakeningScreen.tsx           # 覚醒演出
│   ├── PreFinalScreen.tsx            # 最終ボス準備
│   ├── AllyReviveScreen.tsx          # 仲間復活
│   ├── GameOverScreen.tsx            # リザルト
│   └── shared.tsx                    # 共通UIコンポーネント
└── __tests__/
    ├── game-logic.test.ts            # 純粋関数テスト（44テスト）
    └── storage.test.ts               # 永続化テスト（5テスト）
```

### 2.2 ゲームフェーズ

| フェーズ | 画面コンポーネント | 説明 |
|---------|-------------------|------|
| `title` | TitleScreen | タイトルキャンバス + 各メニューボタン |
| `diff` | DifficultyScreen | 難易度4段階選択 |
| `how` | HowToPlayScreen | 遊び方テキスト |
| `tree` | TreeScreen | 文明ツリー8段階の永続強化 |
| `biome` | BiomeSelectScreen | バイオーム3択選択 |
| `evo` | EvolutionScreen | 進化カード選択 + ステートプレビュー |
| `battle` | BattleScreen | 自動戦闘（Canvas + ステータス + ログ） |
| `awakening` | AwakeningScreen | 覚醒演出 + エフェクト適用 |
| `prefinal` | PreFinalScreen | 最終ボス準備確認 |
| `ally_revive` | AllyReviveScreen | 仲間復活（骨消費） |
| `over` | GameOverScreen | リザルト統計 + 報酬 |

### 2.3 変更したファイル

| ファイル | 変更内容 |
|----------|---------|
| `src/pages/PrimalPathPage.tsx` | 変更なし（そのまま動作） |
| `src/pages/GameListPage.test.tsx` | PrimalPath カードテスト追加 |
| `webpack.config.ts` | `.html` の `asset/source` ルール削除 |
| `src/declarations.d.ts` | `*.html` モジュール型宣言削除 |

### 2.4 削除したファイル

| ファイル | 理由 |
|----------|------|
| `src/features/primal-path/primal-path.html` | React コンポーネント化により不要 |

## 3. 非機能仕様

### 3.1 パフォーマンス

- ゲームページは遅延読み込み (code splitting)
- 戦闘ロジックは純粋関数で最適化

### 3.2 アクセシビリティ

- ゲームカードに `role="button"`, `aria-label`, `tabIndex`, `onKeyDown` を設定
- キーボード操作 (Enter/Space) でカードからナビゲーション可能

### 3.3 互換性

- ゲーム本体の localStorage キー `primal-path-v7` がそのまま動作すること
- Web Audio API の SFX がユーザー操作後に再生されること
- Canvas ピクセルアート描画が `image-rendering: pixelated` で正しく表示されること

### 3.4 設計原則

| 原則 | 適用 |
|------|------|
| DRY | 共通UIを shared.tsx に集約。styled-components でスタイル共有 |
| DbC | contracts.tsx の invariant() で事前条件チェック |
| SRP | 各ファイルが単一の責務（constants / logic / audio / storage / hooks / components） |
| OCP | 新バイオーム/進化/敵の追加は constants.ts のデータ追加のみ |
| DIP | フックは純粋関数に依存。コンポーネントは props のみに依存 |
| 関数型 | game-logic.ts の全関数はイミュータブル |
| 宣言的 | JSX によるフェーズベースの条件レンダリング |
