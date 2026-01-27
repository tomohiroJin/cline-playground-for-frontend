# 仕様・要件定義

## フェーズ1: 品質基盤強化

### 1.1 コード分割（React.lazy + Suspense）

#### 要件

- 全ゲームページをReact.lazyで動的インポート
- Suspenseによるローディング表示
- 初期バンドルサイズの削減

#### 技術仕様

```typescript
// src/App.tsx
import React, { Suspense, lazy } from 'react';

const PuzzlePage = lazy(() => import('./pages/PuzzlePage'));
const AirHockeyPage = lazy(() => import('./pages/AirHockeyPage'));
const RacingGamePage = lazy(() => import('./pages/RacingGamePage'));
const FallingShooterPage = lazy(() => import('./pages/FallingShooterPage'));
const MazeHorrorPage = lazy(() => import('./pages/MazeHorrorPage'));
const DeepSeaShooterPage = lazy(() => import('./pages/DeepSeaShooterPage'));
```

#### 受け入れ基準

- [ ] 各ゲームページが個別チャンクとして出力される
- [ ] 初期ロード時にゲームページのコードが含まれない
- [ ] ページ遷移時にローディングスピナーが表示される

---

### 1.2 LoadingSpinnerコンポーネント

#### 要件

- 再利用可能なローディングインジケータ
- プラットフォームのデザインシステムに準拠
- サイズバリエーション対応（small, medium, large）

#### インターフェース

```typescript
interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}
```

#### デザイン仕様

- グラスモーフィズムスタイル
- アニメーション: 回転（1s linear infinite）
- カラー: `var(--accent-color)` (#00d2ff)

#### 受け入れ基準

- [ ] 3サイズ（24px, 48px, 72px）で表示可能
- [ ] オプションのメッセージテキスト表示
- [ ] ARIA属性（role="status", aria-live="polite"）

---

### 1.3 ErrorBoundaryコンポーネント

#### 要件

- Reactエラーバウンダリによるクラッシュ防止
- ユーザーフレンドリーなエラー表示
- ゲーム再開機能（リトライボタン）

#### インターフェース

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}
```

#### 機能仕様

- `componentDidCatch`でエラーログ出力
- デフォルトフォールバックUI提供
- 「ホームに戻る」「再試行」ボタン

#### 受け入れ基準

- [ ] 子コンポーネントのエラーをキャッチ
- [ ] エラー時にフォールバックUIを表示
- [ ] リトライ時に状態リセット

---

### 1.4 メタタグ・OGP対応

#### 要件

- SEO基本メタタグ
- Open Graph Protocol対応
- Twitter Card対応

#### 実装仕様

```html
<!-- public/index.html -->
<meta name="description" content="6種類の無料ブラウザゲームが楽しめるゲームプラットフォーム">
<meta name="keywords" content="ゲーム,パズル,エアホッケー,レース,シューター,ブラウザゲーム">

<!-- OGP -->
<meta property="og:title" content="Game Platform">
<meta property="og:description" content="6種類の無料ブラウザゲームが楽しめる">
<meta property="og:type" content="website">
<meta property="og:image" content="/images/og-image.png">
<meta property="og:url" content="https://example.com">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Game Platform">
<meta name="twitter:description" content="6種類の無料ブラウザゲームが楽しめる">
```

#### 受け入れ基準

- [ ] Google検索でdescriptionが表示される
- [ ] SNS共有時にOGP画像・説明が表示される

---

## フェーズ2: アクセシビリティ改善

### 2.1 セマンティックHTML

#### 要件

- 適切なランドマーク要素の使用
- スクリーンリーダーでの構造把握向上

#### 実装仕様

```tsx
// src/App.tsx
<AppContainer>
  <Header role="banner">
    <nav aria-label="メインナビゲーション">
      <Title>...</Title>
    </nav>
  </Header>

  <main role="main" id="main-content">
    <Routes>...</Routes>
  </main>

  <Footer role="contentinfo">...</Footer>
</AppContainer>
```

#### 対象要素

| 現在 | 変更後 |
|------|--------|
| `<div>` (コンテンツ) | `<main>` |
| `<div>` (ナビ) | `<nav>` |
| `<div>` (セクション) | `<section>` |

---

### 2.2 ARIA属性

#### 対象コンポーネント

**ゲームカード（GameListPage）**

```tsx
<GameCard
  role="article"
  aria-label={`${game.title}ゲーム`}
  tabIndex={0}
>
```

**Canvas要素（各ゲームページ）**

```tsx
<canvas
  ref={canvasRef}
  role="img"
  aria-label="ゲーム画面"
  tabIndex={0}
/>
```

**ボタン要素**

```tsx
<button
  aria-label="ゲームを開始"
  aria-pressed={isPlaying}
>
  {isPlaying ? '停止' : '開始'}
