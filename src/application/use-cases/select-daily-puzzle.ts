import { Theme } from '../../types/puzzle';

/** デイリー出題で使う難易度プール */
export const DAILY_DIVISIONS = [3, 4, 5] as const;

/** 本日の一枚の出題内容 */
export interface DailyPuzzle {
  readonly imageId: string;
  readonly filename: string;
  readonly division: number;
}

/**
 * 日付シードから「本日の一枚」を決定的に選ぶ純粋関数。
 * 全テーマの全画像（アンロック状態は無視）をフラット化し、シードで作品と難易度を決める。
 */
export const selectDailyPuzzle = (themes: readonly Theme[], seed: number): DailyPuzzle => {
  const images = themes.flatMap(theme => theme.images);
  if (images.length === 0) {
    throw new Error('No images available for daily puzzle');
  }
  const image = images[seed % images.length];
  const division = DAILY_DIVISIONS[seed % DAILY_DIVISIONS.length];
  return { imageId: image.id, filename: image.filename, division };
};
