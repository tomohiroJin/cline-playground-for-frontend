/**
 * パーティクルシステム
 *
 * パーティクルの生成・更新・描画ロジックを提供する。
 */

import { Particle } from './effectTypes';

/**
 * 指定範囲内のランダム値を返す
 */
function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * 放射状パーティクルを生成する
 *
 * @param count - パーティクル数
 * @param x - 発生位置 X
 * @param y - 発生位置 Y
 * @param colors - 色配列（ランダム選択）
 * @param speedMin - 最小速度（px/秒）
 * @param speedMax - 最大速度（px/秒）
 * @param sizeMin - 最小サイズ（px）
 * @param sizeMax - 最大サイズ（px）
 * @param decay - ライフ減衰率（秒あたり）
 * @returns パーティクル配列
 */
export function createRadialParticles(
  count: number,
  x: number,
  y: number,
  colors: string[],
  speedMin: number,
  speedMax: number,
  sizeMin: number,
  sizeMax: number,
  decay: number
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + randomRange(-0.3, 0.3);
    const speed = randomRange(speedMin, speedMax);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: randomRange(sizeMin, sizeMax),
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1.0,
      life: 1.0,
      decay,
    });
  }
  return particles;
}

/**
 * 上方向に浮遊するパーティクルを生成する
 *
 * @param count - パーティクル数
 * @param x - 発生位置 X
 * @param y - 発生位置 Y
 * @param colors - 色配列
 * @param sizeMin - 最小サイズ
 * @param sizeMax - 最大サイズ
 * @param decay - 減衰率
 * @returns パーティクル配列
 */
export function createRisingParticles(
  count: number,
  x: number,
  y: number,
  colors: string[],
  sizeMin: number,
  sizeMax: number,
  decay: number
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x + randomRange(-8, 8),
      y,
      vx: randomRange(-20, 20),
      vy: randomRange(-80, -30),
      size: randomRange(sizeMin, sizeMax),
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1.0,
      life: 1.0,
      decay,
    });
  }
  return particles;
}

/**
 * パーティクルを更新する
 *
 * @param particles - パーティクル配列
 * @param deltaTime - 経過時間（秒）
 * @param gravity - 重力（px/秒^2、デフォルト: 0）
 * @returns 更新後のパーティクル配列（ライフ切れを除外済み）
 */
export function updateParticles(
  particles: Particle[],
  deltaTime: number,
  gravity: number = 0
): Particle[] {
  const alive: Particle[] = [];
  for (const p of particles) {
    p.x += p.vx * deltaTime;
    p.y += p.vy * deltaTime;
    p.vy += gravity * deltaTime;
    p.life -= p.decay * deltaTime;
    p.alpha = Math.max(0, p.life);
    p.size = Math.max(0.5, p.size * (0.98 + 0.02 * p.life));

    if (p.life > 0) {
      alive.push(p);
    }
  }
  return alive;
}

/**
 * パーティクルを描画する
 *
 * @param ctx - Canvas コンテキスト
 * @param particles - パーティクル配列
 * @param offsetX - ビューポートオフセット X
 * @param offsetY - ビューポートオフセット Y
 */
export function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  offsetX: number,
  offsetY: number
): void {
  ctx.save();
  for (const p of particles) {
    if (p.alpha <= 0) continue;
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(
      p.x + offsetX - p.size / 2,
      p.y + offsetY - p.size / 2,
      p.size,
      p.size
    );
  }
  ctx.restore();
}
