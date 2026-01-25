import React, { useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import styled from 'styled-components';
import PuzzlePage from './pages/PuzzlePage';
import GameListPage from './pages/GameListPage';
import AirHockeyPage from './pages/AirHockeyPage';
import RacingGamePage from './pages/RacingGamePage';
import FallingShooterPage from './pages/FallingShooterPage';
import { GlobalStyle } from './styles/GlobalStyle';

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
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    transition: opacity 0.3s;

    &:hover {
      opacity: 0.8;
    }
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
          <Title>
            <Link to="/">Game Platform</Link>
          </Title>
        </Header>

        <Routes>
          <Route path="/" element={<GameListPage />} />
          <Route path="/puzzle" element={<PuzzlePage />} />
          <Route path="/air-hockey" element={<AirHockeyPage />} />
          <Route path="/racing" element={<RacingGamePage />} />
          <Route path="/falling-shooter" element={<FallingShooterPage />} />
        </Routes>

        <Footer>
          <p>© 2025 Game Platform</p>
        </Footer>
      </AppContainer>
    </>
  );
};

export default App;
