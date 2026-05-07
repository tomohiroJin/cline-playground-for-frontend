/**
 * i18n-strings のテスト
 * - 全キーが存在すること
 * - 空文字のキーがないこと
 * - 各カテゴリ（common / player / playerAria / game）の必須キーを網羅
 */
import { AH_STRINGS } from './i18n-strings';

describe('AH_STRINGS', () => {
  describe('common', () => {
    const keys = ['cpu', 'vs', 'goal', 'fever', 'win', 'lose'] as const;
    it.each(keys)('common.%s が空でない文字列', (key) => {
      expect(typeof AH_STRINGS.common[key]).toBe('string');
      expect(AH_STRINGS.common[key].length).toBeGreaterThan(0);
    });
  });

  describe('player', () => {
    const keys = ['p1', 'p2', 'p3', 'p4'] as const;
    it.each(keys)('player.%s が空でない文字列', (key) => {
      expect(AH_STRINGS.player[key]).toBeDefined();
      expect(AH_STRINGS.player[key].length).toBeGreaterThan(0);
    });
  });

  describe('playerAria', () => {
    const keys = ['p1Human', 'p2Human', 'p3Human', 'p4Human', 'cpu'] as const;
    it.each(keys)('playerAria.%s が空でない文字列', (key) => {
      expect(AH_STRINGS.playerAria[key]).toBeDefined();
      expect(AH_STRINGS.playerAria[key].length).toBeGreaterThan(0);
    });
  });

  describe('game.countdown', () => {
    it('数値を文字列化', () => {
      expect(AH_STRINGS.game.countdown(3)).toBe('3');
      expect(AH_STRINGS.game.countdown(1)).toBe('1');
    });

    it("GO! は 'GO!' を返す", () => {
      expect(AH_STRINGS.game.countdown('GO')).toBe('GO!');
    });
  });

  describe('game.combo', () => {
    it('コンボ文字列を生成', () => {
      expect(AH_STRINGS.game.combo(3)).toBe('x3 COMBO!');
      expect(AH_STRINGS.game.combo(10)).toBe('x10 COMBO!');
    });
  });

  describe('game', () => {
    it('paused / tapToResume / howToPlay / feverTime が定義されている', () => {
      expect(AH_STRINGS.game.paused.length).toBeGreaterThan(0);
      expect(AH_STRINGS.game.tapToResume.length).toBeGreaterThan(0);
      expect(AH_STRINGS.game.howToPlay.length).toBeGreaterThan(0);
      expect(AH_STRINGS.game.feverTime.length).toBeGreaterThan(0);
    });
  });

  it('全カテゴリが存在', () => {
    expect(AH_STRINGS).toHaveProperty('common');
    expect(AH_STRINGS).toHaveProperty('player');
    expect(AH_STRINGS).toHaveProperty('playerAria');
    expect(AH_STRINGS).toHaveProperty('game');
  });
});
