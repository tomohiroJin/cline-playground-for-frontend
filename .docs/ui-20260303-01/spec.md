# Game Platform UI/UX ブラッシュアップ仕様書 v2

---

## フェーズ 1: 原始進化録 音声停止バグ修正

### 1.1 問題の詳細

#### 発生条件

1. ユーザーが `/primal-path` でゲームを開始し、BGM が再生される
2. ゲームプレイ中（`phase === 'battle'` 等）にページ遷移する（ブラウザバック、ホームボタン等）
3. 遷移先のページでも原始進化録の BGM が鳴り続ける

#### 根本原因

`BgmEngine.play()` 内の `setInterval`（行158）が、コンポーネントアンマウント後もクリアされない。さらに、各 tick で `initAudio()` を呼び出し（行164）、そこで `ac.resume()` が実行されるため、`GamePageWrapper` の `stopAllAudio()` → `AudioContext.suspend()` が即座に打ち消される。

```
PrimalPathGame アンマウント
    ↓
GamePageWrapper.stopAllAudio() → AudioContext.suspend() ✓
    ↓
setInterval コールバック（まだ生きている）
    ↓
initAudio() → ac.resume() ✗ ← suspend を打ち消し
    ↓
playBgmNote() → 音が鳴り続ける ✗
```

#### 他ゲームとの比較

| ゲーム | cleanup 実装 | 音声停止 |
|--------|-------------|---------|
| Non-Brake Descent | `Audio.cleanup()` + `useEffect` cleanup | 正常 |
| Labyrinth Echo | `stopBgm()` + フェードアウト | 正常 |
| **原始進化録** | **なし** | **バグあり** |

### 1.2 修正仕様

#### 1.2.1 `audio.ts` への `cleanup()` メソッド追加

**ファイル:** `src/features/primal-path/audio.ts`

```typescript
// AudioEngine に追加
cleanup: (): void => {
  BgmEngine.stop();
  if (ac) {
    try { ac.close(); } catch { /* 既にクローズ済み */ }
    ac = null;
  }
},
```

**動作:**
1. `BgmEngine.stop()` で `setInterval` をクリアし、`bgmOsc` を停止
2. `AudioContext.close()` でオーディオリソースを解放
3. `ac = null` で次回の `initAudio()` で新しい `AudioContext` を生成させる

#### 1.2.2 `PrimalPathGame.tsx` へのクリーンアップ追加

**ファイル:** `src/features/primal-path/PrimalPathGame.tsx`

`GameInner` コンポーネント内に以下の `useEffect` を追加:

```typescript
useEffect(() => {
  return () => {
    AudioEngine.cleanup();
  };
}, []);
```

#### 1.2.3 `hooks.ts` の `useAudio` フック拡張

**ファイル:** `src/features/primal-path/hooks.ts`

`useAudio` フックに `cleanup` 関数を追加し、エクスポートする:

```typescript
const cleanup = useCallback(() => {
  AudioEngine.cleanup();
}, []);

return { init, playSfx, playBgm, stopBgm, setBgmVolume, setSfxVolume, cleanup };
```

### 1.3 テスト仕様

| テストケース | 期待結果 |
|-------------|---------|
| `cleanup()` 呼び出し後に BGM が停止する | `bgmPlaying === false`、`bgmTimerId === null` |
| `cleanup()` 呼び出し後に AudioContext が閉じられる | `ac === null` |
| `cleanup()` を複数回呼んでもエラーにならない | 例外なし |
| `cleanup()` 後に再度 `init()` で新しい AudioContext が生成される | 新しいインスタンスが生成 |

---

## フェーズ 2: 3層パララックス背景

### 2.1 概要

ホームページ（`/`）に3層パララックス背景を実装する。迷宮の残響の `TitleScreen.tsx` のマウス追従方式を基盤とし、プラットフォーム全体の雰囲気（ダーク/プレミアムテーマ）に合わせたデザインにする。

