# Falldown Shooter ブラッシュアップ 仕様書

## 新機能仕様

---

### 1. ポーズ機能

#### 概要
ゲームプレイ中に一時停止できる機能。

#### 操作
- **Escape キー** または **P キー**: ポーズ ON/OFF トグル
- **ポーズボタン（⏸）**: ヘッダーに配置、タップでトグル

#### 動作仕様
- ポーズ中はすべてのゲームループ（スポーン、弾移動、ブロック落下、タイマー）を停止
- ポーズ画面を表示（半透明オーバーレイ）
- 再開ボタンまたは同じキーで復帰
- ポーズ中のキーボード操作（移動・射撃・スキル）は無効化

#### UI設計
```
┌──────────────────────┐
│                      │
│     ⏸ PAUSED         │
│                      │
│   [▶ Resume]         │
│   [🏠 Title]         │
│                      │
└──────────────────────┘
```

#### 型定義
```typescript
// types.ts に追加
export type GameStatus = 'idle' | 'playing' | 'paused' | 'clear' | 'over' | 'ending';
```

---

### 2. 難易度設定

#### 概要
Easy / Normal / Hard の3段階で難易度を選択できる機能。

#### 難易度パラメータ

| パラメータ | Easy | Normal | Hard |
|-----------|------|--------|------|
| スポーン間隔倍率 | 1.5x | 1.0x | 0.7x |
| 落下速度倍率 | 1.3x | 1.0x | 0.8x |
| スコア倍率 | 0.8x | 1.0x | 1.5x |
| パワーアップ出現率 | 20% | 15% | 10% |
| スキルチャージレート | 1.2x | 1.0x | 0.8x |

#### UI設計
スタート画面に難易度セレクターを追加:
```
┌──────────────────────┐
│  落ち物シューティング    │
│     ← → Space        │
│                      │
│   [Easy] [Normal] [Hard] │
│                      │
│     [Start]          │
└──────────────────────┘
```

#### 型定義
```typescript
// types.ts に追加
export type Difficulty = 'easy' | 'normal' | 'hard';

export interface DifficultyConfig {
  label: string;
  color: string;
  spawnMultiplier: number;
  fallMultiplier: number;
  scoreMultiplier: number;
  powerUpChance: number;
  skillChargeMultiplier: number;
}
```

#### データ保存
- スコア保存時に difficulty を含める
- ランキングは難易度別に分離
- ストレージキー: `game_score_falling-shooter_<difficulty>`（例: `game_score_falling-shooter_normal`）

#### 難易度パラメータの適用箇所（実装済み）

| パラメータ | 適用箇所 | 適用方法 |
|-----------|---------|---------|
| `spawnMultiplier` | `use-game-loop.ts` → `GameLogic.getSpawnInterval()` | スポーン間隔の計算に使用 |
| `fallMultiplier` | `use-game-loop.ts` → `GameLogic.getFallSpeed()` | 落下速度の計算に使用 |
| `scoreMultiplier` | `use-game-loop.ts` → 弾衝突・ライン消去スコア | `Math.round(score * scoreMultiplier)` |
| `powerUpChance` | `block.ts` → `Block.create()` 第3引数 | `Math.random() < powerUpChance` で判定 |
| `skillChargeMultiplier` | `use-skill-system.ts` → チャージ計算 | `chargeGain * skillChargeMultiplier` |

#### スコア保存タイミング（実装済み）

| タイミング | 保存内容 |
|-----------|---------|
| ゲームオーバー | `saveScore('falling-shooter', finalScore, difficulty)` |
| ステージクリア | `saveScore('falling-shooter', finalScore, difficulty)` |
| エンディング到達 | `saveScore('falling-shooter', finalScore, difficulty)` |

※ `finalScore` は `updateState` 前に計算し、`Object.assign` によるミューテーションでの二重加算を回避

---

### 3. ランキング機能

#### 概要
難易度別のトップ10スコアを表示する機能。

#### 表示場所
- スタート画面: 「ランキング」ボタン
- ゲームオーバー画面: スコア下部にランキングリンク
- エンディング画面: スコア下部にランキングリンク

#### UI設計
```
┌──────────────────────┐
│   🏆 ランキング        │
│                      │
│ [Easy] [Normal] [Hard] │
│                      │
│  1. 12,500  2025/02/25 │
│  2. 10,200  2025/02/24 │
│  3.  8,800  2025/02/23 │
│  ...                 │
│ 10.  1,200  2025/02/20 │
│                      │
│     [Close]          │
└──────────────────────┘
```

#### データソース
- 既存の `score-storage.ts` の `getScores()` を使用
- `getScores('falling-shooter', 10, difficulty)` でトップ10取得

---

## コンポーネント分割仕様

