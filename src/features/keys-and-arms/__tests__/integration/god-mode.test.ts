/**
 * KEYS & ARMS — GOD MODE（隠しチート）の挙動テスト
 *
 * タイトル画面で "jin" と入力してからゲームを開始すると、HP が 20 で始まる。
 * 開始キー（z / space / Enter）はいずれもチート文字として扱われないため、
 * どのキーで開始しても GOD MODE が発動する。
 * （screens/title.ts: cheatBuf.endsWith('jin') → hp = 20）
 */
import { createTestEngine } from '../helpers/test-engine';

/** タイトルで文字列を1キーずつ入力する */
function typeCheat(engine: ReturnType<typeof createTestEngine>, text: string): void {
  for (const ch of text) engine.pressKeyAndTick(ch);
}

/** 指定キーで開始し、トランジションを消化する */
function startWith(engine: ReturnType<typeof createTestEngine>, key: string): void {
  engine.input.handleKeyDown(key);
  engine.gameTick();
  engine.input.handleKeyUp(key);
  while (engine.G.transition.t > 0) engine.gameTick();
}

describe('GOD MODE（隠しチート "jin"）', () => {
  it('"jin" 入力 → スペース開始で HP が 20 で始まる（発動する）', () => {
    // Arrange
    const engine = createTestEngine();
    typeCheat(engine, 'jin');
    expect(engine.G.cheatBuf).toBe('jin');

    // Act: スペース（a〜z 外）で開始 → cheatBuf は 'jin' のまま
    startWith(engine, ' ');

    // Assert
    expect(engine.G.hp).toBe(20);
    expect(engine.G.maxHp).toBe(20);
    expect(engine.G.state).toBe('cave');
    expect(engine.G.cheatBuf).toBe('');
  });

  it('"jin" 入力 → Enter 開始でも HP が 20 で始まる（発動する）', () => {
    const engine = createTestEngine();
    typeCheat(engine, 'jin');

    startWith(engine, 'Enter');

    expect(engine.G.hp).toBe(20);
    expect(engine.G.maxHp).toBe(20);
  });

  it('"jin" 入力 → z 開始でも HP が 20 で始まる（発動する）', () => {
    const engine = createTestEngine();
    typeCheat(engine, 'jin');

    startWith(engine, 'z');

    expect(engine.G.hp).toBe(20);
    expect(engine.G.maxHp).toBe(20);
  });

  it('チート未入力で開始すると HP は通常の 3 で始まる', () => {
    const engine = createTestEngine();

    engine.startGame();

    expect(engine.G.hp).toBe(3);
    expect(engine.G.maxHp).toBe(3);
  });

  it('誤った文字列（"jim"）では発動しない', () => {
    const engine = createTestEngine();
    typeCheat(engine, 'jim');

    startWith(engine, ' ');

    expect(engine.G.hp).toBe(3);
    expect(engine.G.maxHp).toBe(3);
  });
});