### 2.2 コンポーネント設計

#### `HomeParallaxBg` コンポーネント

**ファイル:** `src/components/organisms/HomeParallaxBg.tsx`

**Props:**
```typescript
interface HomeParallaxBgProps {
  className?: string;
}
```

**レイヤー構成:**

| レイヤー | Z-Index | 透明度 | フィルタ | マウス追従係数(X/Y) | 自動ドリフト速度 | スケール |
|---------|---------|--------|---------|-------------------|----------------|--------|
| Far（遠景） | 1 | 0.6 | `blur(2px)` | 4 / 3 | 30秒 | 1.05 |
| Mid（中景） | 2 | 0.4 | `blur(1px)` | 10 / 7 | 22秒 | 1.08 |
| Near（近景） | 3 | 0.25 | なし | 18 / 12 | 16秒 | 1.12 |

**レンダリング:**

```tsx
<Container>
  <Layer
    style={{
      backgroundImage: `url(${homeBgFar})`,
      transform: `translate(${farX}px, ${farY}px) scale(1.05)`,
      opacity: 0.6,
      filter: 'blur(2px)',
      animation: 'homeDriftFar 30s ease-in-out infinite',
    }}
  />
  <Layer style={{ /* Mid layer */ }} />
  <Layer style={{ /* Near layer */ }} />
  <Overlay /> {/* 暗めのオーバーレイ */}
</Container>
```

#### `useMouseParallax` フック

**ファイル:** `src/hooks/useMouseParallax.ts`

```typescript
interface MousePosition {
  x: number; // -1.0 ～ +1.0（ビューポート中心基準）
  y: number; // -1.0 ～ +1.0
}

function useMouseParallax(): MousePosition;
```

**仕様:**
- ビューポート中心を原点として、マウス位置を -1.0 〜 +1.0 に正規化
- タッチデバイスでは `{ x: 0, y: 0 }` を返し続ける（自動ドリフトのみ）
- `transition: transform 0.3s ease-out` で滑らかな追従
- `willChange: 'transform'` で GPU 加速ヒント

### 2.3 CSS アニメーション

```css
@keyframes homeDriftFar {
  0%   { transform: translate(0px, 0px) scale(1.05); }
  25%  { transform: translate(3px, -5px) scale(1.05); }
  50%  { transform: translate(-4px, -8px) scale(1.05); }
  75%  { transform: translate(-5px, 3px) scale(1.05); }
  100% { transform: translate(0px, 0px) scale(1.05); }
}

@keyframes homeDriftMid {
  0%   { transform: translate(0px, 0px) scale(1.08); }
  25%  { transform: translate(-7px, 4px) scale(1.08); }
  50%  { transform: translate(5px, 9px) scale(1.08); }
  75%  { transform: translate(8px, -3px) scale(1.08); }
  100% { transform: translate(0px, 0px) scale(1.08); }
}

@keyframes homeDriftNear {
  0%   { transform: translate(0px, 0px) scale(1.12); }
  25%  { transform: translate(10px, -7px) scale(1.12); }
  50%  { transform: translate(-8px, 10px) scale(1.12); }
  75%  { transform: translate(-12px, -4px) scale(1.12); }
  100% { transform: translate(0px, 0px) scale(1.12); }
}
```

### 2.4 AI 生成画像の仕様

#### 共通仕様

- **フォーマット:** WebP
- **解像度:** 1920 x 1080 px（デスクトップ対応）
- **ファイルサイズ目標:** 各画像 200KB 以下
- **配色:** プレミアムテーマに合わせたダーク系（`#0f0c29` / `#302b63` / `#24243e` ベース）

#### Far レイヤー（遠景）— `home_bg_far.webp`

**AI 生成プロンプト:**

