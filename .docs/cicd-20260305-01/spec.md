# CI/CD パイプライン整備 仕様書

---

## フェーズ 1: npm スクリプト整備

### 1.1 `typecheck` スクリプト

**ファイル:** `package.json`

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit"
  }
}
```

**動作:**
- TypeScript コンパイラを型チェックモードで実行
- `--noEmit` によりファイル出力なし（チェックのみ）
- `tsconfig.json` の `strict: true` 設定に基づき厳密に検証
- 終了コード: 0（成功）/ 1以上（型エラーあり）

**補足:**
- 現在のビルドは `ts-loader` 経由で型チェックしているが、`transpileOnly` オプションが将来追加された場合に型チェックが抜ける可能性がある
- 独立した `tsc --noEmit` は型安全性の最終防衛線として機能する

### 1.2 `lint:ci` スクリプト

**ファイル:** `package.json`

```json
{
  "scripts": {
    "lint:ci": "eslint src --max-warnings 0"
  }
}
```

**動作:**
- `eslint src` と同じ対象を検証
- `--max-warnings 0` により warning が1つでも存在すれば終了コード 1 を返す
- CI 環境では warning を許容しない厳格ポリシーを適用

**既存 `lint` スクリプトとの使い分け:**

| スクリプト | 用途 | warning の扱い |
|-----------|------|---------------|
| `lint` | ローカル開発中の確認 | warning として表示（通過） |
| `lint:ci` | CI / プリデプロイ | warning でも失敗 |

### 1.3 `ci` スクリプト

**ファイル:** `package.json`

```json
{
  "scripts": {
    "ci": "npm run lint:ci && npm run typecheck && npm test && npm run build"
  }
}
```

**動作:**
- 4つのコマンドを順次実行
- いずれかが失敗した時点で後続コマンドをスキップし、失敗で終了
- 実行順序の根拠:
  1. `lint:ci` — 最速（数秒）、構文・規約エラーを即座に検出
  2. `typecheck` — 型エラー検出（10〜30秒）
  3. `test` — テスト実行（30秒〜2分）
  4. `build` — 本番ビルド（1〜3分、最も重い）

### 1.4 `.nvmrc` ファイル

**ファイル:** `.nvmrc`（新規作成）

```
20
```

**動作:**
- Node.js 20.x LTS を使用することを宣言
- `nvm use` で自動切り替え
- CI の `actions/setup-node` で `node-version-file: '.nvmrc'` として参照可能

---

## フェーズ 2: GitHub Actions CI ワークフロー

### 2.1 ワークフロー定義

**ファイル:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint:ci

  typecheck:
    name: TypeCheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report
          path: coverage/
          retention-days: 7

  build:
    name: Build
    needs: [lint, typecheck, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 3
```

### 2.2 ワークフロー設計の詳細

#### トリガー

| イベント | ブランチ | 用途 |
|---------|---------|------|
| `pull_request` | `main` | PR の品質ゲート |
| `push` | `main` | マージ後の最終確認 |

#### 同時実行制御

```yaml
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```

- 同じブランチの CI が複数走った場合、古い方をキャンセル
- PR の Force Push 時に無駄な CI 実行を防止

#### ジョブ構成

```
┌─────────┐  ┌───────────┐  ┌──────────┐
│  lint    │  │ typecheck  │  │   test   │
│  (~30s)  │  │  (~30s)    │  │ (~1-2m)  │
└────┬─────┘  └─────┬──────┘  └────┬─────┘
     │              │              │
     └──────────────┼──────────────┘
                    │
              ┌─────┴─────┐
              │   build    │
              │  (~2-3m)   │
              └────────────┘
```

- `lint`, `typecheck`, `test` は並列実行（合計時間 ≈ 最遅ジョブの時間）
- `build` は上記3ジョブの全成功後に実行

#### キャッシュ戦略

`actions/setup-node` の `cache: 'npm'` により:
- `~/.npm` キャッシュを `package-lock.json` のハッシュでキャッシュキーを生成
- キャッシュヒット時は `npm ci` のダウンロード時間を大幅に短縮

#### アーティファクト

