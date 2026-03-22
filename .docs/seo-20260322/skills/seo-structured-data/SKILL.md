---
name: seo-structured-data
description: JSON-LD 構造化データの設計・生成・検証を行います。Schema.org の最新仕様に基づき、適切なスキーマタイプの選定から実装・検証までをサポートします。
---

# 構造化データ（JSON-LD）

JSON-LD 構造化データの設計・生成・検証を Schema.org 仕様に基づいて行います。

## 手順

### 1. ページの分析

- ページの種類・目的を特定する（記事、商品、FAQ、レシピ等）
- ページ内の主要コンテンツ要素を確認する
- 既存の構造化データがあれば確認する

### 2. スキーマタイプの選定

ページ種別に応じた適切なスキーマを選定:

| ページ種別 | 推奨スキーマ |
|-----------|-------------|
| 記事・ブログ | Article, BlogPosting |
| 商品ページ | Product, Offer |
| FAQ | FAQPage, Question |
| ハウツー | HowTo, Step |
| レシピ | Recipe |
| イベント | Event |
| 組織情報 | Organization, LocalBusiness |
| パンくず | BreadcrumbList |
| 動画 | VideoObject |
| レビュー | Review, AggregateRating |
| 求人 | JobPosting |
| ソフトウェア | SoftwareApplication |

**非推奨スキーマの回避**:
- 非推奨・廃止予定のプロパティを使用しない
- Google がサポートするリッチリザルト対応スキーマを優先する

### 3. JSON-LD の生成

- `@context`, `@type` を正しく設定する
- 必須プロパティを漏れなく含める
- 推奨プロパティを可能な限り含める
- ページ内容と一致するデータのみを記述する（内容不一致はスパム判定リスク）
- ネストされたスキーマは `@type` を明示する

### 4. 品質チェック

- **構文検証**: JSON の構文エラーがないか
- **内容一致性**: JSON-LD の内容がページの可視コンテンツと一致するか
- **必須プロパティ**: Google のリッチリザルト要件を満たしているか
- **URL の有効性**: 画像・リンクの URL が有効か
- **日付フォーマット**: ISO 8601 形式（YYYY-MM-DD）で記述されているか

### 5. 実装

- `<script type="application/ld+json">` でページに埋め込む
- フレームワークに応じた適切な配置場所を選択する
- 複数スキーマがある場合は配列または個別の script タグで記述する

## 実装例

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "記事のタイトル",
  "author": {
    "@type": "Person",
    "name": "著者名"
  },
  "datePublished": "2026-01-01",
  "dateModified": "2026-03-01",
  "image": "https://example.com/image.jpg",
  "publisher": {
    "@type": "Organization",
    "name": "組織名",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png"
    }
  }
}
```

## 連携スキル

- ページ全体の SEO 分析には `seo-page-audit` を活用できます
- 構造化データの実装は `seo-implement` と組み合わせると効果的です
