# セキュリティ脆弱性対策 — 仕様書

## 1. パッケージ整理（フェーズ 1）

### 1.1 `@types` パッケージの移動

**対象**: `package.json`

**変更前**:
```json
{
  "dependencies": {
    "@types/react": "^19.0.11",
    "@types/react-dom": "^19.0.4",
    "jotai": "^2.12.2",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.3.0",
    "styled-components": "^6.1.16",
    "tone": "^15.1.22"
  }
}
```

**変更後**:
```json
{
  "dependencies": {
    "jotai": "^2.12.2",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.3.0",
    "styled-components": "^6.1.16",
    "tone": "^15.1.22"
  },
  "devDependencies": {
    "@types/react": "^19.0.11",
    "@types/react-dom": "^19.0.4",
    ...（既存の devDependencies はそのまま）
  }
}
```

**理由**: `@types` パッケージは型定義のみを提供し、実行時には不要。`devDependencies` に配置することで、本番インストール時（`npm install --production`）のサイズを削減する。

### 1.2 `@types/webpack-dev-server` の削除

**対象**: `package.json`

**変更前**:
```json
{
  "devDependencies": {
    "@types/webpack-dev-server": "^4.7.1",
    ...
  }
}
```

**変更後**:
```json
{
  "devDependencies": {
    // @types/webpack-dev-server を削除
    ...
  }
}
```

**理由**: `webpack-dev-server` v5（本プロジェクトでは `^5.2.0` を使用）は自前の TypeScript 型定義を内包している。`webpack.config.ts` では `import { Configuration as WebpackDevServerConfiguration } from 'webpack-dev-server'` として直接インポートしており、`@types/webpack-dev-server`（v4 系の型定義）は不要。

### 1.3 npm deprecation 警告の対処（overrides）

**対象**: `package.json`

**背景**: `npm install` 時に Jest 関連のトランジティブ依存で deprecation 警告が 4 件発生している。直接依存（jest@30.2.0, jest-environment-jsdom@30.2.0, ts-jest@29.4.6）はすべて最新であり、直接依存のアップデートでは解決不可。

| パッケージ | バージョン | 依存元 | 問題 |
|-----------|-----------|-------|------|
| `whatwg-encoding` | 3.1.1 | `jest-environment-jsdom` → `jsdom` → `html-encoding-sniffer` | 廃止、`@exodus/bytes` を推奨 |
| `inflight` | 1.0.6 | `test-exclude` → `glob@7` | メモリリーク、サポート終了 |
| `glob` | 7.2.3 | `test-exclude` | セキュリティ脆弱性あり |
| `glob` | 10.5.0 | `@jest/reporters`, `jest-changed-files` | セキュリティ脆弱性あり |

**変更前**（`overrides` フィールドなし）

**変更後**:
```json
{
  "overrides": {
    "glob": "^11.0.0",
    "inflight": "npm:lru-cache@^10.0.0"
  }
}
```

**各 override の根拠**:

| キー | 値 | 根拠 |
|------|-----|------|
| `glob` | `^11.0.0` | v7 および v10 に既知のセキュリティ脆弱性あり。v11 は後方互換の API を提供 |
| `inflight` | `npm:lru-cache@^10.0.0` | `inflight` はメモリリークの問題がありサポート終了。npm alias 機能で `lru-cache` に置換し、`glob@7` が排除されることで不要になる可能性もある |

**`whatwg-encoding` を overrides に含めない理由**:
- `whatwg-encoding` は `jsdom` の内部依存であり、代替パッケージ `@exodus/bytes` は API 互換ではない
- overrides で強制すると `jsdom`（および `jest-environment-jsdom`）が正常に動作しなくなるリスクが高い
- 上流（`jsdom` / `html-encoding-sniffer`）の修正待ちとする

**フォールバック方針**: overrides 追加後に `npm run test` で Jest が正常に動作しない場合、overrides を撤回し、既知の警告として記録のみに切り替える。

