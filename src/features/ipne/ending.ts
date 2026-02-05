/**
 * IPNE エンディング分岐システム
 *
 * クリアタイムに基づく5段階評価（S/A/B/C/D）と
 * 各評価に応じたエピローグテキスト・色を提供する
 */

import { Rating, RatingValue, EpilogueText } from './types';

// エンディング画像をimportで読み込み（Webpackでバンドルされる）
import endingImageS from '../../assets/images/ipne_ending_s.webp';
import endingImageA from '../../assets/images/ipne_ending_a.webp';
import endingImageB from '../../assets/images/ipne_ending_b.webp';
import endingImageC from '../../assets/images/ipne_ending_c.webp';
import endingImageD from '../../assets/images/ipne_ending_d.webp';
import gameOverImage from '../../assets/images/ipne_game_over.webp';
import endingVideoS from '../../assets/videos/ipne_ending_s.mp4';

// 評価閾値（ミリ秒）
export const RATING_THRESHOLDS = {
  S: 120000,  // 2分
  A: 180000,  // 3分
  B: 300000,  // 5分
  C: 480000,  // 8分
} as const;

// 評価色
export const RATING_COLORS = {
  s: '#fbbf24', // 金色
  a: '#94a3b8', // 銀色
  b: '#b45309', // 銅色
  c: '#3b82f6', // 青色
  d: '#6b7280', // 灰色
} as const;

// エピローグテキスト定義
const EPILOGUE_TEXTS: Record<RatingValue, EpilogueText> = {
  s: {
    title: '伝説の英雄',
    text: '驚異的な速さで迷宮を踏破した。その名は永遠に語り継がれるだろう。',
  },
  a: {
    title: '熟練の冒険者',
    text: '見事な実力を発揮し、迷宮を制覇した。さらなる高みを目指せるはずだ。',
  },
  b: {
    title: '確かな実力',
    text: '着実に迷宮を攻略した。経験を積めば、より速くクリアできるだろう。',
  },
  c: {
    title: '生還者',
    text: '困難な迷宮から無事に脱出した。この経験は次の冒険に活きるはずだ。',
  },
  d: {
    title: '生存の証',
    text: '長い戦いの末、ようやく迷宮から抜け出した。生きて帰れたことが何よりの成果だ。',
  },
};

// ゲームオーバーテキスト
const GAME_OVER_TEXT: EpilogueText = {
  title: '冒険の終わり',
  text: '迷宮の闇に飲み込まれた。だが、これで終わりではない。再び挑戦しよう。',
};

/**
 * クリアタイムから評価を計算する
 * @param timeMs クリアタイム（ミリ秒）
 * @returns 評価ランク
 */
export function calculateRating(timeMs: number): RatingValue {
  if (timeMs <= RATING_THRESHOLDS.S) {
    return Rating.S;
  }
  if (timeMs <= RATING_THRESHOLDS.A) {
    return Rating.A;
  }
  if (timeMs <= RATING_THRESHOLDS.B) {
    return Rating.B;
  }
  if (timeMs <= RATING_THRESHOLDS.C) {
    return Rating.C;
  }
  return Rating.D;
}

/**
 * 評価に応じたエピローグテキストを取得する
 * @param rating 評価ランク
 * @returns エピローグテキスト（タイトルと本文）
 */
export function getEpilogueText(rating: RatingValue): EpilogueText {
  return EPILOGUE_TEXTS[rating];
}

/**
 * ゲームオーバー時のテキストを取得する
 * @returns ゲームオーバーテキスト（タイトルと本文）
 */
export function getGameOverText(): EpilogueText {
  return GAME_OVER_TEXT;
}

/**
 * 評価に応じた色コードを取得する
 * @param rating 評価ランク
 * @returns 色コード（16進数）
 */
export function getRatingColor(rating: RatingValue): string {
  return RATING_COLORS[rating];
}

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
