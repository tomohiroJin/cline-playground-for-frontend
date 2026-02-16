# 計画書: 原始進化録 (PRIMAL PATH) iframe 廃止 & React コンポーネント化

## 概要

当初 `.tmp/primal-path.html` を iframe srcdoc 方式で埋め込んでいたが、プロジェクト内の他12ゲームがすべて React コンポーネントで直接描画しているため、iframe を廃止し Labyrinth Echo パターンに準拠した React コンポーネントへ全面変換した。

## 対象ゲーム分析

### ゲーム名

- 日本語名: 原始進化録
- 英語名: PRIMAL PATH
- 略称: pp (ディレクトリ・ルーティング用)

### 技術構成（変換前）

| 項目 | 内容 |
|------|------|
| 形式 | 単一HTMLファイル (HTML + CSS + JavaScript 一体型) |
| 行数 | 約695行 |
| 描画 | Canvas (ピクセルアート) + DOM操作 |
| 音声 | Web Audio API (SFX のみ、BGMなし) |
| 保存 | localStorage (`primal-path-v7` キー) |
| 画面サイズ | 480×720px (モバイル: 100vw×100vh) |
| 外部依存 | なし (完全自己完結型) |

### 技術構成（変換後）

| 項目 | 内容 |
|------|------|
| 形式 | React コンポーネント群（25+ファイル） |
| 描画 | Canvas (ピクセルアート) + React JSX |
| 音声 | Web Audio API (audio.ts AudioEngine) |
| 保存 | localStorage (storage.ts ラッパー) |
| スタイル | styled-components (styles.ts) |
| ステート管理 | useReducer (hooks.ts) |
| テスト | Jest + React Testing Library (49テスト) |

## 移設方針

### アプローチ: Labyrinth Echo パターン準拠 React 化

iframe を完全に廃止し、HTML 内のロジック・データ・UIをすべて React コンポーネントに変換した。

**この方式を選択する理由:**

1. **プロジェクト規約との整合性** — 他12ゲームと同じアーキテクチャパターンを採用
2. **テスタビリティ** — 純粋関数の単体テスト、コンポーネントテストが可能
3. **保守性** — TypeScript の型安全性、モジュール分割による変更容易性
4. **DRY / SOLID 原則** — 関心の分離、単一責務原則の適用

**キー変換ポイント:**

- ミュータブルなグローバル変数 `R` → `useReducer` による不変ステート管理
- `tick()` 関数（グローバル状態変更） → `(RunState) → { nextRun, events }` 純粋関数
- `renderTo(id, html, bindings)` パターン → React コンポーネント + JSX
- グローバル CSS → styled-components でスコープ化

### ファイル配置

```
src/features/primal-path/
├── index.ts                  # re-export
├── PrimalPathGame.tsx         # メインオーケストレータ
├── types.ts                   # 型定義
├── constants.ts               # ゲームデータ定数
├── game-logic.ts              # 純粋関数
├── sprites.ts                 # Canvas 描画
├── audio.ts                   # SFX エンジン
├── storage.ts                 # localStorage ラッパー
├── contracts.tsx              # DbC アサーション
├── styles.ts                  # styled-components
├── hooks.ts                   # カスタムフック
├── components/                # 画面コンポーネント群
└── __tests__/                 # テスト
```

## 実装フェーズ

### Phase 0: 基盤 ✅
- types.ts, constants.ts, contracts.tsx 作成

### Phase 1: 純粋ロジック層 ✅
- game-logic.ts, sprites.ts, audio.ts, storage.ts 作成
- HTML からの純粋関数抽出・イミュータブル化

### Phase 2: フック層 ✅
- hooks.ts 作成（useGameState, useBattle, useAudio, useOverlay, usePersistence）

### Phase 3: UI コンポーネント層 ✅
- styles.ts, shared.tsx, 全11画面コンポーネント作成

### Phase 4: メインコンポーネント統合 ✅
- PrimalPathGame.tsx 全面書き換え

### Phase 5: クリーンアップ ✅
- primal-path.html 削除
- webpack.config.ts から .html ルール削除
- declarations.d.ts から *.html 型宣言削除
- テスト作成（49テスト全通過）
- ドキュメント更新

## 技術的考慮事項

### ステート管理

- `useReducer` で24個のミュータブル変数を一元管理
- reducer は純粋関数 game-logic.ts を呼ぶだけでテスト容易
- フェーズ遷移で旧UIは unmount されるため、ダブルクリックガード不要

### Canvas 描画

- ピクセルアートスプライトは React コンポーネント化せず Canvas を維持
- `useRef` + `useEffect` で Canvas ライフサイクル管理

### Overlay システム

- Promise キューで通知を逐次表示
- original の `ov('...').then(nextAction)` チェーンを再現

### CSS スコープ

- `GameContainer` に `font-family: 'Courier New'` 等を閉じ込め
- グローバル CSS (`*{margin:0}`) の漏洩を完全防止

## 検証方法

1. **ユニットテスト**: `npm test` — 49テスト全通過
2. **ビルド確認**: `npm run build` — エラーなし
3. **手動確認**: タイトル → ゲーム開始 → 自動戦闘 → ゲームオーバー
4. **リグレッション**: 既存ゲームページへの影響なし
