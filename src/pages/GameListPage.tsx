import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/atoms/GlassCard';
import puzzleCardBg from '../assets/images/puzzle_card_bg.png';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const HeroSection = styled.div`
  text-align: center;
  margin-bottom: 60px;
  animation: fadeIn 1s ease-out;

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
`;

const HeroTitle = styled.h2`
  font-size: 3.5rem;
  margin-bottom: 16px;
  background: linear-gradient(to right, #fff, #a5f3fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 30px rgba(0, 210, 255, 0.3);
`;

const HeroSubtitle = styled.p`
  font-size: 1.2rem;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
`;

const BentoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  width: 100%;
`;

const GameCardContainer = styled(GlassCard)`
  display: flex;
  flex-direction: column;
  min-height: 300px;
  cursor: pointer;
  padding: 0;
`;

const CardImageArea = styled.div`
  height: 220px;
  background-image: url(${puzzleCardBg});
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

const CardContent = styled.div`
  padding: 24px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`;

const GameTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 12px;
  color: var(--text-primary);
`;

const GameDescription = styled.p`
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 20px;
  flex-grow: 1;
`;

const PlayButton = styled.button`
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

const ComingSoonCard = styled(GlassCard)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  opacity: 0.7;
  border-style: dashed;
`;

const GameListPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageContainer>
      <HeroSection>
        <HeroTitle>Game Platform</HeroTitle>
        <HeroSubtitle>厳選されたインタラクティブなゲーム体験を、ここから始めよう。</HeroSubtitle>
      </HeroSection>

      <BentoGrid>
        <GameCardContainer onClick={() => navigate('/puzzle')}>
          <CardImageArea />
          <CardContent>
            <GameTitle>Picture Puzzle</GameTitle>
            <GameDescription>
              美しい画像を使ったクラシックなスライドパズル。
              難易度調整機能付きで、初心者から上級者まで楽しめます。
            </GameDescription>
            <PlayButton>
              Play Now <span>→</span>
            </PlayButton>
          </CardContent>
        </GameCardContainer>

        <ComingSoonCard>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>🚧</div>
          <h3 style={{ color: 'var(--text-secondary)' }}>Coming Soon</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            New games in development
          </p>
        </ComingSoonCard>
      </BentoGrid>
    </PageContainer>
  );
};

export default GameListPage;
