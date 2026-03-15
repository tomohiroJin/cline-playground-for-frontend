/**
 * 迷宮の残響 - AudioSettings 値オブジェクト
 *
 * オーディオ設定を表現するイミュータブルな値オブジェクト。
 */

/** オーディオ設定 */
export interface AudioSettings {
  readonly bgmVolume: number;
  readonly sfxVolume: number;
  readonly enabled: boolean;
}
