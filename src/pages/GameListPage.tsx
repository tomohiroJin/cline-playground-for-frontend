import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useLazyImage } from '../hooks/useLazyImage';
import { useItemListSchema } from '../hooks/useItemListSchema';
import { HomeParallaxBg } from '../components/organisms/HomeParallaxBg';
import { ParticleField } from '../components/atoms/ParticleField';
import { TypeWriter } from '../components/atoms/TypeWriter';
import { CountUp } from '../components/atoms/CountUp';

// ファーストビュー（上位3枚）のみ static import
import puzzleCardBg from '../assets/images/puzzle_card_bg.webp';
import airHockeyCardBg from '../assets/images/air_hockey_card_bg.webp';
import racingCardBg from '../assets/images/racing_card_bg.webp';

import {
  PageContainer,
  ContentWrapper,
  HeroSection,
  HeroTitle,
  HeroSubtitle,
  GameCounter,
  BentoGrid,
  GameCardContainer,
  CardImageArea,
  CardImage,
  CardContent,
  CardTitle,
  GameDescription,
  PlayButton,
} from './GameListPage.styles';

/** ゲームカードのデータ定義 */
interface GameCardData {
  id: string;
  path: string;
  title: string;
  description: string;
  ariaLabel: string;
  imageAriaLabel: string;
  /** static import 済み画像（ファーストビュー用） */
  staticImage?: string;
  /** dynamic import 関数（遅延読み込み用） */
  importImage?: () => Promise<{ default: string }>;
}

/** ファーストビューに表示するカードの数 */
const EAGER_CARD_COUNT = 3;

