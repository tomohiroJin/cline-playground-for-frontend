# セキュリティ脆弱性対策 — 改善計画

## 概要

Game Platform（React 19 + TypeScript + webpack 5）のセキュリティ状態を調査した結果、`npm audit` での既知脆弱性は **0 件** であるが、以下のセキュリティ改善点が確認された。本計画では 4 フェーズに分けて段階的に対策を実施する。

## 調査結果サマリー

| # | 項目 | リスク | 対象ファイル |
|---|------|--------|-------------|
| 1 | `@types` パッケージが `dependencies` に誤配置 | 低（ビルドサイズ肥大化） | `package.json` |
| 2 | 不要な `@types/webpack-dev-server` が存在 | 低（依存関係の肥大化） | `package.json` |
| 3 | CSP（Content-Security-Policy）ヘッダーが未設定 | 中（XSS 攻撃リスク） | `public/index.html` |
| 4 | `window.open` に `noopener/noreferrer` が欠落 | 中（リバースタブナッピング） | `src/components/molecules/ShareButton.tsx` |
| 5 | webpack 本番ビルドでソースマップ制御が未明示 | 中（ソースコード露出） | `webpack.config.ts` |
| 6 | ESLint セキュリティプラグインが未導入 | 低（静的解析の欠如） | `eslint.config.mjs`, `package.json` |

---

## フェーズ構成

### フェーズ 1: パッケージ整理

**目標**: 依存関係の正確な分類と不要パッケージの削除

**優先度**: 高（他のフェーズに影響なし、即座に実施可能）

**対象ファイル**:
- `package.json`

**変更内容**:
1. `@types/react` を `dependencies` → `devDependencies` に移動
2. `@types/react-dom` を `dependencies` → `devDependencies` に移動
3. `@types/webpack-dev-server` を削除（`webpack-dev-server` v5 が自前の型定義を内包しているため不要）

**テスト方法**:
- `npm install` が正常に完了すること
- `npm run build` が成功すること
- `npm run test` が全件パスすること
- `npm run lint` がエラーなしで完了すること

#### npm deprecation 警告の対処（overrides）

`npm install` 時に以下の deprecation 警告が発生している。すべて Jest 関連のトランジティブ（間接的な）依存であり、直接依存のアップデートでは解決不可。

| パッケージ | バージョン | 依存元 | 問題 |
|-----------|-----------|-------|------|
| `whatwg-encoding` | 3.1.1 | `jest-environment-jsdom` → `jsdom` → `html-encoding-sniffer` | 廃止、`@exodus/bytes` を推奨 |
| `inflight` | 1.0.6 | `test-exclude` → `glob@7` | メモリリーク、サポート終了 |
| `glob` | 7.2.3 | `test-exclude` | セキュリティ脆弱性あり |
| `glob` | 10.5.0 | `@jest/reporters`, `jest-changed-files` | セキュリティ脆弱性あり |

**対策方針**: `package.json` に `overrides` フィールドを追加し、安全に上書き可能な推移的依存を最新バージョンに強制する。

```json
{
  "overrides": {
    "glob": "^11.0.0",
    "inflight": "npm:lru-cache@^10.0.0"
  }
}
```

**フォールバック方針**: overrides が Jest の動作を壊す場合は overrides を撤回し、既知の警告として記録のみに切り替える。

> **実施結果**: overrides を追加したところ `test-exclude`（Jest カバレッジ）が `glob@11` と互換性がなくテストが失敗したため、フォールバック方針に従い overrides を撤回。4 件の deprecation 警告は既知の問題として記録のみとした。

**テスト方法**:
- `npm install` 時に `glob` および `inflight` の deprecation 警告が消失すること
- `npm run test` が全件パスすること（Jest との互換性確認）

---

### フェーズ 2: CSP・セキュリティ meta タグ追加

**目標**: XSS 攻撃の緩和とブラウザセキュリティ機能の有効化

**優先度**: 高（最もインパクトの大きいセキュリティ改善）

**対象ファイル**:
- `public/index.html`

