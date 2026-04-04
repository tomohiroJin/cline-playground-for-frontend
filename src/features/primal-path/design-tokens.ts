/**
 * 原始進化録 - デザイントークン定義
 *
 * CSS 変数として注入するフォントサイズ・スペーシング・カラー・ゲームサイズの定義。
 * 全デバイスでフォント最小 11px を保証する。
 */

const fontSize = {
  title: 'clamp(22px, 4vw, 28px)',
  subtitle: 'clamp(15px, 2.5vw, 18px)',
  button: '15px',
  body: '14px',
  panel: '13px',
  small: '12px',
  tiny: '11px',
} as const;

const fontSizeMobile = {
  button: '13px',
  body: '13px',
  panel: '12px',
  small: '11px',
  tiny: '11px',
} as const;

const spacing = {
  screenPad: '14px 20px',
  sectionGap: '14px',
  cardPad: '12px',
  btnPad: '10px 22px',
} as const;

const spacingMobile = {
  screenPad: '10px 14px',
  sectionGap: '10px',
  cardPad: '8px',
  btnPad: '8px 18px',
} as const;

const colors = {
  /* 基本 UI カラー */
  accent: '#f0c040',
  text: '#e0d8c8',
  textMuted: '#908870',
  textDim: '#605848',
  bg: '#12121e',
  bgDeep: '#0a0a12',
  border: '#2a2a3e',
  borderInner: '#262636',

  /* 文明タイプカラー */
  civTech: '#f08050',
  civLife: '#50e090',
  civRit: '#d060ff',
  civBal: '#e0c060',

  /* カテゴリカラー */
  catAtk: '#f08050',
  catHp: '#50e090',
  catDef: '#50c8e8',
  catCrit: '#f0c040',

  /* 機能カラー（ゲーム色彩心理） */
  danger: '#f05050',
  safe: '#50e090',
  info: '#50c8e8',
  reward: '#f0c040',
} as const;

const gameSize = {
  width: '720px',
  height: '960px',
} as const;

/** PC デフォルトの CSS 変数文字列を生成 */
function generateCssVariables(): string {
  return [
    `--fs-title: ${fontSize.title}`,
    `--fs-subtitle: ${fontSize.subtitle}`,
    `--fs-button: ${fontSize.button}`,
    `--fs-body: ${fontSize.body}`,
    `--fs-panel: ${fontSize.panel}`,
    `--fs-small: ${fontSize.small}`,
    `--fs-tiny: ${fontSize.tiny}`,
    `--sp-screen-pad: ${spacing.screenPad}`,
    `--sp-section-gap: ${spacing.sectionGap}`,
    `--sp-card-pad: ${spacing.cardPad}`,
    `--sp-btn-pad: ${spacing.btnPad}`,
    `--c-accent: ${colors.accent}`,
    `--c-text: ${colors.text}`,
    `--c-text-muted: ${colors.textMuted}`,
    `--c-text-dim: ${colors.textDim}`,
    `--c-bg: ${colors.bg}`,
    `--c-bg-deep: ${colors.bgDeep}`,
    `--c-border: ${colors.border}`,
    `--c-border-inner: ${colors.borderInner}`,
    `--c-civ-tech: ${colors.civTech}`,
    `--c-civ-life: ${colors.civLife}`,
    `--c-civ-rit: ${colors.civRit}`,
    `--c-civ-bal: ${colors.civBal}`,
    `--c-cat-atk: ${colors.catAtk}`,
    `--c-cat-hp: ${colors.catHp}`,
    `--c-cat-def: ${colors.catDef}`,
    `--c-cat-crit: ${colors.catCrit}`,
    `--c-danger: ${colors.danger}`,
    `--c-safe: ${colors.safe}`,
    `--c-info: ${colors.info}`,
    `--c-reward: ${colors.reward}`,
    `--game-width: ${gameSize.width}`,
    `--game-height: ${gameSize.height}`,
  ].join(';\n') + ';';
}

/** モバイル用 CSS 変数文字列を生成（上書き分のみ） */
function generateMobileCssVariables(): string {
  return [
    `--fs-button: ${fontSizeMobile.button}`,
    `--fs-body: ${fontSizeMobile.body}`,
    `--fs-panel: ${fontSizeMobile.panel}`,
    `--fs-small: ${fontSizeMobile.small}`,
    `--fs-tiny: ${fontSizeMobile.tiny}`,
    `--sp-screen-pad: ${spacingMobile.screenPad}`,
    `--sp-section-gap: ${spacingMobile.sectionGap}`,
    `--sp-card-pad: ${spacingMobile.cardPad}`,
    `--sp-btn-pad: ${spacingMobile.btnPad}`,
    `--game-width: 100vw`,
    `--game-height: 100vh`,
  ].join(';\n') + ';';
}

export const DESIGN_TOKENS = {
  fontSize,
  fontSizeMobile,
  spacing,
  spacingMobile,
  colors,
  gameSize,
  generateCssVariables,
  generateMobileCssVariables,
} as const;
