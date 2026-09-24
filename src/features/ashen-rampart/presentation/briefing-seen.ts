/**
 * 灰燼の城壁 - ブリーフィング既読フラグ（反復7 段階1）
 *
 * 2回目以降のブリーフィング（StartOverlay）をスキップするための既読フラグ。
 * 元は AshenRampartGame.tsx に置いていたが、ExpeditionView からも参照するため
 * 独立したモジュールへ移した。
 */
const BRIEFING_SEEN_KEY = 'ashen-rampart:briefing-seen-v1';

export const readBriefingSeen = (): boolean => {
  try {
    return localStorage.getItem(BRIEFING_SEEN_KEY) === '1';
  } catch (e) {
    console.error('ブリーフィング既読フラグの読み込みに失敗しました', e);
    return false;
  }
};

export const markBriefingSeen = (): void => {
  try {
    localStorage.setItem(BRIEFING_SEEN_KEY, '1');
  } catch (e) {
    console.error('ブリーフィング既読フラグの保存に失敗しました', e);
  }
};
