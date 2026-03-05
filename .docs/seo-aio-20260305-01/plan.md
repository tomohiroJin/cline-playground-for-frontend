# SEO 強化・AIO 対策・情報ページ ビジュアルブラッシュアップ計画

## 1. 背景と目的

### 1.1 背景

前回の UI/UX 改善（`ui-20260303-01`）で以下を実施済み:

- JSON-LD 構造化データ（VideoGame + BreadcrumbList スキーマ）
- sitemap.xml の拡充（lastmod / priority / changefreq）
- 動的 meta description / OGP / document title
- theme-color メタタグ
- パフォーマンスヒント（フォント preload）

今回は **SEO のさらなる深化**、**AIO（AI Optimization）対策の新規導入**、**情報ページのビジュアル品質向上** を目的とする。

### 1.2 課題一覧

| # | 課題 | 影響度 | カテゴリ |
|---|------|--------|---------|
| 1 | Organization / ItemList スキーマが未実装（サイト全体の信頼性シグナル不足） | 高 | SEO |
| 2 | FAQ コンテンツとスキーマが未実装（AI 検索での引用率向上余地） | 高 | SEO / AIO |
| 3 | canonical URL がトップページ固定（各ページの正規 URL 未指定） | 中 | SEO |
| 4 | AI クローラーに対する robots.txt の制御が未実装 | 中 | AIO |
| 5 | llms.txt が未作成（AI によるサイト理解の補助なし） | 低 | AIO |
| 6 | 情報ページ（About / Privacy / Terms / Contact）の見た目が単調 | 高 | UI |
| 7 | 情報ページのセマンティック HTML が不十分（article / section / time 未使用） | 中 | SEO / AIO |
| 8 | About ページのコンテンツが AI 検索で引用されにくい構造 | 中 | AIO |

### 1.3 目的

1. **SEO 深化**: Organization / ItemList / FAQ スキーマ追加、動的 canonical URL、セマンティック HTML 強化
2. **AIO 対策**: AI クローラー制御、llms.txt 作成、FAQ コンテンツの構造化、AI 検索で引用されやすいコンテンツ構造
3. **情報ページ ビジュアル品質向上**: 4 つの情報ページに視覚的な魅力を追加し、サイト全体の統一感を向上

### 1.4 スコープ外

- トップページのデザイン変更（前回実施済み）
- ゲーム内部のロジック変更
- SSR / SSG の導入（将来的な検討課題として記録のみ）
- バックエンドの変更
- 新規ゲームの追加

---

## 2. 技術スタック（現状）

| カテゴリ | 技術 | バージョン |
|---------|------|-----------|
| フレームワーク | React | 19.0.0 |
| ルーティング | React Router DOM | 7.3.0 |
| スタイリング | styled-components | 6.1.16 |
| 状態管理 | Jotai | 2.12.2 |
| バンドラ | Webpack | 5.98.0 |
| テスト | Jest | 30.2.0 |
| 言語 | TypeScript | 最新 |

---

## 3. フェーズ構成

全 3 フェーズで段階的に実装する。

### フェーズ 1: SEO 強化（発展編）

**目的:** 検索エンジンでのサイト評価を向上させる構造化データとセマンティック HTML を追加する。

| 項目 | 内容 |
|------|------|
| 1-1 | Organization スキーマ（JSON-LD）を index.html に追加 |
| 1-2 | ItemList スキーマ（ゲーム一覧）をホームページに動的挿入 |
| 1-3 | FAQPage スキーマを About ページに追加 |
| 1-4 | 動的 canonical URL フック（`useCanonicalUrl`）の実装 |
| 1-5 | 情報ページのセマンティック HTML 強化（article / section / time） |
| 1-6 | 構造化データの整合性検証（既存スキーマとの `@id` 統一） |

**根拠:**
- Organization スキーマはサイト全体の信頼性シグナルとして Google が推奨
- ItemList スキーマはゲーム一覧をリッチリザルトとして表示する可能性を高める
- FAQPage スキーマは AI 検索での引用率が最も高い構造化データの一つ
- 動的 canonical URL は SPA でのページ重複インデックス防止に必須

---

### フェーズ 2: AIO（AI Optimization）対策

**目的:** AI 検索エンジン（ChatGPT Search、Perplexity、Google AI Overview 等）でコンテンツが引用されやすい構造にする。