```
ダークな宇宙空間の背景画像。深い紺色〜紫色のグラデーション。
遠くにぼんやりと光る星雲と無数の小さな星が散らばっている。
全体的にとても暗く、中央がわずかに明るい。
テクスチャは滑らかで、ノイズ感は控えめ。
ゲームプラットフォームの背景として使用するため、主張しすぎないこと。
解像度1920x1080、写実的ではなくアーティスティック/イラスト調。
カラーパレット: #0f0c29, #302b63, #24243e, #1a1a4e（にごった紫〜紺）
```

**英語版:**
```
Dark cosmic space background. Deep navy-to-purple gradient.
Distant nebulas glowing faintly, countless small stars scattered across the sky.
Very dark overall with a slightly brighter center area.
Smooth texture with minimal noise.
Should not be too eye-catching as it will be used as a game platform background.
Resolution 1920x1080, artistic/illustration style rather than photorealistic.
Color palette: #0f0c29, #302b63, #24243e, #1a1a4e (muted purple to navy)
```

#### Mid レイヤー（中景）— `home_bg_mid.webp`

**AI 生成プロンプト:**

```
半透明の幾何学グリッドパターン。暗い背景に薄くシアン（#00d2ff）とパープル（#a855f7）の
線で描かれたワイヤーフレーム風のグリッドが奥に向かってパースペクティブで伸びている。
ところどころにノード（結節点）が淡く光っている。
背景は完全に透明（PNG alpha）または非常に暗い色（#0a0a1a、透過感を持たせるため）。
デジタル・テクノロジーの雰囲気。ゲーム的な世界観。
グリッドの密度は中程度で、視認性は控えめ。
解像度1920x1080。
```

**英語版:**
```
Semi-transparent geometric grid pattern. Thin wireframe-style grid lines drawn in
faint cyan (#00d2ff) and purple (#a855f7) on a very dark background, extending into
perspective depth. Scattered nodes (intersection points) glowing softly.
Background should be very dark (#0a0a1a) to allow transparency effect when layered.
Digital/technology aesthetic. Game-world atmosphere.
Medium grid density, subtle visibility.
Resolution 1920x1080.
```

#### Near レイヤー（近景）— `home_bg_near.webp`

**AI 生成プロンプト:**

```
浮遊する光のパーティクルとボケエフェクト。暗い背景に
大小さまざまな淡いシアン（#00d2ff）とアイスブルー（#a5f3fc）の光の玉が
浮遊している。一部はやや大きく円形のボケとなっている。
全体的に非常に控えめで、最前景レイヤーとして使用するため透明感が重要。
背景は非常に暗い（#050510）またはほぼ黒。
光の粒子は画面全体に散らばっているが、密集しすぎない。
解像度1920x1080。
```

**英語版:**
```
Floating light particles and bokeh effects. Various sizes of soft cyan (#00d2ff) and
ice blue (#a5f3fc) light orbs floating on a very dark background.
Some are larger with circular bokeh blur.
Very subtle overall — transparency feel is crucial as this will be the foreground layer.
Background should be very dark (#050510) or nearly black.
Light particles scattered across the screen but not too dense.
Resolution 1920x1080.
```

### 2.5 `GameListPage` への統合

```tsx
// GameListPage.tsx
const GameListPage: React.FC = () => {
  return (
    <PageContainer>
      <HomeParallaxBg />
      <ContentWrapper> {/* position: relative; z-index: 2 */}
        <HeroSection>
          <HeroTitle>Game Platform</HeroTitle>
          <HeroSubtitle>...</HeroSubtitle>
        </HeroSection>
        <BentoGrid>
          {/* ゲームカード一覧 */}
        </BentoGrid>
      </ContentWrapper>
    </PageContainer>
  );
};
```

### 2.6 アクセシビリティ・パフォーマンス対応

| 項目 | 対応 |
|------|------|
| `prefers-reduced-motion` | アニメーション無効、静的表示に切り替え |
| タッチデバイス | マウス追従無効、自動ドリフトのみ |
| 画像の遅延読み込み | `loading="lazy"` は使わない（ファーストビューのため） |
| GPU 加速 | `will-change: transform` を各レイヤーに設定 |
| 画像プリロード | Webpack の `import` で自動バンドル |

