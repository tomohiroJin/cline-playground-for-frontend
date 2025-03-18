import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
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
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
