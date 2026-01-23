import React from 'react';
import { Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import HomePage from './pages/HomePage';

// アプリケーションのルートコンテナ
const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

// ヘッダーコンポーネント
const Header = styled.header`
  text-align: center;
  margin-bottom: 30px;
`;

// タイトルコンポーネント
const Title = styled.h1`
  color: #333;
  font-size: 2rem;
`;

// フッターコンポーネント
const Footer = styled.footer`
  margin-top: auto;
  text-align: center;
  padding: 20px 0;
  color: #666;
  font-size: 0.9rem;
`;

/**
 * アプリケーションのルートコンポーネント
 */
const App: React.FC = () => {
  return (
    <AppContainer>
      <Header>
        <Title>絵合わせパズル</Title>
      </Header>
      
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
      
      <Footer>
        <p>© 2025 絵合わせパズル</p>
      </Footer>
    </AppContainer>
  );
};

export default App;