| 項目 | 内容 |
|------|------|
| 2-1 | robots.txt に AI クローラー別の制御ルールを追加 |
| 2-2 | llms.txt の作成（サイト概要とページ一覧を Markdown で記述） |
| 2-3 | About ページに FAQ コンテンツを追加（Q&A 形式で構造化） |
| 2-4 | 全情報ページのコンテンツを AI 引用されやすい構造にリライト |
| 2-5 | E-E-A-T シグナルの強化（運営者情報の充実、制定日の明記） |

**根拠:**
- AI クローラー（GPTBot, ClaudeBot, PerplexityBot 等）のリクエスト量は Googlebot の約 20% に到達
- FAQ コンテンツを持つページの AI 引用率は非構造化コンテンツの 3.2 倍
- llms.txt は効果が未実証だが、導入コストが低く将来の標準化に備えられる
- 結論ファーストの明確な構造は AI のコンテンツ理解精度を向上させる

---

### フェーズ 3: 情報ページ ビジュアルブラッシュアップ

**目的:** About / Privacy Policy / Terms / Contact の 4 ページのビジュアル品質をトップページに匹敵するレベルに引き上げる。

| 項目 | 内容 |
|------|------|
| 3-1 | `StaticPageLayout` テンプレートの拡張（ページアイコン、セクション装飾） |
| 3-2 | About ページのリデザイン（フィーチャーカード、ゲーム統計、FAQ セクション） |
| 3-3 | Privacy Policy ページのリデザイン（条文ナンバリング装飾、アコーディオン検討） |
| 3-4 | Terms ページのリデザイン（条文ナンバリング装飾、ハイライトボックス） |
| 3-5 | Contact ページのリデザイン（コンタクトカード、メールボタン） |
| 3-6 | 情報ページ共通のスクロールリビールアニメーション適用 |
| 3-7 | パンくずリスト UI の情報ページへの追加 |

**デザイン方針:**
- 既存の Glassmorphism デザイン言語を維持
- トップページのカラーパレット（シアン〜パープルのグラデーション）を情報ページにも適用
- `prefers-reduced-motion` 対応を全アニメーションに実装
- コンテンツの可読性を最優先とし、装飾は補助的に使用

---

## 4. フェーズ間の依存関係

```
フェーズ 1（SEO 強化）    ← 独立
フェーズ 2（AIO 対策）    ← フェーズ 1 の FAQ スキーマ実装後が望ましい
フェーズ 3（情報ページ UI）← フェーズ 2 のコンテンツリライト後が望ましい
```

- フェーズ 1 は独立して実装可能
- フェーズ 2 は FAQ スキーマ（1-3）との整合性のため、フェーズ 1 完了後が望ましい
- フェーズ 3 はコンテンツ変更（フェーズ 2）を反映したビジュアル設計のため、フェーズ 2 完了後が望ましい
- ただし、フェーズ 3 の `StaticPageLayout` 拡張（3-1）は独立して着手可能

---

## 5. ファイル変更サマリ

### 変更対象ファイル

| ファイル | 変更フェーズ | 変更内容 |
|---------|-------------|---------|
| `public/index.html` | 1 | Organization スキーマ追加 |
| `public/robots.txt` | 2 | AI クローラー別制御ルール追加 |
| `public/sitemap.xml` | 1 | lastmod 更新 |
| `src/constants/game-seo-data.ts` | 1, 2 | FAQ データ追加、ItemList データ追加 |
| `src/pages/AboutPage.tsx` | 2, 3 | FAQ コンテンツ追加、ビジュアルリデザイン |
| `src/pages/PrivacyPolicyPage.tsx` | 2, 3 | コンテンツ構造改善、ビジュアルリデザイン |
| `src/pages/TermsPage.tsx` | 2, 3 | コンテンツ構造改善、ビジュアルリデザイン |
| `src/pages/ContactPage.tsx` | 2, 3 | コンテンツ構造改善、ビジュアルリデザイン |
| `src/components/templates/StaticPageLayout.tsx` | 1, 3 | セマンティック HTML 強化、ビジュアル拡張 |
| `src/App.tsx` | 1 | `useCanonicalUrl` フック呼び出し追加 |

### 新規作成ファイル

