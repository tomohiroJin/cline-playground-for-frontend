import React from 'react';
import { Routes, Route } from 'react-router-dom';
import GameMenuPage from './pages/GameMenuPage';
import PuzzleGame from './pages/games/PuzzleGame';
import FallingBlockGame from './pages/games/FallingBlockGame';
import AirHockeyGame from './pages/games/AirHockeyGame';
import RacingGame from './pages/games/RacingGame';

/**
 * アプリケーションのルートコンポーネント
 */
const App: React.FC = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<GameMenuPage />} />
        <Route path="/puzzle" element={<PuzzleGame />} />
        <Route path="/falling-block" element={<FallingBlockGame />} />
        <Route path="/air-hockey" element={<AirHockeyGame />} />
        <Route path="/racing" element={<RacingGame />} />
      </Routes>
    </>
  );
};

export default App;