> **実施結果**: overrides を適用したところ、`test-exclude`（Jest カバレッジ）が `glob@11` の API 変更（`hasMagic()` 等）に対応しておらずテストが失敗。フォールバック方針に従い overrides を撤回した。4 件の deprecation 警告は既知の問題として記録し、上流の修正を待つ。

---

## 2. CSP・セキュリティ meta タグ（フェーズ 2）

### 2.1 Content-Security-Policy

**対象**: `public/index.html`

**追加位置**: `<head>` 内、`<meta charset="UTF-8">` の直後

**変更前**（該当箇所なし）

**変更後**:
```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; media-src 'self'; worker-src 'self' blob:">
```

**ディレクティブ別の設計根拠**:

| ディレクティブ | 値 | 根拠 |
|--------------|-----|------|
| `default-src` | `'self'` | 明示指定のないリソースは同一オリジンのみ許可 |
| `script-src` | `'self'` | webpack バンドル（自己ホスト）のみ実行許可。インラインスクリプトなし |
| `style-src` | `'self' 'unsafe-inline' https://fonts.googleapis.com` | styled-components がランタイムでインラインスタイルを注入するため `'unsafe-inline'` が必要。Google Fonts CSS の読み込みも許可 |
| `font-src` | `'self' https://fonts.gstatic.com` | Google Fonts のフォントファイル配信元を許可 |
| `img-src` | `'self' data:` | ローカル画像と data URI（webpack の asset/resource）を許可 |
| `connect-src` | `'self'` | API 通信は同一オリジンのみ。外部 API 呼び出しなし |
| `media-src` | `'self'` | ローカル動画ファイル（`public/videos/`）を許可 |
| `worker-src` | `'self' blob:` | Tone.js が `URL.createObjectURL()` で blob ベースの Web Worker を生成するため `blob:` を許可。Worker のみに限定されるためセキュリティリスクは限定的 |

### 2.2 その他のセキュリティ meta タグ

**追加位置**: CSP meta タグの直後

**変更後**:
```html
<meta http-equiv="X-Content-Type-Options" content="nosniff">
<meta name="referrer" content="strict-origin-when-cross-origin">
```

**各タグの目的**:
- `X-Content-Type-Options: nosniff`: ブラウザの MIME タイプスニッフィングを防止。悪意あるファイルの実行を抑制
- `Referrer-Policy: strict-origin-when-cross-origin`: クロスオリジンリクエスト時のリファラー情報をオリジンのみに制限

---

## 3. コード修正（フェーズ 3）

### 3.1 `window.open` のセキュリティ修正

**対象**: `src/components/molecules/ShareButton.tsx`（69 行目付近）

**変更前**:
```typescript
window.open(shareUrl.toString(), '_blank', 'width=550,height=420');
```

**変更後**:
```typescript
window.open(shareUrl.toString(), '_blank', 'noopener,noreferrer,width=550,height=420');
```

**根拠**:
- `noopener`: 開かれたウィンドウが `window.opener` を通じて元のページを操作できなくする（リバースタブナッピング防止）
- `noreferrer`: 遷移先に HTTP Referer ヘッダーを送信しない（`noopener` も暗黙的に含む）
- `width=550,height=420`: 既存のポップアップサイズ指定はそのまま維持

### 3.2 webpack 本番ビルドのソースマップ無効化

**対象**: `webpack.config.ts`

**変更前**（`devtool` 設定なし — webpack 5 のデフォルト動作に依存）:
```typescript
const config: Configuration = {
  mode: 'development',
  entry: './src/index.tsx',
  ...
};
```

**変更後**:
```typescript
const config: Configuration = {
  mode: 'development',
  devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',
  entry: './src/index.tsx',
  ...
};
```

