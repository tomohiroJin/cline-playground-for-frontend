# KEYS & ARMS

## 概要

Game & Watch 風のアクションゲームを React コンポーネントとして完全移植した版です。
元の HTML ファイル（2,522行）のゲームロジックを `engine.ts` のクロージャに格納し、
React は薄いラッパーとしてのみ機能します。

## 配置構成

```text
src/features/keys-and-arms/engine.ts           # ゲームエンジン本体（createEngine クロージャ）
src/features/keys-and-arms/KeysAndArmsGame.tsx  # React ラッパー（Canvas + 仮想パッド）
src/features/keys-and-arms/styles.ts            # styled-components スタイル
src/pages/KeysAndArmsPage.tsx                   # ページコンポーネント
```

## 実装方針

- ゲームロジック（2,458行）は元コードをそのまま維持
- 改変は DOM 参照の差し替え（10箇所未満）のみ
- localStorage キー `kaG` でハイスコア保存（元実装と同一）
- フォント `Press Start 2P` は public/index.html でプリロード

## 起動URL

- `/keys-and-arms`
