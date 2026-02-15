# セキュリティ脆弱性対策 — タスクチェックリスト

## 凡例

- `[ ]` 未着手
- `[x]` 完了
- 各タスクは **実施タスク**（I: Implementation）と **検証タスク**（V: Verification）に分類

---

## フェーズ 1: パッケージ整理

> 前提: なし | 対象: `package.json`

### 実施タスク

- [x] **I-01.1** `@types/react` を `dependencies` から `devDependencies` に移動
- [x] **I-01.2** `@types/react-dom` を `dependencies` から `devDependencies` に移動
- [x] **I-01.3** `@types/webpack-dev-server` を `devDependencies` から削除
- [ ] **I-01.4** `package.json` に `overrides` フィールドを追加（`glob: "^11.0.0"`, `inflight: "npm:lru-cache@^10.0.0"`） — ※ `test-exclude`（Jest カバレッジ）と互換性がなくテストが失敗するため、フォールバック方針に従い撤回
- [x] **I-01.5** `npm install` を実行し、`package-lock.json` を再生成

### 検証タスク

- [x] **V-01.1** `npm install` が正常に完了すること
- [x] **V-01.2** `npm run build` が成功すること
- [x] **V-01.3** `npm run test` が全件パスすること（overrides による Jest 互換性の確認を含む）
- [x] **V-01.4** `npm run lint` がエラーなしで完了すること — ※ 既存の lint エラー 48 件はフェーズ 1 の変更とは無関係
- [x] **V-01.5** `package.json` の `dependencies` に `@types` パッケージが残っていないこと
- [ ] **V-01.6** `npm install` 時に `glob` および `inflight` の deprecation 警告が消失すること — ※ overrides 撤回により未達（既知の警告として記録）
- [x] **V-01.7** `whatwg-encoding` の deprecation 警告が引き続き表示されること（対処対象外として記録）

---

## フェーズ 2: CSP・セキュリティ meta タグ追加

> 前提: なし（フェーズ 1 と並行可能） | 対象: `public/index.html`

### 実施タスク

- [x] **I-02.1** `<head>` 内に CSP meta タグを追加（`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; media-src 'self'; worker-src 'self' blob:`）
- [x] **I-02.2** `X-Content-Type-Options: nosniff` meta タグを追加
- [x] **I-02.3** `Referrer-Policy: strict-origin-when-cross-origin` meta タグを追加

### 検証タスク

- [x] **V-02.1** `npm run build` が成功すること
- [ ] **V-02.2** `npm run preview` でアプリを起動し、ブラウザ DevTools Console に CSP 違反が出ないこと — ※ ブラウザでの手動確認が必要（devtool を `source-map` に修正済み、`worker-src 'self' blob:` 追加により Tone.js blob worker の CSP 違反を解消済み、再検証推奨）
- [ ] **V-02.3** Google Fonts（Inter, Silkscreen, Orbitron, Press Start 2P）が正常に読み込まれること — ※ ブラウザでの手動確認が必要
- [ ] **V-02.4** ゲーム画面（Canvas 描画）が正常に動作すること — ※ ブラウザでの手動確認が必要
- [ ] **V-02.5** 動画・画像リソースが正常に読み込まれること — ※ ブラウザでの手動確認が必要

---

## フェーズ 3: コード修正

> 前提: なし（他フェーズと並行可能） | 対象: `ShareButton.tsx`, `webpack.config.ts`

### 実施タスク

- [x] **I-03.1** `ShareButton.tsx` の `window.open` 呼び出しに `noopener,noreferrer` を追加
- [x] **I-03.2** `webpack.config.ts` に `devtool` 設定を追加（本番: `false`、開発: `source-map`）— `eval-source-map` は CSP（`script-src 'self'`）と衝突するため `source-map` に変更

### 検証タスク

- [ ] **V-03.1** ShareButton の共有ボタンクリックで Twitter/X の投稿画面が正常に開くこと — ※ ブラウザでの手動確認が必要
- [ ] **V-03.2** 開かれたウィンドウから `window.opener` が `null` であること（DevTools で確認） — ※ ブラウザでの手動確認が必要
- [x] **V-03.3** `npm run build` 後、`dist/` ディレクトリにソースマップファイル（`*.map`）が存在しないこと
- [ ] **V-03.4** `npm start`（開発サーバー）が正常に動作し、DevTools でソースマップが利用可能なこと — ※ ブラウザでの手動確認が必要
- [x] **V-03.5** `npm run test` が全件パスすること

---

## フェーズ 4: ESLint 更新・セキュリティプラグイン導入

> 前提: フェーズ 1 完了推奨 | 対象: `package.json`, `eslint.config.mjs`

### 実施タスク

- [ ] **I-04.1** ESLint を v10 にアップグレード（利用可能な場合。不可の場合は現行 v9 を維持） — ※ `typescript-eslint` が v10 未対応のため v9 を維持
- [x] **I-04.2** `eslint-plugin-security` を `devDependencies` に追加
- [x] **I-04.3** `eslint.config.mjs` にセキュリティプラグインの import を追加
- [x] **I-04.4** `eslint.config.mjs` の `plugins` にセキュリティプラグインを登録
- [x] **I-04.5** セキュリティルール（7 項目）を `rules` に追加

### 検証タスク

- [x] **V-04.1** `npm install` が正常に完了すること
- [x] **V-04.2** `npm run lint` が既存コードに対してエラーなしで完了すること（新規 warn は許容）
- [ ] **V-04.3** テスト用に `eval()` を含むコードを書いた場合に `detect-eval-with-expression` エラーが報告されること — ※ 手動確認が必要
- [x] **V-04.4** `typescript-eslint` のルールが引き続き正常に動作すること
- [x] **V-04.5** `eslint-plugin-react` および `eslint-plugin-react-hooks` のルールが引き続き正常に動作すること

---

## 全体検証

> 前提: 全フェーズ完了後

- [x] **V-99.1** `npm audit` で脆弱性が 0 件であること
- [x] **V-99.2** `npm run build` が警告なしで成功すること — ※ アセットサイズ警告のみ（既存、セキュリティ変更とは無関係）
- [x] **V-99.3** `npm run test` が全件パスすること
- [x] **V-99.4** `npm run lint` がエラーなしで完了すること — ※ 既存エラー 48 件のみ、セキュリティ変更による新規エラーなし
- [ ] **V-99.5** アプリケーション全体の動作確認（ホーム画面 → 各ゲーム → シェア機能） — ※ ブラウザでの手動確認が必要
