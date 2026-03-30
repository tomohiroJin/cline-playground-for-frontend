/**
 * キャラクター AI プロファイル
 * AiPlayStyle 型の定義とキャラクター別プロファイルを提供する
 */

/** CPU AI のプレイスタイル（キャラクター個性）を制御するパラメータ */
export type AiPlayStyle = {
  /** 横方向のターゲットオフセット傾向（-1.0 左寄せ 〜 0 中央 〜 1.0 右寄せ） */
  sidePreference: number;
  /** ターゲット位置の横ブレの振幅（px）— 揺さぶり */
  lateralOscillation: number;
  /** ターゲット位置の横ブレの周期（ms） */
  lateralPeriod: number;
  /** 前後のポジショニング（0: 守備的 〜 1: 攻撃的） */
  aggressiveness: number;
  /** スコア差に応じた適応度（0: 適応なし 〜 1: 高適応） */
  adaptability: number;
};

/** デフォルトプレイスタイル（オールラウンダー・無個性） */
export const DEFAULT_PLAY_STYLE: AiPlayStyle = {
  sidePreference: 0,
  lateralOscillation: 0,
  lateralPeriod: 0,
  aggressiveness: 0.5,
  adaptability: 0,
};

/** キャラクター ID → AiPlayStyle のマッピング */
export const CHARACTER_AI_PROFILES: Record<string, AiPlayStyle> = {
  /** ヒロ — ストレートシューター: 直線的でシンプルな動き */
  hiro: {
    sidePreference: 0,
    lateralOscillation: 0,   // 揺さぶりなし
    lateralPeriod: 0,
    aggressiveness: 0.7,     // 前に出る
    adaptability: 0.2,       // 低適応
  },

  /** ミサキ — テクニシャン: やや右寄りで角度をつける */
  misaki: {
    sidePreference: 0.3,
    lateralOscillation: 40,  // 大きな揺さぶり
    lateralPeriod: 2000,     // 2秒周期
    aggressiveness: 0.5,     // 中間ポジション
    adaptability: 0.3,       // 中低適応
  },

  /** タクマ — パワーバウンサー: ゴール前に構える守備重視 */
  takuma: {
    sidePreference: 0,
    lateralOscillation: 0,   // 揺さぶりなし
    lateralPeriod: 0,
    aggressiveness: 0.2,     // 守備的
    adaptability: 0.1,       // 低適応
  },

  /** ユウ — アナライザー: やや左寄りで分析的に対応 */
  yuu: {
    sidePreference: -0.2,
    lateralOscillation: 20,  // 控えめな揺さぶり
    lateralPeriod: 3000,     // 3秒周期
    aggressiveness: 0.4,     // やや守備的
    adaptability: 0.8,       // 高適応
  },

  /** ルーキー — ビギナー: 動きが遅く反応が鈍い */
  rookie: {
    sidePreference: 0,
    lateralOscillation: 0,
    lateralPeriod: 0,
    aggressiveness: 0.3,     // 消極的
    adaptability: 0,         // 適応なし
  },

  /** レギュラー — オールラウンダー: わずかに右寄り */
  regular: {
    sidePreference: 0.1,
    lateralOscillation: 10,  // わずかな揺さぶり
    lateralPeriod: 4000,     // ゆっくり
    aggressiveness: 0.5,     // バランス型
    adaptability: 0.2,       // 低適応
  },

  /** エース — エリート: わずかに左寄りで攻撃的 */
  ace: {
    sidePreference: -0.1,
    lateralOscillation: 15,  // 控えめだが正確な揺さぶり
    lateralPeriod: 2500,     // 中速
    aggressiveness: 0.6,     // やや攻撃的
    adaptability: 0.4,       // 中適応
  },
};

/**
 * キャラクター ID から AI プロファイルを取得する
 * 未知の ID の場合は DEFAULT_PLAY_STYLE を返す
 */
export const getCharacterAiProfile = (characterId: string): AiPlayStyle => {
  return CHARACTER_AI_PROFILES[characterId] ?? DEFAULT_PLAY_STYLE;
};
