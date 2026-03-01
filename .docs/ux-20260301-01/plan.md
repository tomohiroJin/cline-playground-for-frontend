# Game Platform UI/UX 改善計画

## 概要

Game Platform のプラットフォームとしての完成度を高めるための UI/UX 改善。

## 実装フェーズ

### フェーズ 1: 基盤変更
- useFullScreenRoute のホワイトリスト方式への変更
- SettingsPanel（機能していない設定画面）の削除
- コピーライト更新（2025 → 2026）

### フェーズ 2: ゲームからの音声停止機能
- AudioContext プロキシによる追跡レジストリ
- GamePageWrapper アンマウント時の全音声停止
- Tone.js Transport 対応

### フェーズ 3: 新規ページ作成
- 静的ページ共通レイアウト（StaticPageLayout）
- About / プライバシーポリシー / 利用規約 / お問い合わせ

### フェーズ 4: ナビゲーション改善
- フッターを3段構成に拡張（サイト内リンク / 姉妹サイト / コピーライト）

### フェーズ 5: 見た目の改善
- ヒーローセクションのパーティクルアニメーション・グロウエフェクト
- ゲームカードのホバーボーダーグラデーション
- IntersectionObserver ベースのスクロールアニメーション

### フェーズ 6: アイコン設定
- favicon / PWA アイコンのリンクタグ追加
- manifest.json の icons 配列設定

### フェーズ 7: 境界整理
- GamePageWrapper に ErrorBoundary ラップ追加
- sitemap.xml に新ページ URL 追加

## 実施日

2026年3月1日