/** 全ゲームカードの定義 */
const GAME_CARDS: GameCardData[] = [
  {
    id: 'puzzle',
    path: '/puzzle',
    title: 'Picture Puzzle',
    description: '美しい画像を使ったクラシックなスライドパズル。難易度調整機能付きで、初心者から上級者まで楽しめます。',
    ariaLabel: 'Picture Puzzle ゲームをプレイする',
    imageAriaLabel: 'Picture Puzzleのゲーム画面プレビュー',
    staticImage: puzzleCardBg,
  },
  {
    id: 'air-hockey',
    path: '/air-hockey',
    title: 'Air Hockey',
    description: 'アイテムや障害物が登場する、ハイスピードなエアホッケー対戦！スプリットパックや透明化など、多彩なギミックでCPUに挑もう。',
    ariaLabel: 'Air Hockey ゲームをプレイする',
    imageAriaLabel: 'Air Hockeyのゲーム画面プレビュー',
    staticImage: airHockeyCardBg,
  },
  {
    id: 'racing',
    path: '/racing',
    title: 'Racing Game',
    description: 'ダイナミックなコースを駆け抜ける、トップダウンレーシング！2P対戦やCPU戦、多彩なコースとカスタマイズで最速を目指せ。',
    ariaLabel: 'Racing Game ゲームをプレイする',
    imageAriaLabel: 'Racing Gameのゲーム画面プレビュー',
    staticImage: racingCardBg,
  },
  {
    id: 'falling-shooter',
    path: '/falling-shooter',
    title: 'Falldown Shooter',
    description: '迫りくるブロックを撃ち落とせ！ パズルとシューティングが融合した新感覚ゲーム。必殺技やパワーアップを駆使してハイスコアを目指そう。',
    ariaLabel: 'Falldown Shooter ゲームをプレイする',
    imageAriaLabel: 'Falldown Shooterのゲーム画面プレビュー',
    importImage: () => import(/* webpackChunkName: "img-falling-shooter" */ '../assets/images/falling_shooter_card_bg.webp'),
  },
  {
    id: 'maze-horror',
    path: '/maze-horror',
    title: 'Labyrinth of Shadows',
    description: '迫りくる影から逃げながら鍵を集める3D迷宮ホラー。音を頼りに敵の位置を把握し、隠れながら脱出を目指せ。恐怖と緊張感のあるかくれんぼアクション。',
    ariaLabel: 'Labyrinth of Shadows ゲームをプレイする',
    imageAriaLabel: 'Labyrinth of Shadowsのゲーム画面プレビュー',
    importImage: () => import(/* webpackChunkName: "img-maze-horror" */ '../assets/images/maze_horror_card_bg.webp'),
  },
  {
    id: 'deep-sea-shooter',
    path: '/deep-sea-shooter',
    title: 'Deep Sea Interceptor',
    description: '深海を舞台にした縦スクロールシューティング。チャージショットとアイテムを駆使して、迫りくる深海の脅威を撃退せよ。美しい深海のビジュアルと爽快な破壊エフェクト。',
    ariaLabel: 'Deep Sea Interceptor ゲームをプレイする',
    imageAriaLabel: 'Deep Sea Interceptorのゲーム画面プレビュー',
    importImage: () => import(/* webpackChunkName: "img-deep-sea" */ '../assets/images/deep_sea_shooter_card_bg.webp'),
  },
  {
    id: 'non-brake-descent',
    path: '/non-brake-descent',
    title: 'Non-Brake Descent',
    description: 'ハイスピード下り坂をノンブレーキで駆け抜けるスリリングアクション。ジャンプと加速を駆使して障害物を回避し、限界スコアに挑め。',
    ariaLabel: 'Non-Brake Descent ゲームをプレイする',
    imageAriaLabel: 'Non-Brake Descentのゲーム画面プレビュー',
    importImage: () => import(/* webpackChunkName: "img-non-brake" */ '../assets/images/non_brake_descent_card_bg.webp'),
  },
  {
    id: 'ipne',
    path: '/ipne',
    title: 'IPNE',
    description: 'シンプルな迷路脱出ゲーム。ゴールを目指して迷宮を探索し、脱出を目指せ。キーボードまたはタッチ操作に対応。',
    ariaLabel: 'IPNE ゲームをプレイする',
    imageAriaLabel: 'IPNEのゲーム画面プレビュー',
    importImage: () => import(/* webpackChunkName: "img-ipne" */ '../assets/images/ipne_card_bg.webp'),
  },
  {
    id: 'agile-quiz-sugoroku',
    path: '/agile-quiz-sugoroku',
    title: 'Agile Quiz Sugoroku',
    description: 'アジャイル・スクラム学習クイズゲーム。3スプリントを走破し、エンジニアタイプを診断。技術的負債が溜まると緊急対応イベントが発生！',
    ariaLabel: 'Agile Quiz Sugoroku ゲームをプレイする',
    imageAriaLabel: 'Agile Quiz Sugorokuのゲーム画面プレビュー',
    importImage: () => import(/* webpackChunkName: "img-agile-quiz" */ '../assets/images/agile_quiz_sugoroku_card_bg.webp'),
  },
  {
    id: 'labyrinth-echo',
    path: '/labyrinth-echo',
    title: '迷宮の残響',
    description: 'テキスト探索×判断×ローグライトRPG。不確かな情報の中で選択を重ね、迷宮からの生還を目指せ。周回で知見を継承し、深淵の攻略に挑む。',
    ariaLabel: '迷宮の残響 ゲームをプレイする',
    imageAriaLabel: '迷宮の残響のゲーム画面プレビュー',
    importImage: () => import(/* webpackChunkName: "img-labyrinth-echo" */ '../assets/images/labyrinth_echo_card_bg.webp'),
  },
  {
    id: 'risk-lcd',
    path: '/risk-lcd',
    title: 'RISK LCD',
    description: '液晶ゲーム機風の3レーン回避アクション×ローグライト。予告を読み、パークを重ねてビルドを構築。リスクとリターンのバランスで高スコアを狙え。',
    ariaLabel: 'RISK LCD ゲームをプレイする',
    imageAriaLabel: 'RISK LCDのゲーム画面プレビュー',
    importImage: () => import(/* webpackChunkName: "img-risk-lcd" */ '../assets/images/risk_lcd_card_bg.webp'),
  },
  {
    id: 'keys-and-arms',
    path: '/keys-and-arms',
    title: 'KEYS & ARMS',
    description: 'レトロLCD風の3ステージアクション。洞窟、草原、城塞を巡りながらスコアを積み上げる。キーボードとタッチの両操作に対応。',
    ariaLabel: 'KEYS & ARMS ゲームをプレイする',
    imageAriaLabel: 'KEYS & ARMSのゲーム画面プレビュー',
    importImage: () => import(/* webpackChunkName: "img-keys-arms" */ '../assets/images/keys_and_arms_card_bg.webp'),
  },
  {
    id: 'primal-path',
    path: '/primal-path',
    title: '原始進化録 - PRIMAL PATH',
    description: '三大文明を育て進化を重ねる自動戦闘ローグライト。シナジービルド・ランダムイベント・実績＆チャレンジで毎回異なる冒険が待つ。',
    ariaLabel: '原始進化録 - PRIMAL PATH ゲームをプレイする',
    imageAriaLabel: '原始進化録 - PRIMAL PATHのゲーム画面プレビュー',
    importImage: () => import(/* webpackChunkName: "img-primal-path" */ '../assets/images/primal_path_card_bg.webp'),
  },
];

