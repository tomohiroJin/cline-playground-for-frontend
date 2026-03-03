import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useMouseParallax } from '../../hooks/useMouseParallax';
import homeBgFar from '../../assets/images/home_bg_far.webp';
import homeBgMid from '../../assets/images/home_bg_mid.webp';
import homeBgNear from '../../assets/images/home_bg_near.webp';

interface HomeParallaxBgProps {
  className?: string;
}

/** 各レイヤーのパララックス設定 */
const LAYERS = [
  {
    id: 'far',
    image: homeBgFar,
    mouseFactorX: 4,
    mouseFactorY: 3,
    opacity: 0.6,
    filter: 'blur(2px)',
    scale: 1.05,
    driftDuration: 30,
    zIndex: 1,
  },
  {
    id: 'mid',
    image: homeBgMid,
    mouseFactorX: 10,
    mouseFactorY: 7,
    opacity: 0.4,
    filter: 'blur(1px)',
    scale: 1.08,
    driftDuration: 22,
    zIndex: 2,
  },
  {
    id: 'near',
    image: homeBgNear,
    mouseFactorX: 18,
    mouseFactorY: 12,
    opacity: 0.25,
    filter: 'none',
    scale: 1.12,
    driftDuration: 16,
    zIndex: 3,
  },
] as const;

/** reduced-motion 設定の判定 */
const useReducedMotion = (): boolean => {
  const [reduced, setReduced] = React.useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  React.useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return reduced;
};

/**
 * ホームページ用3層パララックス背景
 *
 * 迷宮の残響のタイトルバックと同様のマウス追従方式を採用。
 * 3層（Far / Mid / Near）で異なるパララックス速度。
 * タッチデバイスでは自動ドリフトアニメーションのみ。
 * prefers-reduced-motion 設定時はアニメーション無効。
 */
export const HomeParallaxBg: React.FC<HomeParallaxBgProps> = ({ className }) => {
  const mousePos = useMouseParallax();
  const reducedMotion = useReducedMotion();

  return (
    <Container
      data-testid="parallax-container"
      aria-hidden="true"
      className={className}
    >
      {LAYERS.map((layer) => {
        const offsetX = mousePos.x * layer.mouseFactorX;
        const offsetY = mousePos.y * layer.mouseFactorY;

        return (
          <Layer
            key={layer.id}
            data-testid={`parallax-layer-${layer.id}`}
            style={{
              backgroundImage: `url(${layer.image})`,
              transform: reducedMotion
                ? `scale(${layer.scale})`
                : `translate(${offsetX}px, ${offsetY}px) scale(${layer.scale})`,
              opacity: layer.opacity,
              filter: layer.filter,
              zIndex: layer.zIndex,
              animation: reducedMotion ? 'none' : undefined,
              willChange: reducedMotion ? 'auto' : 'transform',
            }}
            $driftId={layer.id}
            $driftDuration={layer.driftDuration}
          />
        );
      })}
      <Overlay data-testid="parallax-overlay" />
    </Container>
  );
};

// --- 自動ドリフトアニメーション ---

const driftFar = keyframes`
  0%   { transform: translate(0px, 0px) scale(1.05); }
  25%  { transform: translate(3px, -5px) scale(1.05); }
  50%  { transform: translate(-4px, -8px) scale(1.05); }
  75%  { transform: translate(-5px, 3px) scale(1.05); }
  100% { transform: translate(0px, 0px) scale(1.05); }
`;

const driftMid = keyframes`
  0%   { transform: translate(0px, 0px) scale(1.08); }
  25%  { transform: translate(-7px, 4px) scale(1.08); }
  50%  { transform: translate(5px, 9px) scale(1.08); }
  75%  { transform: translate(8px, -3px) scale(1.08); }
  100% { transform: translate(0px, 0px) scale(1.08); }
`;

const driftNear = keyframes`
  0%   { transform: translate(0px, 0px) scale(1.12); }
  25%  { transform: translate(10px, -7px) scale(1.12); }
  50%  { transform: translate(-8px, 10px) scale(1.12); }
  75%  { transform: translate(-12px, -4px) scale(1.12); }
  100% { transform: translate(0px, 0px) scale(1.12); }
`;

const DRIFT_ANIMATIONS: Record<string, ReturnType<typeof keyframes>> = {
  far: driftFar,
  mid: driftMid,
  near: driftNear,
};

// --- styled-components ---

const Container = styled.div`
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
`;

const Layer = styled.div<{
  $driftId: string;
  $driftDuration: number;
}>`
  position: absolute;
  inset: -30px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transition: transform 0.3s ease-out;

  ${({ $driftId, $driftDuration }) => css`
    animation: ${DRIFT_ANIMATIONS[$driftId]} ${$driftDuration}s ease-in-out infinite;
  `}

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
    transition: none;
  }
`;

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 4;
`;
