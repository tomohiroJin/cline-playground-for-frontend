import { SpeedRank } from '../../constants';

/** BGM の1音符。[周波数Hz, 長さ秒]。周波数 0 は休符を表す。 */
export type BgmNote = readonly [number, number];

/** 速度ランクに対応する BGM プロファイル */
export type BgmProfile = {
  /** 演奏するノートの配列 */
  readonly notes: ReadonlyArray<BgmNote>;
  /** 1ループのインターバル（ms）。小さいほど速い。 */
  readonly interval: number;
};

/**
 * LOW ランク用 BGM プロファイル
 * 低音中心・スローテンポ。ゲーム開始直後の余裕ある雰囲気を演出する。
 */
const LOW_PROFILE: BgmProfile = {
  notes: [
    [131, 0.12], // C3
    [0, 0.13],   // 休符
    [165, 0.12], // E3
    [0, 0.13],   // 休符
    [196, 0.12], // G3
    [0, 0.13],   // 休符
    [165, 0.12], // E3
    [0, 0.13],   // 休符
  ],
  // LOW ランク: 1秒間隔でループ
  interval: 1000,
};

/**
 * MID ランク用 BGM プロファイル
 * 中音域を加えてテンポアップ。速度上昇に伴う緊張感を表現する。
 */
const MID_PROFILE: BgmProfile = {
  notes: [
    [196, 0.10], // G3
    [0, 0.08],   // 休符
    [247, 0.10], // B3
    [0, 0.08],   // 休符
    [294, 0.10], // D4
    [0, 0.08],   // 休符
    [247, 0.10], // B3
    [0, 0.06],   // 休符
    [196, 0.10], // G3
    [0, 0.08],   // 休符
    [262, 0.12], // C4（音数を増やして盛り上がり）
    [0, 0.10],   // 休符
  ],
  // MID ランク: 750ms 間隔でループ（LOW より25%速い）
  interval: 750,
};

/**
 * HIGH ランク用 BGM プロファイル
 * 高音・高速テンポ。最高速域での興奮・スリルを最大演出する。
 */
const HIGH_PROFILE: BgmProfile = {
  notes: [
    [392, 0.08], // G4（高音域スタート）
    [0, 0.05],   // 休符
    [494, 0.08], // B4
    [0, 0.05],   // 休符
    [523, 0.08], // C5
    [0, 0.05],   // 休符
    [587, 0.08], // D5
    [0, 0.05],   // 休符
    [523, 0.08], // C5
    [0, 0.05],   // 休符
    [659, 0.10], // E5（クライマックス音）
    [0, 0.04],   // 休符
    [784, 0.12], // G5（最高音でループを締める）
    [0, 0.05],   // 休符
  ],
  // HIGH ランク: 500ms 間隔でループ（LOW の半分の速さ）
  interval: 500,
};

/**
 * 速度ランクに対応する BGM プロファイルを返す。
 * 未知のランクは LOW プロファイルにフォールバックする。
 *
 * @param rank SpeedRank の値（0=LOW, 1=MID, 2=HIGH）
 * @returns 対応する BgmProfile
 */
export const selectBgmProfile = (rank: number): BgmProfile => {
  switch (rank) {
    case SpeedRank.LOW:
      return LOW_PROFILE;
    case SpeedRank.MID:
      return MID_PROFILE;
    case SpeedRank.HIGH:
      return HIGH_PROFILE;
    default:
      // 未知のランクは安全に LOW にフォールバック
      return LOW_PROFILE;
  }
};
