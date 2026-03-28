import styled, { keyframes } from 'styled-components';
import { Link } from 'react-router-dom';
import { GlassCard } from '../components/atoms/GlassCard';

/* ==============================
 * キーフレーム定義
 * ============================== */

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const pulseGlow = keyframes`
  0%, 100% {
    text-shadow:
      0 0 20px rgba(0, 210, 255, 0.4),
      0 0 60px rgba(0, 210, 255, 0.1);
  }
  50% {
    text-shadow:
      0 0 40px rgba(0, 210, 255, 0.6),
      0 0 80px rgba(0, 210, 255, 0.2),
      0 0 120px rgba(168, 85, 247, 0.1);
  }
`;

const floatParticle = keyframes`
  0% {
    opacity: 0;
    transform: translateY(40px) scale(0);
  }
  20% { opacity: 1; transform: translateY(20px) scale(1); }
  80% { opacity: 1; transform: translateY(-30px) scale(1); }
  100% {
    opacity: 0;
    transform: translateY(-50px) scale(0);
  }
`;

/* ==============================
 * レイアウト
 * ============================== */

export const PageContainer = styled.div`
  position: relative;
  width: 100%;
  min-height: 100vh;
`;

export const ContentWrapper = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: var(--space-10) var(--space-5);
  max-width: 1280px;
  margin: 0 auto;
`;

/* ==============================
 * ヒーローセクション
 * ============================== */

export const HeroSection = styled.header`
  text-align: center;
  margin-bottom: var(--space-16);
  animation: ${fadeInUp} 1s ease-out;
  position: relative;
  overflow: visible;

  /* 浮遊パーティクル */
  &::before,
  &::after {
    content: '';
    position: absolute;
    border-radius: var(--radius-full);
    pointer-events: none;
  }

  &::before {
    width: 6px;
    height: 6px;
    background: var(--color-accent-primary);
    top: 10%;
    left: 10%;
    box-shadow: 0 0 12px var(--color-accent-primary);
    animation: ${floatParticle} 6s infinite ease-in-out;
  }

  &::after {
    width: 4px;
    height: 4px;
    background: var(--color-accent-secondary);
    top: 30%;
    right: 15%;
    box-shadow: 0 0 10px var(--color-accent-secondary);
    animation: ${floatParticle} 8s infinite ease-in-out 2s;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    &::before,
    &::after {
      animation: none;
      opacity: 0.4;
    }
  }
`;

export const HeroTitle = styled.h2`
  font-size: var(--font-size-3xl);
  font-family: var(--font-family-heading);
  font-weight: var(--font-weight-extrabold);
  letter-spacing: var(--letter-spacing-wide);
  margin-bottom: var(--space-4);
  background: linear-gradient(
    135deg,
    #ffffff 0%,
    #a5f3fc 30%,
    #00d2ff 60%,
    #a855f7 100%
  );
  background-size: 200% auto;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation:
    ${pulseGlow} 4s ease-in-out infinite,
    ${shimmer} 6s linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    text-shadow: 0 0 30px rgba(0, 210, 255, 0.3);
  }
`;

export const HeroSubtitle = styled.p`
  font-size: var(--font-size-md);
  color: var(--color-text-secondary);
  max-width: 600px;
  margin: 0 auto;
  min-height: 3.6em;
  line-height: var(--line-height-relaxed);
`;

export const GameCounter = styled.div`
  margin-top: var(--space-5);
  font-size: var(--font-size-2xl);
  font-family: var(--font-family-heading);
  font-weight: var(--font-weight-bold);
  background: linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: var(--letter-spacing-wide);
  filter: drop-shadow(0 0 8px rgba(0, 210, 255, 0.3));
`;

/* ==============================
 * ゲームカードグリッド
 * ============================== */

export const BentoGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--space-6);
  width: 100%;
`;

export const GameCardContainer = styled(GlassCard).attrs({ as: Link })`
  display: flex;
  flex-direction: column;
  min-height: 300px;
  cursor: pointer;
  padding: 0;
  text-decoration: none;
  color: inherit;
  position: relative;

  /* GlassCard の ::before シマーラインを維持しつつ、
     ネオンボーダーグロウは box-shadow で実現 */

  &:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 2px;
  }

  &:hover {
    transform: translateY(-10px) scale(1.02);
    border-color: rgba(0, 210, 255, 0.6);
    box-shadow:
      0 24px 48px rgba(0, 0, 0, 0.5),
      0 0 20px rgba(0, 210, 255, 0.15),
      0 0 40px rgba(168, 85, 247, 0.1),
      inset 0 0 20px rgba(0, 210, 255, 0.03);
  }

  @media (prefers-reduced-motion: reduce) {
    &:hover {
      transform: translateY(-4px);
    }
  }
`;

/* ==============================
 * カード内部
 * ============================== */

export const CardImageArea = styled.div`
  height: 220px;
  aspect-ratio: 16 / 9;
  background-color: var(--color-bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--glass-border);
  position: relative;
  overflow: hidden;

  /* ホバー時のグローオーバーレイ */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      transparent 40%,
      rgba(0, 210, 255, 0.08) 100%
    );
    opacity: 0;
    transition: opacity 0.5s ease;
  }

  ${GameCardContainer}:hover &::after {
    opacity: 1;
  }
`;

export const CardImage = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  ${GameCardContainer}:hover & {
    transform: scale(1.08);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    ${GameCardContainer}:hover & {
      transform: none;
    }
  }
`;

export const CardContent = styled.div`
  padding: var(--space-6);
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`;

export const CardTitle = styled.h3`
  font-size: var(--font-size-lg);
  font-family: var(--font-family-heading);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--space-3);
  color: var(--color-text-primary);
  letter-spacing: var(--letter-spacing-tight);
  transition: color 0.3s ease;

  @supports (-webkit-background-clip: text) or (background-clip: text) {
    ${GameCardContainer}:hover & {
      background: linear-gradient(135deg, #ffffff, var(--color-accent-primary));
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }
`;

export const GameDescription = styled.p`
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--space-5);
  flex-grow: 1;
`;

export const PlayButton = styled.span`
  background: linear-gradient(135deg, var(--color-accent-primary), var(--color-button-gradient-end));
  color: white;
  border: none;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-glow-cyan);
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-2);
  min-height: 44px;
  position: relative;
  overflow: hidden;
  letter-spacing: var(--letter-spacing-wide);
  text-transform: uppercase;

  /* シマーエフェクト */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s ease;
  }

  ${GameCardContainer}:hover & {
    transform: translateY(-2px);
    box-shadow:
      0 6px 20px rgba(0, 210, 255, 0.4),
      0 0 30px rgba(0, 210, 255, 0.15);
    filter: brightness(1.15);

    &::after {
      left: 100%;
    }
  }

  ${GameCardContainer}:active & {
    transform: translateY(0);
  }

  @media (prefers-reduced-motion: reduce) {
    &::after { display: none; }
    ${GameCardContainer}:hover & {
      transform: none;
      filter: brightness(1.1);
    }
  }
`;

export const ComingSoonCard = styled(GlassCard)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  opacity: 0.7;
  border-style: dashed;
`;
