# Game Platform UI/UX ブラッシュアップ タスクチェックリスト

## 凡例

- `[ ]` 未着手
- `[~]` 作業中
- `[x]` 完了
- `[-]` スキップ / 不要

---

## フェーズ 1: 原始進化録 音声停止バグ修正

### 1-1: `audio.ts` に `cleanup()` メソッド追加

- [x] `AudioEngine` に `cleanup()` メソッドを追加
  - [x] `BgmEngine.stop()` を呼び出し
  - [x] `ac.close()` で AudioContext を解放
  - [x] `ac = null` でリセット
  - [x] `try-catch` で既にクローズ済みのケースをハンドリング
- [x] エクスポートの確認（`AudioEngine.cleanup` が外部から呼べること）

### 1-2: `PrimalPathGame.tsx` にクリーンアップ追加

- [x] `GameInner` コンポーネントにアンマウント時の `useEffect` を追加
  - [x] クリーンアップ関数で `AudioEngine.cleanup()` を呼び出し
  - [x] 依存配列は `[cleanupAudio]`（useCallback メモ化済みのため実質マウント/アンマウント時のみ）

### 1-3: `hooks.ts` の `useAudio` フック拡張

- [x] `cleanup` 関数を `useCallback` でラップして追加
- [x] `return` オブジェクトに `cleanup` を含める

### 1-4: テストの追加

- [x] `audio-cleanup.test.ts` を作成
  - [x] `cleanup()` 呼び出し後に BGM が停止することを確認
  - [x] `cleanup()` 呼び出し後に `setInterval` がクリアされることを確認
  - [x] `cleanup()` 後に `AudioContext.close()` が呼ばれることを確認
  - [x] `cleanup()` を複数回呼んでもエラーにならないことを確認
  - [x] `cleanup()` 後に `init()` で新しい AudioContext が生成されることを確認
  - [x] `cleanup()` 後に再度 BGM を正常に再生できることを確認

### 1-5: 動作確認

- [x] ビルドエラーがないこと（`npm run build`）
- [x] 既存テストが通ること（`npm test`）— 15スイート / 442テスト 全合格
- [x] ブラウザ確認: 原始進化録プレイ中にホームに戻り、音が停止すること
- [x] ブラウザ確認: 音停止後、再度原始進化録に入り BGM が正常に再生されること
- [x] ブラウザ確認: 他のゲーム（迷宮の残響等）の音声が引き続き正常に動作すること

---

## フェーズ 2: 3層パララックス背景

### 2-1: AI 画像生成準備

- [x] `spec.md` の画像プロンプトを確認し、AI に画像生成を依頼
- [x] 生成画像の確認・選定
  - [x] Far レイヤー（宇宙/星雲）: 暗め、主張控えめ
  - [x] Mid レイヤー（幾何学グリッド）: 半透明、テクノロジー感
  - [x] Near レイヤー（光粒/ボケ）: 繊細、透明感
- [x] 画像の最適化
  - [x] WebP フォーマットへの変換
  - [x] 解像度確認（1920x1080）
  - [x] ファイルサイズ確認（各 200KB 以下）
- [x] `src/assets/images/` に配置
  - [x] `home_bg_far.webp`
  - [x] `home_bg_mid.webp`
  - [x] `home_bg_near.webp`

### 2-2: `useMouseParallax` フック作成

- [x] `src/hooks/useMouseParallax.ts` を作成
  - [x] ビューポート中心基準の座標正規化（-1.0 〜 +1.0）
  - [x] `mousemove` イベントリスナーの登録・解除
  - [x] タッチデバイス判定（`ontouchstart` チェック）
  - [x] タッチデバイスでは `{ x: 0, y: 0 }` を返す

### 2-3: `HomeParallaxBg` コンポーネント作成

- [x] `src/components/organisms/HomeParallaxBg.tsx` を作成
  - [x] 3層レイヤー構成（Far / Mid / Near）
  - [x] 各レイヤーの `transform` にマウス追従オフセットを反映
  - [x] 自動ドリフト CSS アニメーション（Far: 30s, Mid: 22s, Near: 16s）
  - [x] ダークオーバーレイ（コンテンツの可読性確保）
  - [x] `position: fixed; inset: 0;` で全画面固定
  - [x] `aria-hidden="true"` でスクリーンリーダーから除外
  - [x] `prefers-reduced-motion` 対応
  - [x] `will-change: transform` の設定

