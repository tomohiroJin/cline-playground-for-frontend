/**
 * air-hockey feature 固有デザイントークン
 *
 * 既存グローバルトークン（src/styles/tokens/）の参照を優先し、
 * air-hockey 固有の意味論のみをここに集約する。
 *
 * 追加ガード:
 * - 新しい色を足す前に tokens/colors.ts / game-ui.ts を確認
 * - 新しい clamp を書く前に tokens/typography.ts の 8 段階を確認
 *
 * 独自定義は 3 項目のみ:
 *   - vs.mobileBreakpoint（他トークンに該当値なし）
 *   - anim.enter / exit / emphasis（既存 tokens にアニメーション定義なし）
 */
import { colors, typography, gameUi } from '../../../styles/tokens';

export const AH_TOKENS = {
  /** 対戦チーム色（既存 game-ui.ts の teamA/teamB を参照） */
  team: {
    a: gameUi.teamA,
    b: gameUi.teamB,
  },
  /** ラベル色（CPU / 人間の区別用） */
  label: {
    cpu: colors.textMuted,
  },
  /** VS 画面の流動タイポグラフィ（typography.ts の既存スケールを再利用） */
  vs: {
    textSize: typography.fontSize3xl,
    characterNameSize: typography.fontSizeLg,
    infoSize: typography.fontSizeBase,
    labelSize: typography.fontSizeXs,
    mobileBreakpoint: '600px',
  },
  /** アニメーション原則（enter 200ms / exit 150ms / emphasis 300ms） */
  anim: {
    enter: { duration: 200, easing: 'ease-out' },
    exit: { duration: 150, easing: 'ease-in' },
    emphasis: { duration: 300, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
  },
} as const;

export type AhAnimType = keyof typeof AH_TOKENS.anim;

/** AH_TOKENS.anim から transition 文字列を生成 */
export const animCss = (type: AhAnimType, property: string = 'all'): string => {
  const { duration, easing } = AH_TOKENS.anim[type];
  return `${property} ${duration}ms ${easing}`;
};
