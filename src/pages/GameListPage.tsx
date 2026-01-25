import React from 'react';
import { useNavigate } from 'react-router-dom';
import puzzleCardBg from '../assets/images/puzzle_card_bg.webp';
import airHockeyCardBg from '../assets/images/air_hockey_card_bg.webp';
import racingCardBg from '../assets/images/racing_card_bg.webp';
import fallingShooterCardBg from '../assets/images/falling_shooter_card_bg.png';
import {
  PageContainer,
  HeroSection,
  HeroTitle,
  HeroSubtitle,
  BentoGrid,
  GameCardContainer,
  CardImageArea,
  CardContent,
  CardTitle,
  GameDescription,
  PlayButton,
} from './GameListPage.styles';

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
          <CardImageArea $bgImage={puzzleCardBg} />
          <CardContent>
            <CardTitle>Picture Puzzle</CardTitle>
            <GameDescription>
              美しい画像を使ったクラシックなスライドパズル。
              難易度調整機能付きで、初心者から上級者まで楽しめます。
            </GameDescription>
            <PlayButton>
              Play Now <span>→</span>
            </PlayButton>
          </CardContent>
        </GameCardContainer>

        <GameCardContainer onClick={() => navigate('/air-hockey')}>
          <CardImageArea $bgImage={airHockeyCardBg}>🏒</CardImageArea>
          <CardContent>
            <CardTitle>Air Hockey</CardTitle>
            <GameDescription>
              アイテムや障害物が登場する、ハイスピードなエアホッケー対戦！
              スプリットパックや透明化など、多彩なギミックでCPUに挑もう。
            </GameDescription>
            <PlayButton>
              Play Now <span>→</span>
            </PlayButton>
          </CardContent>
        </GameCardContainer>

        <GameCardContainer onClick={() => navigate('/racing')}>
          <CardImageArea $bgImage={racingCardBg} />
          <CardContent>
            <CardTitle>Racing Game</CardTitle>
            <GameDescription>
              ダイナミックなコースを駆け抜ける、トップダウンレーシング！
              2P対戦やCPU戦、多彩なコースとカスタマイズで最速を目指せ。
            </GameDescription>
            <PlayButton>
              Play Now <span>→</span>
            </PlayButton>
          </CardContent>
        </GameCardContainer>

        <GameCardContainer onClick={() => navigate('/falling-shooter')}>
          <CardImageArea $bgImage={fallingShooterCardBg} />
          <CardContent>
            <CardTitle>Falldown Shooter</CardTitle>
            <GameDescription>
              迫りくるブロックを撃ち落とせ！ パズルとシューティングが融合した新感覚ゲーム。
              必殺技やパワーアップを駆使してハイスコアを目指そう。
            </GameDescription>
            <PlayButton>
              Play Now <span>→</span>
            </PlayButton>
          </CardContent>
        </GameCardContainer>
      </BentoGrid>
    </PageContainer>
  );
};

export default GameListPage;
