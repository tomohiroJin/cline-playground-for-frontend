/**
 * Canvas / UI で使用する日本語表示文字列の一元管理
 *
 * 目的:
 * - Canvas 内テキスト・DOM ラベルのハードコードを排除
 * - 将来的な多言語対応（Jotai atom + locale 切り替え）に備えた構造
 *
 * 現時点では日本語のみ。実翻訳は別フェーズ。
 */

export const AH_STRINGS = {
  common: {
    cpu: 'CPU',
    vs: 'VS',
    goal: 'GOAL!',
    fever: 'FEVER!',
    win: '勝利',
    lose: '敗北',
  },
  /** ゲーム内表示用のプレイヤー番号（日本ゲーム慣習の "数字先" 表記） */
  player: {
    p1: '1P',
    p2: '2P',
    p3: '3P',
    p4: '4P',
  },
  /** aria-label 用のアクセシブルな説明文 */
  playerAria: {
    p1Human: 'プレイヤー1（キーボード/マウス）',
    p2Human: 'プレイヤー2（WASD/ゲームパッド1）',
    p3Human: 'プレイヤー3（ゲームパッド2）',
    p4Human: 'プレイヤー4（ゲームパッド3）',
    cpu: 'CPU 操作',
  },
  game: {
    countdown: (n: number | 'GO'): string => (n === 'GO' ? 'GO!' : String(n)),
    combo: (count: number): string => `x${count} COMBO!`,
    paused: 'PAUSED',
    tapToResume: 'Tap to Resume',
    howToPlay: 'How to Play',
    feverTime: 'FEVER TIME!',
  },
} as const;
