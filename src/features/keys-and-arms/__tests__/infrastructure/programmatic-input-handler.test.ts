/**
 * KEYS & ARMS — ProgrammaticInputHandler テスト
 *
 * pressAndRelease と justPressed クリアタイミングの整合性を検証する。
 */
import { createProgrammaticInputHandler, type ProgrammaticInputHandler } from '../../infrastructure/programmatic-input-handler';

describe('ProgrammaticInputHandler', () => {
  let input: ProgrammaticInputHandler;

  beforeEach(() => {
    input = createProgrammaticInputHandler();
  });

  it('初期状態ではキーが押されていない', () => {
    // Assert
    expect(input.justPressed('z')).toBe(false);
    expect(input.isAction()).toBe(false);
  });

  it('handleKeyDown でキーの jp と kd が設定される', () => {
    // Act
    input.handleKeyDown('z');

    // Assert
    expect(input.justPressed('z')).toBe(true);
    expect(input.isAction()).toBe(true);
    expect(input.kd['z']).toBe(true);
  });

  it('clearJustPressed で jp フラグがクリアされる', () => {
    // Arrange
    input.handleKeyDown('z');

    // Act
    input.clearJustPressed();

    // Assert
    expect(input.justPressed('z')).toBe(false);
    expect(input.kd['z']).toBe(true); // kd は残る
  });

  it('handleKeyUp で kd フラグがクリアされる', () => {
    // Arrange
    input.handleKeyDown('z');

    // Act
    input.handleKeyUp('z');

    // Assert
    expect(input.kd['z']).toBe(false);
    expect(input.justPressed('z')).toBe(true); // jp はまだ残る
  });

  it('pressAndRelease で jp が設定され kd はクリアされる', () => {
    // Act
    input.pressAndRelease('z');

    // Assert — jp は残り、kd はクリア済み
    expect(input.justPressed('z')).toBe(true);
    expect(input.kd['z']).toBe(false);
  });

  it('pressAndRelease 後に clearJustPressed で jp がクリアされる', () => {
    // Arrange
    input.pressAndRelease('z');
    expect(input.justPressed('z')).toBe(true);

    // Act
    input.clearJustPressed();

    // Assert
    expect(input.justPressed('z')).toBe(false);
  });

  it('pressKeys で複数キーを同時に押せる', () => {
    // Act
    input.pressKeys(['z', 'arrowup', 'arrowright']);

    // Assert
    expect(input.justPressed('z')).toBe(true);
    expect(input.justPressed('arrowup')).toBe(true);
    expect(input.justPressed('arrowright')).toBe(true);
  });

  it('kd と jp オブジェクトに直接アクセスできる', () => {
    // Act
    input.handleKeyDown('x');

    // Assert
    expect(input.kd['x']).toBe(true);
    expect(input.jp['x']).toBe(true);
  });

  describe('justPressed と clearJustPressed のタイミング整合性', () => {
    it('gameTick シミュレーションで正しくクリアされる', () => {
      // Arrange — フレーム1でキーを押す
      input.handleKeyDown('z');
      expect(input.justPressed('z')).toBe(true);

      // Act — フレーム1の終わりに clearJustPressed
      input.clearJustPressed();

      // Assert — フレーム2では jp は false だが kd は true
      expect(input.justPressed('z')).toBe(false);
      expect(input.kd['z']).toBe(true);
    });

    it('既に押下中のキーを再度 handleKeyDown しても jp は設定されない', () => {
      // Arrange — キーを押す
      input.handleKeyDown('z');
      input.clearJustPressed();

      // Act — 同じキーを再度押す（既に kd=true なので jp は設定されない）
      input.handleKeyDown('z');

      // Assert
      expect(input.justPressed('z')).toBe(false);
      expect(input.kd['z']).toBe(true);
    });

    it('キーを離してから再度押すと jp が設定される', () => {
      // Arrange
      input.handleKeyDown('z');
      input.clearJustPressed();
      input.handleKeyUp('z');

      // Act — 離してから再度押す
      input.handleKeyDown('z');

      // Assert
      expect(input.justPressed('z')).toBe(true);
    });
  });
});
