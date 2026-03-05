# SEO 強化・AIO 対策・情報ページ ビジュアルブラッシュアップ仕様書

---

## フェーズ 1: SEO 強化（発展編）

### 1.1 Organization スキーマ

**ファイル:** `public/index.html`

既存の WebSite スキーマに加え、Organization スキーマを追加する。

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://niku9.click/#organization",
  "name": "niku9.click",
  "url": "https://niku9.click/",
  "logo": "https://niku9.click/icon-192.png",
  "description": "13種類の無料ブラウザゲームを提供するゲームプラットフォーム",
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "contact@niku9.click",
    "contactType": "customer service"
  },
  "sameAs": [
    "https://gallery.niku9.click"
  ]
}
```

**既存 WebSite スキーマとの統合:**

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://niku9.click/#website",
  "name": "Game Platform",
  "url": "https://niku9.click/",
  "description": "13種類の無料ブラウザゲームが楽しめるゲームプラットフォーム",
  "inLanguage": "ja",
  "publisher": {
    "@id": "https://niku9.click/#organization"
  }
}
```

**要点:**
- `@id` を使ってエンティティ間の参照を統一する
- WebSite の `publisher` に Organization を参照させる
- 既存の WebSite スキーマを `@id` 付きに更新する

---

### 1.2 ItemList スキーマ（ホームページ用）

**ファイル:** `src/hooks/useItemListSchema.ts`

ホームページ（`/`）にアクセスした際、13 ゲームの一覧を ItemList スキーマとして `<head>` に動的挿入する。

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Game Platform ゲーム一覧",
  "description": "13種類の無料ブラウザゲーム",
  "numberOfItems": 13,
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "url": "https://niku9.click/puzzle",
      "name": "Picture Puzzle",
      "description": "美しい画像を使ったクラシックなスライドパズル..."
    },
    {
      "@type": "ListItem",
      "position": 2,
      "url": "https://niku9.click/air-hockey",
      "name": "Air Hockey",
      "description": "リアルな物理演算で楽しむエアホッケー..."
    }
  ]
}
```

**フック設計:**

```typescript
/**
 * ホームページ用 ItemList 構造化データを挿入するフック
 *
 * ホームページ（/）でのみ動作し、それ以外のパスではスキップする。
 */
function useItemListSchema(): void;
```

**実装方針:**
- `useLocation` でパスを取得し、`/` の場合のみ挿入
- `GAME_SEO_DATA` からゲーム一覧を動的に生成
- 既存の `useStructuredData` と同様のパターン（`<script type="application/ld+json">`）
- アンマウント時にクリーンアップ
- XSS 対策として `textContent` で安全に挿入

---

### 1.3 FAQPage スキーマ

**ファイル:** `src/hooks/useFaqSchema.ts`

About ページ（`/about`）に FAQ セクションを追加し、FAQPage スキーマを挿入する。

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": "https://niku9.click/about#faq",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Game Platform は無料ですか？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "はい、すべてのゲームは完全無料でプレイできます。課金要素はありません。"
      }
    },
    {
      "@type": "Question",
      "name": "ユーザー登録は必要ですか？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "いいえ、ユーザー登録は不要です。サイトにアクセスするだけですぐにゲームをプレイできます。"
      }
    },
    {
      "@type": "Question",
      "name": "どのブラウザで遊べますか？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Google Chrome および Microsoft Edge の最新版を推奨しています。その他のモダンブラウザでも基本的に動作します。"
      }
    },
    {
      "@type": "Question",
      "name": "スマートフォンでも遊べますか？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "はい、多くのゲームはスマートフォンでもプレイ可能です。ただし、一部のゲームはPC操作を推奨しています。各ゲームの注意事項をご確認ください。"
      }
    },
    {
      "@type": "Question",
      "name": "ゲームのデータはどこに保存されますか？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "ゲームの進行データやスコアはブラウザの localStorage に保存されます。サーバーには送信されません。ブラウザのキャッシュクリアでデータが消える場合がありますのでご注意ください。"
      }
    },
    {
      "@type": "Question",
      "name": "何種類のゲームがありますか？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "現在 13 種類のゲームを提供しています。パズル、シューティング、RPG、レース、ホラー、ストラテジーなど多彩なジャンルを取り揃えています。"
      }
    }
  ]
}
```

