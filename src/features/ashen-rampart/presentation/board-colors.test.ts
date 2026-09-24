/**
 * 盤面セルの色（反復7 段階2・設計書 §4.0 b）
 *
 * 段階1 の試遊で「道と置ける場所の区別が付かない」と言われた。
 * 経路 #2a2320 と経路外 #211c19 の比は約 1.1:1 だった。
 */
import { compositeOver, contrastRatio } from './contrast';
import {
  BOARD_COLORS,
  CELL_ARROW_OPACITY,
  LANE_MARK_OPACITY,
  WCAG_NON_TEXT_CONTRAST_MIN,
  cellBackgroundOf,
} from './board-colors';
import { COLORS } from './theme';

describe('盤面の色', () => {
  it('経路と経路外のコントラスト比が 3:1 以上（WCAG 1.4.11）', () => {
    expect(contrastRatio(BOARD_COLORS.path, BOARD_COLORS.slot)).toBeGreaterThanOrEqual(
      WCAG_NON_TEXT_CONTRAST_MIN
    );
  });

  /*
   * 不透明の COLORS.secondary と経路をそのまま比べても実際の見た目を測れない。
   * LaneMark・CellArrow は opacity 付きで描かれるため、実際に効く不透明度の
   * 定数（LANE_MARK_OPACITY / CELL_ARROW_OPACITY）で合成した色を比べる
   * （コントローラ追加指示）。
   */
  it('経路の上のレーン印（LaneMark）が、実際の不透明度で合成した色でも経路に対して 3:1 以上', () => {
    const composited = compositeOver(COLORS.secondary, BOARD_COLORS.path, LANE_MARK_OPACITY);
    expect(contrastRatio(composited, BOARD_COLORS.path)).toBeGreaterThanOrEqual(
      WCAG_NON_TEXT_CONTRAST_MIN
    );
  });

  it('経路の上の矢印（CellArrow）が、実際の不透明度で合成した色でも経路に対して 3:1 以上', () => {
    const composited = compositeOver(COLORS.secondary, BOARD_COLORS.path, CELL_ARROW_OPACITY);
    expect(contrastRatio(composited, BOARD_COLORS.path)).toBeGreaterThanOrEqual(
      WCAG_NON_TEXT_CONTRAST_MIN
    );
  });

  it('射程の斜線は経路外に対して 3:1 以上', () => {
    expect(contrastRatio(BOARD_COLORS.rangeStripe, BOARD_COLORS.slot)).toBeGreaterThanOrEqual(
      WCAG_NON_TEXT_CONTRAST_MIN
    );
  });

  it('置けるセルの琥珀の縁取りは、内側の暗い縁に対して 3:1 以上', () => {
    expect(contrastRatio(COLORS.opportunity, BOARD_COLORS.placeableHalo)).toBeGreaterThanOrEqual(
      WCAG_NON_TEXT_CONTRAST_MIN
    );
  });

  it('射程の斜線は「置ける」の琥珀と別の色（役割を分ける。設計書 §4.3 #5）', () => {
    expect(BOARD_COLORS.rangeStripe).not.toBe(COLORS.opportunity);
  });
});

describe('cellBackgroundOf', () => {
  it('経路は経路の色、経路外は経路外の色', () => {
    expect(cellBackgroundOf({ isPath: true, isThreatened: false })).toBe(BOARD_COLORS.path);
    expect(cellBackgroundOf({ isPath: false, isThreatened: false })).toBe(BOARD_COLORS.slot);
  });

  it('射程内の経路外は、経路外の地に斜線を重ねる（塗りの色は変えない）', () => {
    const background = cellBackgroundOf({ isPath: false, isThreatened: true });
    expect(background).toContain('repeating-linear-gradient');
    expect(background).toContain(BOARD_COLORS.rangeStripe);
    expect(background.endsWith(BOARD_COLORS.slot)).toBe(true);
  });

  it('経路には射程の斜線を付けない（経路は置いて塞ぐ場所で、射程の警告の対象外）', () => {
    expect(cellBackgroundOf({ isPath: true, isThreatened: true })).toBe(BOARD_COLORS.path);
  });
});
