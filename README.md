# Game Platform

ブラウザで遊べる複数のゲームをまとめた、React + TypeScript のゲームプラットフォームです。
トップページから各ゲームにアクセスし、共通の設定やハイスコア保存、SNSシェアに対応しています。

## 収録ゲーム

- Picture Puzzle（絵合わせパズル）
- Air Hockey（エアホッケー）
- Racing Game（トップダウンレース）
- Falldown Shooter（落下型シューティング）
- Labyrinth of Shadows（迷宮ホラー）
- Deep Sea Interceptor（縦スクロールシューティング）

## 主な機能

- ゲーム一覧ページからの起動
- 設定パネル（音量 / 操作方法 / FPS表示 / アニメーション軽減）
- ハイスコアの永続化（localStorage）
- SNSシェア（Web Share API / X共有）
- アクセシビリティ対応（ランドマーク / ARIA）
- コード分割による初期ロード軽量化

## 技術スタック

- **言語**: TypeScript
- **フレームワーク**: React
- **スタイリング**: styled-components
- **状態管理**: Jotai
- **ルーティング**: React Router
- **テスト**: Jest

## セットアップ

```bash
# 依存パッケージをインストール
npm install

# 開発サーバーを起動
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
  ├── pages/                     # 各ゲームページ
  ├── styles/                    # GlobalStyle など共通スタイル
  ├── store/                     # Jotai アトム
  ├── utils/                     # ストレージ・共有などのユーティリティ
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
