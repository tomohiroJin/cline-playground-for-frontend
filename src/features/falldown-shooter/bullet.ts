// 落ち物シューティング 弾丸モジュール

import type { BulletData } from './types';
import { uid } from './utils';

export const Bullet = {
  create: (
    x: number,
    y: number,
    dx: number = 0,
    dy: number = -1,
    pierce: boolean = false
  ): BulletData => ({ id: uid(), x, y, dx, dy, pierce }),

  createSpread: (x: number, y: number, pierce: boolean): BulletData[] => [
    Bullet.create(x, y, 0, -1, pierce),
    Bullet.create(x, y, -1, -1, pierce),
    Bullet.create(x, y, 1, -1, pierce),
  ],

  createWithDownshot: (x: number, y: number, pierce: boolean): BulletData[] => [
    Bullet.create(x, y, 0, -1, pierce),
    Bullet.create(x, y + 1, 0, 1, pierce),
  ],

  createSpreadWithDownshot: (x: number, y: number, pierce: boolean): BulletData[] => [
    Bullet.create(x, y, 0, -1, pierce),
    Bullet.create(x, y, -1, -1, pierce),
    Bullet.create(x, y, 1, -1, pierce),
    Bullet.create(x, y + 1, 0, 1, pierce),
  ],

  move: (bullet: BulletData): BulletData => ({
    ...bullet,
    x: bullet.x + bullet.dx,
    y: bullet.y + bullet.dy,
  }),

  isValid: (bullet: BulletData, width: number, height: number): boolean =>
    bullet.y >= 0 && bullet.y < height && bullet.x >= 0 && bullet.x < width,
};
