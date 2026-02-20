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

// 評価閾値（ミリ秒）— 5ステージ合計基準
export const RATING_THRESHOLDS = {
  S: 600000,   // 10分
  A: 900000,   // 15分
  B: 1500000,  // 25分
  C: 2400000,  // 40分
} as const;

// 評価色
export const RATING_COLORS = {
  s: '#fbbf24', // 金色
  a: '#94a3b8', // 銀色
  b: '#b45309', // 銅色
  c: '#3b82f6', // 青色
  d: '#6b7280', // 灰色
} as const;

// エピローグテキスト定義 — 5ステージ用
const EPILOGUE_TEXTS: Record<RatingValue, EpilogueText> = {
  s: {
    title: '伝説の調査記録',
    text: '全5層を驚異的な速さで踏破した。この調査記録は、後の探索者たちの指針となるだろう。',
    paragraphs: [
      '全5層の核を、想定外の速さで無力化した。',
      '記録装置が捉えたデータは膨大にして精緻。構造体の挙動パターン、反応体の行動原理、核の停止シーケンス――すべてが克明に記録されている。',
      'この調査記録は即座に最高機密に分類され、後の探索作戦の根幹を成す指針となった。',
      '報告書の結語にはこう記されている。「調査員の判断速度と適応力は、人類の対構造体戦術を一世代進めた」と。',
    ],
  },
  a: {
    title: '優秀な調査報告',
    text: '確かな実力で全層を制覇した。解析班からも高い評価が寄せられている。',
    paragraphs: [
      '確かな実力をもって、全5層を着実に制覇した。',
      '各層での核停止は的確で、無駄のない経路選択が記録に残されている。',
      '解析班からは『極めて信頼性の高いデータ』との評価が寄せられ、次期調査計画の重要な基盤資料となった。',
    ],
  },
  b: {
    title: '堅実な踏破記録',
    text: '着実に5つの層を攻略した。得られたデータは今後の調査に大きく貢献する。',
    paragraphs: [
      '決して速くはなかったが、5つの層を着実に攻略した。',
      '取得されたデータは十分な精度を有し、構造体の基本的な挙動パターンの解明に大きく貢献した。',
      '今後の調査に向けた貴重な一歩として、記録に刻まれている。',
    ],
  },
  c: {
    title: '生還報告',
    text: '幾度も危機を乗り越え、全層を踏破した。何より、生きて帰れたことが最大の成果だ。',
    paragraphs: [
      '調査は困難を極めた。何度も撤退を考え、それでも前に進んだ。',
      '記録装置のデータは一部欠損しているが、核の停止に必要な情報は確保された。',
      '何より、生きて帰還したこと。それ自体が、この構造体に対する最大の成果だ。',
    ],
  },
  d: {
    title: '辛勝の脱出記録',
    text: '長い戦いの末、ようやく迷宮の封鎖が解除された。記録に残る限りの困難を極めた調査だった。',
    paragraphs: [
      '極限状態の中、かろうじて全核を停止させた。',
      '記録装置のデータは大部分が破損し、調査としての価値は限定的だ。',
      'だが、封鎖は解除された。次の調査員は、もう少し楽に進めるはずだ。',
      '報告書にはこう記されている。「帰還したことが、唯一にして十分な成果である」と。',
    ],
  },
};

// ゲームオーバーテキスト
const GAME_OVER_TEXT: EpilogueText = {
  title: '冒険の終わり',
  text: '迷宮の闇に飲み込まれた。だが、これで終わりではない。再び挑戦しよう。',
  paragraphs: [
    '意識が遠のいていく。構造体の壁が、ゆっくりと閉じていく。',
    '記録装置だけが、最後まで動作を続けていた。',
    '取得されたデータは、次の調査員へと引き継がれる。',
    'この犠牲は、無駄にはならない。',
  ],
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