---

## フェーズ 3: ヘッダーデザイン洗練

### 3.1 現状の問題

現在、以下の2箇所で「Game Platform」が表示されている:

1. **ヘッダー** (`App.tsx` 行211): `<Title><Link to="/">Game Platform</Link></Title>` — h1 タグ、グラデーションテキスト
2. **HeroSection** (`GameListPage.tsx` 行38): `<HeroTitle>Game Platform</HeroTitle>` — h2 タグ、大きなグラデーションテキスト

ホームページでは両方が表示され、冗長に見える。

### 3.2 改善デザイン

#### ヘッダーの変更

**Before:**
```
┌──────────────────────────────────────────────┐
│              Game Platform                    │  ← h1, 中央寄せ
└──────────────────────────────────────────────┘
```

**After:**
```
┌──────────────────────────────────────────────┐
│  [GP] niku9                         About    │  ← ロゴ + サイト名（左寄せ）+ ナビ（右寄せ）
└──────────────────────────────────────────────┘
```

**仕様:**

| 要素 | 仕様 |
|------|------|
| ロゴマーク | `GP` モノグラム（グラデーション文字、Orbitron フォント） |
| サイト名 | `niku9` — 小さめ表示（0.9rem）、ロゴの横に配置 |
| ナビリンク | 「About」リンク（右寄せ） |
| レイアウト | `display: flex; justify-content: space-between; align-items: center;` |
| デザイン | 既存の Glassmorphism を維持 |
| h1 タグ | ロゴ部分を `h1` として維持（SEO 観点） |

#### スクロール時の動的変化

| スクロール位置 | パディング | 背景透過 | ロゴサイズ |
|--------------|-----------|---------|----------|
| top（0px） | `16px 24px` | `rgba(255,255,255,0.05)` | `1.4rem` |
| scrolled（50px+） | `8px 24px` | `rgba(255,255,255,0.08)` | `1.2rem` |

**`useShrinkHeader` フック:**

```typescript
function useShrinkHeader(threshold?: number): {
  isScrolled: boolean;
};
```

- `threshold` のデフォルト値: `50`
- `window.scrollY > threshold` で `isScrolled` を `true` に
- `passive: true` のスクロールリスナー

### 3.3 HeroSection の変更

HeroSection は変更なし。メインの「Game Platform」タイトル表示は HeroSection が担当する。h2 → `aria-label` で補足し、SEO 的にはヘッダーの h1 がメインタイトルとなる。

### 3.4 レスポンシブ対応

| ブレークポイント | ロゴ | サイト名 | ナビリンク |
|----------------|------|---------|----------|
| デスクトップ（768px+） | `GP` + サイト名 | 表示 | 表示 |
| モバイル（〜767px） | `GP` のみ | 非表示 | アイコン化 |

---

## フェーズ 4: SEO 強化

### 4.1 構造化データ（JSON-LD）追加

#### 4.1.1 ゲーム個別の構造化データ

各ゲームページにアクセスした際に、`<script type="application/ld+json">` を動的に挿入する。

**VideoGame スキーマ:**
```json
{
  "@context": "https://schema.org",
  "@type": "VideoGame",
  "name": "Picture Puzzle",
  "description": "美しい画像を使ったクラシックなスライドパズル。難易度調整機能付きで、初心者から上級者まで楽しめます。",
  "url": "https://niku9.click/puzzle",
  "gamePlatform": "Web Browser",
  "applicationCategory": "Game",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "JPY"
  },
  "inLanguage": "ja",
  "isPartOf": {
    "@type": "WebSite",
    "name": "Game Platform",
    "url": "https://niku9.click/"
  }
}
```

**対象ゲーム:** 全13ゲーム

