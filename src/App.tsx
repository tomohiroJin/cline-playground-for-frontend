import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import LoadingSpinner from './components/atoms/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import { SettingsPanel } from './components/organisms/SettingsPanel';
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

const SettingsButton = styled.button`
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1.2rem;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-50%) rotate(45deg);
  }
`;

// フッターコンポーネント
const Footer = styled.footer`
  margin-top: auto;
  text-align: center;
  padding: 30px 0;
  color: var(--text-secondary);
  font-size: 0.8rem;
  background: rgba(0, 0, 0, 0.2);

  a {
    color: inherit;
    text-decoration: none;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.7;
    }
  }
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
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
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
              <SettingsButton onClick={() => setIsSettingsOpen(true)} aria-label="設定を開く">
                ⚙
              </SettingsButton>
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

        {isSettingsOpen && <SettingsPanel onClose={() => setIsSettingsOpen(false)} />}

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
              </Routes>
            </main>
          </Suspense>
        </ErrorBoundary>

        {!isFullScreen && (
          <Footer>
            <p>&copy; 2025 <a href="https://niku9.click/">niku9.click</a></p>
          </Footer>
        )}
      </AppContainer>
    </>
  );
};

export default App;