**根拠**:
- 本番ビルド（`webpack --mode production`）時にソースマップを生成しない（`false`）
- 開発時は `source-map` でデバッグ体験を維持（`eval-source-map` は CSP の `script-src 'self'` と衝突するため不採用）
- `process.env.NODE_ENV` は webpack の `--mode` フラグにより自動設定される
- ソースマップが公開されると、アプリケーションの内部ロジック・変数名・コメントがすべて閲覧可能になるリスクがある

---

## 4. ESLint 更新・セキュリティプラグイン（フェーズ 4）

### 4.1 パッケージの追加・更新

**対象**: `package.json`

**変更内容**:
```json
{
  "devDependencies": {
    "eslint": "^9.39.2",
    "eslint-plugin-security": "^3.0.1",
    ...
  }
}
```

> **注意**: ESLint v10 へのアップグレードを検討したが、`typescript-eslint` が v10 未対応のため現行 v9 を維持。`eslint-plugin-security` のみ追加した。

### 4.2 ESLint 設定の更新

**対象**: `eslint.config.mjs`

**変更前**:
```javascript
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default defineConfig([
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [
      tseslint.configs.recommended,
      reactPlugin.configs.flat.recommended,
    ],
    plugins: {
      "react-hooks": reactHooks,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "error",
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
]);
```

**変更後**:
```javascript
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import security from "eslint-plugin-security";

export default defineConfig([
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [
      tseslint.configs.recommended,
      reactPlugin.configs.flat.recommended,
    ],
    plugins: {
      "react-hooks": reactHooks,
      security,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "error",
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // セキュリティルール
      "security/detect-object-injection": "warn",
      "security/detect-non-literal-regexp": "warn",
      "security/detect-unsafe-regex": "error",
      "security/detect-buffer-noassert": "error",
      "security/detect-eval-with-expression": "error",
      "security/detect-no-csrf-before-method-override": "error",
      "security/detect-possible-timing-attacks": "warn",
    },
  },
]);
```

**有効化するルール**:

| ルール | レベル | 目的 |
|--------|--------|------|
| `detect-object-injection` | warn | オブジェクトインジェクション攻撃の検出 |
| `detect-non-literal-regexp` | warn | 動的正規表現による ReDoS リスクの検出 |
| `detect-unsafe-regex` | error | 危険な正規表現パターンの検出 |
| `detect-buffer-noassert` | error | Buffer の安全でないアクセスの検出 |
| `detect-eval-with-expression` | error | `eval()` の使用検出 |
| `detect-no-csrf-before-method-override` | error | CSRF 保護の欠如検出 |
| `detect-possible-timing-attacks` | warn | タイミング攻撃の可能性がある比較の検出 |

---

## 5. 実施しない項目

| 項目 | 理由 |
|------|------|
| `nonce` ベースの CSP | styled-components が動的にスタイルを注入するため、`nonce` の管理が複雑。SSR を使用しておらず、meta タグ CSP では `nonce` の動的生成が不可能 |
| Subresource Integrity（SRI） | すべてのリソースが self-hosted（webpack バンドル）であり、CDN 経由の改ざんリスクがない |
| HTTP ヘッダーによる CSP | 本プロジェクトは静的ファイルホスティングを想定しており、サーバーサイド設定は範囲外。meta タグで代替 |
| `Permissions-Policy` | 本アプリケーションは位置情報・カメラ・マイク等のブラウザ API を使用しないため、制限の必要性が低い |
| TypeScript の `strict` モード強化 | セキュリティとは直接的に関係しない。別タスクとして管理 |
| `whatwg-encoding` の overrides による置換 | 代替パッケージ `@exodus/bytes` は API 互換ではなく、`jsdom` の内部依存を壊すリスクが高い。上流の修正待ち |
| `glob`/`inflight` の overrides による強制上書き | `test-exclude`（Jest カバレッジ）が `glob@11` と互換性がなくテストが失敗するため撤回。既知の警告として記録 |
| ESLint v10 へのアップグレード | `typescript-eslint` が v10 未対応。上流の対応待ち |
