/**
 * カスタム Jest マッチャー
 *
 * ゲームドメインに特化したアサーションを提供し、テストの可読性を向上させる。
 */
import type { RunState } from '../../types';
import type { PlayerState } from '../../types/player';

/** カスタムマッチャーの型拡張 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      /** プレイヤーの HP が期待値と一致することを検証する */
      toHavePlayerHp(expected: number): R;
      /** キル数が期待値と一致することを検証する */
      toHaveKills(expected: number): R;
      /** プレイヤーステートの部分一致を検証する */
      toHavePlayerState(expected: Partial<PlayerState>): R;
      /** 戦闘中（敵が存在する）であることを検証する */
      toBeBattleActive(): R;
    }
  }
}

expect.extend({
  toHavePlayerHp(received: RunState, expected: number) {
    const pass = received.hp === expected;
    return {
      pass,
      message: () =>
        pass
          ? `HP が ${expected} でないことを期待しましたが、${received.hp} でした`
          : `HP: 期待値 ${expected}, 実際 ${received.hp}`,
    };
  },

  toHaveKills(received: RunState, expected: number) {
    const pass = received.kills === expected;
    return {
      pass,
      message: () =>
        pass
          ? `キル数が ${expected} でないことを期待しましたが、${received.kills} でした`
          : `キル数: 期待値 ${expected}, 実際 ${received.kills}`,
    };
  },

  toHavePlayerState(received: RunState, expected: Partial<PlayerState>) {
    const mismatches: string[] = [];
    for (const [key, value] of Object.entries(expected)) {
      const actual = (received as unknown as Record<string, unknown>)[key];
      if (actual !== value) {
        mismatches.push(`${key}: 期待値 ${value}, 実際 ${actual}`);
      }
    }
    const pass = mismatches.length === 0;
    return {
      pass,
      message: () =>
        pass
          ? `プレイヤーステートが一致しないことを期待しましたが、全て一致しました`
          : `プレイヤーステート不一致:\n${mismatches.join('\n')}`,
    };
  },

  toBeBattleActive(received: RunState) {
    const pass = received.en !== null && received.en !== undefined;
    return {
      pass,
      message: () =>
        pass
          ? `戦闘中でないことを期待しましたが、敵が存在します: ${received.en?.n}`
          : `戦闘中であることを期待しましたが、敵が存在しません`,
    };
  },
});
