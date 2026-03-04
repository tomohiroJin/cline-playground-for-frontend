import React, { useRef, useEffect, useCallback } from 'react';

/** パーティクル1粒の状態 */
interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  /** 左右揺れの角度 */
  wobbleAngle: number;
  /** 左右揺れの速度 */
  wobbleSpeed: number;
  /** 透明度 */
  alpha: number;
  /** 色相（シアン〜パープル、180〜280） */
  hue: number;
}

interface ParticleFieldProps {
  /** 粒子数（デフォルト: 25） */
  count?: number;
  /** 速度倍率（デフォルト: 1） */
  speed?: number;
  className?: string;
}

/** シアン〜パープルの色相範囲 */
const HUE_MIN = 180;
const HUE_MAX = 280;

/** パーティクルサイズ範囲 */
const SIZE_MIN = 1;
const SIZE_MAX = 3;

/** 上方向ドリフト速度範囲 */
const SPEED_MIN = 0.2;
const SPEED_MAX = 0.6;

/** パーティクルの初期化 */
const createParticle = (width: number, height: number): Particle => ({
  x: Math.random() * width,
  y: Math.random() * height,
  size: SIZE_MIN + Math.random() * (SIZE_MAX - SIZE_MIN),
  speedY: SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN),
  wobbleAngle: Math.random() * Math.PI * 2,
  wobbleSpeed: 0.02 + Math.random() * 0.03,
  alpha: 0.15 + Math.random() * 0.2,
  hue: HUE_MIN + Math.random() * (HUE_MAX - HUE_MIN),
});

export const ParticleField: React.FC<ParticleFieldProps> = ({
  count = 25,
  speed = 1,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const isVisibleRef = useRef(false);
  const frameCountRef = useRef(0);

  /** Canvas をリサイズに追従させる */
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }, []);

  /** パーティクル群を初期化 */
  const initParticles = useCallback(
    (width: number, height: number) => {
      particlesRef.current = Array.from({ length: count }, () =>
        createParticle(width, height)
      );
    },
    [count]
  );

  /** 1フレーム分の描画 */
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particlesRef.current) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 60%, ${p.alpha})`;
        ctx.fill();
      }
    },
    []
  );

  /** パーティクルの位置を更新 */
  const update = useCallback(
    (width: number, height: number) => {
      for (const p of particlesRef.current) {
        // 上方向にドリフト
        p.y -= p.speedY * speed;
        // 左右に揺れる
        p.wobbleAngle += p.wobbleSpeed;
        p.x += Math.sin(p.wobbleAngle) * 0.3;

        // 画面上端を超えたら下端にリセット
        if (p.y < -p.size) {
          p.y = height + p.size;
          p.x = Math.random() * width;
        }
        // 画面左右を超えた場合のラップ
        if (p.x < -p.size) p.x = width + p.size;
        if (p.x > width + p.size) p.x = -p.size;
      }
    },
    [speed]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    handleResize();
    const { width, height } = canvas;
    initParticles(width, height);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // reduced-motion 時は静的に1回だけ描画
    if (prefersReducedMotion) {
      draw(ctx, width, height);
      return;
    }

    // アニメーションループ（2フレームに1回描画でCPU負荷軽減）
    const animate = () => {
      if (!isVisibleRef.current) {
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      frameCountRef.current += 1;
      // 位置は毎フレーム更新、描画は2フレームに1回
      update(canvas.width, canvas.height);
      if (frameCountRef.current % 2 === 0) {
        draw(ctx, canvas.width, canvas.height);
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };

    // IntersectionObserver で viewport 内のみアニメーション
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          isVisibleRef.current = entry.isIntersecting;
        }
      },
      { threshold: 0 }
    );
    observer.observe(canvas);

    animFrameRef.current = requestAnimationFrame(animate);

    // リサイズ対応
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize, initParticles, draw, update]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="particle-field"
      aria-hidden="true"
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
};