/** 個別ゲームカードコンポーネント */
const GameCard: React.FC<{ card: GameCardData; index: number }> = ({ card, index }) => {
  const navigate = useNavigate();
  const isEager = index < EAGER_CARD_COUNT;

  // static import がある場合はそのまま使用、ない場合は遅延読み込み
  const { ref, src: lazySrc } = useLazyImage(
    card.importImage ?? (() => Promise.resolve({ default: '' })),
    isEager || !!card.staticImage
  );

  const imageSrc = card.staticImage ?? lazySrc;

  const handleClick = useCallback(() => {
    navigate(card.path);
  }, [navigate, card.path]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigate(card.path);
      }
    },
    [navigate, card.path]
  );

  return (
    <GameCardContainer
      onClick={handleClick}
      role="button"
      aria-label={card.ariaLabel}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <CardImageArea ref={ref}>
        {imageSrc && (
          <CardImage
            src={imageSrc}
            alt={card.imageAriaLabel}
            fetchPriority={index === 0 ? 'high' : undefined}
            loading={isEager ? 'eager' : 'lazy'}
          />
        )}
      </CardImageArea>
      <CardContent>
        <CardTitle>{card.title}</CardTitle>
        <GameDescription>{card.description}</GameDescription>
        <PlayButton aria-hidden="true" tabIndex={-1}>
          Play Now <span>→</span>
        </PlayButton>
      </CardContent>
    </GameCardContainer>
  );
};

const GameListPage: React.FC = () => {
  // ホームページ用 ItemList 構造化データを挿入
  useItemListSchema();
  const gridRef = useScrollReveal<HTMLElement>();

  const cards = useMemo(
    () =>
      GAME_CARDS.map((card, index) => (
        <GameCard key={card.id} card={card} index={index} />
      )),
    []
  );

  return (
    <PageContainer>
      <HomeParallaxBg />
      <ParticleField count={25} speed={1} />
      <ContentWrapper>
        <HeroSection>
          <HeroTitle>Game Platform</HeroTitle>
          <HeroSubtitle>
            <TypeWriter
              text="厳選されたインタラクティブなゲーム体験を、ここから始めよう。"
              speed={50}
            />
          </HeroSubtitle>
          <GameCounter>
            <CountUp end={13} duration={1500} suffix=" Games" />
          </GameCounter>
        </HeroSection>

        <BentoGrid ref={gridRef} aria-label="提供中のゲーム一覧">
          {cards}
        </BentoGrid>
      </ContentWrapper>
    </PageContainer>
  );
};

export default GameListPage;
