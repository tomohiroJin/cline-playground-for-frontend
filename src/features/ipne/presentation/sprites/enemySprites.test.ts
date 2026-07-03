/**
 * 敵スプライトの状態別追加フレームのテスト
 *
 * 被弾（KNOCKBACK）フレームがベースフレームと同サイズ・同パレットで、
 * かつピクセル内容が異なる（＝視覚的な差分が加えられている）ことを検証する。
 */
import {
  PATROL_ATTACK_FRAME,
  CHARGE_RUSH_FRAME,
  RANGED_CAST_FRAME,
  SPECIMEN_MUTATE_FRAME,
  BOSS_DAMAGE_FRAME,
  MINI_BOSS_DAMAGE_FRAME,
  MEGA_BOSS_DAMAGE_FRAME,
  PATROL_DAMAGE_FRAME,
  CHARGE_DAMAGE_FRAME,
  RANGED_DAMAGE_FRAME,
  SPECIMEN_DAMAGE_FRAME,
  PATROL_SPRITE_SHEET,
  CHARGE_SPRITE_SHEET,
  RANGED_SPRITE_SHEET,
  SPECIMEN_SPRITE_SHEET,
  BOSS_SPRITE_SHEET,
  MINI_BOSS_SPRITE_SHEET,
  MEGA_BOSS_SPRITE_SHEET,
  PATROL_WINDUP_FRAME,
  CHARGE_WINDUP_FRAME,
  RANGED_WINDUP_FRAME,
  SPECIMEN_WINDUP_FRAME,
  BOSS_WINDUP_FRAME,
  MINI_BOSS_WINDUP_FRAME,
  MEGA_BOSS_WINDUP_FRAME,
  BOSS_ATTACK_FRAME,
  MINI_BOSS_ATTACK_FRAME,
  MEGA_BOSS_ATTACK_FRAME,
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

/** 2枚のスプライトのピクセル差分点数を数える（同サイズ前提） */
function countPixelDiff(a: { pixels: readonly (readonly number[])[] }, b: { pixels: readonly (readonly number[])[] }): number {
  let diff = 0;
  for (let y = 0; y < a.pixels.length; y++) {
    for (let x = 0; x < a.pixels[y].length; x++) {
      if (a.pixels[y][x] !== b.pixels[y][x]) diff++;
    }
  }
  return diff;
}

describe('非ボス敵の溜め（WINDUP）フレーム', () => {
  const cases = [
    ['PATROL', PATROL_WINDUP_FRAME, PATROL_SPRITE_SHEET],
    ['CHARGE', CHARGE_WINDUP_FRAME, CHARGE_SPRITE_SHEET],
    ['RANGED', RANGED_WINDUP_FRAME, RANGED_SPRITE_SHEET],
    ['SPECIMEN', SPECIMEN_WINDUP_FRAME, SPECIMEN_SPRITE_SHEET],
  ] as const;

  it.each(cases)('%s: ベースと同サイズ・同パレットで、ピクセルが異なる', (_name, frame, sheet) => {
    const base = sheet.sprites[0];
    expect(frame.width).toBe(base.width);
    expect(frame.height).toBe(base.height);
    expect(frame.palette).toEqual(base.palette);
    expect(frame.pixels).not.toEqual(base.pixels);
  });

  // WINDUP フレームは「idle（sprites[0]）＋意図した溜め編集」のみで構成されるべき。
  // ディテール適用前の素体をベースにするとフレーム1のディテール編集が巻き戻り、
  // 意図しない差分が生じるため、idle との差分点数に上限を設けて再発を防ぐ。
  it.each(cases)('%s: 溜めフレームの idle からの差分は意図した編集のみ（30点以下）', (_name, frame, sheet) => {
    const diff = countPixelDiff(frame, sheet.sprites[0]);
    expect(diff).toBeGreaterThan(0);
    expect(diff).toBeLessThanOrEqual(30);
  });
});

describe('ボス系敵の溜め（WINDUP）フレーム', () => {
  const cases = [
    ['BOSS', BOSS_WINDUP_FRAME, BOSS_ATTACK_FRAME, BOSS_SPRITE_SHEET],
    ['MINI_BOSS', MINI_BOSS_WINDUP_FRAME, MINI_BOSS_ATTACK_FRAME, MINI_BOSS_SPRITE_SHEET],
    ['MEGA_BOSS', MEGA_BOSS_WINDUP_FRAME, MEGA_BOSS_ATTACK_FRAME, MEGA_BOSS_SPRITE_SHEET],
  ] as const;

  it.each(cases)('%s: 攻撃フレームと同サイズ・同パレットで、ピクセルが異なる', (_name, windup, attack, sheet) => {
    const base = sheet.sprites[0];
    expect(windup.width).toBe(base.width);
    expect(windup.height).toBe(base.height);
    expect(windup.palette).toEqual(base.palette);
    expect(windup.pixels).not.toEqual(attack.pixels);
  });

  // ボス系の WINDUP は idle ではなく攻撃フレームと同じ素体（detailed base）を編集元にする。
  // 攻撃フレームとの差分は「攻撃編集点数＋溜め編集点数」に収まるはずのため、
  // 素体不一致（例: idle をベースにしてしまう等）による巨大な差分が出ないことを検証する。
  it.each(cases)('%s: 溜めフレームの攻撃フレームからの差分は意図した編集の範囲内（30点以下）', (_name, windup, attack) => {
    const diff = countPixelDiff(windup, attack);
    expect(diff).toBeGreaterThan(0);
    expect(diff).toBeLessThanOrEqual(30);
  });
});

describe('状態フレームのパレット index 範囲', () => {
  // ピクセル編集で範囲外 index を指定すると描画時に診断用マゼンタへフォールバックする。
  // 既存の不変条件テストはベースフレームとの比較のみで index 自体は見ていないため、
  // 全状態フレームについて「0 <= v < palette.length」を直接検証して穴を塞ぐ。
  const stateFrames = [
    ['PATROL_ATTACK_FRAME', PATROL_ATTACK_FRAME],
    ['CHARGE_RUSH_FRAME', CHARGE_RUSH_FRAME],
    ['RANGED_CAST_FRAME', RANGED_CAST_FRAME],
    ['SPECIMEN_MUTATE_FRAME', SPECIMEN_MUTATE_FRAME],
    ['BOSS_ATTACK_FRAME', BOSS_ATTACK_FRAME],
    ['MINI_BOSS_ATTACK_FRAME', MINI_BOSS_ATTACK_FRAME],
    ['MEGA_BOSS_ATTACK_FRAME', MEGA_BOSS_ATTACK_FRAME],
    ['PATROL_DAMAGE_FRAME', PATROL_DAMAGE_FRAME],
    ['CHARGE_DAMAGE_FRAME', CHARGE_DAMAGE_FRAME],
    ['RANGED_DAMAGE_FRAME', RANGED_DAMAGE_FRAME],
    ['SPECIMEN_DAMAGE_FRAME', SPECIMEN_DAMAGE_FRAME],
    ['BOSS_DAMAGE_FRAME', BOSS_DAMAGE_FRAME],
    ['MINI_BOSS_DAMAGE_FRAME', MINI_BOSS_DAMAGE_FRAME],
    ['MEGA_BOSS_DAMAGE_FRAME', MEGA_BOSS_DAMAGE_FRAME],
    ['PATROL_WINDUP_FRAME', PATROL_WINDUP_FRAME],
    ['CHARGE_WINDUP_FRAME', CHARGE_WINDUP_FRAME],
    ['RANGED_WINDUP_FRAME', RANGED_WINDUP_FRAME],
    ['SPECIMEN_WINDUP_FRAME', SPECIMEN_WINDUP_FRAME],
    ['BOSS_WINDUP_FRAME', BOSS_WINDUP_FRAME],
    ['MINI_BOSS_WINDUP_FRAME', MINI_BOSS_WINDUP_FRAME],
    ['MEGA_BOSS_WINDUP_FRAME', MEGA_BOSS_WINDUP_FRAME],
  ] as const;

  it.each(stateFrames)('%s: 全ピクセル値がパレット範囲内（0 <= v < palette.length）', (_name, frame) => {
    const outOfRange: string[] = [];
    for (let y = 0; y < frame.height; y++) {
      for (let x = 0; x < frame.width; x++) {
        const v = frame.pixels[y][x];
        if (v < 0 || v >= frame.palette.length) {
          outOfRange.push(`(${x},${y})=${v}`);
        }
      }
    }
    expect(outOfRange).toEqual([]);
  });
});
