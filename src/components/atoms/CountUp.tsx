import React, { useState, useEffect, useRef, useCallback } from 'react';

interface CountUpProps {
  /** カウントアップの目標値 */
  end: number;
  /** アニメーション時間（ms、デフォルト: 1500） */
  duration?: number;
  /** 接尾辞（デフォルト: ''） */
  suffix?: string;
  className?: string;
}

/** フレーム間隔（約60fps） */
const FRAME_INTERVAL = 16;

/** easeOut イージング関数 */
const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);

export const CountUp: React.FC<CountUpProps> = ({
  end,
  duration = 1500,
  suffix = '',
  className,
}) => {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const hasStartedRef = useRef(false);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const startCounting = useCallback(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    if (prefersReducedMotion) {
      setCount(end);
      return;
    }

    const totalFrames = Math.ceil(duration / FRAME_INTERVAL);
    let frame = 0;

    timerRef.current = setInterval(() => {
      frame++;
      const progress = easeOut(frame / totalFrames);
      const currentValue = Math.round(progress * end);
      setCount(currentValue);

      if (frame >= totalFrames) {
        setCount(end);
        clearInterval(timerRef.current);
      }
    }, FRAME_INTERVAL);
  }, [end, duration, prefersReducedMotion]);

  // IntersectionObserver で viewport に入ったらカウント開始
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            startCounting();
            observer.disconnect();
          }
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(element);

    return () => {
      clearInterval(timerRef.current);
      observer.disconnect();
    };
  }, [startCounting]);

  return (
    <span
      ref={elementRef}
      data-testid="count-up"
      className={className}
      style={{ fontFamily: "'Orbitron', sans-serif" }}
    >
      {count}
      {suffix}
    </span>
  );
};
