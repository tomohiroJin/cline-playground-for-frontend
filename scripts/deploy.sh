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

# チルダを安全に展開するヘルパー（eval を使わない）
expand_tilde() { echo "${1/#\~/$HOME}"; }

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

# ステップ 1/5: プリデプロイ検証
log_step "ステップ 1/5: プリデプロイ検証"
"${SCRIPT_DIR}/pre-deploy.sh"
echo ""

# ステップ 2/5: サーバー認証
log_step "ステップ 2/5: サーバー認証"

SSH_OPTS=(
  -o StrictHostKeyChecking=accept-new
  -o ConnectTimeout=10
  -p "${DEPLOY_PORT}"
)

case "$DEPLOY_AUTH_METHOD" in
  ssh_key)
    SSH_KEY_PATH="$(expand_tilde "${DEPLOY_SSH_KEY_PATH:-~/.ssh/id_ed25519}")"
    if [ ! -f "$SSH_KEY_PATH" ]; then
      log_error "SSH 鍵が見つかりません: ${SSH_KEY_PATH}"
      exit 1
    fi
    SSH_OPTS+=(-i "$SSH_KEY_PATH")
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
if ! ssh "${SSH_OPTS[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" "echo 'OK'" > /dev/null 2>&1; then
  log_error "サーバーへの接続に失敗しました"
  exit 1
fi
log_info "接続成功"
echo ""

# ステップ 3/5: バックアップ（オプション）
if [ "$DEPLOY_BACKUP" = "true" ]; then
  log_step "ステップ 3/5: リモートバックアップ"
  BACKUP_DIR="${DEPLOY_PATH}_backup_$(date +%Y%m%d_%H%M%S)"
  ssh "${SSH_OPTS[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" \
    "if [ -d '${DEPLOY_PATH}' ]; then cp -r '${DEPLOY_PATH}' '${BACKUP_DIR}'; echo 'バックアップ完了: ${BACKUP_DIR}'; else echo 'バックアップ対象なし（新規デプロイ）'; fi"
  echo ""
else
  log_info "ステップ 3/5: バックアップスキップ"
  echo ""
fi

# ステップ 4/5: rsync による差分デプロイ
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
  -e "ssh ${SSH_OPTS[*]}" # SSH 接続オプション
)

if [ "$DEPLOY_DRY_RUN" = "true" ]; then
  RSYNC_OPTS+=(--dry-run)
  log_warn "Dry Run モード: 実際の転送は行いません"
fi

rsync "${RSYNC_OPTS[@]}" \
  "${PROJECT_ROOT}/dist/" \
  "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"

echo ""

# ステップ 5/5: ヘルスチェック
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
