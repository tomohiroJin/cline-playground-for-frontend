# Game Platform UI/UX 改善 チェックリスト

---

## フェーズ 1: 基盤変更

### 実装タスク

- [x] `src/hooks/useFullScreenRoute.ts` を `LAYOUT_ROUTES` ホワイトリスト方式に変更する
- [x] `src/components/organisms/SettingsPanel.tsx` を削除する
- [x] `src/utils/settings-storage.ts` を削除する
  - [x] 削除前に SettingsPanel 以外からの参照がないことを grep で確認する
- [x] `src/App.tsx` から SettingsPanel 関連コードを削除する
  - [x] `import { SettingsPanel }` の削除
  - [x] `SettingsButton` styled-component 定義の削除
  - [x] `isSettingsOpen` の useState 削除
  - [x] `<SettingsButton>` JSX の削除
  - [x] `{isSettingsOpen && <SettingsPanel ... />}` JSX の削除
- [x] `src/App.tsx` の Footer 内コピーライトを `© 2026 niku9.click All Rights Reserved.` に更新する

### 検証タスク

- [x] `/` でヘッダー・フッターが表示される
- [x] ゲームルート（`/puzzle` 等）でフルスクリーン表示（ヘッダー/フッター非表示）
- [x] 設定ボタン（⚙）がヘッダーから消えている
- [x] コピーライト表記が更新されている
- [x] `npm run build` が通る

### テストタスク

- [x] `src/hooks/useFullScreenRoute.test.tsx` に静的ページルートのテストケースを追加する
  - [x] `/about` で false（ヘッダー表示）を返す
  - [x] `/privacy-policy` で false を返す
  - [x] `/terms` で false を返す
  - [x] `/contact` で false を返す

---

## フェーズ 2: ゲームからの音声停止機能

### 実装タスク

- [x] `src/utils/audio-cleanup.ts` を新規作成する
  - [x] `installAudioContextTracker()` を実装する
    - [x] `window.AudioContext` を Proxy で上書き
    - [x] 生成されたインスタンスを `Set<AudioContext>` で追跡
    - [x] 多重呼び出し防止のガード
  - [x] `stopAllAudio()` を実装する
    - [x] 追跡中の全 AudioContext を suspend → close
    - [x] Set をクリア
    - [x] Tone.js Transport の停止（dynamic import で安全に）
    - [x] エラーを適切に catch
- [x] `src/index.tsx` で `installAudioContextTracker()` を呼び出す
- [x] `src/components/organisms/GamePageWrapper.tsx` に音声停止の useEffect を追加する

### 検証タスク

- [x] 音声付きゲーム（例: `/maze-horror`, `/ipne`）をプレイし、ホームに戻ったときに音が停止する
- [x] 音声停止後、再度同じゲームに入ったときに音声が正常に再生される
- [x] 音声のないゲーム（例: `/puzzle`）でエラーが発生しない
- [x] `npm run build` が通る

### テストタスク

- [x] `src/utils/audio-cleanup.test.ts` を新規作成する
  - [x] `installAudioContextTracker` が AudioContext を正しくプロキシするテスト
  - [x] `stopAllAudio` が追跡中の AudioContext を suspend/close するテスト
  - [x] 多重呼び出しが安全に動作するテスト

---

## フェーズ 3: 新規ページ作成

### 実装タスク

- [x] `src/components/templates/` ディレクトリを作成する
- [x] `src/components/templates/StaticPageLayout.tsx` を作成する
  - [x] Container (max-width: 800px)
  - [x] PageTitle (グラデーションテキスト)
  - [x] ContentArea (Glassmorphism)
  - [x] h3, p, ul, ol, a の共通スタイル
- [x] `src/pages/AboutPage.tsx` を作成する
  - [x] Game Platform とは
  - [x] 特徴（4項目）
  - [x] 免責事項（3項目）
  - [x] 運営者情報
- [x] `src/pages/PrivacyPolicyPage.tsx` を作成する
  - [x] 前文
  - [x] 第1条: 取得する情報（アクセス解析、Cookie、localStorage）
  - [x] 第2条: 利用目的
  - [x] 第3条: 情報の第三者提供
  - [x] 第4条: Cookie の設定
  - [x] 第5条: 免責事項
  - [x] 第6条: 改定
  - [x] 第7条: お問い合わせ（contact@niku9.click）
  - [x] 制定日: 2026年3月