| 名前 | 内容 | 保持期間 | 条件 |
|------|------|---------|------|
| `coverage-report` | テストカバレッジレポート | 7日 | テスト成功/失敗時いずれも |
| `dist` | 本番ビルド成果物 | 3日 | ビルド成功時のみ |

### 2.3 ブランチ保護ルール（推奨設定）

GitHub リポジトリの Settings → Branches → Branch protection rules で以下を設定:

| 設定項目 | 値 | 説明 |
|---------|---|------|
| Branch name pattern | `main` | main ブランチを保護 |
| Require status checks to pass | ✅ | CI 通過必須 |
| Required status checks | `lint`, `typecheck`, `test`, `build` | 全ジョブを必須に |
| Require branches to be up to date | ✅ | 最新の main との同期必須 |
| Require pull request reviews | 任意 | コードレビュー要否 |

**注意:** ブランチ保護ルールの設定は GitHub の Web UI または `gh api` で行う。ワークフローファイルだけでは設定されない。

---

## フェーズ 3: ビルドシステム完全性保証

### 3.1 プリデプロイ検証スクリプト

**ファイル:** `scripts/pre-deploy.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

# 色付きログ出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# プロジェクトルートに移動
cd "$(dirname "$0")/.."

echo "========================================"
echo "  プリデプロイ検証を開始します"
echo "========================================"
echo ""

# ステップ 1: 依存関係のクリーンインストール
log_info "ステップ 1/6: 依存関係のインストール"
npm ci
echo ""

# ステップ 2: リント
log_info "ステップ 2/6: リント実行"
npm run lint:ci
echo ""

# ステップ 3: 型チェック
log_info "ステップ 3/6: 型チェック実行"
npm run typecheck
echo ""

# ステップ 4: テスト
log_info "ステップ 4/6: テスト実行"
npm test
echo ""

# ステップ 5: 本番ビルド
log_info "ステップ 5/6: 本番ビルド実行"
npm run build
echo ""

# ステップ 6: ビルド成果物の検証
log_info "ステップ 6/6: ビルド成果物の検証"

# index.html の存在確認
if [ ! -f "dist/index.html" ]; then
  log_error "dist/index.html が存在しません"
  exit 1
fi
log_info "  ✓ dist/index.html"

# バンドルファイルの存在確認
BUNDLE_COUNT=$(find dist -name "*.bundle.js" | wc -l)
if [ "$BUNDLE_COUNT" -eq 0 ]; then
  log_error "バンドルファイル（*.bundle.js）が存在しません"
  exit 1
fi
log_info "  ✓ バンドルファイル: ${BUNDLE_COUNT}個"

# ソースマップが含まれていないことの確認
SOURCEMAP_COUNT=$(find dist -name "*.map" | wc -l)
if [ "$SOURCEMAP_COUNT" -gt 0 ]; then
  log_warn "ソースマップファイルが ${SOURCEMAP_COUNT}個 含まれています"
  log_warn "本番環境にソースマップをデプロイしないことを確認してください"
fi

# dist ディレクトリの合計サイズ確認（上限: 50MB）
DIST_SIZE=$(du -sm dist | cut -f1)
MAX_DIST_SIZE=50
if [ "$DIST_SIZE" -gt "$MAX_DIST_SIZE" ]; then
  log_error "dist ディレクトリのサイズが上限（${MAX_DIST_SIZE}MB）を超えています: ${DIST_SIZE}MB"
  exit 1
fi
log_info "  ✓ dist サイズ: ${DIST_SIZE}MB（上限: ${MAX_DIST_SIZE}MB）"

echo ""
echo "========================================"
echo -e "  ${GREEN}プリデプロイ検証が完了しました${NC}"
echo "========================================"
```

**実行方法:**
```bash
chmod +x scripts/pre-deploy.sh
./scripts/pre-deploy.sh
```

**終了コード:**
- `0`: 全チェック通過
- `1`: いずれかのチェックが失敗

### 3.2 ビルド成果物の検証項目

