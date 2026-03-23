// ============================================================================
// Deep Sea Interceptor - テストモード
// ============================================================================

/** テストモード発動のキーシーケンス（jin×3） */
export const TEST_MODE_SEQUENCE = 'jinjinjin';

/** テストモード入力チェック結果 */
interface TestModeCheckResult {
  activated: boolean;
}

/** 入力バッファからテストモード発動を判定（スライディングウィンドウ方式） */
export function checkTestModeInput(buffer: string): TestModeCheckResult {
  const len = TEST_MODE_SEQUENCE.length;
  if (buffer.length < len) {
    return { activated: false };
  }
  const tail = buffer.slice(-len);
  return { activated: tail === TEST_MODE_SEQUENCE };
}
