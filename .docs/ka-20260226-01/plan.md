# KEYS & ARMS ブラッシュアップ計画

## 概要

KEYS & ARMS は Game & Watch 風のレトロ LCD アクションゲーム（React + Canvas）。3ステージ（洞窟→草原→城）× 3ループ構成で、EngineContext パターン（クロージャベース）により `engine.ts` を中心に実装されている。

レトロ LCD の美学を維持しつつ、3フェーズで品質改善・ユーザー体験向上を実施する。

### 現状の課題

| 課題 | 詳細 |
|------|------|
| メタデータ不正確 | `game-notices.ts` L81-86 で `hasAudio: false` / `hasFlashing: false` だが、実際は Web Audio API で音声生成（`core/audio.ts`）し、ダメージフラッシュ等の視覚エフェクト（`engine.ts` L214-219）もある |
| ポーズ機能なし | 他ゲーム（LOS 等）にはあるが KEYS & ARMS にはない。ESC はリセット確認のみ（`engine.ts` L162-164） |
| テスト不足 | `difficulty.test.ts`（23ケース）のみ。他ゲームは 80-234 テスト |
| 操作説明不足 | タイトル画面下部に小さく表示のみ（`title.ts` L67-69）。専用ガイド画面がない |
| ステージ間演出が弱 | トランジションテキストが短い。`hud.ts` の `transTo()` はテキスト1行のみ対応 |

## ブランチ戦略

- ブランチ名: `feature/los-brushup`（LOS ブラッシュアップと同一ブランチで実施）
- `main` から分岐
- 各 Phase 完了時にテスト・ビルド確認

## 設計判断

1. **ポーズキーに `P` を採用**: ESC は既存のリセット確認（`engine.ts` L162-164）で使用中のため、共存のために専用キー `P` を使用
2. **`@ts-nocheck` は解消しない**: 元 HTML 忠実移植のため型安全化は数千行規模の変更が必要。ブラッシュアップの本質ではない
3. **3フェーズ構成**: LOS は4フェーズだが、KEYS & ARMS はゲームプレイの本質を変えないため3フェーズで十分

---

## Phase 1: 基盤整備・メタデータ修正

### 目的

正確なゲーム情報提供、ポーズ機能追加、テスト基盤構築。

### タスク

1. **`game-notices.ts` メタデータ修正** — `hasAudio: true`, `hasFlashing: true` に変更
2. **ポーズ機能追加** — `P` キーでポーズ/再開（ESC の既存リセット確認は維持）
   - `engine.ts` L56 の G オブジェクトに `paused: false` プロパティ追加
   - `gameTick()` (L146) にポーズトグル・スキップ処理を追加
   - `render()` (L196) にポーズオーバーレイ描画を追加
   - `KeysAndArmsGame.tsx` に PAUSE ボタン追加、`P` キーを preventDefault 対象に追加
3. **テスト基盤構築** — `math.test.ts`, `particles.test.ts` を新規作成
4. **`README.md` 更新** — 操作方法にポーズ機能追記、注意事項（音声・フラッシュ）追記

### 依存関係

- ポーズ機能とテスト基盤は並行作業可能
- README 更新はポーズ機能完了後

### リスク

- **ポーズと ESC の共存** — 専用キー `P` で解決。ESC 押下時はポーズ中でもリセット確認に入る仕様とする
- **PAUSE ボタン配置** — ShellHeader 内のスペースに RST ボタンと並べる形で配置

---

## Phase 2: ユーザー体験・演出強化

### 目的

初見プレイヤーへの情報提供、ステージ間・戦闘演出の強化。

### タスク

1. **操作ガイド画面** — タイトルで ↑ キー押下 → 3ページのヘルプ画面を表示
   - 新規ファイル `screens/help.ts` — `createHelpScreen(ctx)` ファクトリ
   - `engine.ts` の G オブジェクトに `helpPage: 0` 追加、switch 文に `'help'` ケース追加
   - `title.ts` にヘルプ画面への遷移ロジック追加
2. **トランジション演出強化** — `hud.ts` の `transTo()` にサブテキスト対応
   - `transTo(t, fn)` → `transTo(t, fn, sub)` にシグネチャ拡張
   - トランジション時間を 42 → 56 ティックに延長
   - `drawTrans()` にサブテキスト描画を追加
3. **洞窟ドアのグロー強化** — 外側+内側グロー、全鍵設置時のゴールドフラッシュ演出
4. **ボス演出強化** — レイジウェーブフラッシュ強化、宝石光柱演出

### 依存関係

- 操作ガイド画面とトランジション強化は並行作業可能
- 洞窟・ボス演出は独立して作業可能

