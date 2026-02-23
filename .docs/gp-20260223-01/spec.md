# ゲームプラットフォーム ブラッシュアップ仕様書

## SEO 対策

### meta タグ
- description: 「13種類の無料ブラウザゲームが楽しめるゲームプラットフォーム」
- keywords: 全13ゲーム名を含む
- og:url: `https://niku9.click/`
- og:image: プレースホルダー URL
- canonical: `https://niku9.click/`

### robots.txt
- 全クロール許可
- sitemap URL 記載

### sitemap.xml
- 14 URL（トップ + 13ゲーム）
- lastmod: 2025-01-01

### manifest.json
- PWA 基盤設定
- name: Game Platform
- start_url: /

### 動的タイトル
- useDocumentTitle フックで各ページのタイトルを設定
- フォーマット: `ゲーム名 | Game Platform`

### 構造化データ
- JSON-LD（WebSite スキーマ）を index.html に静的追加

## コピーライト

- `© 2025 niku9.click`
- ドメインリンク付き（`https://niku9.click/`）

## ヘッダー/フッター重なり対策

### 対象ゲーム
- IPNE (`/ipne`)
- RISK LCD (`/risk-lcd`)
- Maze Horror (`/maze-horror`)
- PRIMAL PATH (`/primal-path`)

### 動作
- フルスクリーンゲームページではヘッダー・フッターを非表示
- 代わりにフローティングホームボタンを表示
  - position: fixed, z-index: 200
  - 左上に配置
  - 半透明背景の丸ボタン
  - クリックでトップページへ遷移

## 注意書き

### 表示条件
- 各ゲーム初回アクセス時にモーダル表示
- OK ボタンで閉じたら localStorage に記録
- 2回目以降はスキップ

### 内容
- 推奨ブラウザ: Chrome / Edge 最新版
- 音声使用ゲーム: 「音量にご注意ください」
- 点滅エフェクトあり: 「光の点滅表現を含みます」
- 共通免責: 「当サイトのゲームは学習・趣味目的で制作されたものです」