### 2-4: `GameListPage` への統合

- [x] `GameListPage.tsx` に `HomeParallaxBg` を追加
- [x] 既存コンテンツを `ContentWrapper`（`position: relative; z-index: 2`）でラップ
- [x] `PageContainer` の背景をパララックスに委譲（`background: transparent`）

### 2-5: テストの追加

- [x] `HomeParallaxBg.test.tsx` を作成
  - [x] コンポーネントが正常にレンダリングされること
  - [x] 3つのレイヤーが存在すること
  - [x] `aria-hidden="true"` が設定されていること
- [x] `useMouseParallax.test.ts` を作成
  - [x] 初期値が `{ x: 0, y: 0 }` であること
  - [x] マウスイベントで値が更新されること

### 2-6: 動作確認

- [x] ビルドエラーがないこと
- [x] デスクトップ: マウス移動で3層が異なる速度で追従すること
- [x] モバイル: 自動ドリフトアニメーションが動作すること
- [-] `prefers-reduced-motion` 有効時にアニメーションが停止すること
- [-] パフォーマンス: フレームレートが 60fps を維持すること

---

## フェーズ 3: ヘッダーデザイン洗練

### 3-1: `useShrinkHeader` フック作成

- [x] `src/hooks/useShrinkHeader.ts` を作成
  - [x] `window.scrollY` 監視（`passive: true`）
  - [x] `threshold`（デフォルト: 50px）以上で `isScrolled: true`
  - [x] スクロールリスナーのクリーンアップ

### 3-2: ヘッダーコンポーネントの変更

- [x] `App.tsx` のヘッダーデザインを変更
  - [x] レイアウトを `flex` + `justify-content: space-between` に変更
  - [x] 左側: ロゴマーク（`GP` モノグラム、Orbitron フォント）+ サイト名（`niku9`）
  - [x] 右側: ナビリンク（「About」）
  - [x] h1 タグをロゴ部分に維持
  - [x] グラデーションテキスト維持（`GP` 部分）
  - [x] Glassmorphism デザイン維持

### 3-3: スクロール時のアニメーション適用

- [x] `useShrinkHeader` の `isScrolled` に応じたスタイル切り替え
  - [x] パディング: `16px 24px` → `8px 24px`
  - [x] ロゴサイズ: `1.4rem` → `1.2rem`
  - [x] 背景透過: `0.05` → `0.08`
  - [x] `transition: all 0.3s ease` で滑らかに変化

### 3-4: レスポンシブ対応

- [x] モバイル（768px 未満）
  - [x] サイト名（`niku9`）を非表示
  - [x] `GP` ロゴのみ表示
  - [x] ナビリンクのコンパクト化

### 3-5: テストの追加

- [x] `useShrinkHeader.test.ts` を作成
  - [x] 初期状態で `isScrolled === false` であること
  - [x] スクロールイベントで値が変化すること
  - [x] スクロール位置がしきい値以下に戻ると false に戻ること
  - [x] デフォルトのしきい値が 50 であること
  - [x] カスタムしきい値を指定できること
  - [x] アンマウント時にスクロールリスナーが解除されること
- [x] ヘッダーの DOM テスト（`App.header.test.tsx`）
  - [x] GP モノグラムが存在すること
  - [x] ロゴ部分が h1 タグであること
  - [x] ロゴクリックでホームに遷移するリンクがあること
  - [x] niku9 サイト名が表示されること
  - [x] About ナビリンクが存在すること
  - [x] グローバルナビゲーション領域が存在すること

### 3-6: 動作確認

- [x] ビルドエラーがないこと
- [x] ヘッダーにロゴとナビリンクが表示されること
- [x] スクロール時にヘッダーが縮小すること
- [x] ホームボタン（ロゴクリック）で `/` に遷移すること
- [x] モバイル表示が崩れないこと
- [x] フルスクリーンゲームページではヘッダーが非表示であること

---

## フェーズ 4: SEO 強化

### 4-1: 構造化データ（JSON-LD VideoGame）

