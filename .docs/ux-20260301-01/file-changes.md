# ファイル変更一覧

## 変更対象ファイル

| ファイル | 変更内容 |
|---|---|
| `src/App.tsx` | SettingsPanel 削除、ルート追加、フッター3段構成に拡充、コピーライト更新 |
| `src/hooks/useFullScreenRoute.ts` | ホワイトリスト方式に変更 |
| `src/hooks/useDocumentTitle.ts` | 静的ページのタイトル4件追加 |
| `src/components/organisms/GamePageWrapper.tsx` | 音声停止ロジック追加、ErrorBoundary ラップ追加 |
| `src/index.tsx` | AudioContext トラッカー初期化 |
| `src/pages/GameListPage.tsx` | useScrollReveal 適用 |
| `src/pages/GameListPage.styles.ts` | パーティクルアニメーション、グロウエフェクト、ホバーグラデーション追加 |
| `src/hooks/useFullScreenRoute.test.tsx` | 静的ページルートのテストケース追加 |
| `src/hooks/useDocumentTitle.test.tsx` | 静的ページタイトルのテストケース追加 |
| `public/index.html` | favicon リンク追加 |
| `public/manifest.json` | icons 配列更新 |
| `public/sitemap.xml` | 新ページ URL 4件追加 |

## 削除対象ファイル

| ファイル | 理由 |
|---|---|
| `src/components/organisms/SettingsPanel.tsx` | 各ゲームと連携しておらず機能していない |
| `src/utils/settings-storage.ts` | SettingsPanel 専用（他から参照なし） |

## 新規作成ファイル

| ファイル | 内容 |
|---|---|
| `src/utils/audio-cleanup.ts` | AudioContext 追跡 + 全音声停止ユーティリティ |
| `src/components/templates/StaticPageLayout.tsx` | 静的ページ共通 Glassmorphism レイアウト |
| `src/pages/AboutPage.tsx` | サイトについてページ |
| `src/pages/PrivacyPolicyPage.tsx` | プライバシーポリシーページ |
| `src/pages/TermsPage.tsx` | 利用規約ページ |
| `src/pages/ContactPage.tsx` | お問い合わせページ |
| `src/hooks/useScrollReveal.ts` | IntersectionObserver スクロールアニメーションフック |
| `.docs/ux-20260301-01/plan.md` | 計画書 |
| `.docs/ux-20260301-01/checklist.md` | 検証チェックリスト |
| `.docs/ux-20260301-01/file-changes.md` | ファイル変更一覧 |
