/**
 * ゲームUI セマンティックカラー定義
 *
 * ゲーム共通のセマンティックカラーを統一定義:
 * - 赤 = 危険・ダメージ
 * - 青/ティール = 情報・ナビゲーション
 * - 緑 = 回復・安全
 * - 金 = 実績・レアリティ
 * - オレンジ = エネルギー・パワー
 * - 紫 = 神秘的・隠し要素
 *
 * HSBカラーシステムで状態バリエーションを生成:
 * - hover: 明度 +10
 * - active: 彩度 +10, 明度 -10
 * - disabled: 彩度 -60, 明度 -20
 */

/** ゲームUI CSS変数（テーマ共通） */
export const gameUiVariables = `
  /* 危険・ダメージ */
  --game-danger: #FF6B6B;
  --game-danger-hover: #FF8585;
  --game-danger-active: #E05555;
  --game-danger-disabled: #8C6666;

  /* 情報・ナビゲーション */
  --game-info: #4ECDC4;
  --game-info-hover: #66D6CF;
  --game-info-active: #3BB5AD;
  --game-info-disabled: #7A9E9B;

  /* 回復・安全 */
  --game-heal: #00FF88;
  --game-heal-hover: #33FF9F;
  --game-heal-active: #00E077;
  --game-heal-disabled: #669977;

  /* 実績・レアリティ */
  --game-achievement: #FFD700;
  --game-achievement-hover: #FFE033;
  --game-achievement-active: #E0BD00;
  --game-achievement-disabled: #8C8566;

  /* エネルギー・パワー */
  --game-energy: #FF6B35;
  --game-energy-hover: #FF8555;
  --game-energy-active: #E0562A;
  --game-energy-disabled: #8C6655;

  /* 神秘的・隠し要素 */
  --game-mystery: #9B59B6;
  --game-mystery-hover: #AF72C5;
  --game-mystery-active: #8748A0;
  --game-mystery-disabled: #7A6680;

  /* 対戦チーム（2v2 / 2P モードのチーム色、対戦視認性を優先しダーク/ライト共通） */
  --game-team-a: #3498DB;
  --game-team-b: #E74C3C;
`;

/** styled-components 内でタイポ防止に使う TypeScript 定数 */
export const gameUi = {
  danger: 'var(--game-danger)',
  dangerHover: 'var(--game-danger-hover)',
  dangerActive: 'var(--game-danger-active)',
  dangerDisabled: 'var(--game-danger-disabled)',
  info: 'var(--game-info)',
  infoHover: 'var(--game-info-hover)',
  infoActive: 'var(--game-info-active)',
  infoDisabled: 'var(--game-info-disabled)',
  heal: 'var(--game-heal)',
  healHover: 'var(--game-heal-hover)',
  healActive: 'var(--game-heal-active)',
  healDisabled: 'var(--game-heal-disabled)',
  achievement: 'var(--game-achievement)',
  achievementHover: 'var(--game-achievement-hover)',
  achievementActive: 'var(--game-achievement-active)',
  achievementDisabled: 'var(--game-achievement-disabled)',
  energy: 'var(--game-energy)',
  energyHover: 'var(--game-energy-hover)',
  energyActive: 'var(--game-energy-active)',
  energyDisabled: 'var(--game-energy-disabled)',
  mystery: 'var(--game-mystery)',
  mysteryHover: 'var(--game-mystery-hover)',
  mysteryActive: 'var(--game-mystery-active)',
  mysteryDisabled: 'var(--game-mystery-disabled)',
  teamA: 'var(--game-team-a)',
  teamB: 'var(--game-team-b)',
} as const;