- [x] ゲームデータの定数ファイルを作成（`src/constants/game-seo-data.ts`）
  - [x] 全13ゲームの名前、説明文、URL を定義
- [x] `useStructuredData` フックを作成
  - [x] `<head>` に `<script type="application/ld+json">` を動的挿入
  - [x] アンマウント時にクリーンアップ
  - [x] `skip` オプションで非ゲームページでの挿入をスキップ
- [x] `useGameStructuredData` ヘルパーフック作成（GamePageWrapper から呼び出し）
- [x] 各ゲームページで `useStructuredData` を呼び出し（`GamePageWrapper` 経由）

### 4-2: `sitemap.xml` の拡充

- [x] 全 URL に `lastmod` を追加（2026-03-03）
- [x] 全 URL に `changefreq` を追加（weekly / monthly / yearly）
- [x] 全 URL に `priority` を追加（1.0 / 0.8 / 0.5 / 0.3）
- [x] 新規ページ（About, Privacy Policy, Terms, Contact）の URL を確認
- [x] XML 構文検証通過（18 URL）

### 4-3: `theme-color` メタタグ追加

- [x] `public/index.html` に `<meta name="theme-color" content="#0f0c29">` を追加

### 4-4: パンくずリスト構造化データ

- [x] `useStructuredData` フックにパンくずリスト対応を追加（BreadcrumbList スキーマ）
- [x] ホーム → ゲームページの2階層パンくず（`useGameStructuredData` 経由）

### 4-5: 動的 meta description

- [x] `useMetaDescription` フックを作成（`src/hooks/useMetaDescription.ts`）
  - [x] ルートパスに応じた description マッピング（`META_DESCRIPTIONS` 定数）
  - [x] `<meta name="description">` の `content` を動的更新
  - [x] クリーンアップで元の description に戻す
- [x] `App.tsx` から `useMetaDescription` を呼び出し

### 4-6: Performance Hints

- [x] `public/index.html` にフォントの `preload` ヒントを追加
- [-] パララックス背景画像の `preload` — Webpack バンドル（ハッシュ付きファイル名）のため静的 preload 不可、Webpack の import で自動対応

### 4-6b: OGP 個別対応

- [x] `useOgpUpdate` フック作成（`src/hooks/useOgpUpdate.ts`）
  - [x] ゲームページで `og:title` / `og:description` / `og:url` を動的更新
  - [x] アンマウント時に元の OGP 値に戻す
- [x] `App.tsx` から `useOgpUpdate` を呼び出し

### 4-7: テストの追加

- [x] `useStructuredData.test.ts` を作成（5テスト）
  - [x] `<head>` に JSON-LD スクリプトが挿入されること
  - [x] アンマウント時にスクリプトが削除されること
  - [x] パンくずリストの JSON-LD が正しく挿入されること
  - [x] XSS 対策（textContent 経由の挿入検証）
- [x] `useMetaDescription.test.ts` を作成（7テスト）
  - [x] ルートに応じた description が設定されること
  - [x] アンマウント時に元の description に戻ること
  - [x] 未定義パスでデフォルト維持
- [x] `useOgpUpdate.test.ts` を作成（5テスト）
  - [x] ゲームページで OGP が更新されること
  - [x] ホームページで元の OGP が維持されること
  - [x] アンマウント時に元の値に戻ること
- [x] `sitemap.test.ts` 更新（changefreq 検証テスト追加）

### 4-8: 動作確認

- [x] ビルドエラーがないこと（webpack compiled with 1 warning）
- [x] 全テスト通過（188スイート / 2571テスト）
- [-] Google Rich Results Test で構造化データが有効であること（デプロイ後に確認）
- [-] Lighthouse SEO スコアが 90+ であること（デプロイ後に確認）
- [x] `sitemap.xml` が有効な XML であること（Python xml.etree で検証済み）

---

## フェーズ 5: ページ演出の強化

### 5-1: 背景パーティクルシステム

