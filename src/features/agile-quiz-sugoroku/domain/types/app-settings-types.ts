/**
 * アプリ設定に関するドメイン型定義
 */

/** アプリ全体の設定 */
export interface AppSettings {
  /** 効果音・BGM を再生するか */
  soundEnabled: boolean;
}

/** 設定のデフォルト値 */
export const DEFAULT_APP_SETTINGS: AppSettings = {
  soundEnabled: true,
};
