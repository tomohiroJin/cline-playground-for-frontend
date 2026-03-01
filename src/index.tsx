import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { installAudioContextTracker } from './utils/audio-cleanup';

// AudioContext の追跡を開始
installAudioContextTracker();

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
