/**
 * 計測ログをクリップボードへコピーする
 *
 * Clipboard API が使えない環境（対応ブラウザ外・権限拒否）では例外を握り潰さず、
 * コンソールへ出力してユーザーに手動コピーの手段を残す（記録が失われて終わる事態を避ける）。
 */
export const copyLogToClipboard = async (json: string): Promise<boolean> => {
  try {
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
      throw new Error('Clipboard API が利用できません');
    }
    await navigator.clipboard.writeText(json);
    return true;
  } catch (e) {
    console.error('計測ログのクリップボードコピーに失敗しました', e);
    console.log(json);
    return false;
  }
};