| 検証項目 | 条件 | 失敗時の動作 |
|---------|------|------------|
| `dist/index.html` の存在 | ファイルが存在 | エラー終了 |
| `*.bundle.js` の存在 | 1個以上存在 | エラー終了 |
| ソースマップ（`.map`）の存在 | 0個（推奨） | 警告（通過） |
| dist ディレクトリサイズ | 50MB 以下 | エラー終了 |

### 3.3 Webpack 本番ビルドの確認事項

現在の `webpack.config.ts` で既に設定済みの項目:

| 項目 | 設定 | 状態 |
|------|------|------|
| production モード | `--mode production` | ✅ 設定済み |
| devtool | `false`（production 時） | ✅ 設定済み |
| コード分割 | `splitChunks` + `runtimeChunk` | ✅ 設定済み |
| clean ビルド | `output.clean: true` | ✅ 設定済み |
| パフォーマンス制限 | `maxAssetSize: 400000` | ✅ 設定済み |

---

## フェーズ 4: デプロイパイプライン

### 4.1 環境設定テンプレート

**ファイル:** `.env.deploy.example`

```bash
# デプロイ先サーバー設定
DEPLOY_HOST=your-server.example.com
DEPLOY_USER=deploy
DEPLOY_PATH=/var/www/game-platform
DEPLOY_PORT=22

# 認証方式（ssh_key または token）
DEPLOY_AUTH_METHOD=ssh_key

# SSH 鍵認証の場合
DEPLOY_SSH_KEY_PATH=~/.ssh/id_ed25519

# トークン認証の場合（コンテナ環境用）
# DEPLOY_TOKEN=

# サイトURL（ヘルスチェック用）
DEPLOY_SITE_URL=https://niku9.click

# オプション
DEPLOY_DRY_RUN=false
DEPLOY_BACKUP=true
```

### 4.2 デプロイスクリプト

