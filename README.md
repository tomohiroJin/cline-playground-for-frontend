# Game Platform

ブラウザで遊べる複数のゲームをまとめた、React + TypeScript のゲームプラットフォームです。
トップページから各ゲームにアクセスし、共通の設定やハイスコア保存、SNSシェアに対応しています。

## 収録ゲーム

| ゲーム | ジャンル | 詳細 |
|--------|----------|------|
| Picture Puzzle | パズル | [README](src/features/picture-puzzle/README.md) |
| Air Hockey | スポーツ | [README](src/features/air-hockey/README.md) |
| Racing Game | レース | [README](src/features/racing-game/README.md) |
| Falldown Shooter | シューティング | [README](src/features/falldown-shooter/README.md) |
| Labyrinth of Shadows | ホラー迷路 | [README](src/features/labyrinth-of-shadows/README.md) |
| Deep Sea Interceptor | シューティング | [README](src/features/deep-sea-interceptor/README.md) |
| Non-Brake Descent | ランニングアクション | [README](src/features/non-brake-descent/README.md) |
| IPNE | ローグライクRPG | [README](src/features/ipne/README.md) |
| Agile Quiz Sugoroku | クイズ / 教育 | [README](src/features/agile-quiz-sugoroku/README.md) |
| 迷宮の残響 | テキスト探索ローグライト | [README](src/features/labyrinth-echo/README.md) |
| RISK LCD | レーン回避×ローグライトビルド | [README](src/features/risk-lcd/README.md) |
| KEYS & ARMS | レトロLCDアクション（React コンポーネント移植済） | [README](src/features/keys-and-arms/README.md) |
| 原始進化録 - PRIMAL PATH | 自動戦闘ローグライト | [README](src/features/primal-path/README.md) |

## 主な機能

- ゲーム一覧ページからの起動
- 設定パネル（音量 / 操作方法 / FPS表示 / アニメーション軽減）
- ハイスコアの永続化（localStorage）
- SNSシェア（Web Share API / X共有）
- アクセシビリティ対応（ランドマーク / ARIA）
- コード分割による初期ロード軽量化

## 技術スタック

- **言語**: TypeScript
- **フレームワーク**: React 19.0.0
- **ルーティング**: React Router 7.3.0
- **スタイリング**: styled-components 6.1.16
- **状態管理**: Jotai 2.12.2
- **オーディオ**: Tone.js 15.1.22
- **ビルドツール**: Webpack 5.98.0
- **テスト**: Jest 30.2.0

## セットアップ

```bash
# 依存パッケージをインストール
npm install

# 開発サーバーを起動（http://localhost:3000）
npm start

# 本番ビルド
npm run build

# 本番ビルドをローカルで確認
npm run preview
```

## テスト

```bash
# テストを実行
npm test

# テストカバレッジ
npm run test:coverage
```

## プロジェクト構成

```text
src/
  ├── assets/                    # 画像・音声などのアセット
  ├── components/                # UIコンポーネント
  │   ├── atoms/
  │   ├── molecules/
  │   └── organisms/
  ├── features/                  # ゲームごとのモジュール分割済み実装
  ├── hooks/                     # カスタムフック
  ├── pages/                     # 各ゲームページ
  ├── store/                     # Jotai アトム
  ├── styles/                    # GlobalStyle など共通スタイル
  ├── types/                     # TypeScript 型定義
  ├── utils/                     # ストレージ・共有・math-utils などのユーティリティ
  ├── App.tsx                    # ルート
  └── index.tsx                  # エントリーポイント
```

## 開発者向け情報

### スタイル注入（styled-components）に関する注意

本番ビルドでは `styled-components` が CSSOM（`insertRule`）でスタイルを注入します。
このとき `createGlobalStyle` 内に `@import` があると注入に失敗し、`npm run preview` など本番相当でスタイルが空になることがあります。
そのため、フォント読み込みは `public/index.html` の `<link rel="stylesheet">` で行い、`createGlobalStyle` には `@import` を書かない方針とします。

## ライセンス

MIT
