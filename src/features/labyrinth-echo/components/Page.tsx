import React, { useEffect, useState } from 'react';
import { CSS, PAGE_STYLE } from '../styles';
import { ParallaxBg } from './ParallaxBg';

interface PageProps {
  children: React.ReactNode;
  particles?: React.ReactNode;
  floor?: number;
}

/** パララックス背景とコンテンツの間に挟む半透明オーバーレイ */
const DARK_OVERLAY: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1,
  pointerEvents: "none",
  background: "linear-gradient(180deg, rgba(8,8,24,0.65) 0%, rgba(12,12,32,0.6) 40%, rgba(8,8,18,0.65) 100%)",
};

export const Page: React.FC<PageProps> = ({ children, particles, floor }) => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) {
        setScrollProgress(0);
      } else {
        const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
        setScrollProgress(progress);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // パララックス使用時は背景を透明にし、body の暗色背景 + パララックスが見えるようにする
  const hasParallax = floor !== undefined;
  const pageStyle = hasParallax
    ? { ...PAGE_STYLE, background: "transparent" }
    : PAGE_STYLE;

  return (
    <div style={pageStyle}>
      <style>{CSS}</style>
      {hasParallax && <ParallaxBg floor={floor} scrollProgress={scrollProgress} />}
      {hasParallax && <div style={DARK_OVERLAY} />}
      <div style={{ position: "relative", zIndex: 2 }}>
        {particles}
        {children}
      </div>
    </div>
  );
};