### カスタムフック一覧

#### `use-game-state.ts`
```typescript
interface UseGameStateReturn {
  state: GameState;
  stateRef: React.MutableRefObject<GameState>;
  updateState: (changes: Partial<GameState>) => void;
  resetState: (stage: number, score: number) => void;
}
```

#### `use-game-flow.ts`
```typescript
interface UseGameFlowParams {
  difficulty: Difficulty;  // 難易度（ハイスコア取得に使用）
  // ... 他のパラメータ
}

interface UseGameFlowReturn {
  status: GameStatus;
  setStatus: (status: GameStatus) => void;
  highScore: number;
  startStage: (num: number, score?: number) => void;
  goToTitle: () => void;
  resetGame: () => void;
  nextStage: () => void;
  loadHighScore: () => void;
}
```

#### `use-game-controls.ts`
```typescript
interface UseGameControlsReturn {
  playerX: number;
  moveLeft: () => void;
  moveRight: () => void;
  fire: () => void;
}
```

#### `use-skill-system.ts`
```typescript
interface UseSkillSystemParams {
  gameState: UseGameStateReturn;
  playerX: number;
  isPlaying: boolean;
  soundEnabled: boolean;
  skillChargeMultiplier: number;  // 難易度別チャージ速度倍率
}

interface UseSkillSystemReturn {
  skillCharge: number;
  setSkillCharge: (c: number | ((prev: number) => number)) => void;
  activateSkill: (skill: SkillType) => void;
  laserX: number | null;
  setLaserX: (x: number | null) => void;
  showBlast: boolean;
  setShowBlast: (v: boolean) => void;
}
```

#### `use-power-up.ts`
```typescript
interface UsePowerUpReturn {
  powers: Powers;
  explosions: ExplosionData[];
  handlePowerUp: (type: PowerType, x: number, y: number) => void;
  handlePowerExpire: (type: PowerType) => void;
}
```

#### `use-game-loop.ts`
```typescript
interface UseGameLoopParams {
  gameState: UseGameStateReturn;
  isPlaying: boolean;
  powers: { slow: boolean };
  soundEnabled: boolean;
  handlePowerUp: (type: PowerType, x: number, y: number) => void;
  setStatus: (status: GameStatus) => void;
  loadHighScore: () => void;
  difficulty: Difficulty;  // 難易度（スコア倍率・パワーアップ確率・スコア保存に使用）
}

// 4つの useInterval を統合管理
// difficulty から scoreMultiplier, powerUpChance を取得して適用
const useGameLoop: (params: UseGameLoopParams) => void;
```

---

## エラーハンドリング仕様

### audio.ts
- `AudioContext.state === 'suspended'` 時に `resume()` を呼出
- `window.AudioContext` 未対応時は `console.warn` で警告
- 各音声再生で try-catch（既存）を維持

### score-storage.ts
- `QuotaExceededError` 発生時に古いスコアを自動削除して再試行
- 最大保存件数: 100件（超過分は古い順に削除）
- クリーンアップ後も保存失敗時は `console.error` で警告

---

## React.memo 最適化対象

| コンポーネント | 比較対象 Props |
|--------------|---------------|
| CellComponent | x, y, color, size, power |
| BulletView | bullet.id, size |
| PlayerShip | x, y, size |
| StatusBar | stage, lines, linesNeeded, score |
| SkillGauge | charge, onUseSkill |
| PowerUpIndicator | powers |

---

## アクセシビリティ仕様

### ARIA Live Region
- スコア表示: `aria-live="polite"` — スコア更新通知
- ステージ表示: `aria-live="assertive"` — ステージ変更通知

### スキルゲージ
- `role="progressbar"`
- `aria-valuenow={charge}`
- `aria-valuemax={100}`
- `aria-label="スキルゲージ"`

### ボタン
- ポーズボタン: `aria-label="ゲームを一時停止"`
- サウンドボタン: `aria-label="サウンドの切り替え"`
- ヘルプボタン: `aria-label="ヘルプを表示"`
- コントロールボタン: `aria-label="左に移動"` / `aria-label="射撃"` / `aria-label="右に移動"`

### フォーカストラップ
- オーバーレイ表示中は Tab キーでオーバーレイ内の要素のみフォーカス

---

## レスポンシブ仕様

### セルサイズ計算
```typescript
// 画面幅に応じてセルサイズを動的計算
const cellSize = Math.floor(Math.min(
  (windowWidth - 32) / CONFIG.grid.width,  // 左右パディング 16px ずつ
  CONFIG.grid.cellSize                       // 最大30px
));
```

### ブレークポイント
- 360px 未満: セルサイズ自動縮小
- 360px ～ 768px: 標準サイズ
- 768px 以上: 標準サイズ（デスクトップ）
