/**
 * UI 状態の atom 定義
 */
import { atom } from 'jotai';

/** ヒントモード有効フラグ */
export const hintModeEnabledAtom = atom<boolean>(false);

/** 完成オーバーレイ表示フラグ */
export const overlayVisibleAtom = atom<boolean>(true);

/** 動画再生状態 */
export const videoPlaybackAtom = atom<{ enabled: boolean; url: string | null }>({
  enabled: false,
  url: null,
});

/** ヒント使用フラグ */
export const hintUsedAtom = atom<boolean>(false);

/** デバッグモードフラグ */
export const debugModeAtom = atom<boolean>(false);

/** 空パネルクリック回数 */
export const emptyPanelClicksAtom = atom<number>(0);
