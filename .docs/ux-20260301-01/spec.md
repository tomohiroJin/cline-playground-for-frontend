# Game Platform UI/UX 改善 仕様書

---

## 1. useFullScreenRoute のホワイトリスト方式への変更

### 対象ファイル

`src/hooks/useFullScreenRoute.ts`

### 現状

```typescript
export const useFullScreenRoute = (): boolean => {
  const { pathname } = useLocation();
  return pathname !== '/';
};
```

`/` 以外のすべてのパスをフルスクリーン（ゲーム）と判定するため、新規静的ページ（`/about` 等）でもヘッダー/フッターが非表示になる。

### 変更後

ヘッダー/フッターを表示するルートのホワイトリストを定義し、リストに含まれないルートをフルスクリーンと判定する。

```typescript
const LAYOUT_ROUTES = new Set(['/', '/about', '/privacy-policy', '/terms', '/contact']);

export const useFullScreenRoute = (): boolean => {
  const { pathname } = useLocation();
  return !LAYOUT_ROUTES.has(pathname);
};
```

### 影響範囲

- `App.tsx`: ヘッダー/フッター表示制御（変更不要、既存ロジックがそのまま機能）
- 既存ゲームルート: 影響なし（ホワイトリストに含まれないためフルスクリーン維持）

---

## 2. SettingsPanel の削除

### 削除理由

SettingsPanel は `masterVolume`, `sfxVolume`, `bgmVolume`, `controls`, `showFps`, `reducedMotion` を localStorage に保存するが、各ゲームは独自の音声管理を行っており、SettingsPanel の値を読み取るゲームが一つも存在しない。設定を変更しても何も変わらないため、ユーザーを混乱させる要因となっている。

### 削除対象ファイル

| ファイル | 理由 |
|---------|------|
| `src/components/organisms/SettingsPanel.tsx` | 設定 UI 本体 |
| `src/utils/settings-storage.ts` | SettingsPanel 専用のストレージ。他からの参照なし |

### App.tsx からの削除対象コード

1. `import { SettingsPanel }` のインポート文
2. `SettingsButton` styled-component の定義
3. `isSettingsOpen` 状態（`useState`）
4. `<SettingsButton>` JSX（ヘッダー内の⚙ボタン）
5. `{isSettingsOpen && <SettingsPanel ... />}` JSX

### 確認事項

- `settings-storage.ts` が SettingsPanel 以外から参照されていないことを `grep` で確認すること
- localStorage キー `game-platform-settings` のデータは残存するが、読み取るコードが消えるため無害

---

## 3. コピーライト更新

### 対象ファイル

`src/App.tsx` の Footer 内

### 変更内容

```
変更前: © 2025 niku9.click（niku9.click はリンク）
変更後: © 2026 niku9.click All Rights Reserved.（リンクなし、テキストのみ）
```

フッター全体のリデザイン（フェーズ 4）でリンクはフッターナビゲーションとして別途配置するため、コピーライト行からはリンクを除去する。

---

## 4. 音声停止ユーティリティ

### 新規ファイル

`src/utils/audio-cleanup.ts`

### 設計方針

各ゲームは Web Audio API の `AudioContext` を独自に生成・管理している。プラットフォーム側から各ゲームの音声実装に手を入れずに全音声を停止する必要があるため、AudioContext コンストラクタをプロキシで上書きし、生成されたインスタンスを追跡するレジストリパターンを採用する。

### インターフェース

```typescript
/** AudioContext コンストラクタをラップし、生成されたインスタンスを追跡する */
installAudioContextTracker(): void

/** 追跡中の全 AudioContext を suspend/close し、Tone.js の Transport も停止する */
stopAllAudio(): Promise<void>
```

### 動作仕様

#### installAudioContextTracker

- `window.AudioContext` を Proxy で上書きする
- `construct` トラップ内で、生成されたインスタンスを `Set<AudioContext>` に追加する
- 多重呼び出しを防止する（`isInstalled` フラグ）
- アプリ起動時に1度だけ `src/index.tsx` から呼び出す

