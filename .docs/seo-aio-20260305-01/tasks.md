# SEO 強化・AIO 対策・情報ページ ビジュアルブラッシュアップ タスクチェックリスト

## 凡例

- `[ ]` 未着手
- `[~]` 作業中
- `[x]` 完了
- `[-]` スキップ / 不要

---

## フェーズ 1: SEO 強化（発展編）

### 1-1: Organization スキーマの追加

- [ ] `public/index.html` に Organization スキーマ（JSON-LD）を追加
  - [ ] `@id: "https://niku9.click/#organization"` の設定
  - [ ] `name`, `url`, `logo`, `description`, `contactPoint` の設定
  - [ ] `sameAs` に姉妹サイト URL を追加
- [ ] 既存 WebSite スキーマに `@id` と `publisher` 参照を追加
  - [ ] `@id: "https://niku9.click/#website"` の設定
  - [ ] `publisher` に Organization の `@id` を参照させる
- [ ] JSON-LD の構文検証（ブラウザコンソールで `JSON.parse` チェック）

### 1-2: ItemList スキーマ（ホームページ用）

- [ ] `src/hooks/useItemListSchema.ts` を作成
  - [ ] `useLocation` でパスを取得し、`/` の場合のみ動作
  - [ ] `GAME_SEO_DATA` から全 13 ゲームの ListItem を生成
  - [ ] `<head>` に `<script type="application/ld+json">` を動的挿入
  - [ ] アンマウント時にクリーンアップ
  - [ ] XSS 対策として `textContent` で安全に挿入
- [ ] `src/pages/GameListPage.tsx` から `useItemListSchema` を呼び出し
- [ ] テスト作成（`useItemListSchema.test.ts`）
  - [ ] ホームページで ItemList が挿入されること
  - [ ] 非ホームページでは挿入されないこと
  - [ ] 13 ゲームが全て含まれること
  - [ ] アンマウント時にスクリプトが削除されること

### 1-3: FAQPage スキーマ

- [ ] FAQ データの定数定義（`src/constants/game-seo-data.ts` に追加）
  - [ ] `FaqItem` インターフェースの定義
  - [ ] `ABOUT_FAQ_ITEMS` 定数に 6 つの Q&A を定義
- [ ] `src/hooks/useFaqSchema.ts` を作成
  - [ ] `FaqItem` 配列を受け取り FAQPage スキーマを構築
  - [ ] `<head>` に動的挿入、アンマウント時にクリーンアップ
  - [ ] `skip` パラメータで非対象ページでのスキップ対応
- [ ] テスト作成（`useFaqSchema.test.ts`）
  - [ ] FAQ スキーマが正しく挿入されること
  - [ ] `skip: true` で挿入されないこと
  - [ ] アンマウント時にスクリプトが削除されること

### 1-4: 動的 canonical URL

- [ ] `src/hooks/useCanonicalUrl.ts` を作成
  - [ ] `useLocation` でパスを取得
  - [ ] `SITE_BASE_URL + pathname` で canonical URL を構築
  - [ ] `<link rel="canonical">` の `href` を動的更新
  - [ ] トレイリングスラッシュの正規化（`/about/` → `/about`）
  - [ ] アンマウント時にトップページ URL に戻す
- [ ] `src/App.tsx` から `useCanonicalUrl` を呼び出し
- [ ] テスト作成（`useCanonicalUrl.test.ts`）
  - [ ] パスに応じた canonical URL が設定されること
  - [ ] トレイリングスラッシュが正規化されること
  - [ ] アンマウント時にデフォルト URL に戻ること

### 1-5: セマンティック HTML 強化

- [ ] `StaticPageLayout.tsx` のセマンティック改善
  - [ ] 最外殻を `<div>` → `<article>` に変更
  - [ ] `<header>` でタイトルをラップ
  - [ ] `publishDate` / `lastUpdated` Props の追加
  - [ ] `<time datetime="...">` 要素の追加
  - [ ] `breadcrumbItems` Props の追加（フェーズ 3 と連携）
- [ ] 各情報ページで新 Props を渡す
  - [ ] `AboutPage.tsx`: `publishDate="2026-03"`, `lastUpdated="2026-03-05"`
  - [ ] `PrivacyPolicyPage.tsx`: `publishDate="2026-03"`
  - [ ] `TermsPage.tsx`: `publishDate="2026-03"`
  - [ ] `ContactPage.tsx`

