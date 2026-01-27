# タスク一覧・進捗管理

## 進捗サマリー

| フェーズ | 状況 | 完了タスク |
|---------|------|-----------|
| フェーズ1: 品質基盤強化 | 完了 | 4/4 |
| フェーズ2: アクセシビリティ | 完了 | 4/4 |
| フェーズ3: テスト充実 | 進行中 | 1/3 |
| フェーズ4: エンゲージメント | 未着手 | 0/3 |
| **合計** | **64%** | **9/14** |

---

## フェーズ1: 品質基盤強化

### 1.1 コード分割（React.lazy + Suspense）

- [x] `src/App.tsx`の修正
  - [x] React.lazyでゲームページをインポート
  - [x] Suspenseでルートをラップ
  - [x] GameListPageは同期インポートのまま
- [x] ビルド確認（チャンク分割）

**ファイル**: `src/App.tsx`
**ステータス**: 完了

---

### 1.2 LoadingSpinnerコンポーネント作成

- [x] `src/components/atoms/LoadingSpinner.tsx`作成
  - [x] スピナーアニメーション実装
  - [x] サイズバリエーション（small/medium/large）
  - [x] オプションメッセージ対応
  - [x] ARIA属性追加
- [x] スタイル実装（グラスモーフィズム）

**ファイル**: `src/components/atoms/LoadingSpinner.tsx`
**ステータス**: 完了

---

### 1.3 ErrorBoundaryコンポーネント作成

- [x] `src/components/ErrorBoundary.tsx`作成
  - [x] エラーキャッチ実装
  - [x] フォールバックUI
  - [x] リトライ機能
  - [x] ホームへ戻るリンク
- [x] App.tsxでラップ

**ファイル**: `src/components/ErrorBoundary.tsx`
**ステータス**: 完了

---

### 1.4 メタタグ追加

- [x] `public/index.html`修正
  - [x] descriptionメタタグ
  - [x] keywordsメタタグ
  - [x] OGPタグ（og:title, og:description, og:image, og:type）
  - [x] Twitterカードタグ
  - [x] タイトル更新（「Game Platform」）

**ファイル**: `public/index.html`
**ステータス**: 完了

---

## フェーズ2: アクセシビリティ改善

### 2.1 セマンティックHTML導入

- [x] `src/App.tsx`修正
  - [x] `<main>`要素追加
  - [x] `<nav>`要素追加（Headerコンポーネントとして実装）
  - [x] role属性追加
- [x] 各ページに`<section>`追加

**ファイル**: `src/App.tsx`, 各ページ
**ステータス**: 完了

---

### 2.2 ARIA属性追加

- [x] `src/pages/GameListPage.tsx`
  - [x] ゲームカードにaria-label
  - [x] リンクにaria-describedby（aria-labelで代用）
- [x] 各ゲームページ
  - [x] Canvasにrole="img"とaria-label
  - [x] ボタンにaria-pressed（該当箇所）
- [x] モレキュール/オーガニズム
  - [x] インタラクティブ要素のラベル

**ステータス**: 完了

---

### 2.3 カラーコントラスト修正

- [x] `src/styles/GlobalStyle.ts`修正
  - [x] --text-secondary の明度向上
  - [x] ボタンテキスト色の調整
- [x] コントラスト比検証（4.5:1以上）

**ファイル**: `src/styles/GlobalStyle.ts`
**ステータス**: 完了

---

### 2.4 画像alt属性追加

- [x] `src/pages/GameListPage.tsx`
  - [x] ゲーム画像にalt追加
- [x] パズル関連コンポーネント
  - [x] DefaultImageSelectorの画像にalt
  - [x] アップロード画像にalt

**ステータス**: 完了

---

## フェーズ3: テスト充実

### 3.1 ゲームページテスト作成

- [x] `src/pages/FallingShooterPage.test.tsx`
  - [x] レンダリングテスト
  - [x] 状態遷移テスト
  - [x] UI表示テスト
- [x] `src/pages/DeepSeaShooterPage.test.tsx`
  - [x] レンダリングテスト
  - [x] 状態遷移テスト
  - [x] UI表示テスト
- [x] `src/pages/MazeHorrorPage.test.tsx`
  - [x] レンダリングテスト
  - [x] 状態遷移テスト
  - [x] UI表示テスト
- [x] `src/pages/RacingGamePage.test.tsx`
  - [x] レンダリングテスト
  - [x] 状態遷移テスト
  - [x] UI表示テスト

**ステータス**: 完了

---

### 3.2 useGameStateテスト作成

- [ ] `src/hooks/useGameState.test.ts`
  - [ ] 初期状態テスト
  - [ ] 難易度変更テスト
  - [ ] ゲーム開始/終了テスト
  - [ ] リセットテスト
  - [ ] ヒントモードテスト

**ファイル**: `src/hooks/useGameState.test.ts`
**ステータス**: 未着手

---

### 3.3 カバレッジ設定

- [ ] `package.json`修正
  - [ ] collectCoverage設定
  - [ ] coverageThreshold設定
  - [ ] collectCoverageFrom設定
- [ ] カバレッジレポート確認

**ファイル**: `package.json`
**ステータス**: 未着手

---

## フェーズ4: エンゲージメント向上

### 4.1 ハイスコア永続化

- [ ] `src/utils/score-storage.ts`作成
  - [ ] IndexedDB初期化
  - [ ] saveScore関数
  - [ ] getHighScore関数
  - [ ] getScoreHistory関数
  - [ ] clearScores関数
- [ ] 各ゲームページへの統合

**ファイル**: `src/utils/score-storage.ts`
**ステータス**: 未着手

---

### 4.2 SNSシェア機能

- [ ] `src/components/molecules/ShareButton.tsx`作成
  - [ ] Twitter/X共有
  - [ ] Web Share API対応
  - [ ] 共有テキスト生成
- [ ] 結果画面への配置

**ファイル**: `src/components/molecules/ShareButton.tsx`
**ステータス**: 未着手

---

### 4.3 設定パネル

- [ ] `src/components/organisms/SettingsPanel.tsx`作成
  - [ ] 音量スライダー（master, sfx, bgm）
  - [ ] 操作設定セレクト
  - [ ] FPS表示トグル
  - [ ] アニメーション軽減トグル
- [ ] `src/utils/settings-storage.ts`作成
  - [ ] localStorage永続化
  - [ ] デフォルト値設定
- [ ] ヘッダーへの設定アイコン追加

**ファイル**: `src/components/organisms/SettingsPanel.tsx`, `src/utils/settings-storage.ts`
**ステータス**: 未着手

---

## 検証タスク

### 各フェーズ完了時

- [ ] `npm run lint` - エラー0件
- [ ] `npm test` - 全テスト通過
- [ ] `npm run build` - ビルド成功
- [ ] 手動確認 - 機能動作確認

### アクセシビリティ検証

- [ ] Lighthouse監査（a11yスコア90以上）
- [ ] キーボードナビゲーション確認
- [ ] スクリーンリーダーテスト

---

## 変更履歴

| 日付 | 内容 | 担当 |
|------|------|------|
| 2025-01-26 | 初版作成 | - |
