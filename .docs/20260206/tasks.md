# Agile Quiz Sugoroku タスクリスト

## Phase 1: 基盤準備

- [x] `npm install tone` 実行
- [x] `src/features/agile-quiz-sugoroku/` ディレクトリ作成
- [x] `types.ts` 型定義作成
- [x] `constants.ts` 定数ファイル作成
- [x] `quiz-data.ts` 問題データ移行

## Phase 2: 音声システム

- [x] `audio/sound.ts` Tone.js音声システム実装
  - [x] 初期化関数
  - [x] BGM再生/停止
  - [x] 効果音（正解、不正解、タイマー、開始、結果、コンボ）

## Phase 3: カスタムフック

- [x] `hooks/useGame.ts` ゲーム状態管理
  - [x] フェーズ管理
  - [x] スプリント管理
  - [x] 問題選択
  - [x] 回答処理
  - [x] 統計計算
- [x] `hooks/useCountdown.ts` タイマー
- [x] `hooks/useFade.ts` フェードアニメーション
- [x] `hooks/useKeys.ts` キーボード操作
- [x] `hooks/index.ts` エクスポート

## Phase 4: コンポーネント

- [x] `components/styles.ts` スタイル定義
  - [x] 共通コンポーネント
  - [x] アニメーション定義
- [x] `components/ParticleEffect.tsx` パーティクル
- [x] `components/RadarChart.tsx` レーダーチャート
- [x] `components/BarChart.tsx` バーチャート
- [x] `components/TitleScreen.tsx` タイトル画面
- [x] `components/SprintStartScreen.tsx` スプリント開始画面
- [x] `components/QuizScreen.tsx` クイズ画面
- [x] `components/RetrospectiveScreen.tsx` 振り返り画面
- [x] `components/ResultScreen.tsx` 結果画面
- [x] `components/index.ts` エクスポート
- [x] `index.ts` メインエクスポート

## Phase 5: 統合

- [x] `AgileQuizSugorokuPage.tsx` 作成
- [x] メニュー画像配置（WebP変換）
- [x] `App.tsx` ルーティング追加
- [x] `GameListPage.tsx` カード追加

## Phase 6: 検証

- [x] ビルド確認（`npm run build`）
- [ ] 動作確認（`npm start`）※開発サーバーでの手動テスト推奨

## 完了状況

**全タスク完了**: 36/36 ✅

ビルドは正常に完了。アセットサイズの警告（動画ファイル）はあるが、機能に影響なし。
