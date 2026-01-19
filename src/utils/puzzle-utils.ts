/**
 * 画像をロードしてサイズを取得する
 *
 * @param url 画像のURL
 * @returns 画像のサイズ（幅と高さ）を含むPromise
 */
export const getImageSize = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error('画像の読み込みに失敗しました'));
    };
    img.src = url;
  });
};

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

/**
 * ファイルのサイズをチェックする
 *
 * @param file ファイル
 * @param maxSizeInMB 最大サイズ（MB）
 * @returns サイズが制限内ならtrue、そうでなければfalse
 */
export const checkFileSize = (file: File, maxSizeInMB: number): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
};