- [x] `src/pages/TermsPage.tsx` を作成する
  - [x] 前文
  - [x] 第1条: 適用
  - [x] 第2条: 著作権・知的財産権（OSS 但し書き付き）
  - [x] 第3条: 禁止事項（6項目）
  - [x] 第4条: サービスの変更・中断・終了
  - [x] 第5条: 免責事項（localStorage データ損失含む）
  - [x] 第6条: 利用規約の変更
  - [x] 第7条: 準拠法・裁判管轄
  - [x] 制定日: 2026年3月
- [x] `src/pages/ContactPage.tsx` を作成する
  - [x] メール案内文
  - [x] メールアドレスの JavaScript 動的組み立て（スパム防止）
  - [x] mailto リンク
  - [x] 注記 3 項目
- [x] `src/hooks/useDocumentTitle.ts` に4ページのタイトルマッピングを追加する
- [x] `src/App.tsx` に4ルートを追加する（lazy import、GamePageWrapper で囲まない）
- [x] `src/App.tsx` のフッターに簡易ナビゲーション（FooterNav / FooterLink）を追加する
  - [x] ホーム、サイトについて、プライバシーポリシー、利用規約、お問い合わせの5リンク
  - [x] flex レイアウトでレスポンシブ対応（flex-wrap）

### 検証タスク

- [x] `/about` が正常に表示される
- [x] `/privacy-policy` が正常に表示される
- [x] `/terms` が正常に表示される
- [x] `/contact` が正常に表示される
- [x] 各ページでドキュメントタイトルが正しく設定される
- [x] 各ページでヘッダー・フッターが表示される
- [x] お問い合わせページの mailto リンクが機能する
- [x] モバイル表示で各ページが崩れない
- [x] `npm run build` が通る

### テストタスク

- [x] `src/hooks/useDocumentTitle.test.tsx` に4ページのテストケースを追加する
  - [x] `/about` → `サイトについて | Game Platform`
  - [x] `/privacy-policy` → `プライバシーポリシー | Game Platform`
  - [x] `/terms` → `利用規約 | Game Platform`
  - [x] `/contact` → `お問い合わせ | Game Platform`

---

## フェーズ 4: ナビゲーション改善

### 実装タスク

- [ ] `src/App.tsx` の Footer を3段構成に拡張する
  - [ ] `FooterNav` styled-component を作成する（flex, center, wrap）
  - [ ] `FooterLink` styled-component を作成する（styled(Link)、下線スライドイン）
  - [ ] `SisterSiteRow` styled-component を作成する
  - [ ] `CopyrightRow` styled-component を作成する
  - [ ] 上段: サイト内リンク 5 本（ホーム、サイトについて、プライバシーポリシー、利用規約、お問い合わせ）
  - [ ] 中段: 姉妹サイトリンク（Gallery NIKU9 桜花-Click、`target="_blank" rel="noopener noreferrer"`）
  - [ ] 下段: コピーライト
- [ ] フッターに Glassmorphism スタイルを適用する（`var(--glass-bg)`, `backdrop-filter`, `border-top`）

### 検証タスク

- [ ] フッターの全リンクが正しい遷移先に機能する
- [ ] 姉妹サイトリンクが新しいタブで開く
- [ ] フッターリンクのホバーエフェクト（下線スライドイン）が動作する
- [ ] モバイル表示でフッターが崩れない（flex-wrap による折り返し）

---

## フェーズ 5: 見た目の改善

### 実装タスク

- [ ] `src/pages/GameListPage.styles.ts` にパーティクルアニメーションを追加する
  - [ ] `floatParticle` keyframes を定義する
  - [ ] HeroSection の `::before`, `::after` 疑似要素で光の粒を表現する
- [ ] `src/pages/GameListPage.styles.ts` にタイトルグロウエフェクトを追加する
  - [ ] `titleGlow` keyframes を定義する
  - [ ] HeroTitle に animation を適用する
