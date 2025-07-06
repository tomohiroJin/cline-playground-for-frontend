import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';

/**
 * アプリケーションのルートコンポーネント
 */
const App: React.FC = () => (
  <div className="flex flex-col min-h-screen max-w-[1200px] mx-auto p-5">
    <header className="text-center mb-8">
      <h1 className="text-2xl text-gray-800">絵合わせパズル</h1>
    </header>

    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>

    <footer className="mt-auto text-center py-5 text-gray-600 text-sm">
      <p>© 2025 絵合わせパズル</p>
    </footer>
  </div>
);

export default App;
