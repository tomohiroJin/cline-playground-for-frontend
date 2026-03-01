import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import LoadingSpinner from './components/atoms/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import { GamePageWrapper } from './components/organisms/GamePageWrapper';
import { useDocumentTitle } from './hooks/useDocumentTitle';
import { useFullScreenRoute } from './hooks/useFullScreenRoute';

import GameListPage from './pages/GameListPage';
import { GlobalStyle } from './styles/GlobalStyle';

const PuzzlePage = lazy(() => import('./pages/PuzzlePage'));
const AirHockeyPage = lazy(() => import('./pages/AirHockeyPage'));
const RacingGamePage = lazy(() => import('./pages/RacingGamePage'));
const FallingShooterPage = lazy(() => import('./pages/FallingShooterPage'));
const MazeHorrorPage = lazy(() => import('./pages/MazeHorrorPage'));
const NonBrakeDescentPage = lazy(() => import('./pages/NonBrakeDescentPage'));
const DeepSeaShooterPage = lazy(
  () => import(/* webpackChunkName: "DeepSeaShooterPage" */ './pages/DeepSeaShooterPage')
);
const IpnePage = lazy(
  () => import(/* webpackChunkName: "IpnePage" */ './pages/IpnePage')
);
const AgileQuizSugorokuPage = lazy(
  () => import(/* webpackChunkName: "AgileQuizSugorokuPage" */ './pages/AgileQuizSugorokuPage')
);
const LabyrinthEchoPage = lazy(
  () => import(/* webpackChunkName: "LabyrinthEchoPage" */ './pages/LabyrinthEchoPage')
);
const RiskLcdPage = lazy(
  () => import(/* webpackChunkName: "RiskLcdPage" */ './pages/RiskLcdPage')
);
const KeysAndArmsPage = lazy(
  () => import(/* webpackChunkName: "KeysAndArmsPage" */ './pages/KeysAndArmsPage')
);
const PrimalPathPage = lazy(
  () => import(/* webpackChunkName: "PrimalPathPage" */ './pages/PrimalPathPage')
);
const AboutPage = lazy(() => import('./pages/AboutPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));

// アプリケーションのルートコンテナ
const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  margin: 0 auto;
`;

// ヘッダーコンポーネント (Glassmorphism)
const Header = styled.header`
  text-align: center;
  padding: 20px 0;
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  margin-bottom: 0;
`;

// タイトルコンポーネント
const Title = styled.h1`
  font-size: 1.5rem;
  margin: 0;
  font-weight: 800;
  letter-spacing: -0.05em;

  a {
    text-decoration: none;
    background: linear-gradient(to right, #fff, #bbb);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    transition: opacity 0.3s;

    &:hover {
      opacity: 0.8;
    }
  }
`;

// フッターコンポーネント（Glassmorphism）
const Footer = styled.footer`
  margin-top: auto;
  text-align: center;
  padding: 30px 20px;
  color: var(--text-secondary);
  font-size: 0.8rem;
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--glass-border);
`;

// フッター内ナビゲーション（上段: サイト内リンク）
const FooterNav = styled.nav`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin-bottom: 16px;
`;

// フッターリンク（下線スライドインエフェクト付き）
const FooterLink = styled(Link)`
  color: var(--text-secondary);
  text-decoration: none;
  position: relative;
  transition: color 0.2s;

  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 1px;
    background: var(--accent-color);
    transition: width 0.3s ease;
  }

  &:hover {
    color: var(--accent-color);
  }

  &:hover::after {
    width: 100%;
  }
`;

// 姉妹サイト行（中段）
const SisterSiteRow = styled.div`
  margin-bottom: 16px;
  font-size: 0.8rem;
`;

// 姉妹サイトの外部リンク
const SisterSiteLink = styled.a`
  color: var(--accent-color);
  text-decoration: none;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
    text-decoration: underline;
  }
`;

// コピーライト行（下段）
const CopyrightRow = styled.p`
  font-size: 0.75rem;
  opacity: 0.7;
