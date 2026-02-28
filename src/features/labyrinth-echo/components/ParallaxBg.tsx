import React, { useEffect, useState, useRef } from 'react';
import { LE_BG_IMAGES } from '../images';

export interface ParallaxBgProps {
  floor: number;
}

/** 各レイヤーの自動ドリフトアニメーション（スクロール不要でパララックス効果を実現） */
const PARALLAX_CSS = `
@keyframes parallaxDriftFar {
  0%   { transform: translate(0px, 0px) scale(1.05); }
  25%  { transform: translate(4px, -6px) scale(1.05); }
  50%  { transform: translate(-3px, -10px) scale(1.05); }
  75%  { transform: translate(-6px, 2px) scale(1.05); }
  100% { transform: translate(0px, 0px) scale(1.05); }
}
@keyframes parallaxDriftMid {
  0%   { transform: translate(0px, 0px) scale(1.08); }
  25%  { transform: translate(-8px, 5px) scale(1.08); }
  50%  { transform: translate(6px, 10px) scale(1.08); }
  75%  { transform: translate(10px, -4px) scale(1.08); }
  100% { transform: translate(0px, 0px) scale(1.08); }
}
@keyframes parallaxDriftNear {
  0%   { transform: translate(0px, 0px) scale(1.12); }
  25%  { transform: translate(12px, -8px) scale(1.12); }
  50%  { transform: translate(-10px, 12px) scale(1.12); }
  75%  { transform: translate(-14px, -5px) scale(1.12); }
  100% { transform: translate(0px, 0px) scale(1.12); }
}
`;

export const ParallaxBg: React.FC<ParallaxBgProps> = ({ floor }) => {
  const [currentFloor, setCurrentFloor] = useState(floor);
  const [phase, setPhase] = useState<'idle' | 'fadeOut' | 'dark' | 'fadeIn'>('idle');
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (floor !== currentFloor && phase === 'idle') {
      setPhase('fadeOut');
      const t1 = setTimeout(() => {
        setPhase('dark');
        setCurrentFloor(floor);
        const t2 = setTimeout(() => {
          setPhase('fadeIn');
          const t3 = setTimeout(() => {
            setPhase('idle');
          }, 800);
          timersRef.current.push(t3);
        }, 200);
        timersRef.current.push(t2);
      }, 500);
      timersRef.current.push(t1);
    }
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [floor, currentFloor, phase]);

  const activeFloor = currentFloor;
  const bgImages = (LE_BG_IMAGES as Record<number, { far: string; mid: string; near: string }>)[activeFloor] || { far: '', mid: '', near: '' };

  const getOpacity = (baseOpacity: number) => {
    if (phase === 'fadeOut' || phase === 'dark') return 0;
    return baseOpacity;
  };

  const getTransition = () => {
    if (phase === 'fadeOut') return 'opacity 0.5s ease-out';
    if (phase === 'fadeIn') return 'opacity 0.8s ease-in';
    return 'opacity 0ms';
  };

  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    inset: -50,
    width: 'calc(100% + 100px)',
    height: 'calc(100% + 100px)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    pointerEvents: 'none',
    transition: getTransition(),
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <style>{PARALLAX_CSS}</style>
      {bgImages.far && (
        <div style={{
            ...baseStyle,
            zIndex: 1,
            opacity: getOpacity(0.7),
            filter: 'blur(2px)',
            backgroundImage: `url(${bgImages.far})`,
            animation: 'parallaxDriftFar 28s ease-in-out infinite',
        }} />
      )}
      {bgImages.mid && (
        <div style={{
            ...baseStyle,
            zIndex: 2,
            opacity: getOpacity(0.55),
            filter: 'blur(1px)',
            backgroundImage: `url(${bgImages.mid})`,
            animation: 'parallaxDriftMid 20s ease-in-out infinite',
        }} />
      )}
      {bgImages.near && (
        <div style={{
            ...baseStyle,
            zIndex: 3,
            opacity: getOpacity(0.4),
            backgroundImage: `url(${bgImages.near})`,
            animation: 'parallaxDriftNear 14s ease-in-out infinite',
        }} />
      )}
    </div>
  );
};
