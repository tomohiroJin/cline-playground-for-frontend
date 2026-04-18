/**
 * air-hockey 固有デザイントークンの整合性テスト
 *
 * - 既存グローバルトークン（styles/tokens/）への参照が正しいこと
 * - 独自定義は minimum（mobileBreakpoint / anim 3 種のみ）であること
 * - animCss ヘルパが正しい CSS 文字列を返すこと
 */
import { colors, typography, gameUi } from '../../../styles/tokens';
import { AH_TOKENS, animCss } from './design-tokens';

describe('AH_TOKENS', () => {
  describe('team color', () => {
    it('teamA / teamB を既存 gameUi トークンから参照している', () => {
      expect(AH_TOKENS.team.a).toBe(gameUi.teamA);
      expect(AH_TOKENS.team.b).toBe(gameUi.teamB);
    });

    it('CSS 変数形式である（直接 #rrggbb を含まない）', () => {
      expect(AH_TOKENS.team.a).toContain('var(');
      expect(AH_TOKENS.team.b).toContain('var(');
    });
  });

  describe('label color', () => {
    it('cpu ラベル色は既存 colors.textMuted 参照', () => {
      expect(AH_TOKENS.label.cpu).toBe(colors.textMuted);
    });
  });

  describe('vs typography', () => {
    it('既存 typography.ts の fluid スケールを再利用', () => {
      expect(AH_TOKENS.vs.textSize).toBe(typography.fontSize3xl);
      expect(AH_TOKENS.vs.characterNameSize).toBe(typography.fontSizeLg);
      expect(AH_TOKENS.vs.infoSize).toBe(typography.fontSizeBase);
      expect(AH_TOKENS.vs.labelSize).toBe(typography.fontSizeXs);
    });

    it('mobileBreakpoint は独自定義（他トークンに該当なし）', () => {
      expect(AH_TOKENS.vs.mobileBreakpoint).toBe('600px');
    });
  });

  describe('animation', () => {
    it('enter / exit / emphasis の 3 種のみ定義', () => {
      expect(Object.keys(AH_TOKENS.anim).sort()).toEqual(['emphasis', 'enter', 'exit']);
    });

    it('duration は 300ms 以内（デザイン原則）', () => {
      expect(AH_TOKENS.anim.enter.duration).toBeLessThanOrEqual(300);
      expect(AH_TOKENS.anim.exit.duration).toBeLessThanOrEqual(300);
      expect(AH_TOKENS.anim.emphasis.duration).toBeLessThanOrEqual(300);
    });

    it('enter の duration > exit の duration（退出を速く）', () => {
      expect(AH_TOKENS.anim.enter.duration).toBeGreaterThan(AH_TOKENS.anim.exit.duration);
    });
  });
});

describe('animCss', () => {
  it('enter の transition 文字列を生成', () => {
    expect(animCss('enter')).toBe('all 200ms ease-out');
  });

  it('exit の transition 文字列を生成', () => {
    expect(animCss('exit')).toBe('all 150ms ease-in');
  });

  it('emphasis の transition 文字列を生成', () => {
    expect(animCss('emphasis')).toBe('all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)');
  });

  it('property を指定できる', () => {
    expect(animCss('enter', 'opacity')).toBe('opacity 200ms ease-out');
  });
});
