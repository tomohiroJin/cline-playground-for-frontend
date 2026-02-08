import React from 'react';
import { useNavigate } from 'react-router-dom';
import puzzleCardBg from '../assets/images/puzzle_card_bg.webp';
import airHockeyCardBg from '../assets/images/air_hockey_card_bg.webp';
import racingCardBg from '../assets/images/racing_card_bg.webp';
import fallingShooterCardBg from '../assets/images/falling_shooter_card_bg.webp';
import mazeHorrorCardBg from '../assets/images/maze_horror_card_bg.webp';
import deepSeaShooterCardBg from '../assets/images/deep_sea_shooter_card_bg.webp';
import nonBrakeDescentCardBg from '../assets/images/non_brake_descent_card_bg.webp';
import ipneCardBg from '../assets/images/ipne_card_bg.webp';
import agileQuizSugorokuCardBg from '../assets/images/agile_quiz_sugoroku_card_bg.webp';
import labyrinthEchoCardBg from '../assets/images/labyrinth_echo_card_bg.webp';
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

      <BentoGrid aria-label="提供中のゲーム一覧">
        <GameCardContainer
          onClick={() => navigate('/puzzle')}
          role="button"
          aria-label="Picture Puzzle ゲームをプレイする"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/puzzle');
            }
          }}
        >
          <CardImageArea
            $bgImage={puzzleCardBg}
            role="img"
            aria-label="Picture Puzzleのゲーム画面プレビュー"
          />
          <CardContent>
            <CardTitle>Picture Puzzle</CardTitle>
            <GameDescription>
              美しい画像を使ったクラシックなスライドパズル。
              難易度調整機能付きで、初心者から上級者まで楽しめます。
            </GameDescription>
            <PlayButton aria-hidden="true" tabIndex={-1}>
              Play Now <span>→</span>
            </PlayButton>
          </CardContent>
        </GameCardContainer>

        <GameCardContainer
          onClick={() => navigate('/air-hockey')}
          role="button"
          aria-label="Air Hockey ゲームをプレイする"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/air-hockey');
            }
          }}
        >
          <CardImageArea
            $bgImage={airHockeyCardBg}
            role="img"
            aria-label="Air Hockeyのゲーム画面プレビュー"
          ></CardImageArea>
          <CardContent>
            <CardTitle>Air Hockey</CardTitle>
            <GameDescription>
              アイテムや障害物が登場する、ハイスピードなエアホッケー対戦！
              スプリットパックや透明化など、多彩なギミックでCPUに挑もう。
            </GameDescription>
            <PlayButton aria-hidden="true" tabIndex={-1}>
              Play Now <span>→</span>
            </PlayButton>
          </CardContent>
        </GameCardContainer>

        <GameCardContainer
          onClick={() => navigate('/racing')}
          role="button"
          aria-label="Racing Game ゲームをプレイする"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/racing');
            }
          }}
        >
          <CardImageArea
            $bgImage={racingCardBg}
            role="img"
            aria-label="Racing Gameのゲーム画面プレビュー"
          />
          <CardContent>
            <CardTitle>Racing Game</CardTitle>
            <GameDescription>
              ダイナミックなコースを駆け抜ける、トップダウンレーシング！
              2P対戦やCPU戦、多彩なコースとカスタマイズで最速を目指せ。
            </GameDescription>
            <PlayButton aria-hidden="true" tabIndex={-1}>
              Play Now <span>→</span>
            </PlayButton>
          </CardContent>
        </GameCardContainer>

        <GameCardContainer
          onClick={() => navigate('/falling-shooter')}
          role="button"
          aria-label="Falldown Shooter ゲームをプレイする"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/falling-shooter');
            }
          }}
        >
          <CardImageArea
            $bgImage={fallingShooterCardBg}
            role="img"
            aria-label="Falldown Shooterのゲーム画面プレビュー"
          />
          <CardContent>
            <CardTitle>Falldown Shooter</CardTitle>
            <GameDescription>
              迫りくるブロックを撃ち落とせ！ パズルとシューティングが融合した新感覚ゲーム。
              必殺技やパワーアップを駆使してハイスコアを目指そう。
            </GameDescription>
            <PlayButton aria-hidden="true" tabIndex={-1}>
              Play Now <span>→</span>
            </PlayButton>
          </CardContent>
        </GameCardContainer>

        <GameCardContainer
          onClick={() => navigate('/maze-horror')}
          role="button"
          aria-label="Labyrinth of Shadows ゲームをプレイする"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/maze-horror');
            }
          }}
        >
          <CardImageArea
            $bgImage={mazeHorrorCardBg}
            role="img"
            aria-label="Labyrinth of Shadowsのゲーム画面プレビュー"
          />
          <CardContent>
            <CardTitle>Labyrinth of Shadows</CardTitle>
            <GameDescription>
              迫りくる影から逃げながら鍵を集める3D迷宮ホラー。
              音を頼りに敵の位置を把握し、隠れながら脱出を目指せ。
              恐怖と緊張感のあるかくれんぼアクション。
            </GameDescription>
            <PlayButton aria-hidden="true" tabIndex={-1}>
              Play Now <span>→</span>
            </PlayButton>
          </CardContent>
        </GameCardContainer>

        <GameCardContainer
          onClick={() => navigate('/deep-sea-shooter')}
          role="button"
          aria-label="Deep Sea Interceptor ゲームをプレイする"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/deep-sea-shooter');
            }
          }}
        >
          <CardImageArea
            $bgImage={deepSeaShooterCardBg}
            role="img"
            aria-label="Deep Sea Interceptorのゲーム画面プレビュー"
          />
          <CardContent>
            <CardTitle>Deep Sea Interceptor</CardTitle>
            <GameDescription>
              深海を舞台にした縦スクロールシューティング。
              チャージショットとアイテムを駆使して、迫りくる深海の脅威を撃退せよ。
              美しい深海のビジュアルと爽快な破壊エフェクト。
            </GameDescription>
            <PlayButton aria-hidden="true" tabIndex={-1}>
              Play Now <span>→</span>
            </PlayButton>
          </CardContent>
        </GameCardContainer>

        <GameCardContainer
          onClick={() => navigate('/non-brake-descent')}
          role="button"
          aria-label="Non-Brake Descent ゲームをプレイする"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/non-brake-descent');
            }
          }}
        >
          <CardImageArea
            $bgImage={nonBrakeDescentCardBg}
            role="img"
            aria-label="Non-Brake Descentのゲーム画面プレビュー"
          />
          <CardContent>
            <CardTitle>Non-Brake Descent</CardTitle>
            <GameDescription>
              ハイスピード下り坂をノンブレーキで駆け抜けるスリリングアクション。
              ジャンプと加速を駆使して障害物を回避し、限界スコアに挑め。
            </GameDescription>
            <PlayButton aria-hidden="true" tabIndex={-1}>
              Play Now <span>→</span>
            </PlayButton>
          </CardContent>
        </GameCardContainer>

        <GameCardContainer
          onClick={() => navigate('/ipne')}
          role="button"
          aria-label="IPNE ゲームをプレイする"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/ipne');
            }
          }}
        >
          <CardImageArea
            $bgImage={ipneCardBg}
            role="img"
            aria-label="IPNEのゲーム画面プレビュー"
          />
          <CardContent>
            <CardTitle>IPNE</CardTitle>
            <GameDescription>
              シンプルな迷路脱出ゲーム。
              ゴールを目指して迷宮を探索し、脱出を目指せ。
              キーボードまたはタッチ操作に対応。
            </GameDescription>
            <PlayButton aria-hidden="true" tabIndex={-1}>
              Play Now <span>→</span>
            </PlayButton>
          </CardContent>
        </GameCardContainer>

        <GameCardContainer
          onClick={() => navigate('/agile-quiz-sugoroku')}
          role="button"
          aria-label="Agile Quiz Sugoroku ゲームをプレイする"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/agile-quiz-sugoroku');
            }
          }}
        >
          <CardImageArea
            $bgImage={agileQuizSugorokuCardBg}
            role="img"
            aria-label="Agile Quiz Sugorokuのゲーム画面プレビュー"
          />
          <CardContent>
            <CardTitle>Agile Quiz Sugoroku</CardTitle>
            <GameDescription>
              アジャイル・スクラム学習クイズゲーム。
              3スプリントを走破し、エンジニアタイプを診断。
              技術的負債が溜まると緊急対応イベントが発生！
            </GameDescription>
            <PlayButton aria-hidden="true" tabIndex={-1}>
              Play Now <span>→</span>
            </PlayButton>
          </CardContent>
        </GameCardContainer>

        <GameCardContainer
          onClick={() => navigate('/labyrinth-echo')}
          role="button"
          aria-label="迷宮の残響 ゲームをプレイする"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/labyrinth-echo');
            }
          }}
        >
          <CardImageArea
            $bgImage={labyrinthEchoCardBg}
            role="img"
            aria-label="迷宮の残響のゲーム画面プレビュー"
          />
          <CardContent>
            <CardTitle>迷宮の残響</CardTitle>
            <GameDescription>
              テキスト探索×判断×ローグライトRPG。
              不確かな情報の中で選択を重ね、迷宮からの生還を目指せ。
              周回で知見を継承し、深淵の攻略に挑む。
            </GameDescription>
            <PlayButton aria-hidden="true" tabIndex={-1}>
              Play Now <span>→</span>
            </PlayButton>
          </CardContent>
        </GameCardContainer>
      </BentoGrid>
    </PageContainer>
  );
};

export default GameListPage;