| ファイル | フェーズ | 内容 |
|---------|---------|------|
| `src/hooks/useCanonicalUrl.ts` | 1 | 動的 canonical URL フック |
| `src/hooks/useItemListSchema.ts` | 1 | ホームページ ItemList スキーマフック |
| `src/hooks/useFaqSchema.ts` | 1 | FAQ スキーマ動的挿入フック |
| `public/llms.txt` | 2 | AI 向けサイト概要ファイル |
| `src/components/molecules/Breadcrumb.tsx` | 3 | パンくずリスト UI コンポーネント |
| `src/components/molecules/SectionCard.tsx` | 3 | 情報ページ用セクションカードコンポーネント |
| `src/components/molecules/FaqAccordion.tsx` | 3 | FAQ アコーディオン UI コンポーネント |
| `src/components/atoms/InfoBadge.tsx` | 3 | 情報ページ用アイコンバッジ |

### テスト追加対象

| ファイル | 内容 |
|---------|------|
| `src/hooks/__tests__/useCanonicalUrl.test.ts` | 動的 canonical URL のテスト |
| `src/hooks/__tests__/useItemListSchema.test.ts` | ItemList スキーマのテスト |
| `src/hooks/__tests__/useFaqSchema.test.ts` | FAQ スキーマのテスト |
| `src/components/molecules/__tests__/Breadcrumb.test.tsx` | パンくずリスト UI テスト |
| `src/components/molecules/__tests__/FaqAccordion.test.tsx` | FAQ アコーディオン テスト |
| `src/pages/__tests__/AboutPage.test.tsx` | About ページリデザイン後のテスト |

---

## 6. リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| 構造化データの不整合（既存スキーマと新規スキーマの矛盾） | Google がスキーマを無視する可能性 | `@id` を統一し、Schema Markup Validator で全スキーマを検証 |
| robots.txt の AI クローラーブロックが検索表示に影響 | AI 検索結果に表示されなくなる | リアルタイム検索用クローラーは Allow、学習用のみ Disallow の戦略 |
| 情報ページのリデザインでコンテンツ可読性が低下 | ユーザー離脱率の増加 | 装飾は補助的に使用し、テキストの読みやすさを最優先 |
| SPA の制約で AI クローラーが JS を実行できない | 構造化データや動的コンテンツが認識されない | index.html の静的スキーマを充実、将来的な SSR 導入を視野に |
| FAQ コンテンツの追加でページが長くなりすぎる | ユーザー体験の低下 | アコーディオン UI で折りたたみ、必要な情報のみ表示 |
| llms.txt が AI クローラーに無視される | 導入コストが無駄になる | コストが低いため許容。効果が確認されれば拡充 |

---

## 7. 検証方法

### 自動テスト

- `npm run build` でビルドエラーがないこと
- 既存テスト + 新規テストが全て通ること
- JSON-LD の構文検証（テスト内で `JSON.parse` チェック）

### 手動検証

- [Schema Markup Validator](https://validator.schema.org/) で全スキーマを検証
- [Google Rich Results Test](https://search.google.com/test/rich-results) でリッチリザルト対象を確認
- Lighthouse SEO スコアが 95+ であること
- robots.txt の構文検証（[robots.txt テスター](https://www.google.com/webmasters/tools/robots-testing-tool)）
- 各情報ページのレスポンシブ表示確認（デスクトップ / タブレット / モバイル）
- `prefers-reduced-motion` 有効時にアニメーションが停止すること
- llms.txt がブラウザから正常にアクセスできること

---

## 8. 実装順序の推奨

1. **フェーズ 1（SEO 強化）** — 構造化データは即座に効果が現れ、他フェーズの基盤となる
2. **フェーズ 2（AIO 対策）** — FAQ スキーマとの整合性を保ちながらコンテンツを構造化
3. **フェーズ 3（情報ページ UI）** — コンテンツ確定後にビジュアルを仕上げる

---

## 9. 将来的な検討課題（スコープ外の記録）

| 課題 | 優先度 | 備考 |
|------|--------|------|
| SSR / SSG の導入 | 高 | AI クローラーの JS 実行能力に依存しない SEO / AIO を実現 |
| 各ゲームの OG 画像生成（動的） | 中 | SNS 共有時のビジュアル向上 |
| Google Search Console との連携 | 中 | インデックス状況のモニタリング |
| AI 検索パフォーマンスのトラッキング | 低 | Perplexity / ChatGPT からの流入計測 |
| AVIF 画像フォーマットの導入 | 低 | WebP より優れた圧縮率だがブラウザサポートが限定的 |