**フック設計:**

```typescript
interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

/**
 * FAQ 構造化データを挿入するフック
 *
 * FAQ アイテムの配列を受け取り、FAQPage スキーマとして挿入する。
 */
function useFaqSchema(faqItems: ReadonlyArray<FaqItem>, skip?: boolean): void;
```

**FAQ データの定数定義:**

```typescript
// src/constants/game-seo-data.ts に追加
export const ABOUT_FAQ_ITEMS: ReadonlyArray<FaqItem> = [
  {
    question: 'Game Platform は無料ですか？',
    answer: 'はい、すべてのゲームは完全無料でプレイできます。課金要素はありません。',
  },
  // ... 全 6 項目
];
```

---

### 1.4 動的 canonical URL

**ファイル:** `src/hooks/useCanonicalUrl.ts`

```typescript
/**
 * 現在のパスに対応する canonical URL を動的に設定するフック
 *
 * index.html の <link rel="canonical"> を動的更新する。
 */
function useCanonicalUrl(): void;
```

**仕様:**
- `useLocation` でパスを取得
- `SITE_BASE_URL + pathname` で canonical URL を構築
- `<link rel="canonical">` の `href` を動的更新
- アンマウント時にトップページ URL に戻す
- トレイリングスラッシュの正規化（`/about/` → `/about`）

**対応パス:**
- `/` → `https://niku9.click/`
- `/puzzle` → `https://niku9.click/puzzle`
- `/about` → `https://niku9.click/about`
- その他すべてのルート

---

### 1.5 セマンティック HTML 強化

**ファイル:** `src/components/templates/StaticPageLayout.tsx`

現在の構造:
```html
<div>          <!-- Container -->
  <h2>タイトル</h2>
  <div>        <!-- ContentArea -->
    <h3>セクション</h3>
    <p>本文</p>
  </div>
</div>
```

改善後の構造:
```html
<article>       <!-- セマンティック: 独立コンテンツ -->
  <header>
    <h2>タイトル</h2>
    <nav aria-label="パンくずリスト">
      <!-- Breadcrumb -->
    </nav>
  </header>
  <div>         <!-- ContentArea（Glassmorphism） -->
    <section>
      <h3>セクション</h3>
      <p>本文</p>
    </section>
  </div>
  <footer>
    <time datetime="2026-03">制定日: 2026年3月</time>
  </footer>
</article>
```

**変更点:**
- 最外殻を `<div>` → `<article>` に変更
- `<header>` でタイトル + パンくずリストをラップ
- 各セクションの `<h3>` を `<section>` でラップ可能にする
- 制定日を `<time datetime="...">` で構造化
- `StaticPageLayout` の Props に `breadcrumbItems` と `publishDate` を追加

```typescript
interface StaticPageLayoutProps {
  readonly title: string;
  readonly children: React.ReactNode;
  /** パンくずリストのアイテム */
  readonly breadcrumbItems?: ReadonlyArray<{ label: string; path?: string }>;
  /** 制定日（datetime 形式: YYYY-MM） */
  readonly publishDate?: string;
}
```

---

### 1.6 構造化データの整合性検証

既存と新規の全スキーマで `@id` を統一する。

| スキーマ | @id | ファイル |
|---------|-----|---------|
| Organization | `https://niku9.click/#organization` | `index.html`（静的） |
| WebSite | `https://niku9.click/#website` | `index.html`（静的） |
| VideoGame | `https://niku9.click/{path}#game` | `useGameStructuredData`（動的） |
| BreadcrumbList | `https://niku9.click/{path}#breadcrumb` | `useGameStructuredData`（動的） |
| ItemList | `https://niku9.click/#gamelist` | `useItemListSchema`（動的） |
| FAQPage | `https://niku9.click/about#faq` | `useFaqSchema`（動的） |