### リスク

- **ヘルプ画面のステート管理** — `G.state = 'help'` は既存の switch 文すべてに影響。gameTick / render 両方のカバーが必要
- **トランジション時間延長** — ゲームテンポに影響する可能性。プレイテストで確認

---

## Phase 3: テスト拡充・仕上げ

### 目的

新機能のテスト確保、全体の品質確認。

### タスク

1. **テスト新規作成**
   - `audio.test.ts` — AudioContext モック化、SFX 呼び出し検証
   - `rendering.test.ts` — Canvas 描画ヘルパーの検証
   - `pause.test.ts` — ポーズ機能の状態遷移テスト
   - `help.test.ts` — ヘルプ画面のページ遷移テスト
2. **全テスト通過・ビルド成功確認**
3. **ブラウザ検証** — 全3ステージ通しプレイ、ポーズ機能、ヘルプ画面、演出強化、モバイル確認

### 依存関係

- Phase 1, 2 の全タスク完了後

### リスク

- **Canvas/AudioContext モック化** — `@ts-nocheck` 環境でのテストは型安全でないため、ランタイムエラーに注意
- **テスト目標: 50ケース以上** — 既存 23 + 新規 27 以上 → **実績: 80 ケース達成**

---

## 変更ファイル一覧

| 操作 | ファイル | 内容 |
|------|---------|------|
| 変更 | `src/constants/game-notices.ts` | hasAudio/hasFlashing → true |
| 変更 | `src/features/keys-and-arms/engine.ts` | ポーズ、help ステート追加 |
| 変更 | `src/features/keys-and-arms/KeysAndArmsGame.tsx` | PAUSE ボタン、P キー |
| 変更 | `src/features/keys-and-arms/styles.ts` | PAUSE ボタンスタイル |
| 変更 | `src/features/keys-and-arms/core/hud.ts` | transTo サブテキスト対応 |
| 変更 | `src/features/keys-and-arms/stages/cave/index.ts` | ドアグロー強化 |
| 変更 | `src/features/keys-and-arms/stages/boss/index.ts` | 演出強化 |
| 変更 | `src/features/keys-and-arms/screens/title.ts` | HELP 遷移追加、startGame に transTo 適用 |
| 変更 | `src/features/keys-and-arms/screens/ending.ts` | transTo サブテキスト追加 |
| 変更 | `src/features/keys-and-arms/screens/true-end.ts` | transTo サブテキスト追加 |
| 変更 | `src/features/keys-and-arms/README.md` | 操作説明・注意事項追記 |
| 新規 | `src/features/keys-and-arms/screens/help.ts` | 操作ガイド画面 |
| 新規 | `src/features/keys-and-arms/__tests__/math.test.ts` | 数学ユーティリティテスト |
| 新規 | `src/features/keys-and-arms/__tests__/particles.test.ts` | パーティクルテスト |
| 新規 | `src/features/keys-and-arms/__tests__/audio.test.ts` | オーディオテスト |
| 新規 | `src/features/keys-and-arms/__tests__/rendering.test.ts` | 描画テスト |
| 新規 | `src/features/keys-and-arms/__tests__/pause.test.ts` | ポーズテスト |
| 新規 | `src/features/keys-and-arms/__tests__/help.test.ts` | ヘルプ画面テスト |

## 検証方法

1. `npm test` — 全テスト通過確認
2. `npm run build` — ビルド成功確認
3. ブラウザ確認 — ポーズ機能、ヘルプ画面、演出強化、全3ステージ通しプレイ

---

## 実装結果

### 完了日

2026-02-26（全 41 実装タスク完了）

### 実績サマリー

| 項目 | 計画 | 実績 |
|------|------|------|
| 実装タスク | 41 | 41（全完了） |
| テストケース | 70（目標 50+） | 80 |
| テストスイート | 7 | 7 |
| 変更ファイル | 9 | 11 |
| 新規ファイル | 7 | 7 |
| ビルド | — | 成功 |

### 計画外の追加変更

トランジション演出の一貫性を確保するため、以下のファイルも追加で変更した:

- `screens/ending.ts` — エンディング → ループ 2 遷移にサブテキスト `'HARDER!'` を追加
- `screens/true-end.ts` — 真エンディング → ループ 4 遷移にサブテキスト `'HARDER!'` を追加
- `screens/title.ts` — ゲーム開始時に `G.cavInit()` 直接呼び出し → `transTo('CAVE', G.cavInit, 'FIND 3 KEYS')` に変更

### 残作業

- ブラウザ検証 17 項目（手動確認待ち）
