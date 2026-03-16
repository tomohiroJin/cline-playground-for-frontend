#!/usr/bin/env bash
# Jest の --shard オプションで テストを N 分割し、別プロセスとして並列実行するスクリプト
#
# 使い方:
#   ./scripts/test-parallel.sh           # 全テスト並列実行（デフォルト6分割）
#   SHARDS=4 ./scripts/test-parallel.sh  # 4分割で実行
#   ./scripts/test-parallel.sh --coverage # カバレッジ付き
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$SCRIPT_DIR"

EXTRA_ARGS="${*}"
TMPDIR=$(mktemp -d)
PIDS=()

# シャード数（デフォルト6、環境変数で変更可能）
TOTAL_SHARDS="${SHARDS:-6}"

# プロセスあたりのワーカー数（デフォルト2、環境変数で変更可能）
# 注: シャード数×ワーカー数がCPUコア数以下になるように調整すること
WORKERS_PER_SHARD="${WORKERS:-2}"

echo "=== 並列テスト実行 (${TOTAL_SHARDS} シャード, 各 ${WORKERS_PER_SHARD} ワーカー) ==="

# 各シャードを並列実行
for i in $(seq 1 "$TOTAL_SHARDS"); do
  npx jest --forceExit --shard="${i}/${TOTAL_SHARDS}" --maxWorkers="$WORKERS_PER_SHARD" $EXTRA_ARGS \
    > "$TMPDIR/shard-${i}.log" 2>&1 &
  PIDS+=($!)
done

# 全プロセスの完了を待機し、結果を集計
FAILED=0
TOTAL_SUITES=0
TOTAL_TESTS=0
PASSED_SUITES=0
FAILED_SUITES=0

for i in $(seq 1 "$TOTAL_SHARDS"); do
  idx=$((i - 1))
  pid="${PIDS[$idx]}"

  if wait "$pid"; then
    status="PASS"
  else
    status="FAIL"
    FAILED=1
  fi

  # 結果からテスト数を抽出
  suites=$(grep -oP 'Test Suites:\s+\K\d+(?= passed)' "$TMPDIR/shard-${i}.log" 2>/dev/null || echo "0")
  suite_failed=$(grep -oP 'Test Suites:\s+\K\d+(?= failed)' "$TMPDIR/shard-${i}.log" 2>/dev/null || echo "0")
  tests=$(grep -oP 'Tests:\s+\K\d+(?= passed)' "$TMPDIR/shard-${i}.log" 2>/dev/null || echo "0")
  time_taken=$(grep -oP 'Time:\s+\K[\d.]+' "$TMPDIR/shard-${i}.log" 2>/dev/null || echo "?")

  TOTAL_SUITES=$((TOTAL_SUITES + suites + suite_failed))
  TOTAL_TESTS=$((TOTAL_TESTS + tests))
  PASSED_SUITES=$((PASSED_SUITES + suites))
  FAILED_SUITES=$((FAILED_SUITES + suite_failed))

  printf "  shard %d/%d  %s  (suites: %3s, tests: %5s, time: %ss)\n" \
    "$i" "$TOTAL_SHARDS" "$status" "$((suites + suite_failed))" "$tests" "$time_taken"

  # 失敗の場合はログを表示
  if [ "$status" = "FAIL" ]; then
    echo "--- shard ${i} の失敗ログ ---"
    grep -A 5 "● " "$TMPDIR/shard-${i}.log" 2>/dev/null || tail -20 "$TMPDIR/shard-${i}.log"
    echo "---"
  fi
done

echo ""
echo "=== 集計結果 ==="
echo "Test Suites: ${PASSED_SUITES} passed, ${FAILED_SUITES} failed, ${TOTAL_SUITES} total"
echo "Tests:       ${TOTAL_TESTS} passed"

# 一時ファイルを削除
rm -rf "$TMPDIR"

exit $FAILED