**変更内容**:
1. CSP meta タグの追加
   - `default-src 'self'`
   - `script-src 'self'`
   - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`（styled-components とインラインスタイルのため `'unsafe-inline'` が必要）
   - `font-src 'self' https://fonts.gstatic.com`
   - `img-src 'self' data:`
   - `connect-src 'self'`
   - `media-src 'self'`
   - `worker-src 'self' blob:`（Tone.js が blob ベースの Web Worker を生成するため）
2. `X-Content-Type-Options` 相当の meta タグ追加
3. `Referrer-Policy` meta タグ追加

**設計判断**:
- `'unsafe-inline'` を `style-src` に含める理由: styled-components が実行時にインラインスタイルを生成するため不可避
- `connect-src` に `ws:` を含めない理由: meta タグ CSP は本番環境を想定しており、開発サーバーの WebSocket は対象外

**テスト方法**:
- `npm run build` 後、`npm run preview` でアプリを起動し、ブラウザの DevTools Console に CSP 違反が出ないこと
- Google Fonts が正常に読み込まれること
- 全ゲーム画面が正常に動作すること

---

### フェーズ 3: コード修正

**目標**: 既存コードのセキュリティリスクを修正

**優先度**: 中

**対象ファイル**:
- `src/components/molecules/ShareButton.tsx`
- `webpack.config.ts`

**変更内容**:
1. **ShareButton.tsx**: `window.open` の第 3 引数に `noopener,noreferrer` を追加
   - リバースタブナッピング攻撃を防止
   - 外部サイト（Twitter/X）にリファラー情報を漏洩させない
2. **webpack.config.ts**: 本番ビルド時に `devtool: false` を明示設定
   - 本番環境でソースマップが生成・公開されることを防止
   - 開発モードでは `source-map` を使用（`eval-source-map` は CSP の `script-src 'self'` と衝突するため不採用）

**テスト方法**:
- ShareButton のシェア機能が正常に動作すること（Twitter/X 画面が開くこと）
- `npm run build` 後に `dist/` にソースマップファイル（`*.map`）が存在しないこと
- 開発サーバー（`npm start`）が正常に動作すること

---

### フェーズ 4: ESLint 更新・セキュリティプラグイン導入

**目標**: 静的解析によるセキュリティ問題の自動検出を有効化

**優先度**: 低（開発体験の改善、コードの品質向上）

**対象ファイル**:
- `package.json`
- `eslint.config.mjs`

**変更内容**:
1. ~~ESLint を v10 にアップグレード~~ → `typescript-eslint` が v10 未対応のため、現行 v9 を維持
2. `eslint-plugin-security` を `devDependencies` に追加
3. `eslint.config.mjs` にセキュリティプラグインの設定を追加

**テスト方法**:
- `npm run lint` がエラーなしで完了すること
- 意図的に危険なコード（例: `eval()`）を書いた場合にセキュリティ警告が出ること
- 既存の ESLint ルールが引き続き動作すること

---

## 実施しない項目

| 項目 | 理由 |
|------|------|
| HTTP セキュリティヘッダー（サーバーサイド） | 本プロジェクトは静的ホスティングを想定しており、サーバー設定は範囲外 |
| HTTPS 強制 | ホスティング環境依存のため、アプリケーションレベルでは対応不要 |
| サブリソースインテグリティ（SRI） | webpack バンドルは self-hosted のため不要 |
| `nonce` ベースの CSP | styled-components との統合が複雑になるため、`'unsafe-inline'` で対応 |

---

## リスク・注意事項

1. **CSP の `'unsafe-inline'`**: styled-components の仕組み上、完全な CSP 保護は困難。将来的に `nonce` ベースへの移行を検討
2. **ESLint v10 互換性**: `typescript-eslint` が v10 未対応のため v9 を維持。上流の対応待ち
3. **Google Fonts 外部依存**: CSP で `fonts.googleapis.com` と `fonts.gstatic.com` を許可する必要があり、完全な `self` 制限は不可
4. **npm deprecation 警告**: `glob`/`inflight` の overrides は Jest 互換性問題で撤回。上流の修正待ち