**検証手順:**
1. 各スキーマの `@id` が一意であること
2. 相互参照（`publisher`, `isPartOf` 等）が正しいこと
3. [Schema Markup Validator](https://validator.schema.org/) でエラーがないこと

---

## フェーズ 2: AIO（AI Optimization）対策

### 2.1 robots.txt AI クローラー制御

**ファイル:** `public/robots.txt`

```
# 検索エンジンクローラー: 全ページ許可
User-agent: *
Allow: /
Sitemap: https://niku9.click/sitemap.xml

# AI リアルタイム検索用クローラー: 許可（AI 検索結果に表示されるため）
User-agent: ChatGPT-User
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

# AI 学習用クローラー: 許可（コンテンツを広く認知してもらうため）
# ※ 必要に応じて Disallow に変更可能
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: CCBot
Allow: /
```

**戦略的判断:**
- 学習用クローラーも **Allow** とする理由:
  - 無料ゲームプラットフォームであり、商業的なコンテンツ保護の必要性が低い
  - AI モデルに認知されることで、AI 検索での推薦確率が向上する
  - 将来的に Disallow に変更するオプションはコメントで記録
- クローラーごとに個別 User-agent で記述し、将来の個別制御に対応

---

### 2.2 llms.txt

**ファイル:** `public/llms.txt`

```markdown
# Game Platform

> 13種類の無料ブラウザゲームが楽しめるゲームプラットフォーム（niku9.click）。
> ユーザー登録不要、課金要素なし。ブラウザだけですぐにプレイできます。

## ゲーム一覧

- [Picture Puzzle](https://niku9.click/puzzle): 美しい画像を使ったクラシックなスライドパズル。難易度調整機能付き。
- [Air Hockey](https://niku9.click/air-hockey): リアルな物理演算で楽しむエアホッケー。
- [Racing Game](https://niku9.click/racing): スピード感あふれるレースゲーム。
- [Falldown Shooter](https://niku9.click/falling-shooter): 落下しながら敵を撃破するシューティングゲーム。
- [Labyrinth of Shadows](https://niku9.click/maze-horror): 暗闇の迷宮を探索するホラーアドベンチャー。
- [Non-Brake Descent](https://niku9.click/non-brake-descent): ブレーキなしで坂道を駆け下りるアクションゲーム。
- [Deep Sea Interceptor](https://niku9.click/deep-sea-shooter): 深海を舞台にしたシューティングゲーム。
- [IPNE](https://niku9.click/ipne): ターン制ローグライクRPG。
- [Agile Quiz Sugoroku](https://niku9.click/agile-quiz-sugoroku): アジャイル開発の知識を試すクイズすごろく。
- [迷宮の残響](https://niku9.click/labyrinth-echo): テキスト探索×判断×ローグライトRPG。
- [RISK LCD](https://niku9.click/risk-lcd): リスク管理をテーマにしたLCD風ストラテジーゲーム。
- [KEYS & ARMS](https://niku9.click/keys-and-arms): 鍵と武器を駆使するアクションRPG。
- [原始進化録 - PRIMAL PATH](https://niku9.click/primal-path): 三大文明を育て進化を重ねる自動戦闘ローグライト。

## サイト情報

- [サイトについて](https://niku9.click/about): Game Platform の概要、特徴、よくある質問。
- [プライバシーポリシー](https://niku9.click/privacy-policy): 個人情報の取り扱いについて。
- [利用規約](https://niku9.click/terms): サービスの利用条件。
- [お問い合わせ](https://niku9.click/contact): 連絡先情報。

## 技術仕様

- プラットフォーム: Web ブラウザ（Chrome / Edge 推奨）
- 対応デバイス: PC / スマートフォン / タブレット
- 料金: 完全無料（課金要素なし）
- ユーザー登録: 不要
- データ保存: ブラウザの localStorage（サーバー送信なし）
```

**要点:**
- Markdown 形式で AI が解析しやすい構造
- ゲーム一覧はリンク付きで、各ゲームの簡潔な説明を含む
- サイトの技術仕様を明記し、ユーザーの疑問に先回りで回答

---

### 2.3 About ページ FAQ コンテンツ

**ファイル:** `src/pages/AboutPage.tsx`

既存の About ページに FAQ セクションを追加する。

**追加コンテンツ（Q&A 形式）:**

| 質問 | 回答 |
|------|------|
| Game Platform は無料ですか？ | はい、すべてのゲームは完全無料でプレイできます。課金要素はありません。 |
| ユーザー登録は必要ですか？ | いいえ、ユーザー登録は不要です。サイトにアクセスするだけですぐにゲームをプレイできます。 |
| どのブラウザで遊べますか？ | Google Chrome および Microsoft Edge の最新版を推奨しています。その他のモダンブラウザでも基本的に動作します。 |
| スマートフォンでも遊べますか？ | はい、多くのゲームはスマートフォンでもプレイ可能です。ただし、一部のゲームは PC 操作を推奨しています。 |
| ゲームのデータはどこに保存されますか？ | ブラウザの localStorage に保存されます。サーバーには送信されません。キャッシュクリアでデータが消える場合があります。 |
| 何種類のゲームがありますか？ | 現在 13 種類のゲームを提供しています。パズル、シューティング、RPG、レース、ホラー、ストラテジーなど多彩なジャンルです。 |

**HTML 構造（AI 最適化）:**
```html
<section>
  <h3>よくある質問</h3>
  <dl>
    <dt>Game Platform は無料ですか？</dt>
    <dd>はい、すべてのゲームは完全無料でプレイできます。課金要素はありません。</dd>
    <dt>ユーザー登録は必要ですか？</dt>
    <dd>いいえ、ユーザー登録は不要です。...</dd>
  </dl>
</section>
```

**ポイント:**
- `<dl>` / `<dt>` / `<dd>` で FAQ のセマンティクスを明確化
- FAQPage スキーマ（1.3）と内容を同期
- 回答は 1-2 文の簡潔な形式（AI 引用に最適な長さ）

---

### 2.4 全情報ページのコンテンツ構造改善

AI 検索で引用されやすくするため、各ページのコンテンツ構造を以下のガイドラインに沿ってリライトする。

**ガイドライン:**
1. **結論ファースト**: 各セクションの冒頭に要点を配置
2. **短い段落**: 2-3 文で 1 段落
3. **箇条書きの活用**: 情報をスキャンしやすい形式に
4. **明示的な見出し**: 見出しだけでコンテンツ内容が分かるように
5. **具体的な数値**: 「13 種類のゲーム」「課金要素 0」等

**About ページのリライト例:**

Before:
```
Game Platform は、ブラウザだけで遊べる無料のゲームプラットフォームです。
ユーザー登録やアプリのインストールは不要で、サイトにアクセスするだけですぐにゲームを楽しめます。
```

After:
```
Game Platform は 13 種類の無料ブラウザゲームが楽しめるプラットフォームです。

- 完全無料: 課金要素は一切ありません
- 登録不要: アカウント作成なしですぐにプレイ
- インストール不要: ブラウザからワンクリックで開始
- 多彩なジャンル: パズル、RPG、シューティング、レース、ホラー、ストラテジー
```

---

### 2.5 E-E-A-T シグナルの強化

**About ページ:**
- 運営者情報を充実させる（サイト名、URL、連絡先）
- サイトの目的を明記（趣味・学習目的の個人運営）
- ゲーム開発の技術情報を簡潔に記載（React / TypeScript / Web Audio API）

**全情報ページ:**
- 制定日を `<time>` 要素で構造化
- 最終更新日を追加（`<time datetime="2026-03-05">`）
- 連絡先情報を全ページフッターに配置

---

## フェーズ 3: 情報ページ ビジュアルブラッシュアップ

### 3.1 `StaticPageLayout` テンプレートの拡張

**ファイル:** `src/components/templates/StaticPageLayout.tsx`

#### 拡張後の Props

```typescript
interface StaticPageLayoutProps {
  readonly title: string;
  readonly children: React.ReactNode;
  /** ページアイコン（絵文字 or Unicode 記号） */
  readonly icon?: string;
  /** パンくずリストのアイテム */
  readonly breadcrumbItems?: ReadonlyArray<{ label: string; path?: string }>;
  /** 制定日（datetime 形式: YYYY-MM） */
  readonly publishDate?: string;
  /** 最終更新日（datetime 形式: YYYY-MM-DD） */
  readonly lastUpdated?: string;
}
```

#### ビジュアル拡張

**ページタイトル装飾:**
```
    ╭──────────────────────────────╮
    │     📋                       │
    │   サイトについて              │
    │   ─────────────              │
    │   ホーム > サイトについて      │
    ╰──────────────────────────────╯
```

- アイコン: タイトル上部にグラデーション背景の円形バッジで表示
- アンダーライン: タイトル下に `accent-color` のグラデーションライン
- パンくずリスト: タイトル下にコンパクトに配置

**セクション装飾:**
- `<h3>` の左側にアクセントカラーの縦線（`border-left: 3px solid var(--accent-color)`）
- セクション間にグラデーションの区切り線

**コンテンツ領域:**
- 既存の Glassmorphism を維持しつつ、パディングを増やす（`32px` → `40px`）
- セクション内のリストアイテムにアイコンマーカーを追加

**日付表示:**
- ページ最下部に制定日・最終更新日をフェードカラーで表示
- `<time>` 要素でセマンティックにマークアップ

---

### 3.2 About ページのリデザイン

**現状の構成:**
1. Game Platform とは（テキストのみ）
2. 特徴（リストのみ）
3. 免責事項（リストのみ）
4. 運営者情報（1 行テキスト）

**リデザイン後の構成:**

```
╔══════════════════════════════════════════════╗
║  ℹ️  サイトについて                          ║
║  ─── ホーム > サイトについて                  ║
╚══════════════════════════════════════════════╝

┌─ Glassmorphism Card ─────────────────────────┐
│                                               │
│  ▌ Game Platform とは                         │
│  ─────────────────────────                    │
│  13種類の無料ブラウザゲームが楽しめる...       │
│                                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│  │  🎮     │ │  💰     │ │  👤     │         │
│  │ 13種類  │ │ 完全無料│ │ 登録不要│         │
│  │ のゲーム│ │         │ │         │         │
│  └─────────┘ └─────────┘ └─────────┘         │
│                                               │
│  ▌ ゲームジャンル                             │
│  ─────────────────────────                    │
│  パズル / シューティング / RPG / レース /      │
│  ホラー / ストラテジー / アクション / クイズ    │
│                                               │
│  ▌ よくある質問                               │
│  ─────────────────────────                    │
│  [▼] Game Platform は無料ですか？             │
│      はい、すべてのゲームは完全無料...         │
│  [▶] ユーザー登録は必要ですか？               │
│  [▶] どのブラウザで遊べますか？               │
│  [▶] スマートフォンでも遊べますか？           │
│  [▶] ゲームのデータはどこに保存されますか？   │
│  [▶] 何種類のゲームがありますか？             │
│                                               │
│  ▌ 免責事項                                   │
│  ─────────────────────────                    │
│  ⚠️ 趣味・学習目的の運営です...               │
│                                               │
│  ▌ 運営者情報                                 │
│  ─────────────────────────                    │
│  🌐 niku9.click                               │
│  📧 contact@niku9.click                       │
│                                               │
│  最終更新: 2026年3月5日                       │
└───────────────────────────────────────────────┘
```

#### フィーチャーカード

**コンポーネント:** `src/components/molecules/SectionCard.tsx`

```typescript
interface SectionCardProps {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}
```

**スタイル:**
- 3 列のグリッドレイアウト（`grid-template-columns: repeat(auto-fit, minmax(160px, 1fr))`）
- 各カード: Glassmorphism 背景、中央揃え
- アイコン: 2rem サイズ、上部に配置
- タイトル: 太字、`accent-color`
- 説明: `text-secondary`
- ホバー時: 微量の `translateY(-2px)` + シアンボーダー出現

#### FAQ アコーディオン

**コンポーネント:** `src/components/molecules/FaqAccordion.tsx`

```typescript
interface FaqAccordionProps {
  readonly items: ReadonlyArray<{ question: string; answer: string }>;
}
```

**仕様:**
- HTML ネイティブの `<details>` / `<summary>` を使用（ライブラリ不要）
- 開閉時にスムーズなアニメーション（`transition: max-height 0.3s ease`）
- 閉じている状態: 質問テキスト + 右向き矢印（`▶`）
- 開いている状態: 質問テキスト + 下向き矢印（`▼`）+ 回答テキスト
- `prefers-reduced-motion` 時はアニメーションなし
- キーボード操作対応（`Enter` / `Space` で開閉）

**アクセシビリティ:**
- `<details>` / `<summary>` はネイティブでアクセシブル
- 追加の ARIA 属性は不要

---

### 3.3 Privacy Policy ページのリデザイン

**デザイン要素:**

- **条文ナンバリング装飾**: `<h3>` の先頭番号をアクセントカラーの円形バッジで強調

```
  ① 取得する情報
  ─────────────────
  本サイトでは、以下の情報を取得する場合があります。

  ② 利用目的
  ─────────────────
  取得した情報は、以下の目的で利用いたします。
```

- **ハイライトボックス**: 重要な情報（「サーバーには送信されません」等）をアクセントカラー背景のボックスで強調

```typescript
const HighlightBox = styled.div`
  background: rgba(0, 210, 255, 0.08);
  border-left: 3px solid var(--accent-color);
  padding: 12px 16px;
  border-radius: 0 8px 8px 0;
  margin: 12px 0;
`;
```

- **制定日の強調**: ページ末尾に `<time>` 付きの日付表示

---

### 3.4 Terms ページのリデザイン

Privacy Policy と同様のデザインパターンを適用する。

**追加要素:**
- **禁止事項リスト**: 各項目にアイコンマーカー（❌）を付与
- **免責事項ハイライト**: 注意喚起として黄色系のハイライトボックスを使用

```typescript
const WarningBox = styled.div`
  background: rgba(255, 193, 7, 0.08);
  border-left: 3px solid #ffc107;
  padding: 12px 16px;
  border-radius: 0 8px 8px 0;
  margin: 12px 0;
`;
```

---

### 3.5 Contact ページのリデザイン

**リデザイン後の構成:**

```
╔══════════════════════════════════════════════╗
║  ✉️  お問い合わせ                            ║
║  ─── ホーム > お問い合わせ                    ║
╚══════════════════════════════════════════════╝

┌─ Glassmorphism Card ─────────────────────────┐
│                                               │
│  ▌ お問い合わせ方法                           │
│  ─────────────────────────                    │
│  本サイトに関するお問い合わせは、             │
│  以下のメールアドレスまでご連絡ください。     │
│                                               │
│  ┌──── Contact Card ────────────────────┐     │
│  │  📧                                  │     │
│  │  contact@niku9.click                 │     │
│  │  [ メールを送信 ]                     │     │
│  └──────────────────────────────────────┘     │
│                                               │
│  ▌ 注記                                       │
│  ─────────────────────────                    │
│  • スパム防止のため、フォームは非設置         │
│  • 返信にお時間をいただく場合があります       │
│  • 内容により返信できない場合があります       │
│                                               │
└───────────────────────────────────────────────┘
```

**コンタクトカード:**

```typescript
const ContactCard = styled.div`
  background: rgba(0, 210, 255, 0.05);
  border: 1px solid rgba(0, 210, 255, 0.2);
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  margin: 24px 0;
`;

const EmailButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #00d2ff, #a855f7);
  color: #fff;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: opacity 0.2s, transform 0.2s;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;
```

---

### 3.6 スクロールリビールアニメーション

既存の `useScrollReveal` フックを情報ページにも適用する。

**適用対象:**
- 各セクション（`<h3>` + コンテンツ）
- フィーチャーカード
- FAQ アコーディオン
- コンタクトカード

**仕様:**
- `IntersectionObserver` で viewport 進入時にフェードイン
- `opacity: 0 → 1`, `translateY(20px) → 0`
- `transition-duration: 0.5s`, `ease-out`
- セクション間のスタッガードは `100ms` 間隔
- `prefers-reduced-motion` 時はアニメーションなし（即時表示）

---

### 3.7 パンくずリスト UI

**コンポーネント:** `src/components/molecules/Breadcrumb.tsx`

```typescript
interface BreadcrumbItem {
  readonly label: string;
  /** パスが undefined の場合はリンクなし（現在のページ） */
  readonly path?: string;
}

interface BreadcrumbProps {
  readonly items: ReadonlyArray<BreadcrumbItem>;
}
```

**表示:**
```
ホーム > サイトについて
```

**スタイル:**
- `font-size: 0.8rem`
- `color: var(--text-secondary)`
- 区切り文字: `>` （CSS `::before` で挿入）
- ホーム: `<Link to="/">ホーム</Link>`（アクセントカラー）
- 現在ページ: テキストのみ（リンクなし、`aria-current="page"`）

**セマンティクス:**
```html
<nav aria-label="パンくずリスト">
  <ol>
    <li><a href="/">ホーム</a></li>
    <li aria-current="page">サイトについて</li>
  </ol>
</nav>
```

---

## 全フェーズ共通: アクセシビリティ要件

| 項目 | 対応 |
|------|------|
| `prefers-reduced-motion` | すべてのアニメーションを無効化 or 最小化 |
| キーボードナビゲーション | FAQ アコーディオン、パンくずリストに適切な `tabIndex` |
| スクリーンリーダー | パンくずリストに `aria-label`、現在ページに `aria-current` |
| コントラスト比 | WCAG AA（4.5:1）準拠、ハイライトボックス内テキストも同様 |
| セマンティック HTML | `<article>`, `<section>`, `<time>`, `<dl>`, `<details>` の適切な使用 |

---

## 全フェーズ共通: テスト方針

### ユニットテスト

| フック / コンポーネント | テスト内容 |
|----------------------|----------|
| `useCanonicalUrl` | パスに応じた canonical URL の設定、アンマウント時の復元 |
| `useItemListSchema` | ホームページでの ItemList 挿入、非ホームでのスキップ |
| `useFaqSchema` | FAQ スキーマの挿入、スキップ時の非挿入 |
| `Breadcrumb` | リンク生成、現在ページの `aria-current`、セパレータ |
| `FaqAccordion` | 開閉動作、アクセシビリティ、表示内容 |
| `SectionCard` | プロップスの表示、レイアウト |
| `AboutPage` | FAQ セクションの存在、コンテンツ表示 |

### 統合テスト

- `npm run build` が成功すること
- 既存テスト + 新規テストが全て通ること
- JSON-LD の構文が有効であること（`JSON.parse` チェック）

### 手動テスト

- Schema Markup Validator で全スキーマ検証
- Lighthouse SEO スコアが 95+ であること
- 全情報ページのレスポンシブ表示確認
- `prefers-reduced-motion` 有効時の動作確認
- robots.txt の構文検証
- llms.txt のブラウザアクセス確認
