/**
 * 画像関連ユーティリティ
 */

/**
 * 画像URLから画像名を抽出する
 *
 * @param imageUrl 画像のURL
 * @returns 拡張子を除いたファイル名
 */
export const extractImageName = (imageUrl: string): string => {
  if (!imageUrl) return 'Unknown';

  const parts = imageUrl.split('/');
  const filename = parts[parts.length - 1];
  const name = filename.split('.')[0];

  return name;
};
