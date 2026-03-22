---
name: seo-performance
description: Core Web Vitals とページ速度の最適化を行います。LCP・INP・CLS の各指標を分析し、具体的な改善を実装します。
---

# Core Web Vitals・ページ速度最適化

Core Web Vitals（LCP, INP, CLS）とページ速度を分析・最適化します。

## 最適化手順

### 1. LCP（Largest Contentful Paint）最適化

LCP の目標: 2.5 秒以内

- **画像最適化**
  - 最適フォーマットの使用（WebP / AVIF）
  - 適切なサイズへのリサイズ（srcset / sizes）
  - ファーストビュー画像に `fetchpriority="high"` を設定
  - ファーストビュー画像の `loading="lazy"` を除去

- **プリロード**
  - LCP 要素のリソースを `<link rel="preload">` で事前読み込み
  - Web フォントのプリロード

- **クリティカル CSS**
  - ファーストビューに必要な CSS をインライン化
  - 残りの CSS は非同期読み込み

- **サーバー応答時間**
  - CDN の活用
  - サーバーサイドキャッシュの設定

### 2. INP（Interaction to Next Paint）最適化

INP の目標: 200ms 以内

- **JavaScript の最適化**
  - 長時間タスクの分割（50ms 以下のチャンクに）
  - `requestIdleCallback` / `scheduler.yield()` の活用
  - 不要な JavaScript の削除・遅延読み込み

- **スクリプト読み込み戦略**
  - `defer` / `async` の適切な使用
  - サードパーティスクリプトの遅延読み込み
  - 重い処理の Web Worker への移行

- **イベントハンドラの最適化**
  - デバウンス・スロットルの適用
  - パッシブイベントリスナーの使用（`{ passive: true }`）

### 3. CLS（Cumulative Layout Shift）最適化

CLS の目標: 0.1 以下

- **サイズ指定**
  - 画像・動画に `width` / `height` 属性を明示
  - `aspect-ratio` CSS プロパティの活用

- **スペース予約**
  - 広告・埋め込みコンテンツの領域を事前確保
  - 動的コンテンツの挿入位置をビューポート外に配置

- **フォント**
  - `font-display: swap` または `font-display: optional` の設定
  - フォントのプリロード
  - フォールバックフォントのサイズ調整

### 4. 一般的な速度最適化

- **通信プロトコル**: HTTP/2 の有効化
- **圧縮**: Brotli / gzip の有効化
- **キャッシュ**: Cache-Control ヘッダーの適切な設定
- **コード分割**: ルートベースのコード分割
- **ツリーシェイキング**: 未使用コードの除去

### 5. 改善の計測

- 改善前後で Lighthouse スコアを比較
- フィールドデータ（CrUX）での確認方法を案内
- 継続的なモニタリング方法を提案

## 連携スキル

- パフォーマンス以外の SEO 問題には `seo-page-audit` や `seo-review` を活用できます
- 改善の実装には `seo-implement` を併用してください