### 1-6: 構造化データの整合性検証

- [ ] 全スキーマの `@id` 一覧を確認
  - [ ] Organization: `https://niku9.click/#organization`
  - [ ] WebSite: `https://niku9.click/#website`
  - [ ] ItemList: `https://niku9.click/#gamelist`
  - [ ] FAQPage: `https://niku9.click/about#faq`
  - [ ] VideoGame: `https://niku9.click/{path}#game`（既存）
  - [ ] BreadcrumbList: `https://niku9.click/{path}#breadcrumb`（既存）
- [ ] 相互参照の正確性を確認（`publisher`, `isPartOf` 等）
- [ ] 既存の `useGameStructuredData` に `@id` を追加（未設定の場合）

### 1-7: フェーズ 1 動作確認

- [ ] `npm run build` が成功すること
- [ ] `npm test` が全テスト通過すること
- [ ] ブラウザで各ページの `<head>` に正しい JSON-LD が挿入されていること
- [ ] canonical URL が各ページで正しく設定されていること
- [-] Schema Markup Validator で全スキーマがエラーなしであること（デプロイ後に確認）

---

## フェーズ 2: AIO（AI Optimization）対策

### 2-1: robots.txt AI クローラー制御

- [ ] `public/robots.txt` を更新
  - [ ] 既存の `User-agent: *` ルールを維持
  - [ ] AI リアルタイム検索用クローラーの Allow ルールを追加
    - [ ] `ChatGPT-User`
    - [ ] `OAI-SearchBot`
    - [ ] `Claude-User`
    - [ ] `Claude-SearchBot`
    - [ ] `PerplexityBot`
  - [ ] AI 学習用クローラーの Allow ルールを追加（コメント付き）
    - [ ] `GPTBot`
    - [ ] `ClaudeBot`
    - [ ] `Google-Extended`
    - [ ] `CCBot`
  - [ ] Sitemap URL を維持
- [ ] robots.txt の構文が有効であることを確認

### 2-2: llms.txt の作成

- [ ] `public/llms.txt` を作成
  - [ ] サイト名と概要
  - [ ] ゲーム一覧（13 ゲーム、リンク + 説明付き）
  - [ ] サイト情報ページ一覧
  - [ ] 技術仕様セクション
- [ ] ブラウザから `https://localhost:3000/llms.txt` でアクセス確認
- [ ] Markdown 構文が正しいことを確認

### 2-3: About ページ FAQ コンテンツ追加

- [ ] `AboutPage.tsx` に FAQ セクションを追加
  - [ ] 6 つの Q&A をコンテンツとして配置
  - [ ] `<dl>` / `<dt>` / `<dd>` でセマンティックにマークアップ
  - [ ] `ABOUT_FAQ_ITEMS` 定数からデータを参照
- [ ] `useFaqSchema` を `AboutPage` から呼び出し
  - [ ] FAQPage スキーマが `/about` でのみ挿入されること

### 2-4: 全情報ページのコンテンツ構造改善

- [ ] About ページのコンテンツリライト
  - [ ] 結論ファーストの構造に変更
  - [ ] 箇条書きの活用
  - [ ] 具体的な数値の追加（「13 種類」「課金要素 0」等）
- [ ] Privacy Policy ページのコンテンツ構造改善
  - [ ] 各条文の冒頭に要約文を追加
  - [ ] 重要事項のハイライト（「サーバーには送信されません」等）
- [ ] Terms ページのコンテンツ構造改善
  - [ ] 各条文の冒頭に要約文を追加
  - [ ] 禁止事項リストの視覚的強調
- [ ] Contact ページのコンテンツ構造改善
  - [ ] 連絡先情報を結論ファーストで配置

### 2-5: E-E-A-T シグナルの強化

- [ ] About ページの運営者情報を充実
  - [ ] サイト名、URL、連絡先メールの明記
  - [ ] サイトの目的（趣味・学習目的の個人運営）を明記
  - [ ] 使用技術の簡潔な記載
- [ ] 全情報ページに最終更新日を追加
  - [ ] `<time datetime="2026-03-05">` で構造化
- [ ] 全情報ページにお問い合わせリンクを追加（フッター付近）

### 2-6: フェーズ 2 動作確認

