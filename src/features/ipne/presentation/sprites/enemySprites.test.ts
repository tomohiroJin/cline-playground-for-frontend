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

  // 被弾フレームは「idle（sprites[0]）＋意図した被弾編集」のみで構成されるべき。
  // ディテール適用前の素体をベースにするとフレーム1のディテール編集が巻き戻り、
  // 意図しない差分が生じるため、idle との差分点数に上限を設けて再発を防ぐ。
  it.each(cases)('%s: 被弾フレームの idle からの差分は意図した編集のみ（30点以下）', (_name, frame, sheet) => {
    const base = sheet.sprites[0];
    let diff = 0;
    for (let y = 0; y < base.height; y++) {
      for (let x = 0; x < base.width; x++) {
        if (frame.pixels[y][x] !== base.pixels[y][x]) diff++;
      }
    }
    expect(diff).toBeGreaterThan(0);
    expect(diff).toBeLessThanOrEqual(30);
  });
});
