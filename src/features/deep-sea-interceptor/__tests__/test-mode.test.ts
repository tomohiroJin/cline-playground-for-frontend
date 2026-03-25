// ============================================================================
// テストモードのテスト
// ============================================================================

import { checkTestModeInput, TEST_MODE_SEQUENCE } from '../test-mode';

describe('テストモード入力検知', () => {
  describe('checkTestModeInput', () => {
    it('「jinjinjin」の入力でテストモードが発動する', () => {
      let buffer = '';
      const sequence = 'jinjinjin';
      for (const char of sequence) {
        const result = checkTestModeInput(buffer + char);
        buffer += char;
        if (result.activated) {
          expect(result.activated).toBe(true);
          return;
        }
      }
      // 最後の文字でactivatedになっているはず
      expect(checkTestModeInput(buffer).activated).toBe(true);
    });

    it('不完全な入力ではテストモードが発動しない', () => {
      expect(checkTestModeInput('jin').activated).toBe(false);
      expect(checkTestModeInput('jinjin').activated).toBe(false);
      expect(checkTestModeInput('jinjinj').activated).toBe(false);
      expect(checkTestModeInput('jinjinji').activated).toBe(false);
    });

    it('無関係な入力ではテストモードが発動しない', () => {
      expect(checkTestModeInput('abcdefghi').activated).toBe(false);
      expect(checkTestModeInput('jjjjjjjjj').activated).toBe(false);
    });

    it('途中に余計な文字が入っても、末尾9文字が一致すれば発動する', () => {
      // スライディングウィンドウ方式
      expect(checkTestModeInput('xxxjinjinjin').activated).toBe(true);
    });

    it('シーケンス定数が正しい', () => {
      expect(TEST_MODE_SEQUENCE).toBe('jinjinjin');
    });
  });
});
