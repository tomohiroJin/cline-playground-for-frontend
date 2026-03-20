/**
 * UI 状態の atom 定義
 */
import { atom } from 'jotai';

/** ヒントモード有効フラグ */
export const hintModeEnabledAtom = atom<boolean>(false);

/** 完成オーバーレイ表示フラグ */
export const completionOverlayVisibleAtom = atom<boolean>(true);

/** 動画再生モード有効フラグ */
export const videoPlaybackEnabledAtom = atom<boolean>(false);

/** 再生する動画のURL */
export const videoUrlAtom = atom<string | null>(null);

/** ヒント使用フラグ */
export const hintUsedAtom = atom<boolean>(false);

/** デバッグモードフラグ */
export const debugModeAtom = atom<boolean>(false);

/** 空パネルクリック回数 */
export const emptyPanelClicksAtom = atom<number>(0);
