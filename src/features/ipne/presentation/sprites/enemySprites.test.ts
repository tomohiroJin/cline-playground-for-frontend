/**
 * 敵スプライトの状態別追加フレームのテスト
 *
 * 被弾（KNOCKBACK）フレームがベースフレームと同サイズ・同パレットで、
 * かつピクセル内容が異なる（＝視覚的な差分が加えられている）ことを検証する。
 */
import {
  PATROL_DAMAGE_FRAME,
  CHARGE_DAMAGE_FRAME,
  RANGED_DAMAGE_FRAME,
  SPECIMEN_DAMAGE_FRAME,
  PATROL_SPRITE_SHEET,
  CHARGE_SPRITE_SHEET,
  RANGED_SPRITE_SHEET,
  SPECIMEN_SPRITE_SHEET,
} from './enemySprites';

describe('非ボス敵の被弾フレーム', () => {
  const cases = [
    ['PATROL', PATROL_DAMAGE_FRAME, PATROL_SPRITE_SHEET],
    ['CHARGE', CHARGE_DAMAGE_FRAME, CHARGE_SPRITE_SHEET],
    ['RANGED', RANGED_DAMAGE_FRAME, RANGED_SPRITE_SHEET],
    ['SPECIMEN', SPECIMEN_DAMAGE_FRAME, SPECIMEN_SPRITE_SHEET],
  ] as const;

  it.each(cases)('%s: ベースと同サイズ・同パレットで、ピクセルが異なる', (_name, frame, sheet) => {
    const base = sheet.sprites[0];
    expect(frame.width).toBe(base.width);
    expect(frame.height).toBe(base.height);
    expect(frame.palette).toEqual(base.palette);
    expect(frame.pixels).not.toEqual(base.pixels);
  });
});
