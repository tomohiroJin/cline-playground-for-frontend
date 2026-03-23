---
name: seo-implement
description: テクニカル SEO の実装・修正を行います。メタタグ、構造化データ、サイトマップ、Core Web Vitals、モバイル対応などを実装します。
---

# SEO 実装・修正

テクニカル SEO の実装・修正を体系的に行います。

## エージェント参照

詳細な実装知識は `agents/seo-engineer.yaml` を参照してください。
エージェントファイルが見つからない場合は、以下の手順で完結できます。

## 実装手順

### 1. プロジェクトの技術スタック確認

- フレームワーク・レンダリング方式を特定する（SSR / SSG / CSR / ISR）
- レンダリング方式に応じた SEO 実装戦略を決定する
- 使用中の SEO 関連ライブラリ・プラグインを確認する

### 2. 既存の SEO 設定を把握

- メタタグ（title, description, canonical, robots）の現状を確認
- 構造化データ（JSON-LD）の有無を確認
- サイトマップ・robots.txt の状態を確認
- OGP / Twitter Card の設定を確認

### 3. 実装対象領域の選択

ユーザーの依頼に応じて以下から実装対象を選択:

- **メタタグ**: title, description, canonical, robots, viewport
- **構造化データ**: JSON-LD（Article, BreadcrumbList, Product 等）
- **サイトマップ**: sitemap.xml の生成・更新
- **robots.txt**: クロール制御の設定
- **Core Web Vitals**: LCP, INP, CLS の改善
- **モバイル対応**: レスポンシブデザイン、viewport 設定
- **国際化**: hreflang タグの設定
- **OGP / SNS**: og:title, og:description, og:image, Twitter Card

### 4. 実装

- 既存のコードパターンに一貫した方法で実装する
- フレームワーク固有のベストプラクティスに従う
- SEO に影響するレンダリングの問題に注意する（CSR のインデックス問題等）

### 5. 実装後の検証

- HTML 出力にメタタグが正しく含まれているか確認
- 構造化データの構文エラーがないか検証
- ビルドエラー・テストの失敗がないか確認

## 連携スキル

- 実装前の調査には `seo-page-audit` が有効です
- 構造化データの詳細設計には `seo-structured-data` を活用できます
- パフォーマンス最適化には `seo-performance` を参照してください
