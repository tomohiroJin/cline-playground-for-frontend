import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import styled from 'styled-components';
import LoadingSpinner from './components/atoms/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import { SettingsPanel } from './components/organisms/SettingsPanel'; // Import SettingsPanel

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
`;

/**
 * アプリケーションのルートコンポーネント
 */
const App: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false); // Settings state

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
                <Route path="/puzzle" element={<PuzzlePage />} />
                <Route path="/air-hockey" element={<AirHockeyPage />} />
                <Route path="/racing" element={<RacingGamePage />} />
                <Route path="/falling-shooter" element={<FallingShooterPage />} />
                <Route path="/maze-horror" element={<MazeHorrorPage />} />
                <Route path="/non-brake-descent" element={<NonBrakeDescentPage />} />
                <Route path="/deep-sea-shooter" element={<DeepSeaShooterPage />} />
                <Route path="/ipne" element={<IpnePage />} />
              </Routes>
            </main>
          </Suspense>
        </ErrorBoundary>

        <Footer>
          <p>© 2025 Game Platform</p>
        </Footer>
      </AppContainer>
    </>
  );
};

export default App;