#### stopAllAudio

- 追跡中の全 AudioContext に対して:
  1. `state !== 'closed'` のインスタンスのみ処理
  2. `ctx.suspend()` → `ctx.close()` を順に呼び出す
  3. エラーは無視する（既に閉じている場合等）
- Set をクリアする（再利用時に新しい AudioContext が生成されるため）
- Tone.js が読み込まれている場合:
  - `Tone.getTransport().stop()` で再生停止
  - `Tone.getTransport().cancel()` でスケジュール済みイベントをクリア
  - dynamic import で Tone.js を読み込み、利用不可の場合は無視する

### GamePageWrapper への統合

`src/components/organisms/GamePageWrapper.tsx` の `useEffect` cleanup 関数で `stopAllAudio()` を呼び出す。

```typescript
useEffect(() => {
  return () => {
    stopAllAudio();
  };
}, [pathname]);
```

ゲームページからの離脱時（別のルートへの遷移時）に実行される。

### 注意事項

- AudioContext は close 後に再利用できないが、ゲームページに再度遷移すればゲーム側が新しい AudioContext を生成するため問題ない
- `installAudioContextTracker()` は必ず `index.tsx` で呼び出すこと（ゲームより先に実行される必要がある）

---

## 5. 静的ページ共通レイアウト

### 新規ファイル

`src/components/templates/StaticPageLayout.tsx`

### Props

```typescript
interface StaticPageLayoutProps {
  title: string;
  children: React.ReactNode;
}
```

### レイアウト構成

