/**
 * KEYS & ARMS — GOD MODE（隠しチート）の挙動ドキュメント兼回帰テスト
 *
 * タイトル画面で "jin" と入力してからゲームを開始すると、
 * HP が通常の 3 ではなく 20 で始まる隠しコマンド。
 * （screens/title.ts: cheatBuf.endsWith('jin') → hp = 20）
 *
 * 【既知の問題】開始キー 'z' は engine.ts の title 節にある
 * チート蓄積ループ（a〜z）に含まれるため、'z' で開始すると同じティックで
 * cheatBuf が 'jin' → 'jinz' になり GOD MODE が発動しない。
 * スペース / Enter で開始すれば発動する。詳細は README.md「既知の問題」を参照。
 *
 * このテストは現状の挙動を実行可能な形で固定し、将来の回帰／修正を検知する。
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

  it('【既知の問題】"jin" 入力 → z 開始では発動しない（cheatBuf が "jinz" になるため）', () => {
    // 開始キー 'z' が a〜z 蓄積ループに混入する既存バグの固定。
    // 修正された場合はこのテストが落ちるので、その時点で期待値を 20 に更新する。
    const engine = createTestEngine();
    typeCheat(engine, 'jin');

    startWith(engine, 'z');

    expect(engine.G.hp).toBe(3);
    expect(engine.G.maxHp).toBe(3);
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
