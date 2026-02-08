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
  quiz-data.ts              # クイズデータ（カテゴリ別・難易度別）
  hooks/
    useGame.ts              # ゲーム状態管理フック
    useCountdown.ts         # カウントダウンタイマー
    useFade.ts              # フェードアニメーション
  components/
    TitleScreen.tsx          # タイトル画面
    SprintStartScreen.tsx    # スプリント開始画面
    QuizScreen.tsx           # クイズ画面
    RetrospectiveScreen.tsx  # 振り返り画面
    ResultScreen.tsx         # 結果画面
  audio/
    sound.ts                 # 効果音・BGM
src/pages/AgileQuizSugorokuPage.tsx  # ページコンポーネント（約160行）
```

### 状態管理

- React Hooks（`useState`, `useCallback`, `useMemo`, `useRef`）
- カスタムフック（`useGame`, `useCountdown`, `useFade`）で関心を分離

### 使用技術

- **CSS Animation**: フェードイン/アウトエフェクト
- **Web Audio API**: 効果音・BGM
- **コンボシステム**: 連続正解でボーナス
- **技術的負債イベント**: 不正解蓄積でペナルティ発生
- **スプリント管理**: ベロシティ計算、振り返り、エンジニアタイプ診断
