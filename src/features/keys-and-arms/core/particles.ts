/**
 * KEYS & ARMS — パーティクル・ポップアップシステム
 */
import { ON } from '../constants';
import { rng, rngSpread } from './math';
import { assert } from '../constants';
import type {
  DrawingAPI,
  ParticlesModule,
  ParticlePool,
  ParticleSpawnParams,
  Popup,
} from '../types';

/**
 * パーティクルシステムを生成する
 * @param draw 描画ヘルパー（createRendering の戻り値）
 */
export function createParticles(draw: DrawingAPI): ParticlesModule {
  const { $, txt } = draw;

  const Particles = {
    /** パーティクルをプールに生成 */
    spawn(pool: ParticlePool, { x, y, n = 4, vxSpread = 2, vySpread = 2, vyBase = 0, life = 12, s = 3, rot = false, gravity = 0 }: ParticleSpawnParams): ParticlePool {
      assert(Array.isArray(pool), 'pool must be array');
      for (let i = 0; i < n; i++) {
        pool.push({
          x: x + rng(-4, 4), y: y + rng(-4, 4),
          vx: rngSpread(vxSpread), vy: vyBase + rngSpread(vySpread),
          life, maxLife: life, s, rot: rot ? rng(0, 6) : 0, gravity
        });
      }
      return pool;
    },

    /** パーティクルの更新と描画 */
    updateAndDraw(pool: ParticlePool, color: string = ON): void {
      $.fillStyle = color;
      for (let i = pool.length - 1; i >= 0; i--) {
        const p = pool[i];
        p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.life--;
        if (p.life <= 0) { pool.splice(i, 1); continue; }
        $.globalAlpha = p.life / p.maxLife;
        $.fillRect(p.x, p.y, p.s, p.s);
      }
      $.globalAlpha = 1;
    }
  };

  const Popups = {
    pool: [] as Popup[],
    add(x: number, y: number, t: string): void { this.pool.push({ x, y, t, life: 50 }); },
    clear(): void { this.pool = []; },
    updateAndDraw(): void {
      this.pool = this.pool.filter((p: Popup) => {
        p.life--; p.y -= .5;
        if (p.life <= 0) return false;
        $.globalAlpha = Math.min(1, p.life / 20);
        txt(p.t, p.x, p.y, 6);
        $.globalAlpha = 1;
        return true;
      });
    }
  };

  return { Particles, Popups };
}