- [ ] `npm run build` が成功すること
- [ ] `npm test` が全テスト通過すること
- [ ] robots.txt がブラウザからアクセス可能であること
- [ ] llms.txt がブラウザからアクセス可能であること
- [ ] About ページの FAQ コンテンツが正しく表示されること
- [ ] FAQ スキーマが `<head>` に挿入されていること

---

## フェーズ 3: 情報ページ ビジュアルブラッシュアップ

### 3-1: `StaticPageLayout` テンプレート拡張

- [ ] `StaticPageLayout.tsx` にビジュアル拡張を追加
  - [ ] `icon` Props の追加（ページアイコン表示）
  - [ ] ページアイコンバッジ（グラデーション背景の円形）
  - [ ] タイトル下のアクセントカラーグラデーションライン
  - [ ] `<h3>` の左側にアクセントカラー縦線（`border-left`）
  - [ ] セクション間のグラデーション区切り線
  - [ ] コンテンツ領域のパディング調整（`32px` → `40px`）
- [ ] 日付表示エリアの追加
  - [ ] 制定日（`publishDate`）の表示
  - [ ] 最終更新日（`lastUpdated`）の表示
  - [ ] `<time>` 要素でセマンティックに

### 3-2: パンくずリスト UI コンポーネント

- [ ] `src/components/molecules/Breadcrumb.tsx` を作成
  - [ ] `<nav aria-label="パンくずリスト">` でラップ
  - [ ] `<ol>` でリスト構造
  - [ ] 区切り文字 `>` を CSS `::before` で挿入
  - [ ] 現在ページに `aria-current="page"` を設定
  - [ ] ホームリンクにアクセントカラーを適用
  - [ ] `font-size: 0.8rem` でコンパクト表示
- [ ] `StaticPageLayout` にパンくずリストを統合
- [ ] テスト作成（`Breadcrumb.test.tsx`）
  - [ ] リンク要素が正しく生成されること
  - [ ] 現在ページに `aria-current="page"` が設定されること
  - [ ] 区切り文字が正しく表示されること

### 3-3: フィーチャーカードコンポーネント

- [ ] `src/components/molecules/SectionCard.tsx` を作成
  - [ ] アイコン、タイトル、説明文の表示
  - [ ] Glassmorphism 背景スタイル
  - [ ] ホバー時の `translateY(-2px)` + ボーダー出現
  - [ ] `prefers-reduced-motion` 対応（ホバーアニメーション無効化）
- [ ] テスト作成（`SectionCard.test.tsx`）

### 3-4: FAQ アコーディオン コンポーネント

- [ ] `src/components/molecules/FaqAccordion.tsx` を作成
  - [ ] HTML ネイティブ `<details>` / `<summary>` を使用
  - [ ] 開閉時のスムーズアニメーション
  - [ ] 閉: `▶` + 質問、開: `▼` + 質問 + 回答
  - [ ] `prefers-reduced-motion` 対応
  - [ ] キーボード操作対応
  - [ ] Glassmorphism スタイルの各項目
- [ ] テスト作成（`FaqAccordion.test.tsx`）
  - [ ] 初期状態で全項目が閉じていること
  - [ ] クリックで開閉すること
  - [ ] 質問と回答が正しく表示されること

### 3-5: About ページのリデザイン

- [ ] フィーチャーカード（3 列グリッド）の追加
  - [ ] 🎮 13 種類のゲーム
  - [ ] 💰 完全無料
  - [ ] 👤 登録不要
- [ ] ゲームジャンルセクションの追加
  - [ ] ジャンルタグのバッジ表示
- [ ] FAQ セクションのアコーディオン UI 化
  - [ ] `FaqAccordion` コンポーネントを使用
- [ ] 免責事項セクションの WarningBox 化
- [ ] 運営者情報セクションの充実
  - [ ] サイト名（アイコン付き）
  - [ ] メールアドレス（アイコン付き）
- [ ] パンくずリストの追加（`breadcrumbItems` Props）
- [ ] テスト作成 / 更新（`AboutPage.test.tsx`）

### 3-6: Privacy Policy ページのリデザイン

- [ ] 条文ナンバリング装飾の追加
  - [ ] `<h3>` の番号をアクセントカラー円形バッジに
- [ ] ハイライトボックスの追加
  - [ ] 重要情報（「サーバーには送信されません」）をハイライト
- [ ] パンくずリストの追加
- [ ] テスト更新

### 3-7: Terms ページのリデザイン

