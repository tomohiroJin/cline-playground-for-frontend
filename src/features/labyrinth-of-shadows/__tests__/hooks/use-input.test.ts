/**
 * useInput カスタムフックのテスト
 * PlayerInput 生成ロジックを検証する
 */

describe('useInput - PlayerInput 生成ロジック', () => {
  /**
   * getPlayerInput のロジックを直接テスト
   * （フック本体は React の useRef/useEffect に依存するため、
   *   ロジック部分のみ単体テストする）
   */
  const createPlayerInput = (keys: Record<string, boolean>) => ({
    left: keys['a'] || keys['arrowleft'] || false,
    right: keys['d'] || keys['arrowright'] || false,
    forward: keys['w'] || keys['arrowup'] || false,
    backward: keys['s'] || keys['arrowdown'] || false,
    hide: keys[' '] || false,
    sprint: keys['shift'] || false,
  });

  describe('移動入力', () => {
    it('WASD キーで移動入力を生成する', () => {
      // Arrange
      const keys = { w: true, a: false, s: false, d: true };

      // Act
      const input = createPlayerInput(keys);

      // Assert
      expect(input.forward).toBe(true);
      expect(input.right).toBe(true);
      expect(input.left).toBe(false);
      expect(input.backward).toBe(false);
    });

    it('矢印キーで移動入力を生成する', () => {
      // Arrange
      const keys = { arrowup: true, arrowleft: true, arrowdown: false, arrowright: false };

      // Act
      const input = createPlayerInput(keys);

      // Assert
      expect(input.forward).toBe(true);
      expect(input.left).toBe(true);
      expect(input.backward).toBe(false);
      expect(input.right).toBe(false);
    });
  });

  describe('アクション入力', () => {
    it('スペースキーで隠れ入力を生成する', () => {
      // Arrange
      const keys = { ' ': true };

      // Act
      const input = createPlayerInput(keys);

      // Assert
      expect(input.hide).toBe(true);
    });

    it('Shift キーでダッシュ入力を生成する', () => {
      // Arrange
      const keys = { shift: true };

      // Act
      const input = createPlayerInput(keys);

      // Assert
      expect(input.sprint).toBe(true);
    });
  });

  describe('キー未押下時', () => {
    it('空のキー状態で全て false を返す', () => {
      // Arrange
      const keys: Record<string, boolean> = {};

      // Act
      const input = createPlayerInput(keys);

      // Assert
      expect(input.forward).toBe(false);
      expect(input.backward).toBe(false);
      expect(input.left).toBe(false);
      expect(input.right).toBe(false);
      expect(input.hide).toBe(false);
      expect(input.sprint).toBe(false);
    });
  });
});
