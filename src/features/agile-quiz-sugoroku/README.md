# Agile Quiz Sugoroku（アジャイル・クイズ・すごろく）

## 概要

アジャイル開発・スクラムに関するクイズに答えてすごろくを進む教育ゲーム。
3スプリントを走破し、スコアとベロシティからエンジニアタイプを診断。
技術的負債が溜まると緊急対応イベントが発生するリアルなスプリント体験。

## 操作方法

- **マウスクリック**: 選択肢を選択

## 技術詳細

### ファイル構成

```
src/features/agile-quiz-sugoroku/
  index.ts                  # barrel export
  types.ts                  # 型定義
  constants.ts              # ゲーム設定定数
  game-logic.ts             # ゲームロジック（純粋関数）
  quiz-data.ts              # 互換エクスポート（questions/を再公開）
  questions/
    index.ts                # カテゴリ別問題データの集約
    planning.json           # planningカテゴリ問題データ
    impl1.json              # impl1カテゴリ問題データ
    test1.json              # test1カテゴリ問題データ
    refinement.json         # refinementカテゴリ問題データ
    impl2.json              # impl2カテゴリ問題データ
    test2.json              # test2カテゴリ問題データ
    review.json             # reviewカテゴリ問題データ
    emergency.json          # emergencyカテゴリ問題データ
  hooks/
    useGame.ts              # ゲーム状態管理フック
    useCountdown.ts         # カウントダウンタイマー
    useFade.ts              # フェードアニメーション
    useKeys.ts              # キーボード入力
    index.ts                # barrel export
  components/
    TitleScreen.tsx          # タイトル画面
    SprintStartScreen.tsx    # スプリント開始画面
    QuizScreen.tsx           # クイズ画面
    RetrospectiveScreen.tsx  # 振り返り画面
    ResultScreen.tsx         # 結果画面
    BarChart.tsx             # 棒グラフ
    RadarChart.tsx           # レーダーチャート
    ParticleEffect.tsx       # パーティクルエフェクト
    index.ts                 # barrel export
    styles/
      animations.ts          # アニメーション
      common.ts              # 共通スタイル
      layout.ts              # レイアウト
      quiz.ts                # クイズスタイル
      result.ts              # 結果スタイル
      index.ts               # barrel export
  audio/
    sound.ts                 # 効果音・BGM
  __tests__/                 # ユニットテスト
    components.test.tsx
    constants.test.ts
    game-logic.test.ts
    questions.test.ts
src/pages/AgileQuizSugorokuPage.tsx  # ページコンポーネント（薄いラッパー）
```

### 状態管理

- React Hooks（`useState`, `useCallback`, `useMemo`, `useRef`）
- カスタムフック（`useGame`, `useCountdown`, `useFade`, `useKeys`）で関心を分離

### 使用技術

- **CSS Animation**: フェードイン/アウトエフェクト
- **Web Audio API**: 効果音・BGM
- **コンボシステム**: 連続正解でボーナス
- **技術的負債イベント**: 不正解蓄積でペナルティ発生
- **スプリント管理**: ベロシティ計算、振り返り、エンジニアタイプ診断