- [ ] `src/pages/GameListPage.styles.ts` のゲームカードにホバー時ボーダーグラデーションを追加する
  - [ ] `border-image: linear-gradient(135deg, #00d2ff, #a855f7)` を適用する
- [ ] `src/hooks/useScrollReveal.ts` を新規作成する
  - [ ] IntersectionObserver ベースの実装
  - [ ] 初期状態: `opacity: 0`, `translateY(30px)`
  - [ ] 表示時: `opacity: 1`, `translateY(0)` にトランジション
  - [ ] 各要素に `transitionDelay`（index × 0.08s）
  - [ ] 一度表示した要素は unobserve
- [ ] `src/pages/GameListPage.tsx` で `useScrollReveal` を BentoGrid に適用する

### 検証タスク

- [ ] ヒーローセクションにパーティクル（光の粒）が浮遊している
- [ ] タイトルにグロウ（明滅）エフェクトが表示される
- [ ] ゲームカードのホバー時にシアン → パープルのグラデーションボーダーが表示される
- [ ] ゲームカードがスクロール時にフェードイン・スライドアップする
- [ ] `prefers-reduced-motion` を有効にした環境でも致命的な問題がないこと

---

## フェーズ 6: アイコン設定

### 事前準備タスク（ユーザー対応）

- [ ] アイコンデザイン案を確認・決定する
- [ ] AI でアイコン画像を生成する
- [ ] 以下のファイルを `public/` に配置する
  - [ ] `favicon.ico` (16×16, 32×32 マルチサイズ)
  - [ ] `icon-192.png` (192×192)
  - [ ] `icon-512.png` (512×512)
  - [ ] `apple-touch-icon.png` (180×180)

### 実装タスク

- [ ] `public/index.html` に favicon リンクタグを追加する
  - [ ] `<link rel="icon" href="/favicon.ico" sizes="32x32">`
  - [ ] `<link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192">`
  - [ ] `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`
- [ ] `public/manifest.json` の icons 配列を設定する
  - [ ] 192×192 エントリ
  - [ ] 512×512 エントリ

### 検証タスク

- [ ] ブラウザタブにファビコンが表示される
- [ ] PWA としてインストールした際にアイコンが表示される（Chrome: アドレスバー → インストール）

---

## フェーズ 7: ゲームとプラットフォームの境界整理

### 実装タスク

- [ ] `src/components/organisms/GamePageWrapper.tsx` にゲーム固有の ErrorBoundary ラップを追加する
  - [ ] `isAccepted` 時の return を `<ErrorBoundary>{children}</ErrorBoundary>` に変更する
  - [ ] 既存の `src/components/ErrorBoundary.tsx` を使用する
- [ ] `public/sitemap.xml` に新規4ページの URL を追加する
  - [ ] `/about` (priority: 0.5)
  - [ ] `/privacy-policy` (priority: 0.3)
  - [ ] `/terms` (priority: 0.3)
  - [ ] `/contact` (priority: 0.3)

### 検証タスク

- [ ] ゲーム内でエラーが発生した場合、ErrorBoundary のフォールバック UI が表示される
- [ ] エラー画面から「再試行」「ホームに戻る」が機能する
- [ ] エラーがプラットフォーム全体（ヘッダー/フッター）に波及しない

---

## 最終検証

### ビルド

- [ ] `npm run build` がエラーなしで完了する
- [ ] ビルド成果物のサイズが異常に増加していないこと

### テスト

- [ ] 新規追加したテストがすべて通る
- [ ] 既存テストが壊れていない

### クロスブラウザ / レスポンシブ

- [ ] Chrome で全ページが正常に動作する
- [ ] Firefox で全ページが正常に動作する
- [ ] モバイル表示（幅 375px 程度）で各ページが崩れない
- [ ] タブレット表示（幅 768px 程度）で各ページが崩れない

### 回帰テスト

- [ ] 既存の13ゲームがすべて正常に起動する
- [ ] ゲームから `/` に戻るフローが正常に動作する
- [ ] FloatingHomeButton（⌂）がゲーム画面で正常に動作する

### SEO / メタデータ

- [ ] 各ページの `document.title` が正しいこと
- [ ] `sitemap.xml` に新ページが含まれていること
