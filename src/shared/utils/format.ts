/**
 * 経過時間をフォーマットする（mm:ss形式）
 *
 * @param seconds 経過秒数
 * @returns フォーマットされた時間文字列
 */
export const formatElapsedTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};
