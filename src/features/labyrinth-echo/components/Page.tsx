import React, { useEffect, useState } from 'react';
import { CSS, PAGE_STYLE } from '../styles';
import { ParallaxBg } from './ParallaxBg';

interface PageProps {
  children: React.ReactNode;
  particles?: React.ReactNode;
  floor?: number;
}

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
    // setTimeoutなどでDOM構築後に計算するようにするとなお良いが一旦即時呼び出し
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={PAGE_STYLE}>
      <style>{CSS}</style>
      {floor !== undefined && <ParallaxBg floor={floor} scrollProgress={scrollProgress} />}
      {particles}
      {children}
    </div>
  );
};