**ファイル:** `scripts/deploy.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

# 色付きログ出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# プロジェクトルートに移動
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# 環境変数の読み込み
ENV_FILE="${PROJECT_ROOT}/.env.deploy"
if [ ! -f "$ENV_FILE" ]; then
  log_error ".env.deploy が見つかりません"
  log_error "${PROJECT_ROOT}/.env.deploy.example をコピーして設定してください"
  exit 1
fi
# shellcheck source=/dev/null
source "$ENV_FILE"

# 必須変数の確認
: "${DEPLOY_HOST:?DEPLOY_HOST が設定されていません}"
: "${DEPLOY_USER:?DEPLOY_USER が設定されていません}"
: "${DEPLOY_PATH:?DEPLOY_PATH が設定されていません}"
: "${DEPLOY_AUTH_METHOD:?DEPLOY_AUTH_METHOD が設定されていません}"

DEPLOY_PORT="${DEPLOY_PORT:-22}"
DEPLOY_DRY_RUN="${DEPLOY_DRY_RUN:-false}"
DEPLOY_BACKUP="${DEPLOY_BACKUP:-true}"

echo "========================================"
echo "  デプロイを開始します"
echo "========================================"
echo ""
log_info "デプロイ先: ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}"
log_info "認証方式: ${DEPLOY_AUTH_METHOD}"
log_info "Dry Run: ${DEPLOY_DRY_RUN}"
echo ""

# ステップ 1: プリデプロイ検証
log_step "ステップ 1/5: プリデプロイ検証"
"${SCRIPT_DIR}/pre-deploy.sh"
echo ""

# ステップ 2: SSH 接続オプションの構築
log_step "ステップ 2/5: サーバー認証"

SSH_OPTS="-o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 -p ${DEPLOY_PORT}"

case "$DEPLOY_AUTH_METHOD" in
  ssh_key)
    SSH_KEY_PATH="${DEPLOY_SSH_KEY_PATH:-~/.ssh/id_ed25519}"
    if [ ! -f "$(eval echo "$SSH_KEY_PATH")" ]; then
      log_error "SSH 鍵が見つかりません: ${SSH_KEY_PATH}"
      exit 1
    fi
    SSH_OPTS="${SSH_OPTS} -i $(eval echo "$SSH_KEY_PATH")"
    ;;
  token)
    if [ -z "${DEPLOY_TOKEN:-}" ]; then
      log_error "DEPLOY_TOKEN が設定されていません"
      exit 1
    fi
    # トークン認証はコンテナ環境の仕組みに依存
    # 必要に応じてここにトークンベースの認証ロジックを追加
    log_info "トークン認証を使用"
    ;;
  *)
    log_error "未対応の認証方式: ${DEPLOY_AUTH_METHOD}"
    exit 1
    ;;
esac

# 接続テスト
log_info "接続テスト中..."
if ! ssh ${SSH_OPTS} "${DEPLOY_USER}@${DEPLOY_HOST}" "echo 'OK'" > /dev/null 2>&1; then
  log_error "サーバーへの接続に失敗しました"
  exit 1
fi
log_info "接続成功"
echo ""

# ステップ 3: バックアップ（オプション）
if [ "$DEPLOY_BACKUP" = "true" ]; then
  log_step "ステップ 3/5: リモートバックアップ"
  BACKUP_DIR="${DEPLOY_PATH}_backup_$(date +%Y%m%d_%H%M%S)"
  ssh ${SSH_OPTS} "${DEPLOY_USER}@${DEPLOY_HOST}" \
    "if [ -d '${DEPLOY_PATH}' ]; then cp -r '${DEPLOY_PATH}' '${BACKUP_DIR}'; echo 'バックアップ完了: ${BACKUP_DIR}'; else echo 'バックアップ対象なし（新規デプロイ）'; fi"
  echo ""
else
  log_info "ステップ 3/5: バックアップスキップ"
  echo ""
fi

# ステップ 4: rsync による差分デプロイ
log_step "ステップ 4/5: 差分デプロイ（rsync）"

RSYNC_OPTS=(
  --archive            # パーミッション・タイムスタンプ保持
  --compress           # 転送時圧縮
  --checksum           # チェックサムベースの差分検出
  --delete             # サーバー上の不要ファイル削除
  --verbose            # 転送ファイルの詳細表示
  --stats              # 転送統計表示
  --exclude='.env'     # 環境変数ファイルは除外
  --exclude='.git'     # Git メタデータは除外
  --exclude='*.map'    # ソースマップは除外
  -e "ssh ${SSH_OPTS}" # SSH 接続オプション
)

if [ "$DEPLOY_DRY_RUN" = "true" ]; then
  RSYNC_OPTS+=(--dry-run)
  log_warn "Dry Run モード: 実際の転送は行いません"
fi

rsync "${RSYNC_OPTS[@]}" \
  "${PROJECT_ROOT}/dist/" \
  "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"

echo ""

# ステップ 5: ヘルスチェック
log_step "ステップ 5/5: ヘルスチェック"

if [ -n "${DEPLOY_SITE_URL:-}" ] && [ "$DEPLOY_DRY_RUN" != "true" ]; then
  log_info "サイト応答確認中: ${DEPLOY_SITE_URL}"

  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${DEPLOY_SITE_URL}" || echo "000")

  if [ "$HTTP_STATUS" = "200" ]; then
    log_info "ヘルスチェック成功（HTTP ${HTTP_STATUS}）"
  else
    log_warn "ヘルスチェック: HTTP ${HTTP_STATUS}（期待値: 200）"
    log_warn "サイトの状態を手動で確認してください"
  fi
else
  log_info "ヘルスチェックスキップ（DEPLOY_SITE_URL 未設定 または Dry Run）"
fi

echo ""
echo "========================================"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
if [ "$DEPLOY_DRY_RUN" = "true" ]; then
  echo -e "  ${YELLOW}Dry Run 完了（${TIMESTAMP}）${NC}"
else
  echo -e "  ${GREEN}デプロイ完了（${TIMESTAMP}）${NC}"
fi
echo "========================================"
```

**実行方法:**
```bash
chmod +x scripts/deploy.sh

# Dry Run（転送せずに差分確認のみ）
DEPLOY_DRY_RUN=true ./scripts/deploy.sh

# 本番デプロイ
./scripts/deploy.sh
```

### 4.3 rsync 差分デプロイの仕様

#### オプション詳細

