import styled from 'styled-components';
import { GlassCard } from '../components/atoms/GlassCard';
import puzzleCardBg from '../assets/images/puzzle_card_bg.webp';

export const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

export const HeroSection = styled.header`
  text-align: center;
  margin-bottom: 60px;
  animation: fadeIn 1s ease-out;
  position: relative;
  overflow: visible;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* パーティクルアニメーション: 浮遊する光の粒 */
  @keyframes floatParticle {
    0% {
      opacity: 0;
      transform: translateY(60px) translateX(0);
    }
    20% {
      opacity: 1;
    }
    80% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translateY(-60px) translateX(20px);
    }
  }

  &::before,
  &::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
  }

  &::before {
    width: 4px;
    height: 4px;
    background: rgba(0, 210, 255, 0.6);
    top: 20%;
    left: 15%;
    animation: floatParticle 7s infinite ease-in-out;
  }

  &::after {
    width: 3px;
    height: 3px;
    background: rgba(165, 243, 252, 0.5);
    top: 40%;
    right: 20%;
    animation: floatParticle 9s infinite ease-in-out 3s;
  }

  @media (prefers-reduced-motion: reduce) {
    &::before,
    &::after {
      animation: none;
      opacity: 0.3;
    }
  }
`;

export const HeroTitle = styled.h2`
  font-size: 3.5rem;
  margin-bottom: 16px;
  background: linear-gradient(to right, #fff, #a5f3fc);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: titleGlow 4s ease-in-out infinite;

  /* タイトルグロウエフェクト: text-shadow の明滅 */
  @keyframes titleGlow {
    0%, 100% {
      text-shadow: 0 0 30px rgba(0, 210, 255, 0.3);
    }
    50% {
      text-shadow: 0 0 50px rgba(0, 210, 255, 0.5), 0 0 80px rgba(0, 210, 255, 0.2);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    text-shadow: 0 0 30px rgba(0, 210, 255, 0.3);
  }
`;

export const HeroSubtitle = styled.p`
  font-size: 1.2rem;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
`;

export const BentoGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  width: 100%;
`;

export const GameCardContainer = styled(GlassCard)`
  display: flex;
  flex-direction: column;
  min-height: 300px;
  cursor: pointer;
  padding: 0;

  /* ホバー時にシアンのボーダー + パープルのアウターグロウ */
  &:hover {
    border-color: rgba(0, 210, 255, 0.5);
    box-shadow:
      0 20px 40px rgba(0, 0, 0, 0.4),
      0 0 15px rgba(168, 85, 247, 0.3),
      inset 0 0 15px rgba(0, 210, 255, 0.05);
  }
`;

export const CardImageArea = styled.div<{ $bgImage?: string; $customBg?: string }>`
  height: 220px;
  background: ${props =>
    props.$bgImage ? `url(${props.$bgImage})` : props.$customBg || `url(${puzzleCardBg})`};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--glass-border);
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(0, 210, 255, 0.4), transparent 70%);
    transform: translate(-50%, -50%);
    filter: blur(20px);
    transition: 0.5s;
    opacity: 0;
  }

  ${GameCardContainer}:hover &::after {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.5);
  }
`;

export const CardContent = styled.div`
  padding: 24px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`;

export const CardTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 12px;
  color: var(--text-primary);
`;

export const GameDescription = styled.p`
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 20px;
  flex-grow: 1;
`;

export const PlayButton = styled.button`
  background: linear-gradient(135deg, var(--accent-color), #3a7bd5);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 210, 255, 0.3);
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 210, 255, 0.5);
    filter: brightness(1.1);
  }

  &:active {
    transform: translateY(0);
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
