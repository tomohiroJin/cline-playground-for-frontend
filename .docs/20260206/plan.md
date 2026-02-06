# Agile Quiz Sugoroku 実装計画

## プロジェクト概要

既存の Game Platform に「Agile Quiz Sugoroku（アジャイル・クイズすごろく）」を9番目のゲームとして統合する。

### 元ゲームの特徴
- **ゲーム種別**: アジャイル・スクラム学習クイズゲーム
- **技術**: React + Tone.js（音声生成）
- **画面構成**: タイトル → スプリント開始 → クイズ → 振り返り → 結果
- **問題カテゴリ**: プランニング、実装、テスト、リファインメント、レビュー、緊急対応
- **独自システム**: 技術的負債、コンボ、エンジニアタイプ診断

## 実装アプローチ

### 変換作業
1. JSX → TSX（型安全性）
2. インラインスタイル → styled-components
3. 単一ファイル → モジュール分割

### ファイル構成
```
src/
├── pages/
│   └── AgileQuizSugorokuPage.tsx          # メインページ
├── features/
│   └── agile-quiz-sugoroku/
│       ├── index.ts                        # エクスポート
│       ├── types.ts                        # 型定義
│       ├── constants.ts                    # 定数・設定
│       ├── quiz-data.ts                    # 問題データ
│       ├── audio/
│       │   └── sound.ts                    # Tone.js音声
│       ├── components/
│       │   ├── styles.ts                   # スタイル定義
│       │   ├── TitleScreen.tsx
│       │   ├── SprintStartScreen.tsx
│       │   ├── QuizScreen.tsx
│       │   ├── RetrospectiveScreen.tsx
│       │   ├── ResultScreen.tsx
│       │   ├── RadarChart.tsx
│       │   ├── BarChart.tsx
│       │   └── ParticleEffect.tsx
│       └── hooks/
│           ├── useGame.ts
│           ├── useCountdown.ts
│           ├── useFade.ts
│           └── useKeys.ts
└── assets/images/
    └── agile_quiz_sugoroku_card_bg.webp   # メニュー画像
```

## 実装フェーズ

### Phase 1: 基盤準備 ✅
- tone パッケージをインストール
- ディレクトリ構造を作成
- 型定義、定数、問題データを移行

### Phase 2: 音声システム ✅
- Tone.js による BGM・効果音システムを実装

### Phase 3: カスタムフック ✅
- useGame（ゲーム状態管理）
- useCountdown（タイマー）
- useFade（フェードアニメーション）
- useKeys（キーボード操作）

### Phase 4: コンポーネント ✅
- スタイル定義（styled-components）
- 各画面コンポーネント（5画面）
- チャート・エフェクトコンポーネント

### Phase 5: 統合 ✅
- AgileQuizSugorokuPage.tsx 作成
- メニュー画像配置（WebP変換）
- App.tsx ルーティング追加
- GameListPage.tsx カード追加

### Phase 6: 検証 ✅
- ビルド確認（npm run build）

## リスクと対策

| リスク | 対策 |
|--------|------|
| Tone.js の互換性 | 既存プロジェクトと同じバンドラー設定を使用 |
| 型定義の複雑さ | 段階的に型を追加、any を避ける |
| スタイルの統一 | グラスモーフィズムデザインを維持 |

## 完了状況

- ✅ Phase 1〜6 全て完了
- ✅ ビルド成功（warning 1件のみ、機能に影響なし）