**実装方式:**
- `useStructuredData` フックを作成
- `useEffect` で `<script>` タグを `<head>` に挿入、クリーンアップで削除
- ゲームデータは定数ファイルで一元管理

#### 4.1.2 パンくずリスト構造化データ

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "ホーム",
      "item": "https://niku9.click/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Picture Puzzle",
      "item": "https://niku9.click/puzzle"
    }
  ]
}
```

### 4.2 `sitemap.xml` の拡充

**Before:**
```xml
<url><loc>https://niku9.click/</loc></url>
```

**After:**
```xml
<url>
  <loc>https://niku9.click/</loc>
  <lastmod>2026-03-03</lastmod>
  <changefreq>weekly</changefreq>
  <priority>1.0</priority>
</url>
<url>
  <loc>https://niku9.click/puzzle</loc>
  <lastmod>2026-03-03</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.8</priority>
</url>
```

**優先度ルール:**

| ページ | priority | changefreq |
|--------|----------|-----------|
| ホーム | 1.0 | weekly |
| ゲームページ | 0.8 | monthly |
| About | 0.5 | yearly |
| 法的ページ | 0.3 | yearly |

### 4.3 `theme-color` メタタグ

```html
<meta name="theme-color" content="#0f0c29">
```

プレミアムテーマのベース色を設定。モバイルブラウザのアドレスバー色に反映される。

### 4.4 動的 meta description

**`useMetaDescription` フック:**

```typescript
function useMetaDescription(): void;
```

ルートパスに応じて `<meta name="description">` の `content` を動的に更新する。

| パス | description |
|------|-----------|
| `/` | 13種類の無料ブラウザゲームが楽しめるゲームプラットフォーム。... |
| `/puzzle` | 美しい画像を使ったクラシックなスライドパズル。難易度調整機能付き。無料でブラウザからすぐにプレイ可能。 |
| `/labyrinth-echo` | テキスト探索×判断×ローグライトRPG。不確かな情報の中で選択を重ね、迷宮からの生還を目指せ。 |
| `/primal-path` | 三大文明を育て進化を重ねる自動戦闘ローグライト。シナジービルドで毎回異なる冒険が待つ。 |
| （他ゲーム） | 各ゲームの説明文をベースに作成 |

### 4.5 Performance Hints

```html
<!-- クリティカルフォントのプリロード -->
<link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" as="style">

<!-- 背景画像のプリロード（フェーズ2実装後） -->
<link rel="preload" href="/static/media/home_bg_far.webp" as="image" type="image/webp">
```

### 4.6 OGP の各ゲーム個別対応

**方針:** SPA の制約上、サーバーサイドレンダリングなしでは動的 OGP は困難。以下のアプローチで対応:

1. **ホーム用 OGP（既存）:** 維持
2. **各ゲーム用 OGP:** `og:image` 用の静的画像を用意（各ゲームのカードBG画像を流用）
3. **実装:** `useOgpUpdate` フックで `<meta property="og:*">` を動的に更新
   - 注：SNS クローラーは JS を実行しないため効果は限定的
   - 将来的に SSR 対応する際のベース実装として位置づけ

---

## フェーズ 5: ページ演出の強化

### 5.1 背景パーティクルシステム

**コンポーネント:** `src/components/atoms/ParticleField.tsx`

**仕様:**
- Canvas ベースの軽量パーティクル（DOM ノード数を抑制）
- 粒子数: 30〜50個（パフォーマンスとのバランス）
- 色: `rgba(0, 210, 255, 0.3)` ～ `rgba(168, 85, 247, 0.2)`（シアン〜パープル）
- サイズ: 1〜3px
- 動き: ゆっくりと上方向にドリフト、わずかに左右に揺れる
- `IntersectionObserver` で viewport 外はアニメーション停止
- `prefers-reduced-motion` 時は描画のみ、アニメーションなし

```typescript
interface ParticleFieldProps {
  count?: number;     // 粒子数（デフォルト: 40）
  color?: string;     // ベース色（デフォルト: 'cyan'）
  speed?: number;     // 速度倍率（デフォルト: 1）
  className?: string;
}
```

### 5.2 ゲームカード入場アニメーション（スタッガード）

既存の `useScrollReveal` を拡張し、各カードが順番に入場するスタッガードアニメーションを実装する。

**仕様:**
- 各カードに `animation-delay` を `index * 100ms` で設定
- アニメーション: `opacity: 0 → 1`, `translateY(30px) → 0`
- `IntersectionObserver` トリガー（viewport に入ったときに開始）
- `transition-duration: 0.6s`, `ease-out`

```css
.card-enter {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}

