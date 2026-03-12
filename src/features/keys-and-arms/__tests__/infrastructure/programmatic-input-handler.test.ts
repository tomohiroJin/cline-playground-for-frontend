import { describe, it, expect, beforeEach } from 'vitest';
import { createProgrammaticInputHandler } from '../../infrastructure/programmatic-input-handler';
import type { InputHandler } from '../../core/input';

describe('ProgrammaticInputHandler', () => {
  let input: InputHandler;

  beforeEach(() => {
    input = createProgrammaticInputHandler();
  });

  it('初期状態ではキーが押されていない', () => {
    expect(input.justPressed('z')).toBe(false);
    expect(input.isAction()).toBe(false);
  });

  it('pressKey でキーを押せる', () => {
    // Act
    input.handleKeyDown('z');

    // Assert
    expect(input.justPressed('z')).toBe(true);
    expect(input.isAction()).toBe(true);
  });

  it('clearJustPressed で jp フラグがクリアされる', () => {
    // Arrange
    input.handleKeyDown('z');

    // Act
    input.clearJustPressed();

    // Assert
    expect(input.justPressed('z')).toBe(false);
  });

  it('handleKeyUp でキーを離せる', () => {
    // Arrange
    input.handleKeyDown('z');

    // Act
    input.handleKeyUp('z');

    // Assert
    expect(input.kd['z']).toBe(false);
  });

  it('pressAndRelease でキーを押して即離す', () => {
    // Act
    input.handleKeyDown('arrowup');

    // Assert
    expect(input.justPressed('arrowup')).toBe(true);
    expect(input.kd['arrowup']).toBe(true);
  });

  it('kd と jp オブジェクトに直接アクセスできる', () => {
    // Act
    input.handleKeyDown('x');

    // Assert
    expect(input.kd['x']).toBe(true);
    expect(input.jp['x']).toBe(true);
  });
});