- [ ] `src/components/atoms/ParticleField.tsx` を作成
  - [ ] Canvas ベースのパーティクル描画
  - [ ] 粒子数: 40個（デフォルト）
  - [ ] 色: シアン〜パープルのグラデーション
  - [ ] 動き: 上方向ドリフト + 左右揺れ
  - [ ] `IntersectionObserver` で viewport 外停止
  - [ ] `prefers-reduced-motion` 対応
  - [ ] `requestAnimationFrame` のクリーンアップ

### 5-2: ゲームカード入場アニメーション

- [ ] `useScrollReveal` の拡張 or 新規フック作成
  - [ ] スタッガードアニメーション（`index * 100ms` ディレイ）
  - [ ] `IntersectionObserver` トリガー
  - [ ] `opacity: 0 → 1`, `translateY(30px) → 0`
  - [ ] `transition-duration: 0.6s`, `ease-out`
- [ ] `GameListPage.tsx` のカードに適用

### 5-3: HeroSection タイプライターエフェクト

- [ ] `src/components/atoms/TypeWriter.tsx` を作成
  - [ ] 1文字ずつ表示（50ms 間隔）
  - [ ] カーソル点滅アニメーション
  - [ ] 表示完了後のカーソル消去（3秒後）
  - [ ] `prefers-reduced-motion` 対応（即時全文表示）
- [ ] `GameListPage.tsx` の `HeroSubtitle` を `TypeWriter` に置き換え

### 5-4: ゲーム総数カウンターアニメーション

- [ ] `src/components/atoms/CountUp.tsx` を作成
  - [ ] 0 → 目標値のカウントアップ
  - [ ] `easeOut` イージング
  - [ ] `IntersectionObserver` トリガー
  - [ ] Orbitron フォント
- [ ] HeroSection に「13 Games」として配置

### 5-5: フッターパーティクルライン装飾

- [ ] `App.tsx` のフッタースタイルに光の粒が流れるアニメーションを追加
  - [ ] CSS `@keyframes` + `linear-gradient` + `background-position`
  - [ ] 既存の `border-top` を置き換え
  - [ ] `prefers-reduced-motion` 対応

### 5-6: ページ遷移トランジション

- [ ] `Suspense` の `fallback` にフェードインアニメーションを適用
- [ ] ゲームカードクリック時のフェードアウト（200ms）
- [ ] CSS `@keyframes` ベース（ライブラリ追加なし）

### 5-7: テストの追加

- [ ] `ParticleField.test.tsx` を作成
  - [ ] Canvas 要素がレンダリングされること
  - [ ] `aria-hidden="true"` が設定されていること
- [ ] `TypeWriter.test.tsx` を作成
  - [ ] テキストが順次表示されること
  - [ ] `prefers-reduced-motion` 時に全文即時表示されること
- [ ] `CountUp.test.tsx` を作成
  - [ ] 目標値に到達すること

### 5-8: 動作確認

- [ ] ビルドエラーがないこと
- [ ] パーティクルが背景に表示され、ゆっくり浮遊すること
- [ ] ゲームカードがスクロールに応じて順番に入場すること
- [ ] タイプライターエフェクトが自然に見えること
- [ ] カウンターアニメーションが正常に動作すること
- [ ] フッターのライン装飾が流れていること
- [ ] ページ遷移が滑らかであること
- [ ] モバイル表示が崩れないこと
- [ ] `prefers-reduced-motion` 有効時に全アニメーションが停止/最小化すること

---

## 全フェーズ共通: 最終確認

### 統合テスト

- [ ] `npm run build` が成功すること
- [ ] `npm test` が全テスト通過すること
- [ ] Lighthouse パフォーマンスが 80+ であること
- [ ] Lighthouse SEO が 90+ であること
- [ ] Lighthouse アクセシビリティが 90+ であること

### ブラウザ確認

- [ ] Chrome（最新）で全機能が動作すること
- [ ] Firefox（最新）で全機能が動作すること
- [ ] Safari（最新）で全機能が動作すること
- [ ] モバイル（iOS Safari / Android Chrome）で表示が崩れないこと

### クロスフェーズ確認

- [ ] 音声バグ修正がパララックスや演出と干渉しないこと
- [ ] ヘッダー変更がフルスクリーンゲームの表示に影響しないこと
- [ ] SEO 構造化データが有効な JSON-LD であること
- [ ] 演出が既存ゲームのパフォーマンスに影響しないこと
