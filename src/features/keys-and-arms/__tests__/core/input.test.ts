import { describe, it, expect } from 'vitest';
import { createInputHandler } from '../../core/input';

describe('InputHandler', () => {
  describe('handleKeyDown', () => {
    it('キーを押すと kd と jp が true になる', () => {
      // Arrange
      const input = createInputHandler();

      // Act
      input.handleKeyDown('z');

      // Assert
      expect(input.kd['z']).toBe(true);
      expect(input.jp['z']).toBe(true);
    });

    it('大文字キーは小文字に正規化される', () => {
      // Arrange
      const input = createInputHandler();

      // Act
      input.handleKeyDown('Z');

      // Assert
      expect(input.kd['z']).toBe(true);
      expect(input.jp['z']).toBe(true);
    });

    it('連続押下では jp は再設定されない', () => {
      // Arrange
      const input = createInputHandler();
      input.handleKeyDown('z');
      input.clearJustPressed();

      // Act
      input.handleKeyDown('z');

      // Assert
      expect(input.kd['z']).toBe(true);
      expect(input.jp['z']).toBeUndefined();
    });
  });

  describe('handleKeyUp', () => {
    it('キーを離すと kd が false になる', () => {
      // Arrange
      const input = createInputHandler();
      input.handleKeyDown('z');

      // Act
      input.handleKeyUp('z');

      // Assert
      expect(input.kd['z']).toBe(false);
    });
  });

  describe('justPressed', () => {
    it('押されたキーに対して true を返す', () => {
      // Arrange
      const input = createInputHandler();
      input.handleKeyDown('z');

      // Act & Assert
      expect(input.justPressed('z')).toBe(true);
    });

    it('押されていないキーに対して false を返す', () => {
      // Arrange
      const input = createInputHandler();

      // Act & Assert
      expect(input.justPressed('z')).toBeFalsy();
    });
  });

  describe('clearJustPressed', () => {
    it('全ての jp フラグをクリアする', () => {
      // Arrange
      const input = createInputHandler();
      input.handleKeyDown('z');
      input.handleKeyDown('x');

      // Act
      input.clearJustPressed();

      // Assert
      expect(input.justPressed('z')).toBeFalsy();
      expect(input.justPressed('x')).toBeFalsy();
    });
  });

  describe('isAction', () => {
    it('z キーでアクションが true になる', () => {
      // Arrange
      const input = createInputHandler();
      input.handleKeyDown('z');

      // Act & Assert
      expect(input.isAction()).toBe(true);
    });

    it('スペースキーでアクションが true になる', () => {
      // Arrange
      const input = createInputHandler();
      input.handleKeyDown(' ');

      // Act & Assert
      expect(input.isAction()).toBe(true);
    });

    it('他のキーではアクションが false になる', () => {
      // Arrange
      const input = createInputHandler();
      input.handleKeyDown('x');

      // Act & Assert
      expect(input.isAction()).toBeFalsy();
    });
  });
});
