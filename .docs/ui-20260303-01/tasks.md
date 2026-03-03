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

- [ ] `spec.md` の画像プロンプトを確認し、AI に画像生成を依頼
- [ ] 生成画像の確認・選定
  - [ ] Far レイヤー（宇宙/星雲）: 暗め、主張控えめ
  - [ ] Mid レイヤー（幾何学グリッド）: 半透明、テクノロジー感
  - [ ] Near レイヤー（光粒/ボケ）: 繊細、透明感
- [ ] 画像の最適化
  - [ ] WebP フォーマットへの変換
  - [ ] 解像度確認（1920x1080）
  - [ ] ファイルサイズ確認（各 200KB 以下）
- [ ] `src/assets/images/` に配置
  - [ ] `home_bg_far.webp`
  - [ ] `home_bg_mid.webp`
  - [ ] `home_bg_near.webp`

### 2-2: `useMouseParallax` フック作成

- [ ] `src/hooks/useMouseParallax.ts` を作成
  - [ ] ビューポート中心基準の座標正規化（-1.0 〜 +1.0）
  - [ ] `mousemove` イベントリスナーの登録・解除
  - [ ] タッチデバイス判定（`ontouchstart` チェック）
  - [ ] タッチデバイスでは `{ x: 0, y: 0 }` を返す

### 2-3: `HomeParallaxBg` コンポーネント作成

- [ ] `src/components/organisms/HomeParallaxBg.tsx` を作成
  - [ ] 3層レイヤー構成（Far / Mid / Near）
  - [ ] 各レイヤーの `transform` にマウス追従オフセットを反映
  - [ ] 自動ドリフト CSS アニメーション（Far: 30s, Mid: 22s, Near: 16s）
  - [ ] ダークオーバーレイ（コンテンツの可読性確保）
  - [ ] `position: fixed; inset: 0;` で全画面固定
  - [ ] `aria-hidden="true"` でスクリーンリーダーから除外
  - [ ] `prefers-reduced-motion` 対応
  - [ ] `will-change: transform` の設定

### 2-4: `GameListPage` への統合

- [ ] `GameListPage.tsx` に `HomeParallaxBg` を追加
- [ ] 既存コンテンツを `ContentWrapper`（`position: relative; z-index: 2`）でラップ
- [ ] `PageContainer` の背景をパララックスに委譲（`background: transparent`）

### 2-5: テストの追加

- [ ] `HomeParallaxBg.test.tsx` を作成
  - [ ] コンポーネントが正常にレンダリングされること
  - [ ] 3つのレイヤーが存在すること
  - [ ] `aria-hidden="true"` が設定されていること
- [ ] `useMouseParallax.test.ts` を作成
  - [ ] 初期値が `{ x: 0, y: 0 }` であること
  - [ ] マウスイベントで値が更新されること

### 2-6: 動作確認

- [ ] ビルドエラーがないこと
- [ ] デスクトップ: マウス移動で3層が異なる速度で追従すること
- [ ] モバイル: 自動ドリフトアニメーションが動作すること
- [ ] `prefers-reduced-motion` 有効時にアニメーションが停止すること
- [ ] パフォーマンス: フレームレートが 60fps を維持すること

---

## フェーズ 3: ヘッダーデザイン洗練

### 3-1: `useShrinkHeader` フック作成

- [ ] `src/hooks/useShrinkHeader.ts` を作成
  - [ ] `window.scrollY` 監視（`passive: true`）
  - [ ] `threshold`（デフォルト: 50px）以上で `isScrolled: true`
  - [ ] スクロールリスナーのクリーンアップ

### 3-2: ヘッダーコンポーネントの変更

- [ ] `App.tsx` のヘッダーデザインを変更
  - [ ] レイアウトを `flex` + `justify-content: space-between` に変更
  - [ ] 左側: ロゴマーク（`GP` モノグラム、Orbitron フォント）+ サイト名（`niku9`）
  - [ ] 右側: ナビリンク（「About」）
  - [ ] h1 タグをロゴ部分に維持
  - [ ] グラデーションテキスト維持（`GP` 部分）
  - [ ] Glassmorphism デザイン維持