| オプション | 効果 | 理由 |
|-----------|------|------|
| `--archive` | パーミッション・タイムスタンプ・シンボリックリンクを保持 | ファイル属性の維持 |
| `--compress` | 転送時にデータを圧縮 | ネットワーク帯域の節約 |
| `--checksum` | タイムスタンプではなくチェックサムで差分判定 | CI 環境ではタイムスタンプが信頼できないため |
| `--delete` | サーバー上に存在するがローカルにないファイルを削除 | 古いチャンクファイルの掃除 |
| `--verbose` | 転送されたファイル一覧を表示 | デプロイ内容の確認 |
| `--stats` | 転送統計（ファイル数、サイズ等）を表示 | デプロイの効率確認 |

#### Webpack contenthash との連携

Webpack の出力ファイルは以下の命名規則:
```
main.bundle.js           # エントリポイント
vendor-react.[hash].chunk.js  # React 関連
vendors.[hash].chunk.js       # その他ベンダー
```

`[contenthash]` はファイル内容のハッシュ値。コードが変更されない限りハッシュは同一。
rsync の `--checksum` と組み合わせることで:

1. ハッシュが変わらないチャンク → チェックサムが同じ → **スキップ**
2. ハッシュが変わったチャンク → チェックサムが異なる → **転送**
3. 新しいハッシュのチャンク → サーバーに存在しない → **転送**
4. 古いハッシュのチャンク → ローカルに存在しない → `--delete` で **削除**

### 4.4 ヘルスチェック仕様

| チェック項目 | 方法 | 成功条件 |
|-------------|------|---------|
| HTTP ステータスコード | `curl -s -o /dev/null -w "%{http_code}"` | 200 |
| タイムアウト | `--max-time 10` | 10秒以内に応答 |

### 4.5 ロールバック手順

デプロイに問題があった場合のロールバック手順:

```bash
# 1. バックアップディレクトリの確認
ssh ${SSH_OPTS} "${DEPLOY_USER}@${DEPLOY_HOST}" "ls -la ${DEPLOY_PATH}_backup_*"

# 2. 現在のデプロイを退避
ssh ${SSH_OPTS} "${DEPLOY_USER}@${DEPLOY_HOST}" \
  "mv ${DEPLOY_PATH} ${DEPLOY_PATH}_failed_$(date +%Y%m%d_%H%M%S)"

# 3. バックアップから復元
ssh ${SSH_OPTS} "${DEPLOY_USER}@${DEPLOY_HOST}" \
  "mv ${DEPLOY_PATH}_backup_YYYYMMDD_HHMMSS ${DEPLOY_PATH}"

# 4. ヘルスチェック
curl -s -o /dev/null -w "%{http_code}" ${DEPLOY_SITE_URL}
```

### 4.6 `.gitignore` への追加

**ファイル:** `.gitignore`

```gitignore
# デプロイ設定（機密情報を含むため）
.env.deploy
```

---

## 全フェーズ共通: ディレクトリ構造

### 新規ファイルの配置

```
project-root/
├── .github/
│   └── workflows/
│       └── ci.yml           # フェーズ 2: CI ワークフロー
├── scripts/
│   ├── pre-deploy.sh        # フェーズ 3: プリデプロイ検証
│   └── deploy.sh            # フェーズ 4: デプロイスクリプト
├── .env.deploy.example      # フェーズ 4: デプロイ設定テンプレート
├── .nvmrc                   # フェーズ 1: Node.js バージョン指定
├── package.json             # フェーズ 1: スクリプト追加
└── .gitignore               # フェーズ 4: .env.deploy 除外追加
```

---

## セキュリティ考慮事項

| 対象 | 対策 |
|------|------|
| SSH 秘密鍵 | ローカルファイルシステムにのみ保管、Git に含めない |
| `.env.deploy` | `.gitignore` に含め、Git に含めない |
| デプロイトークン | 環境変数経由、ログに出力しない |
| GitHub Actions Secrets | リポジトリ設定の Secrets に保管（将来の CD 自動化時） |
| サーバー接続 | `StrictHostKeyChecking=accept-new` で初回接続を許可、以降は検証 |
| rsync 除外 | `.env`, `.git`, `*.map` をデプロイ対象から除外 |
