# CI/CD パイプライン整備 タスクチェックリスト

## 凡例

- `[ ]` 未着手
- `[~]` 作業中
- `[x]` 完了
- `[-]` スキップ / 不要

---

## フェーズ 1: npm スクリプト整備

### 1-1: `typecheck` スクリプト追加

- [x] `package.json` に `"typecheck": "tsc --noEmit"` を追加
- [x] `npm run typecheck` が正常に実行されることを確認
- [x] 型エラーが存在する場合に終了コード 1 で終了することを確認

### 1-2: `lint:ci` スクリプト追加

- [x] `package.json` に `"lint:ci": "eslint src --max-warnings 0"` を追加
- [x] `npm run lint:ci` が正常に実行されることを確認
- [x] warning が存在する場合に終了コード 1 で終了することを確認

### 1-3: `ci` スクリプト追加

- [x] `package.json` に `"ci": "npm run lint:ci && npm run typecheck && npm test && npm run build"` を追加
- [x] `npm run ci` が全ステップを順次実行することを確認
- [x] いずれかのステップが失敗した場合に後続がスキップされることを確認

### 1-4: `.nvmrc` ファイル作成

- [x] プロジェクトルートに `.nvmrc` を作成（内容: `20`）
- [-] `nvm use` で正しいバージョンに切り替わることを確認（nvm 利用環境のみ）

### 1-5: 動作確認

- [x] `npm run typecheck` が成功すること
- [x] `npm run lint:ci` が成功すること
- [x] `npm test` が成功すること
- [x] `npm run build` が成功すること
- [x] `npm run ci` が全ステップ成功すること

---

## フェーズ 2: GitHub Actions CI ワークフロー

### 2-1: ワークフローファイル作成

- [ ] `.github/workflows/` ディレクトリを作成
- [ ] `ci.yml` を作成

### 2-2: Lint ジョブ

- [ ] `lint` ジョブを定義
- [ ] `actions/checkout@v4` でソースをチェックアウト
- [ ] `actions/setup-node@v4` で Node.js セットアップ（`.nvmrc` 参照）
- [ ] `npm ci` で依存関係インストール
- [ ] `npm run lint:ci` でリント実行

### 2-3: TypeCheck ジョブ

- [ ] `typecheck` ジョブを定義
- [ ] lint ジョブと並列実行される設定
- [ ] `npm run typecheck` で型チェック実行

### 2-4: Test ジョブ

- [ ] `test` ジョブを定義
- [ ] `npm run test:coverage` でカバレッジ付きテスト実行
- [ ] `actions/upload-artifact@v4` でカバレッジレポートを保存
- [ ] テスト失敗時もカバレッジレポートがアップロードされること（`if: always()`）

### 2-5: Build ジョブ

- [ ] `build` ジョブを定義
- [ ] `needs: [lint, typecheck, test]` で依存関係を設定
- [ ] `npm run build` で本番ビルド実行
- [ ] `actions/upload-artifact@v4` で `dist/` をアーティファクトとして保存

### 2-6: ワークフロー共通設定

- [ ] `on.pull_request.branches: [main]` トリガー設定
- [ ] `on.push.branches: [main]` トリガー設定
- [ ] `concurrency` で同一ブランチの重複実行をキャンセル設定
- [ ] npm キャッシュ設定（`cache: 'npm'`）

### 2-7: 動作確認

- [ ] feature ブランチで PR を作成し、CI が自動で起動することを確認
- [ ] lint / typecheck / test が並列実行されることを確認
- [ ] build が上記3ジョブ成功後に実行されることを確認
- [ ] 全ジョブが成功し、PR に緑のチェックマークが表示されることを確認
- [ ] カバレッジレポートがアーティファクトとして保存されていることを確認

### 2-8: ブランチ保護ルール設定（手動）

- [ ] GitHub リポジトリ Settings → Branches → Branch protection rules を設定
  - [ ] `main` ブランチに対するルールを追加
  - [ ] 「Require status checks to pass before merging」を有効化
  - [ ] 必須ステータスチェックに `lint`, `typecheck`, `test`, `build` を追加
  - [ ] 「Require branches to be up to date before merging」を有効化

---

## フェーズ 3: ビルドシステム完全性保証

### 3-1: プリデプロイ検証スクリプト作成

- [ ] `scripts/` ディレクトリを作成
- [ ] `scripts/pre-deploy.sh` を作成
- [ ] 実行権限を付与（`chmod +x`）

### 3-2: 検証ステップの実装

- [ ] ステップ 1: `npm ci` による依存関係のクリーンインストール
- [ ] ステップ 2: `npm run lint:ci` によるリント検証
- [ ] ステップ 3: `npm run typecheck` による型チェック
- [ ] ステップ 4: `npm test` によるテスト実行
- [ ] ステップ 5: `npm run build` による本番ビルド
- [ ] ステップ 6: ビルド成果物の検証
  - [ ] `dist/index.html` の存在確認
  - [ ] `*.bundle.js` の存在確認（1個以上）
  - [ ] ソースマップ（`.map`）ファイルの検出・警告
  - [ ] `dist/` ディレクトリのサイズ確認（50MB 以下）