`;

// フルスクリーンゲーム用フローティングホームボタン
const FloatingHomeButton = styled.button`
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 200;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

/**
 * アプリケーションのルートコンポーネント
 */
const App: React.FC = () => {
  const isFullScreen = useFullScreenRoute();
  const navigate = useNavigate();

  // 動的タイトル設定
  useDocumentTitle();

  // プレミアムテーマを適用
  useEffect(() => {
    document.body.classList.add('premium-theme');
    return () => {
      document.body.classList.remove('premium-theme');
    };
  }, []);

  return (
    <>
      <GlobalStyle />
      <AppContainer>
        {!isFullScreen && (
          <Header>
            <nav aria-label="Global Navigation">
              <Title>
                <Link to="/">Game Platform</Link>
              </Title>
            </nav>
          </Header>
        )}

        {isFullScreen && (
          <FloatingHomeButton
            onClick={() => navigate('/')}
            aria-label="ホームに戻る"
            type="button"
          >
            ⌂
          </FloatingHomeButton>
        )}

        <ErrorBoundary>
          <Suspense
            fallback={
              <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
                <LoadingSpinner size="large" message="Loading game..." />
              </div>
            }
          >
            <main id="main-content" role="main">
              <Routes>
                <Route path="/" element={<GameListPage />} />
                <Route path="/puzzle" element={<GamePageWrapper><PuzzlePage /></GamePageWrapper>} />
                <Route path="/air-hockey" element={<GamePageWrapper><AirHockeyPage /></GamePageWrapper>} />
                <Route path="/racing" element={<GamePageWrapper><RacingGamePage /></GamePageWrapper>} />
                <Route path="/falling-shooter" element={<GamePageWrapper><FallingShooterPage /></GamePageWrapper>} />
                <Route path="/maze-horror" element={<GamePageWrapper><MazeHorrorPage /></GamePageWrapper>} />
                <Route path="/non-brake-descent" element={<GamePageWrapper><NonBrakeDescentPage /></GamePageWrapper>} />
                <Route path="/deep-sea-shooter" element={<GamePageWrapper><DeepSeaShooterPage /></GamePageWrapper>} />
                <Route path="/ipne" element={<GamePageWrapper><IpnePage /></GamePageWrapper>} />
                <Route path="/agile-quiz-sugoroku" element={<GamePageWrapper><AgileQuizSugorokuPage /></GamePageWrapper>} />
                <Route path="/labyrinth-echo" element={<GamePageWrapper><LabyrinthEchoPage /></GamePageWrapper>} />
                <Route path="/risk-lcd" element={<GamePageWrapper><RiskLcdPage /></GamePageWrapper>} />
                <Route path="/keys-and-arms" element={<GamePageWrapper><KeysAndArmsPage /></GamePageWrapper>} />
                <Route path="/primal-path" element={<GamePageWrapper><PrimalPathPage /></GamePageWrapper>} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/contact" element={<ContactPage />} />
              </Routes>
            </main>
          </Suspense>
        </ErrorBoundary>

        {!isFullScreen && (
          <Footer>
            <FooterNav aria-label="Footer Navigation">
              <FooterLink to="/">ホーム</FooterLink>
              <FooterLink to="/about">サイトについて</FooterLink>
              <FooterLink to="/privacy-policy">プライバシーポリシー</FooterLink>
              <FooterLink to="/terms">利用規約</FooterLink>
              <FooterLink to="/contact">お問い合わせ</FooterLink>
            </FooterNav>
            <SisterSiteRow>
              姉妹サイト:{' '}
              <SisterSiteLink
                href="https://gallery.niku9.click"
                target="_blank"
                rel="noopener noreferrer"
              >
                Gallery NIKU9 桜花-Click
              </SisterSiteLink>
            </SisterSiteRow>
            <CopyrightRow>&copy; 2026 niku9.click All Rights Reserved.</CopyrightRow>
          </Footer>
        )}
      </AppContainer>
    </>
  );
};

export default App;
