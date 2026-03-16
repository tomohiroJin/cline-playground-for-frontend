/**
 * エンディングアセットプロバイダー
 * domain層から分離したアセット参照を管理する
 */
import { Rating, RatingValue } from '../../types';

// エンディング画像をimportで読み込み（Webpackでバンドルされる）
import endingImageS from '../../../../assets/images/ipne_ending_s.webp';
import endingImageA from '../../../../assets/images/ipne_ending_a.webp';
import endingImageB from '../../../../assets/images/ipne_ending_b.webp';
import endingImageC from '../../../../assets/images/ipne_ending_c.webp';
import endingImageD from '../../../../assets/images/ipne_ending_d.webp';
import gameOverImage from '../../../../assets/images/ipne_game_over.webp';
import endingVideoS from '../../../../assets/videos/ipne_ending_s.mp4';

// エンディング画像パス（importでWebpackにバンドルされる）
const ENDING_IMAGES: Record<RatingValue, string> = {
  s: endingImageS,
  a: endingImageA,
  b: endingImageB,
  c: endingImageC,
  d: endingImageD,
};

// ゲームオーバー画像パス（importでWebpackにバンドルされる）
const GAME_OVER_IMAGE = gameOverImage;

/**
 * 評価に応じたエンディング画像パスを取得する
 * @param rating 評価ランク
 * @returns 画像パス
 */
export function getEndingImage(rating: RatingValue): string {
  return ENDING_IMAGES[rating];
}

/**
 * ゲームオーバー画像パスを取得する
 * @returns 画像パス
 */
export function getGameOverImage(): string {
  return GAME_OVER_IMAGE;
}

/**
 * 評価に応じたエンディング動画パスを取得する
 * Sランクのみ動画が存在し、他のランクはnullを返す
 * @param rating 評価ランク
 * @returns 動画パス（Sランク以外はnull）
 */
export function getEndingVideo(rating: RatingValue): string | null {
  if (rating === Rating.S) {
    return endingVideoS;
  }
  return null;
}
