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
    /** プレイヤー自身を指す定型文（Scoreboard などのデフォルト値、v4: Codex P2 対応） */
    you: 'YOU',
  },
  /** ゲーム内表示用のプレイヤー番号（日本ゲーム慣習の "数字先" 表記） */
  player: {
    p1: '1P',
    p2: '2P',
    p3: '3P',
    p4: '4P',
  },
  /**
   * aria-label 用のアクセシブルな説明文
   * TeamSetupScreen の実装に準拠:
   *   P1: 矢印キー/マウス（固定）
   *   P2: WASD/タッチ（ゲームパッド不要、常時有効）
   *   P3: ゲームパッド1（`gamepadConnected >= 1` で有効）
   *   P4: ゲームパッド2（`gamepadConnected >= 2` で有効）
   * Codex P1-2 対応: 画面間の表記を統一
   */
  playerAria: {
    p1Human: 'プレイヤー1（矢印キー/マウス）',
    p2Human: 'プレイヤー2（WASD/タッチ）',
    p3Human: 'プレイヤー3（ゲームパッド1）',
    p4Human: 'プレイヤー4（ゲームパッド2）',
    cpu: 'CPU 操作',
  },
  game: {
    countdown: (n: number | 'GO'): string => (n === 'GO' ? 'GO!' : String(n)),
    combo: (count: number): string => `x${count} COMBO!`,
    paused: 'PAUSED',
    tapToResume: 'Tap to Resume',
    howToPlay: 'How to Play',
    feverTime: 'FEVER TIME!',
    lose: 'LOSE...',
    helpHint: "Hit the puck into the opponent's goal!",
    itemsHeader: '-- Items --',
    goalBonus: '🎉 +1 Pt!',
    goalPenalty: '😢 -1 Pt',
  },
} as const;