.card-enter.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### 5.3 HeroSection タイプライターエフェクト

**コンポーネント:** `src/components/atoms/TypeWriter.tsx`

サブタイトル「厳選されたインタラクティブなゲーム体験を、ここから始めよう。」をタイプライターエフェクトで表示する。

**仕様:**
- 1文字ずつ表示（間隔: 50ms）
- カーソル（`|`）が点滅（`blink 1s step-end infinite`）
- 表示完了後3秒でカーソル消去
- `prefers-reduced-motion` 時は即時全文表示

```typescript
interface TypeWriterProps {
  text: string;
  speed?: number;        // 1文字あたりの表示間隔（ms、デフォルト: 50）
  cursorChar?: string;   // カーソル文字（デフォルト: '|'）
  className?: string;
}
```

### 5.4 ゲーム総数カウンターアニメーション

**コンポーネント:** `src/components/atoms/CountUp.tsx`

HeroSection のサブタイトル付近に「13 Games」のカウントアップアニメーションを表示。

**仕様:**
- 0 → 13 を 1.5 秒でカウントアップ
- `easeOut` のイージングで最後にゆっくり
- `IntersectionObserver` で viewport に入ったときに開始
- フォント: `Orbitron`（ゲーミング感）
- 色: `var(--accent-color)`

```typescript
interface CountUpProps {
  end: number;
  duration?: number;     // アニメーション時間（ms、デフォルト: 1500）
  suffix?: string;       // 接尾辞（デフォルト: ''）
  className?: string;
}
```

### 5.5 フッターのパーティクルライン装飾

フッターの上辺に、パーティクルが流れるライン装飾を追加。

**仕様:**
- フッターの `border-top` の代わりに、光の粒が左→右に流れるアニメーション
- CSS のみで実装（`@keyframes` + `linear-gradient` + `background-position`）
- 高さ: 1px
- 色: `var(--accent-color)` → `transparent` のグラデーション

```css
.footer-particle-line::before {
  content: '';
  display: block;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--accent-color) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: particleLine 3s linear infinite;
}

@keyframes particleLine {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### 5.6 ページ遷移トランジション

ゲームカードをクリックした際のページ遷移にフェードトランジションを追加。

**仕様:**
- フェードアウト: 200ms
- フェードイン: 300ms
- CSS `opacity` ベース（React Router のルート切り替えに合わせる）
- `Suspense` の `fallback` にもフェードインを適用

**実装方針:**
- `CSSTransition` ベースではなく、CSS `@keyframes` + Suspense の組み合わせ
- 複雑なルートアニメーションライブラリは導入しない（バンドルサイズ重視）

---

## 全フェーズ共通: アクセシビリティ要件

| 項目 | 対応 |
|------|------|
| `prefers-reduced-motion` | すべてのアニメーションを無効化 or 最小化 |
| `prefers-color-scheme` | 現状プレミアムテーマ固定のため対応不要 |
| キーボードナビゲーション | 新規追加要素に適切な `tabIndex` と `aria-label` |
| スクリーンリーダー | パーティクル・パララックスに `aria-hidden="true"` |
| コントラスト比 | WCAG AA（4.5:1）準拠を維持 |