- [ ] 条文ナンバリング装飾の追加（Privacy と同様）
- [ ] 禁止事項リストのアイコンマーカー化
- [ ] 免責事項の WarningBox 化
- [ ] パンくずリストの追加
- [ ] テスト更新

### 3-8: Contact ページのリデザイン

- [ ] コンタクトカードの追加
  - [ ] メールアイコン + アドレス表示
  - [ ] グラデーション「メールを送信」ボタン
  - [ ] Glassmorphism 背景のカード
- [ ] パンくずリストの追加
- [ ] テスト更新

### 3-9: スクロールリビールアニメーション適用

- [ ] 情報ページの各セクションに `useScrollReveal` を適用
  - [ ] フェードイン + スライドアップ（`opacity: 0 → 1`, `translateY(20px) → 0`）
  - [ ] セクション間スタッガード（`100ms` 間隔）
  - [ ] `prefers-reduced-motion` 対応（即時表示）
- [ ] `StaticPageLayout` にスクロールリビール用の ref を統合

### 3-10: フェーズ 3 動作確認

- [ ] `npm run build` が成功すること
- [ ] `npm test` が全テスト通過すること
- [ ] About ページの各要素が正しく表示されること
  - [ ] フィーチャーカード（3 列）
  - [ ] FAQ アコーディオン
  - [ ] パンくずリスト
  - [ ] 運営者情報
- [ ] Privacy Policy ページの条文装飾が正しく表示されること
- [ ] Terms ページの条文装飾が正しく表示されること
- [ ] Contact ページのコンタクトカードが正しく表示されること
- [ ] 全情報ページでレスポンシブ表示が崩れないこと
  - [ ] デスクトップ（1200px+）
  - [ ] タブレット（768px〜1199px）
  - [ ] モバイル（〜767px）
- [ ] スクロールリビールアニメーションが自然に見えること
- [ ] `prefers-reduced-motion` 有効時に全アニメーションが停止すること

---

## 全フェーズ共通: 最終確認

### 統合テスト

- [ ] `npm run build` が成功すること
- [ ] `npm test` が全テスト通過すること
- [-] Lighthouse パフォーマンスが 80+ であること（デプロイ後に確認）
- [-] Lighthouse SEO が 95+ であること（デプロイ後に確認）
- [-] Lighthouse アクセシビリティが 90+ であること（デプロイ後に確認）

### ブラウザ確認

- [ ] Chrome（最新）で全情報ページが正しく表示されること
- [-] Firefox（最新）で全情報ページが正しく表示されること
- [-] Safari（最新）で全情報ページが正しく表示されること
- [-] モバイル（iOS Safari / Android Chrome）で表示が崩れないこと

### 構造化データ確認

- [-] Schema Markup Validator で Organization スキーマが有効であること
- [-] Schema Markup Validator で ItemList スキーマが有効であること
- [-] Schema Markup Validator で FAQPage スキーマが有効であること
- [-] Google Rich Results Test でリッチリザルト対象が表示されること

### AIO 確認

- [ ] robots.txt が正しい構文であること
- [ ] llms.txt がブラウザからアクセス可能であること
- [ ] llms.txt の Markdown が正しくフォーマットされていること
- [ ] FAQ コンテンツが About ページに正しく表示されること

### クロスフェーズ確認

- [ ] SEO スキーマ追加がビジュアル変更と干渉しないこと
- [ ] AIO コンテンツ変更がレイアウトを崩さないこと
- [ ] 新規コンポーネントが既存ゲームページのパフォーマンスに影響しないこと
- [ ] canonical URL が全ページで正しく設定されていること
- [ ] FAQ スキーマと FAQ コンテンツの内容が一致していること

---

## パフォーマンス計測手順（Lighthouse）

### production build で計測すること

```bash
# 1. production build を作成
npm run build

# 2. production build をローカル配信（ポート 3001）
npm run preview

# 3. ブラウザで http://localhost:3001 を開く
# 4. Chrome DevTools → Lighthouse タブで計測
#    - Mode: Navigation
#    - Device: Mobile（デフォルト）
#    - Categories: Performance, Accessibility, Best Practices, SEO
```

### 重点チェック項目

- SEO スコア: 各ページの meta description、canonical URL、構造化データ
- アクセシビリティ: パンくずリストの ARIA、FAQ アコーディオンのキーボード操作
- パフォーマンス: 新規コンポーネント追加によるバンドルサイズへの影響
