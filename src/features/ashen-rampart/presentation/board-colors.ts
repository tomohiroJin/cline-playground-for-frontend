/**
 * 灰燼の城壁 - 盤面セルの色（反復7 段階2・設計書 §4.0 b / §4.3 #5）
 *
 * 経路は「道」として明るくし縁を付ける。経路外（置ける場所）は据え置きの暗色。
 * 経路と経路外のコントラスト比を 3:1 以上に保つ（board-colors.test.ts が計算で守る）。
 *
 * 射程の警告（§4.3 #5）は**塗りの色ではなく斜線の模様**で出す。
 * 経路外の塗りを明るくして区別すると経路との 3:1 が崩れ、暗くすると経路外と
 * 見分けられない。模様なら地の色を変えずに両立する。
 * 「置ける」は琥珀の outline が担っているので、斜線には別の色（dangerText）を使う。
 */
import { COLORS } from './theme';

export const BOARD_COLORS = {
  /** 経路（道）。経路外に対して約 3.37:1 */
  path: '#7d6d58',
  /** 経路の縁 */
  pathEdge: '#a39076',
  /** 経路外（置ける場所）。段階1 から据え置き */
  slot: '#211c19',
  /** 敵の射程が届く経路外に重ねる斜線。射程は「削られる」脅威なので危険系の明るい色 */
  rangeStripe: COLORS.dangerText,
  /** 置けるセルの琥珀の縁取りの内側に敷く暗い縁（明るい経路の上でも琥珀を読ませる） */
  placeableHalo: COLORS.dominant,
} as const;

/** WCAG 1.4.11（非テキストのコントラスト）の最小比 */
export const WCAG_NON_TEXT_CONTRAST_MIN = 3;

/** 置けるセルの暗い縁の太さ（px）。琥珀の outline（2px）より内側に2px 見える */
export const PLACEABLE_HALO_PX = 4;

/**
 * LaneMark（レーン印）の不透明度。BoardGrid.tsx の LaneMark が実際に使う値。
 *
 * 経路を明るくした後も、opacity 付きで合成した実際の色が経路に対して
 * 3:1 を満たすようにここで固定する（board-colors.test.ts が compositeOver で検査）。
 * 段階1 の 0.6 では合成後の比が約 2.37:1 に留まり 3:1 を割ったため、0.85 まで上げた
 * （経路外での見た目は変えず、経路の上でだけ濃く見える）。
 */
export const LANE_MARK_OPACITY = 0.85;

/**
 * CellArrow（進行方向の矢印）の不透明度。BoardGrid.tsx の CellArrow が実際に使う値。
 *
 * 段階1 の 0.7 では合成後の比が約 2.68:1 に留まり 3:1 を割ったため、0.9 まで上げた。
 */
export const CELL_ARROW_OPACITY = 0.9;

const RANGE_STRIPE_ANGLE_DEG = 135;
const RANGE_STRIPE_WIDTH_PX = 2;
const RANGE_STRIPE_PERIOD_PX = 8;

/** セルの背景。射程の斜線は経路外にだけ重ねる */
export const cellBackgroundOf = ({
  isPath,
  isThreatened,
}: {
  isPath: boolean;
  isThreatened: boolean;
}): string => {
  if (isPath) return BOARD_COLORS.path;
  if (!isThreatened) return BOARD_COLORS.slot;
  return (
    `repeating-linear-gradient(${RANGE_STRIPE_ANGLE_DEG}deg, ` +
    `${BOARD_COLORS.rangeStripe} 0 ${RANGE_STRIPE_WIDTH_PX}px, ` +
    `transparent ${RANGE_STRIPE_WIDTH_PX}px ${RANGE_STRIPE_PERIOD_PX}px), ${BOARD_COLORS.slot}`
  );
};
