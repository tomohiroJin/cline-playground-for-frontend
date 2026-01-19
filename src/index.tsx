import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import './styles/index.css';
import App from './App';

// ルートコンテナを取得
const container = document.getElementById('root');

// コンテナが存在しない場合はエラーを投げる
if (!container) {
  throw new Error('Root element not found');
}

// ルートを作成
const root = createRoot(container);

// アプリケーションをレンダリング
root.render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
