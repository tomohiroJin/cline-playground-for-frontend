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

# ステップ 1/6: 依存関係のクリーンインストール
log_info "ステップ 1/6: 依存関係のインストール"
npm ci
echo ""

# ステップ 2/6: リント
log_info "ステップ 2/6: リント実行"
npm run lint:ci
echo ""

# ステップ 3/6: 型チェック
log_info "ステップ 3/6: 型チェック実行"
npm run typecheck
echo ""

# ステップ 4/6: テスト
log_info "ステップ 4/6: テスト実行"
npm test
echo ""

# ステップ 5/6: 本番ビルド
log_info "ステップ 5/6: 本番ビルド実行"
npm run build
echo ""

# ステップ 6/6: ビルド成果物の検証
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
