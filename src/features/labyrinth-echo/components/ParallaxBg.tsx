import React, { useEffect, useState, useRef } from 'react';
import { LE_BG_IMAGES } from '../images';

export interface ParallaxBgProps {
  floor: number;
  scrollProgress: number;
}

const PARALLAX_FAR_FACTOR = 0.1;
const PARALLAX_MID_FACTOR = 0.3;
const PARALLAX_NEAR_FACTOR = 0.5;
const MAX_OFFSET = 50;

export const ParallaxBg: React.FC<ParallaxBgProps> = ({ floor, scrollProgress }) => {
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

  const farOffset = scrollProgress * PARALLAX_FAR_FACTOR * MAX_OFFSET;
  const midOffset = scrollProgress * PARALLAX_MID_FACTOR * MAX_OFFSET;
  const nearOffset = scrollProgress * PARALLAX_NEAR_FACTOR * MAX_OFFSET;

  const getOpacity = (baseOpacity: number) => {
    if (phase === 'fadeOut' || phase === 'dark') return 0;
    return baseOpacity;
  };
  
  const getTransition = () => {
    if (phase === 'fadeOut') return 'opacity 0.5s ease-out';
    if (phase === 'fadeIn') return 'opacity 0.8s ease-in';
    return 'opacity 0ms'; // for dark state or instant changes
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
    <div style={{ position: 'fixed', inset: 0, zIndex: -4, pointerEvents: 'none', overflow: 'hidden' }}>
      {bgImages.far && (
        <div style={{
            ...baseStyle,
            zIndex: -3,
            opacity: getOpacity(0.4),
            filter: 'blur(2px)',
            backgroundImage: `url(${bgImages.far})`,
            transform: `translateY(${farOffset}px)`
        }} />
      )}
      {bgImages.mid && (
        <div style={{
            ...baseStyle,
            zIndex: -2,
            opacity: getOpacity(0.3),
            filter: 'blur(1px)',
            backgroundImage: `url(${bgImages.mid})`,
            transform: `translateY(${midOffset}px)`
        }} />
      )}
      {bgImages.near && (
        <div style={{
            ...baseStyle,
            zIndex: -1,
            opacity: getOpacity(0.2),
            backgroundImage: `url(${bgImages.near})`,
            transform: `translateY(${nearOffset}px)`
        }} />
      )}
    </div>
  );
};
