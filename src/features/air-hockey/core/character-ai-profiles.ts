/**
 * キャラクター AI プロファイル
 * AiPlayStyle 型の定義とキャラクター別プロファイルを提供する
 */

/** 守備スタイル: パック相手陣地時のポジショニング */
export type DefenseStyle = 'center' | 'wide' | 'aggressive';

/** チーム内の役割 */
export type TeamRole = 'attacker' | 'defender' | 'balanced';

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
  /** 守備パターン: パック相手陣地時のポジション制御 */
  defenseStyle: DefenseStyle;
  /** 打ち返し角度バイアス（-1.0 ストレート 〜 1.0 バウンス） */
  deflectionBias: number;
  /** パック方向転換後のターゲット再計算遅延（ms） */
  reactionDelay: number;
  /** 2v2 でのチーム内役割 */
  teamRole: TeamRole;
};

/** デフォルトプレイスタイル（オールラウンダー・無個性） */
export const DEFAULT_PLAY_STYLE: AiPlayStyle = {
  sidePreference: 0,
  lateralOscillation: 0,
  lateralPeriod: 0,
  aggressiveness: 0.5,
  adaptability: 0,
  defenseStyle: 'center',
  deflectionBias: 0,
  reactionDelay: 100,
  teamRole: 'balanced',
};

/** DEFAULT_PLAY_STYLE をベースに差分のみ指定してプロファイルを生成 */
const createProfile = (overrides: Partial<AiPlayStyle>): AiPlayStyle => ({
  ...DEFAULT_PLAY_STYLE,
  ...overrides,
});

/** キャラクター ID → AiPlayStyle のマッピング */
export const CHARACTER_AI_PROFILES: Record<string, AiPlayStyle> = {
  /** ヒロ — 攻撃型エース: ストレートで撃ち抜く */
  hiro: createProfile({
    aggressiveness: 0.7, adaptability: 0.2,
    defenseStyle: 'aggressive', deflectionBias: -0.3, reactionDelay: 50, teamRole: 'attacker',
  }),

  /** ミサキ — テクニシャン: 壁バウンスで翻弄する */
  misaki: createProfile({
    sidePreference: 0.3, lateralOscillation: 40, lateralPeriod: 2000,
    aggressiveness: 0.5, adaptability: 0.3,
    defenseStyle: 'wide', deflectionBias: 0.5, reactionDelay: 80,
  }),

  /** タクマ — 鉄壁の守護神: ゴール前で素早く反応し直球で返す */
  takuma: createProfile({
    aggressiveness: 0.2, adaptability: 0.1,
    deflectionBias: -0.5, reactionDelay: 30, teamRole: 'defender',
  }),

  /** ユウ — アナライザー: adaptability で試合展開に適応 */
  yuu: createProfile({
    sidePreference: -0.2, lateralOscillation: 20, lateralPeriod: 3000,
    aggressiveness: 0.4, adaptability: 0.8,
    defenseStyle: 'wide', deflectionBias: 0.2, reactionDelay: 40,
  }),

  /** ルーキー — ビギナー: 反応が遅く癖がない素直な動き */
  rookie: createProfile({
    aggressiveness: 0.3, reactionDelay: 200,
  }),

  /** レギュラー — 標準レベル: バランスの良い中堅 */
  regular: createProfile({
    sidePreference: 0.1, lateralOscillation: 10, lateralPeriod: 4000,
    adaptability: 0.2, defenseStyle: 'wide', deflectionBias: 0.1,
  }),

  /** カナタ — トリックスター: 壁バウンスと揺さぶりで翻弄 */
  kanata: createProfile({
    aggressiveness: 0.4, adaptability: 0.5,
    defenseStyle: 'wide', deflectionBias: 0.6, reactionDelay: 100,
    lateralOscillation: 30, lateralPeriod: 1800,
  }),

  /** エース — 上級者: 積極的にバウンスショットを狙う */
  ace: createProfile({
    sidePreference: -0.1, lateralOscillation: 15, lateralPeriod: 2500,
    aggressiveness: 0.6, adaptability: 0.4,
    defenseStyle: 'aggressive', deflectionBias: 0.3, reactionDelay: 50, teamRole: 'attacker',
  }),
};

/**
 * キャラクター ID から AI プロファイルを取得する
 * 未知の ID の場合は DEFAULT_PLAY_STYLE を返す
 */
export const getCharacterAiProfile = (characterId: string): AiPlayStyle => {
  return CHARACTER_AI_PROFILES[characterId] ?? DEFAULT_PLAY_STYLE;
};