</button>
```

---

### 2.3 カラーコントラスト

#### WCAG AA基準

- 通常テキスト: 4.5:1以上
- 大きなテキスト（18px以上）: 3:1以上

#### 修正対象

| 要素 | 現在 | 修正後 | コントラスト比 |
|------|------|--------|---------------|
| `--text-secondary` | rgba(255,255,255,0.6) | rgba(255,255,255,0.75) | 4.5:1以上 |
| ボタンテキスト | #999 | #b3b3b3 | 4.5:1以上 |

---

### 2.4 画像alt属性

#### 対象ファイル

**GameListPage.tsx**

```tsx
<GameImage
  src={game.image}
  alt={`${game.title}のゲーム画面プレビュー`}
/>
```

**DefaultImageSelector（PuzzlePage）**

```tsx
<ImageOption
  src={image.url}
  alt={image.description || `パズル画像オプション${index + 1}`}
/>
```

---

## フェーズ3: テスト充実

### 3.1 ゲームページテスト

#### テスト観点

| テスト種別 | 内容 |
|-----------|------|
| レンダリング | コンポーネントがクラッシュせず描画される |
| 状態遷移 | menu → playing → gameover の遷移 |
| ユーザー操作 | キーボード・マウス入力への反応 |
| UI表示 | スコア、タイマー等の表示 |

#### テストケース例

```typescript
// FallingShooterPage.test.tsx
describe('FallingShooterPage', () => {
  it('renders without crashing', () => {
    render(<FallingShooterPage />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('shows start button on initial load', () => {
    render(<FallingShooterPage />);
    expect(screen.getByText(/スタート/i)).toBeInTheDocument();
  });

  it('transitions to playing state on start', async () => {
    render(<FallingShooterPage />);
    fireEvent.click(screen.getByText(/スタート/i));
    await waitFor(() => {
      expect(screen.queryByText(/スタート/i)).not.toBeInTheDocument();
    });
  });
});
```

---

### 3.2 useGameStateテスト

#### テスト観点

```typescript
// useGameState.test.ts
describe('useGameState', () => {
  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useGameState());
    expect(result.current.gameStarted).toBe(false);
  });

  it('handles difficulty change', () => {
    const { result } = renderHook(() => useGameState());
    act(() => {
      result.current.handleDifficultyChange(5);
    });
    expect(result.current.gameState.division).toBe(5);
  });

  it('resets game state correctly', () => {
    const { result } = renderHook(() => useGameState());
    act(() => {
      result.current.handleStartGame();
      result.current.handleResetGame();
    });
    expect(result.current.gameStarted).toBe(false);
  });
});
```

---

### 3.3 カバレッジ設定

#### Jest設定

```json
// package.json
{
  "jest": {
    "collectCoverage": true,
    "coverageDirectory": "coverage",
    "coverageReporters": ["text", "lcov", "html"],
    "coverageThreshold": {
      "global": {
        "branches": 40,
        "functions": 40,
        "lines": 50,
        "statements": 50
      }
    },
    "collectCoverageFrom": [
      "src/**/*.{ts,tsx}",
      "!src/**/*.d.ts",
      "!src/index.tsx"
    ]
  }
}
```

---

## フェーズ4: エンゲージメント向上

### 4.1 ハイスコア永続化

#### 技術仕様

```typescript
// src/utils/score-storage.ts
interface GameScore {
  gameId: string;
  score: number;
  timestamp: number;
  playerName?: string;
}

interface ScoreStorage {
  saveScore(gameId: string, score: number): Promise<void>;
  getHighScore(gameId: string): Promise<number | null>;
  getScoreHistory(gameId: string, limit?: number): Promise<GameScore[]>;
  clearScores(gameId: string): Promise<void>;
}
```

#### 永続化ストレージ
初期実装では `localStorage` を使用するが、将来的な `IndexedDB` への移行を見据えて非同期インターフェースを採用する。

```typescript
// Storage Key Structure
// format: game_score_${gameId}_${difficulty}
// value: JSON.stringify(ScoreRecord[])
```

---

### 4.2 SNSシェア機能

#### インターフェース

```typescript
interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  gameId: string;
  score?: number;
}
```

#### 共有テンプレート

```typescript
const shareText = `${gameTitle}で${score}点を獲得しました！ #GamePlatform`;
const shareUrl = `https://example.com/games/${gameId}`;
```

#### 対応プラットフォーム

- Twitter/X
- Web Share API（対応ブラウザ）

---

### 4.3 設定パネル

#### インターフェース

```typescript
interface GameSettings {
  masterVolume: number;      // 0-100
  sfxVolume: number;         // 0-100
  bgmVolume: number;         // 0-100
  controls: ControlScheme;   // 'keyboard' | 'mouse' | 'touch'
  showFps: boolean;
  reducedMotion: boolean;
}
```

#### UI仕様

- スライダー: 音量調整（0-100）
- トグル: 効果音ON/OFF、BGM ON/OFF
- ドロップダウン: 操作方法選択
- 保存: localStorageに自動保存

#### 永続化キー

```typescript
const SETTINGS_KEY = 'game-platform-settings';
```