### 3-3: スクロール時のアニメーション適用

- [ ] `useShrinkHeader` の `isScrolled` に応じたスタイル切り替え
  - [ ] パディング: `16px 24px` → `8px 24px`
  - [ ] ロゴサイズ: `1.4rem` → `1.2rem`
  - [ ] 背景透過: `0.05` → `0.08`
  - [ ] `transition: all 0.3s ease` で滑らかに変化

### 3-4: レスポンシブ対応

- [ ] モバイル（768px 未満）
  - [ ] サイト名（`niku9`）を非表示
  - [ ] `GP` ロゴのみ表示
  - [ ] ナビリンクのコンパクト化

### 3-5: テストの追加

- [ ] `useShrinkHeader.test.ts` を作成
  - [ ] 初期状態で `isScrolled === false` であること
  - [ ] スクロールイベントで値が変化すること
- [ ] ヘッダーのスナップショット or DOM テスト
  - [ ] ロゴ要素が存在すること
  - [ ] ナビリンクが存在すること

### 3-6: 動作確認

- [ ] ビルドエラーがないこと
- [ ] ヘッダーにロゴとナビリンクが表示されること
- [ ] スクロール時にヘッダーが縮小すること
- [ ] ホームボタン（ロゴクリック）で `/` に遷移すること
- [ ] モバイル表示が崩れないこと
- [ ] フルスクリーンゲームページではヘッダーが非表示であること

---

## フェーズ 4: SEO 強化

### 4-1: 構造化データ（JSON-LD VideoGame）

- [ ] ゲームデータの定数ファイルを作成（`src/constants/game-seo-data.ts`）
  - [ ] 全13ゲームの名前、説明文、URL を定義
- [ ] `useStructuredData` フックを作成
  - [ ] `<head>` に `<script type="application/ld+json">` を動的挿入
  - [ ] アンマウント時にクリーンアップ
- [ ] 各ゲームページで `useStructuredData` を呼び出し

### 4-2: `sitemap.xml` の拡充

- [ ] 全 URL に `lastmod` を追加
- [ ] 全 URL に `changefreq` を追加
- [ ] 全 URL に `priority` を追加
- [ ] 新規ページ（About, Privacy Policy, Terms, Contact）の URL を確認

### 4-3: `theme-color` メタタグ追加

- [ ] `public/index.html` に `<meta name="theme-color" content="#0f0c29">` を追加

### 4-4: パンくずリスト構造化データ

- [ ] `useStructuredData` フックにパンくずリスト対応を追加
- [ ] ホーム → ゲームページの2階層パンくず

### 4-5: 動的 meta description

- [ ] `useMetaDescription` フックを作成（`src/hooks/useMetaDescription.ts`）
  - [ ] ルートパスに応じた description マッピング
  - [ ] `<meta name="description">` の `content` を動的更新
  - [ ] クリーンアップで元の description に戻す
- [ ] `App.tsx` から `useMetaDescription` を呼び出し

### 4-6: Performance Hints

- [ ] `public/index.html` にフォントの `preload` ヒントを追加
- [ ] パララックス背景画像の `preload` をフェーズ2完了後に追加

### 4-7: テストの追加

- [ ] `useStructuredData.test.ts` を作成
  - [ ] `<head>` に JSON-LD スクリプトが挿入されること
  - [ ] アンマウント時にスクリプトが削除されること
- [ ] `useMetaDescription.test.ts` を作成
  - [ ] ルートに応じた description が設定されること

### 4-8: 動作確認

- [ ] ビルドエラーがないこと
- [ ] Google Rich Results Test で構造化データが有効であること
- [ ] Lighthouse SEO スコアが 90+ であること
- [ ] `sitemap.xml` が有効な XML であること

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
