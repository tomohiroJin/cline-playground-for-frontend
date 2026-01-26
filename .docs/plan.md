# プロダクトブラッシュアップ計画

## 概要

本計画は、Reactベースのゲームプラットフォームの品質向上、アクセシビリティ改善、テスト充実、エンゲージメント向上を目的とした包括的なブラッシュアップ計画です。

## プロダクト概要

**プロダクト名**: Game Platform
**技術スタック**: React 19, TypeScript, styled-components, Jotai, Canvas API, Webpack 5

### 提供ゲーム（6種類）

| ゲーム | 概要 | ファイルサイズ |
|--------|------|---------------|
| Picture Puzzle | スライドパズル | ~300行 |
| Air Hockey | エアホッケー（CPU対戦） | ~800行 |
| Racing Game | トップダウンレースゲーム | ~1,700行 |
| Falling Shooter | 落ちものシューター | ~1,560行 |
| Maze Horror | 3D迷路ホラー | ~1,540行 |
| Deep Sea Shooter | 縦スクロールシューター | ~1,230行 |

---

## 実装フェーズ

### フェーズ1: 品質基盤強化（優先度: 高）

**目的**: 今後の開発効率を上げる基盤整備

| # | 項目 | 内容 |
|---|------|------|
| C1 | コード分割 | React.lazy + Suspenseによる動的インポート |
| E1 | ローディング状態 | LoadingSpinnerコンポーネント作成 |
| E2 | エラーバウンダリ | ErrorBoundaryコンポーネント作成 |
| G1 | メタタグ追加 | SEO・OGP対応のメタタグ |

**成果物**:

- `src/components/atoms/LoadingSpinner.tsx`
- `src/components/ErrorBoundary.tsx`
- `src/App.tsx`の更新（lazy loading）
- `public/index.html`の更新（メタタグ）

---

### フェーズ2: アクセシビリティ改善（優先度: 高）

**目的**: WCAG準拠、法的リスク軽減、ユーザー層拡大

| # | 項目 | 内容 |
|---|------|------|
| D1 | ARIA属性追加 | 全インタラクティブ要素にラベル付与 |
| D3 | カラーコントラスト | WCAG AA基準（4.5:1）準拠 |
| D4 | セマンティックHTML | nav, main, section要素の導入 |
| G3 | alt属性追加 | 全画像にalt属性 |

**対象ファイル**:

- `src/App.tsx` - セマンティック構造
- `src/pages/GameListPage.tsx` - ゲームカードのa11y
- `src/styles/GlobalStyle.ts` - カラーコントラスト
- 各ゲームページ - Canvas要素のラベル

---

### フェーズ3: テスト充実（優先度: 中）

**目的**: 長期的な品質維持、安全なリファクタリング基盤

| # | 項目 | 内容 |
|---|------|------|
| B1 | ゲームページテスト | 4ページのユニットテスト |
| B2 | useGameStateテスト | コアフックのテスト |
| B4 | カバレッジ計測 | Jest設定・閾値設定 |

**成果物**:

- `src/pages/FallingShooterPage.test.tsx`
- `src/pages/DeepSeaShooterPage.test.tsx`
- `src/pages/MazeHorrorPage.test.tsx`
- `src/pages/RacingGamePage.test.tsx`
- `src/hooks/useGameState.test.ts`

---

### フェーズ4: エンゲージメント向上（優先度: 中）

**目的**: ユーザー継続率・満足度向上

| # | 項目 | 内容 |
|---|------|------|
| F1 | ハイスコア永続化 | IndexedDBによるスコア保存 |
| F4 | SNSシェア | Twitter/X共有ボタン |
| E5 | 設定パネル | 音量・操作設定のカスタマイズ |

**成果物**:

- `src/utils/score-storage.ts`
- `src/components/molecules/ShareButton.tsx`
- `src/components/organisms/SettingsPanel.tsx`

---

## アーキテクチャ方針

### コンポーネント設計

```
atoms/         - 最小単位のUI部品（ボタン、スピナー）
molecules/     - 複数atomsの組み合わせ（フォーム、カード）
organisms/     - 複雑なUI（ゲームボード、設定パネル）
```

### 状態管理

- **グローバル状態**: Jotai atoms（`src/store/atoms.ts`）
- **ローカル状態**: React hooks
- **永続化**: localStorage / IndexedDB

### コード分割戦略

```typescript
// ルートベースの分割
const PuzzlePage = lazy(() => import('./pages/PuzzlePage'));
const AirHockeyPage = lazy(() => import('./pages/AirHockeyPage'));
// ...

// Suspenseでラップ
<Suspense fallback={<LoadingSpinner />}>
  <Routes>...</Routes>
</Suspense>
```

---

## 検証基準

各フェーズ完了時に以下を確認:

1. **静的解析**: `npm run lint` - エラー0件
2. **テスト**: `npm test` - 全テスト通過
3. **ビルド**: `npm run build` - 成功
4. **手動確認**: 該当機能の動作確認

### アクセシビリティ検証

- Chrome DevTools Lighthouse
- axe DevToolsによるa11y監査
- キーボードのみでの操作確認

---

## リスクと対策

| リスク | 対策 |
|--------|------|
| 既存機能のリグレッション | テスト先行で安全網構築 |
| パフォーマンス低下 | Lighthouse計測で継続監視 |
| ブラウザ互換性 | 主要ブラウザでの手動検証 |

---

## 今後の展望

本計画完了後の検討項目:

- **A1-A4**: 大規模リファクタリング（1500行超ファイルの分割）
- **B3**: E2Eテスト導入（Playwright）
- **F2, F5**: 実績システム・リーダーボード
- **F3**: PWA対応（オフラインプレイ）
