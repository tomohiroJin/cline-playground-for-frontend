/**
 * Agile Quiz Sugoroku - アニメーション定義
 */
import { keyframes } from 'styled-components';
import { COLORS } from '../../constants';

export const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
`;

export const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
`;

export const fadeSlideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const floatY = keyframes`
  0%, 100% {
    transform: translateY(0) translateX(0);
  }
  25% {
    transform: translateY(-35px) translateX(12px);
  }
  50% {
    transform: translateY(-18px) translateX(-10px);
  }
  75% {
    transform: translateY(-45px) translateX(6px);
  }
`;

export const comboGlow = keyframes`
  0%, 100% { text-shadow: 0 0 4px ${COLORS.orange}44; }
  50% { text-shadow: 0 0 16px ${COLORS.orange}aa; }
`;

export const popIn = keyframes`
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
`;

export const titleGlow = keyframes`
  0%, 100% { text-shadow: 0 0 4px ${COLORS.accent}22; }
  50% { text-shadow: 0 0 20px ${COLORS.accent}44; }
`;

export const gradeReveal = keyframes`
  0% {
    transform: scale(0) rotate(-20deg);
    opacity: 0;
  }
  60% {
    transform: scale(1.15) rotate(5deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
`;

export const barGrow = keyframes`
  from { height: 0; }
`;

export const radarFill = keyframes`
  from {
    opacity: 0;
    transform: scale(0.3);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;
