/**
 * Canvas 2D コンテキスト用のフォント指定を一元化
 *
 * DOM 側の --font-family-body（Inter + Noto Sans JP）と揃え、
 * 絵文字の OS 間差も吸収する。
 */

/**
 * DOM 本文と統一する汎用フォントスタック
 * renderer.ts のスケール対応（`${Math.round(N*s)}px`）用に export する
 */
export const FONT_STACK_BODY =
  `'Inter', 'Noto Sans JP', system-ui, -apple-system, 'Segoe UI', 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif`;

/** DOM 見出しと統一するフォントスタック（Orbitron） */
export const FONT_STACK_HEADING =
  `'Orbitron', 'Inter', 'Noto Sans JP', system-ui, 'Segoe UI', 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif`;

export const CANVAS_FONTS = {
  /** カウントダウン数字（3/2/1） */
  countdownNumber: `bold 80px ${FONT_STACK_HEADING}`,
  /** カウントダウン GO! */
  countdownGo: `bold 90px ${FONT_STACK_HEADING}`,
  /** ポーズ PAUSED 見出し */
  pauseTitle: `bold 48px ${FONT_STACK_HEADING}`,
  /** ポーズ本文 */
  pauseBody: `bold 20px ${FONT_STACK_BODY}`,
  pauseHint: `16px ${FONT_STACK_BODY}`,
  /** ヘルプ画面 */
  helpTitle: `bold 18px ${FONT_STACK_BODY}`,
  helpSubtitle: `12px ${FONT_STACK_BODY}`,
  helpSectionTitle: `bold 14px ${FONT_STACK_BODY}`,
  helpItem: `bold 13px ${FONT_STACK_BODY}`,
  helpItemDesc: `11px ${FONT_STACK_BODY}`,
  /** HUD */
  hudStatus: `bold 12px ${FONT_STACK_BODY}`,
  /** コンボ（scale で動的サイズ） */
  combo: (scale: number): string =>
    `bold ${Math.floor(28 * scale)}px ${FONT_STACK_HEADING}`,
  /** ゲームパッドトースト */
  toast: `bold 14px ${FONT_STACK_BODY}`,
  /** PerfProbe 等デバッグオーバーレイ（等幅モノスペース） */
  debugInfo: `11px 'JetBrains Mono', 'Fira Code', monospace`,
} as const;