```
┌──────────────────────────────────┐
│          PageTitle               │  ← グラデーションテキスト（白→シアン）
├──────────────────────────────────┤
│  ┌────────────────────────────┐  │
│  │                            │  │  ← Glassmorphism コンテンツ領域
│  │   children                 │  │     max-width: 800px
│  │                            │  │     border-radius: 16px
│  │                            │  │     padding: 32px
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

### スタイリング

- `Container`: max-width 800px、左右中央配置、padding: 40px 20px 60px
- `PageTitle`: font-size 2rem、グラデーションテキスト（`linear-gradient(to right, #fff, #a5f3fc)`）
- `ContentArea`: Glassmorphism（`var(--glass-bg)`、`backdrop-filter: blur(12px)`）
  - `h3`: border-bottom 付きのセクション見出し
  - `p`: `var(--text-secondary)` カラー
  - `a`: `var(--accent-color)` カラー、ホバーで下線

---

## 6. About ページ

### 新規ファイル

`src/pages/AboutPage.tsx`

### ルート

`/about`

### ドキュメントタイトル

`サイトについて | Game Platform`

### コンテンツ構成

#### セクション 1: Game Platform とは

サイトの概要説明。

- ブラウザだけで遊べる無料のゲームプラットフォーム
- ユーザー登録やアプリのインストール不要
- サイトにアクセスするだけですぐにゲームを楽しめる

#### セクション 2: 特徴

箇条書きで特徴を列挙。

- ブラウザだけで遊べる（インストール不要）
- 完全無料（課金要素なし）
- 13種類のゲーム（パズル、シューティング、RPG、レース、ホラー等）
- ユーザー登録不要

#### セクション 3: 免責事項

箇条書きで免責事項を明示。

- 趣味・学習目的の運営、動作環境・パフォーマンスの保証なし
- 一部ゲームに激しい光の点滅や効果音が含まれる（体調注意）
- サービス内容は予告なく変更・終了の可能性あり

#### セクション 4: 運営者情報

- 運営: niku9.click

---

## 7. プライバシーポリシーページ

### 新規ファイル

`src/pages/PrivacyPolicyPage.tsx`

### ルート

`/privacy-policy`

### ドキュメントタイトル

`プライバシーポリシー | Game Platform`

### 構成

gallery.niku9.click のプライバシーポリシーを参考に、ゲームプラットフォーム向けにカスタマイズする。

**gallery.niku9.click との差分:**
- Google Analytics / AdSense / A8.net の記載 → 本サイトでは広告を掲載していないため、アクセス解析と Cookie の一般的な記載に留める
- ゲーム利用状況の localStorage 保存に関する記載を追加（gallery.niku9.click にはない項目）
- お問い合わせ時の情報取得の記載は維持

#### 条項一覧（全7条）

| 条 | 見出し | 概要 |
|---|--------|------|
| 前文 | - | 「Game Platform（以下「本サイト」）」の定義と基本方針 |
| 1 | 取得する情報 | (1) アクセス解析情報 (2) Cookie (3) ゲーム利用状況（localStorage） |
| 2 | 利用目的 | サイト改善、利用状況分析、ゲーム体験向上 |
| 3 | 情報の第三者提供 | 法令に基づく場合を除き提供しない |
| 4 | Cookie の設定 | ブラウザ設定で無効化可能、一部機能制限の注記 |
| 5 | 免責事項 | 外部リンク先の情報は責任範囲外 |
| 6 | 改定 | 予告なく変更の可能性、掲載時点で効力 |
| 7 | お問い合わせ | contact@niku9.click |

#### 制定日

2026年3月

---

## 8. 利用規約ページ

### 新規ファイル

`src/pages/TermsPage.tsx`

### ルート

`/terms`

### ドキュメントタイトル

`利用規約 | Game Platform`

### 構成

gallery.niku9.click の利用規約を参考に、ゲームプラットフォーム向けにカスタマイズする。

**gallery.niku9.click との差分:**
- 著作権条項の「AI学習データへの二次利用禁止」→ ゲームソースの一部はオープンソースのため「オープンソースとして公開している部分を除く」の但し書きを追加
- 禁止事項の「広告・アフィリエイトリンクの不正クリック」→ 広告なしのため削除、代わりに「不正アクセス」「営業妨害」を明記
- 免責事項に「ゲームデータの localStorage 消失」に関する記載を追加

#### 条項一覧（全7条）

| 条 | 見出し | 概要 |
|---|--------|------|
| 前文 | - | 「Game Platform（以下「本サイト」）」「本規約」の定義、利用 = 同意 |
| 第1条 | 適用 | サービス利用に関する一切の関係に適用 |
| 第2条 | 著作権・知的財産権 | コンテンツの著作権帰属、無断複製・転載・改変の禁止（OSS 部分を除く） |
| 第3条 | 禁止事項 | 不正アクセス、リバースエンジニアリング（OSS 除く）、運営妨害、権利侵害、商業利用、その他不適切な行為 |
| 第4条 | サービスの変更・中断・終了 | 事前通知なく変更・中断・終了可能、損害の非責任 |
| 第5条 | 免責事項 | 動作保証なし、趣味・学習目的の運営、ゲームデータ（localStorage）の損失は非責任 |
| 第6条 | 利用規約の変更 | 通知なく変更可能、変更後の利用で同意とみなす |
| 第7条 | 準拠法・裁判管轄 | 日本法準拠、運営者所在地の裁判所を専属管轄 |

#### 制定日

2026年3月

---

## 9. お問い合わせページ

### 新規ファイル

`src/pages/ContactPage.tsx`

### ルート

`/contact`

### ドキュメントタイトル

`お問い合わせ | Game Platform`

### コンテンツ構成

gallery.niku9.click と同様に、フォームは設置せずメールアドレスのみの案内とする。

#### 案内文

「本サイトに関するお問い合わせは、以下のメールアドレスまでご連絡ください。」

#### メールアドレス

`contact@niku9.click`（mailto リンク付き）

#### スパム防止

メールアドレスを JavaScript で動的に組み立てて表示する。

```typescript
const email = useMemo(() => {
  const user = 'contact';
  const domain = 'niku9.click';
  return `${user}@${domain}`;
}, []);
```

HTML ソースにメールアドレスが直接記載されないようにする。

#### 注記

- 「スパム防止のため、お問い合わせフォームは設置しておりません。」
- 「返信までにお時間をいただく場合がございます。あらかじめご了承ください。」
- 「お問い合わせ内容によっては、返信いたしかねる場合がございます。」

---

## 10. フッターの拡充

### 対象ファイル

`src/App.tsx` の Footer 部分

### 変更後の構成（3段構成）

```
┌────────────────────────────────────────────────┐
│  ホーム | サイトについて | プライバシーポリシー │  ← 上段: サイト内リンク
│      | 利用規約 | お問い合わせ                  │
├────────────────────────────────────────────────┤
│  姉妹サイト: Gallery NIKU9 桜花-Click          │  ← 中段: 姉妹サイト
├────────────────────────────────────────────────┤
│  © 2026 niku9.click All Rights Reserved.       │  ← 下段: コピーライト
└────────────────────────────────────────────────┘
```

### スタイリング

- **フッター全体**: Glassmorphism（`var(--glass-bg)`, `backdrop-filter: blur(10px)`, `border-top`）
- **サイト内リンク**: React Router の `Link` コンポーネント、下線スライドインエフェクト（hover 時に `::after` 疑似要素で `width: 0 → 100%`）
- **姉妹サイトリンク**: `target="_blank" rel="noopener noreferrer"` で外部リンク、`var(--accent-color)` で強調
- **コピーライト**: font-size 0.75rem、opacity 0.7 で控えめに

### 新規 styled-components

- `FooterNav`: flex レイアウト、`justify-content: center`, `flex-wrap: wrap`
- `FooterLink`: `styled(Link)` で React Router Link をスタイリング
- `SisterSiteRow`: 姉妹サイト行
- `CopyrightRow`: コピーライト行

---

## 11. ヒーローセクションの強化

### 対象ファイル

`src/pages/GameListPage.styles.ts`

### 変更内容

#### パーティクルアニメーション

HeroSection の `::before` と `::after` 疑似要素で浮遊する光の粒を表現する。

```css
/* 疑似要素で 2 つの光の粒 */
&::before {
  width: 4px; height: 4px;
  background: rgba(0, 210, 255, 0.6);
  border-radius: 50%;
  animation: floatParticle 7s infinite ease-in-out;
}
&::after {
  width: 3px; height: 3px;
  background: rgba(165, 243, 252, 0.5);
  animation: floatParticle 9s infinite ease-in-out 3s;
}
```

`floatParticle` keyframes: Y 軸方向に画面下から上へ浮遊、opacity フェードイン/アウト。

#### タイトルグロウエフェクト

HeroTitle の `text-shadow` をアニメーション化する。

```css
animation: titleGlow 4s ease-in-out infinite;

@keyframes titleGlow {
  0%, 100% { text-shadow: 0 0 30px rgba(0, 210, 255, 0.3); }
  50% { text-shadow: 0 0 50px rgba(0, 210, 255, 0.5), 0 0 80px rgba(0, 210, 255, 0.2); }
}
```

---

## 12. ゲームカードのホバーエフェクト改善

### 対象ファイル

`src/pages/GameListPage.styles.ts`

### 変更内容

GameCardContainer のホバー時にボーダーをグラデーション（シアン → パープル）にする。

```css
&:hover {
  border-image: linear-gradient(135deg, #00d2ff, #a855f7) 1;
  border-image-slice: 1;
}
```

既存の GlassCard ホバーエフェクト（translateY、scale、光の反射）はそのまま維持する。

---

## 13. スクロールアニメーション

### 新規ファイル

`src/hooks/useScrollReveal.ts`

### インターフェース

```typescript
const useScrollReveal: <T extends HTMLElement>() => React.RefObject<T>
```

### 動作仕様

1. ref を受け取った要素の直下の子要素すべてに適用
2. 初期状態: `opacity: 0`, `transform: translateY(30px)`
3. IntersectionObserver（`threshold: 0.1`, `rootMargin: '0px 0px -50px 0px'`）で監視
4. 要素が画面に入ったら `opacity: 1`, `transform: translateY(0)` にトランジション
5. 各カードに `transitionDelay` を設定（index × 0.08s）して連鎖的にアニメーション
6. 一度表示された要素は `unobserve` して再アニメーションしない

### 適用箇所

`src/pages/GameListPage.tsx` の `BentoGrid` に ref を渡す。

---

## 14. アイコン設定

### アイコンデザイン案

**案: 六角形 + プレイボタン**

- 六角形（テック感）の中にプレイボタン三角形
- ダークネイビー背景（`#0f0c29` → `#302b63`）+ シアンアクセント（`#00d2ff`）
- Glassmorphism 風の半透明レイヤー
- 小サイズ（16×16）でも視認性が高いシンプルなデザイン

```
AI 生成プロンプト案:
A modern hexagonal app icon for a game platform.
Dark navy/purple gradient background (#0f0c29 to #302b63).
A glowing cyan (#00d2ff) play button triangle in the center.
Subtle glassmorphism effect. Clean, minimal design.
Visible at 16x16 to 512x512. No text.
```

### 必要なアイコンファイル（ユーザーが AI 生成）

| ファイル | サイズ | 用途 |
|---------|--------|------|
| `public/favicon.ico` | 16×16, 32×32 マルチサイズ | ブラウザタブ |
| `public/icon-192.png` | 192×192 | PWA アイコン |
| `public/icon-512.png` | 512×512 | PWA スプラッシュ |
| `public/apple-touch-icon.png` | 180×180 | iOS ホーム画面 |

### index.html への追加

```html
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

### manifest.json の更新

```json
{
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 15. GamePageWrapper の責務明確化

### 対象ファイル

`src/components/organisms/GamePageWrapper.tsx`

### 変更後の責務

| # | 責務 | 実装フェーズ |
|---|------|-------------|
| 1 | 初回アクセス時の注意書きモーダル表示 | 既存 |
| 2 | アンマウント時の全音声停止 | フェーズ 2 |
| 3 | ゲーム固有の ErrorBoundary ラップ | フェーズ 7 |

### ErrorBoundary の追加

ゲームコンテンツを `ErrorBoundary` でラップする。ゲーム内で発生したエラーがプラットフォーム全体に波及しないようにする。

```typescript
if (isAccepted) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
```

既存の `src/components/ErrorBoundary.tsx` を使用する。このコンポーネントは「再試行」と「ホームに戻る」ボタンを持つエラー画面を表示する。

---

## 16. sitemap.xml の更新

### 対象ファイル

`public/sitemap.xml`

### 追加 URL

| URL | priority | lastmod |
|-----|----------|---------|
| `https://niku9.click/about` | 0.5 | 2026-03-01 |
| `https://niku9.click/privacy-policy` | 0.3 | 2026-03-01 |
| `https://niku9.click/terms` | 0.3 | 2026-03-01 |
| `https://niku9.click/contact` | 0.3 | 2026-03-01 |

---

## 17. useDocumentTitle の更新

### 対象ファイル

`src/hooks/useDocumentTitle.ts`

### 追加エントリ

```typescript
'/about': 'サイトについて | Game Platform',
'/privacy-policy': 'プライバシーポリシー | Game Platform',
'/terms': '利用規約 | Game Platform',
'/contact': 'お問い合わせ | Game Platform',
```

---

## 18. App.tsx のルーティング追加

### 追加ルート

```typescript
const AboutPage = lazy(() => import('./pages/AboutPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));

// Routes 内に追加（GamePageWrapper で囲まない）
<Route path="/about" element={<AboutPage />} />
<Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
<Route path="/terms" element={<TermsPage />} />
<Route path="/contact" element={<ContactPage />} />
```

静的ページは GamePageWrapper で囲まない（注意書きモーダルや音声停止はゲーム専用機能のため）。
