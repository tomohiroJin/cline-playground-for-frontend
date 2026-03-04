import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';

interface TypeWriterProps {
  /** 表示するテキスト */
  text: string;
  /** 1文字あたりの表示間隔（ms、デフォルト: 50） */
  speed?: number;
  /** カーソル文字（デフォルト: '|'） */
  cursorChar?: string;
  className?: string;
}

/** カーソルの消失タイマー（ms） */
const CURSOR_HIDE_DELAY = 3000;

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
`;

const Cursor = styled.span`
  animation: ${blink} 1s step-end infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const TypeWriter: React.FC<TypeWriterProps> = ({
  text,
  speed = 50,
  cursorChar = '|',
  className,
}) => {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [displayedCount, setDisplayedCount] = useState(
    prefersReducedMotion ? text.length : 0
  );
  const [showCursor, setShowCursor] = useState(!prefersReducedMotion);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const cursorTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (prefersReducedMotion) return;

    timerRef.current = setInterval(() => {
      setDisplayedCount((prev) => {
        if (prev >= text.length) {
          clearInterval(timerRef.current);
          return prev;
        }
        return prev + 1;
      });
    }, speed);

    return () => {
      clearInterval(timerRef.current);
    };
  }, [text, speed, prefersReducedMotion]);

  // テキスト表示完了後にカーソルを消す
  useEffect(() => {
    if (displayedCount < text.length) return;
    if (prefersReducedMotion) return;

    cursorTimerRef.current = setTimeout(() => {
      setShowCursor(false);
    }, CURSOR_HIDE_DELAY);

    return () => {
      clearTimeout(cursorTimerRef.current);
    };
  }, [displayedCount, text.length, prefersReducedMotion]);

  return (
    <span data-testid="typewriter" className={className}>
      {text.slice(0, displayedCount)}
      {showCursor && (
        <Cursor data-testid="typewriter-cursor">{cursorChar}</Cursor>
      )}
    </span>
  );
};