### 3-3: ログ出力

- [ ] 色付きログ出力（INFO: 緑, WARN: 黄, ERROR: 赤）
- [ ] 各ステップの開始・完了メッセージ
- [ ] 失敗時のエラーメッセージとゼロ以外の終了コード

### 3-4: 動作確認

- [ ] `./scripts/pre-deploy.sh` がローカルで正常に実行されること
- [ ] 全ステップが順次実行され、成功メッセージが表示されること
- [ ] 意図的にテストを失敗させた場合、後続ステップが実行されないこと
- [ ] `dist/` の検証が正しく行われること

---

## フェーズ 4: デプロイパイプライン

### 4-1: 環境設定テンプレート

- [ ] `.env.deploy.example` を作成
  - [ ] `DEPLOY_HOST` — デプロイ先ホスト名
  - [ ] `DEPLOY_USER` — SSH ユーザー名
  - [ ] `DEPLOY_PATH` — デプロイ先パス
  - [ ] `DEPLOY_PORT` — SSH ポート（デフォルト: 22）
  - [ ] `DEPLOY_AUTH_METHOD` — 認証方式（ssh_key / token）
  - [ ] `DEPLOY_SSH_KEY_PATH` — SSH 鍵パス
  - [ ] `DEPLOY_TOKEN` — トークン（コンテナ環境用）
  - [ ] `DEPLOY_SITE_URL` — ヘルスチェック用 URL
  - [ ] `DEPLOY_DRY_RUN` — ドライランフラグ
  - [ ] `DEPLOY_BACKUP` — バックアップフラグ

### 4-2: デプロイスクリプト作成

- [ ] `scripts/deploy.sh` を作成
- [ ] 実行権限を付与（`chmod +x`）

### 4-3: デプロイスクリプトの実装

- [ ] ステップ 1: `.env.deploy` の読み込みと必須変数の確認
- [ ] ステップ 2: プリデプロイ検証の呼び出し（`pre-deploy.sh`）
- [ ] ステップ 3: サーバー認証
  - [ ] SSH 鍵認証の実装
  - [ ] トークン認証のプレースホルダー
  - [ ] 接続テスト
- [ ] ステップ 4: rsync による差分デプロイ
  - [ ] `--archive` — パーミッション保持
  - [ ] `--compress` — 転送圧縮
  - [ ] `--checksum` — チェックサムベース差分検出
  - [ ] `--delete` — 不要ファイル削除
  - [ ] `--verbose --stats` — 転送ログ
  - [ ] `--exclude` — `.env`, `.git`, `*.map` の除外
  - [ ] `--dry-run` — ドライランモード対応
- [ ] ステップ 5: ヘルスチェック
  - [ ] HTTP ステータスコード確認（200 OK）
  - [ ] タイムアウト設定（10秒）
- [ ] デプロイ完了ログ（タイムスタンプ付き）

### 4-4: `.gitignore` 更新

- [ ] `.env.deploy` を `.gitignore` に追加

### 4-5: 動作確認

- [ ] `DEPLOY_DRY_RUN=true` でドライラン実行が正常に動作すること
- [ ] `.env.deploy` が存在しない場合にエラーメッセージが表示されること
- [ ] 必須変数が未設定の場合にエラーメッセージが表示されること
- [ ] 接続テストが失敗した場合にエラーメッセージが表示され、デプロイが中止されること

### 4-6: ロールバック手順の文書化

- [ ] ロールバック手順を spec.md に記載（完了済み）
- [ ] バックアップディレクトリの命名規則を確認

---

## 全フェーズ共通: 最終確認

### 統合テスト

- [ ] フェーズ 1: 全 npm スクリプトが正常に動作すること
- [ ] フェーズ 2: PR 作成時に CI が自動実行されること
- [ ] フェーズ 2: CI 全ジョブが緑色で通過すること
- [ ] フェーズ 3: `pre-deploy.sh` がローカルで成功すること
- [ ] フェーズ 4: `deploy.sh --dry-run` が正常に動作すること

### ドキュメント確認

- [ ] `plan.md` が最新の実装内容を反映していること
- [ ] `spec.md` が全フェーズの詳細仕様を網羅していること
- [ ] `tasks.md` の全タスクのステータスが正しいこと
- [ ] `.env.deploy.example` に全必須変数が記載されていること

### セキュリティ確認

- [ ] `.env.deploy` が `.gitignore` に含まれていること
- [ ] SSH 秘密鍵がリポジトリに含まれていないこと
- [ ] デプロイトークンがログに出力されないこと
- [ ] GitHub Actions のシークレットが適切に設定されていること（CD 自動化時）
