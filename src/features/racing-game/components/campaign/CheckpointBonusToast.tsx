// CHECKPOINT BONUS トースト（spec §6.4 / R3 共通運命）
//
// TIME カウンタの真下に出現し、上方向 24px フロート + 1.0s フェードアウト。
// reduced-motion 時はフロート無し、0.5s で即時消去。

import React, { useEffect, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { TOKENS } from './campaign-styles';

const TOAST_DURATION_MS = 1000;
const TOAST_REDUCED_DURATION_MS = 500;

const float = keyframes`
  0%   { transform: translate(-50%, 0); opacity: 1; }
  100% { transform: translate(-50%, -24px); opacity: 0; }
`;

const fadeOnly = keyframes`
  0%   { opacity: 1; }
  100% { opacity: 0; }
`;

const Toast = styled.div`
  position: absolute;
  top: 76px;  /* TIME カウンタ（top:16, height:48）の下 */
  left: 50%;
  transform: translateX(-50%);
  font-family: ${TOKENS.fontEnPixel};
  font-size: 24px;
  color: ${TOKENS.accentGold};
  pointer-events: none;
  animation: ${css`${float} 1s ease-out forwards`};

  @media (prefers-reduced-motion: reduce) {
    animation: ${css`${fadeOnly} 0.5s ease-out forwards`};
    transform: translateX(-50%);
  }
`;

export interface CheckpointBonusToastProps {
  /** 加算秒数。null/undefined のときはトーストを表示しない */
  readonly bonusSec?: number;
  /** トースト表示を識別するキー（同じ bonusSec が連続で来たときに再表示する用） */
  readonly triggerKey: number;
  /** 自動消去後のコールバック（任意） */
  readonly onDone?: () => void;
}

const usePrefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const CheckpointBonusToast: React.FC<CheckpointBonusToastProps> = ({
  bonusSec,
  triggerKey,
  onDone,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (bonusSec === undefined || bonusSec === null) {
      setIsVisible(false);
      return;
    }
    setIsVisible(true);
    const duration = reducedMotion ? TOAST_REDUCED_DURATION_MS : TOAST_DURATION_MS;
    const id = window.setTimeout(() => {
      setIsVisible(false);
      onDone?.();
    }, duration);
    return () => window.clearTimeout(id);
  }, [bonusSec, triggerKey, reducedMotion, onDone]);

  if (!isVisible || bonusSec === undefined || bonusSec === null) return null;

  return (
    <Toast key={triggerKey} role="status" aria-live="polite">
      +{bonusSec} SECONDS
    </Toast>
  );
};
