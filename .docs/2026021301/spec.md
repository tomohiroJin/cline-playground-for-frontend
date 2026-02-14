# リファクタリング仕様書

## 共通ルール

### ファイル命名規則

- ファイル名: **kebab-case**（例: `game-logic.ts`, `maze-service.ts`）
- コンポーネント名: **PascalCase**（例: `PlayerSprite.tsx`, `VolumeControl.tsx`）
- テストファイル: `*.test.ts` / `*.test.tsx`

### ファイルサイズ目標

- **1ファイル300行以下**（データ定義・定数配列を除く）
- **1ファイル7関心事以下**

### 分離原則

- 純粋関数を React コンポーネントから分離
- 副作用（Audio, Canvas, DOM 操作）はカスタムフック内に閉じ込める
- 型定義は `types.ts` に集約
- 定数は `constants.ts` に集約
- スタイルは `styles.ts` または CSS Modules に集約

### 標準ディレクトリ構成

```
src/features/{game-name}/
  ├── types.ts          # 型定義
  ├── constants.ts      # 定数
  ├── game-logic.ts     # ゲームロジック（純粋関数）
  ├── entities.ts       # エンティティ生成・管理
  ├── renderer.ts(x)    # 描画関連
  ├── audio.ts          # Web Audio API 関連
  ├── hooks.ts          # カスタムフック
  ├── styles.ts         # スタイル定義
  ├── {GameName}Game.tsx # メインゲームコンポーネント
  ├── index.ts          # re-export
  ├── components/       # UIサブコンポーネント
  │   └── *.tsx
  └── __tests__/        # テストファイル
      └── *.test.ts(x)
```

> **注**: ゲームの複雑さに応じてファイル構成は調整する。上記はあくまで標準パターン。

---

## 各ゲーム分割仕様

### 1. Racing Game（P1）

**現状**: `src/pages/RacingGamePage.tsx`（1,820行）に全ロジック集約

**移動先**: `src/features/racing-game/`

**ファイル分割**:

| ファイル | 責務 | 抽出元 |
|---------|------|--------|
| `types.ts` | Player, Enemy, Track, GameState 等の型定義 | RacingGamePage.tsx 冒頭 |
| `constants.ts` | コース定義、速度定数、色定数 | RacingGamePage.tsx 冒頭 |
| `utils.ts` | 数学ヘルパー（lerp, clamp, distance 等） | RacingGamePage.tsx 内の関数 |
| `audio.ts` | Web Audio API 初期化・サウンド生成 | RacingGamePage.tsx 内の Audio 関連 |
| `entities.ts` | プレイヤー・敵車の生成・更新 | RacingGamePage.tsx 内のエンティティ関連 |
| `track.ts` | コース生成・道路ジオメトリ計算 | RacingGamePage.tsx 内のトラック関連 |
| `renderer.ts` | Canvas 描画関数群 | RacingGamePage.tsx 内の render 関連 |
| `game-logic.ts` | 衝突判定・スコア計算・状態遷移 | RacingGamePage.tsx 内のロジック |
| `hooks.ts` | useGameLoop, useInput 等のカスタムフック | RacingGamePage.tsx 内のフック |
| `components/VolumeControl.tsx` | 音量調節UI | RacingGamePage.tsx 内の音量UI |
| `RacingGame.tsx` | メインゲームコンポーネント（Canvas + 状態管理） | RacingGamePage.tsx のコンポーネント部 |
| `index.ts` | re-export | 新規作成 |

**ページファイル変更**: `RacingGamePage.tsx` は `RacingGame` を import する薄いラッパーに変更

---

### 2. Labyrinth of Shadows（P1）

**現状**: `src/pages/MazeHorrorPage.tsx`（1,613行）に全ロジック集約

**移動先**: `src/features/labyrinth-of-shadows/`

**ファイル分割**:

| ファイル | 責務 | 抽出元 |
|---------|------|--------|
| `types.ts` | Maze, Player, Enemy, GameState 等の型定義 | MazeHorrorPage.tsx 冒頭 |
| `constants.ts` | 迷路サイズ、タイルサイズ、色定数 | MazeHorrorPage.tsx 冒頭 |
| `utils.ts` | 座標変換・距離計算等のヘルパー | MazeHorrorPage.tsx 内の関数 |
| `audio.ts` | Web Audio API 初期化・サウンド生成 | MazeHorrorPage.tsx 内の Audio 関連 |
| `maze-service.ts` | 迷路生成アルゴリズム・経路探索 | MazeHorrorPage.tsx 内の迷路生成関連 |
| `entity-factory.ts` | プレイヤー・敵の生成・AI | MazeHorrorPage.tsx 内のエンティティ関連 |
| `game-logic.ts` | 衝突判定・状態遷移・ゲーム進行 | MazeHorrorPage.tsx 内のロジック |
| `renderer.ts` | Canvas 描画関数群 | MazeHorrorPage.tsx 内の render 関連 |
| `hooks.ts` | useGameLoop, useInput 等のカスタムフック | MazeHorrorPage.tsx 内のフック |
| `components/Minimap.tsx` | ミニマップUI | MazeHorrorPage.tsx 内のミニマップ |
| `components/HUD.tsx` | ヘッドアップディスプレイ | MazeHorrorPage.tsx 内のHUD |
| `components/TitleScreen.tsx` | タイトル画面 | MazeHorrorPage.tsx 内のタイトル |
| `components/ResultScreen.tsx` | リザルト画面 | MazeHorrorPage.tsx 内のリザルト |
| `index.ts` | re-export | 新規作成 |

**ページファイル変更**: `MazeHorrorPage.tsx` は薄いラッパーに変更

---

### 3. Falldown Shooter（P1）

**現状**: `src/pages/FallingShooterPage.tsx`（1,602行）に全ロジック集約

**移動先**: `src/features/falldown-shooter/`

**ファイル分割**:

| ファイル | 責務 | 抽出元 |
|---------|------|--------|
| `types.ts` | Grid, Block, Bullet, Player, GameState 等の型定義 | FallingShooterPage.tsx 冒頭 |
| `constants.ts` | グリッドサイズ、速度定数、色定数 | FallingShooterPage.tsx 冒頭 |
| `utils.ts` | 共通ヘルパー関数 | FallingShooterPage.tsx 内の関数 |
| `audio.ts` | Web Audio API 初期化・サウンド生成 | FallingShooterPage.tsx 内の Audio 関連 |
| `grid.ts` | グリッド管理・操作 | FallingShooterPage.tsx 内のグリッド関連 |
| `block.ts` | ブロック生成・落下ロジック | FallingShooterPage.tsx 内のブロック関連 |
| `bullet.ts` | 弾丸生成・移動・管理 | FallingShooterPage.tsx 内の弾丸関連 |
| `collision.ts` | 衝突判定 | FallingShooterPage.tsx 内の衝突判定 |
| `game-logic.ts` | ゲーム進行・状態遷移・スコア計算 | FallingShooterPage.tsx 内のロジック |
| `stage.ts` | ステージ定義・難易度管理 | FallingShooterPage.tsx 内のステージ関連 |
| `hooks.ts` | useGameLoop, useInput 等のカスタムフック | FallingShooterPage.tsx 内のフック |
| `components/CellView.tsx` | セル描画コンポーネント | FallingShooterPage.tsx 内のセル描画 |
| `components/BulletView.tsx` | 弾丸描画コンポーネント | FallingShooterPage.tsx 内の弾丸描画 |
| `components/PlayerShip.tsx` | プレイヤー機体コンポーネント | FallingShooterPage.tsx 内のプレイヤー描画 |
| `components/SkillGauge.tsx` | スキルゲージUI | FallingShooterPage.tsx 内のスキルゲージ |
| `index.ts` | re-export | 新規作成 |

**ページファイル変更**: `FallingShooterPage.tsx` は薄いラッパーに変更

---

### 4. Deep Sea Interceptor（P1）

**現状**: `src/pages/DeepSeaShooterPage.tsx`（1,320行）に全ロジック集約

**移動先**: `src/features/deep-sea-interceptor/`

**ファイル分割**:

| ファイル | 責務 | 抽出元 |
|---------|------|--------|
| `types.ts` | Player, Enemy, Bullet, GameState 等の型定義 | DeepSeaShooterPage.tsx 冒頭 |
| `constants.ts` | 速度定数、画面サイズ、色定数 | DeepSeaShooterPage.tsx 冒頭 |
| `entities.ts` | エンティティ生成・初期化 | DeepSeaShooterPage.tsx 内のエンティティ関連 |
| `movement.ts` | 移動ロジック（プレイヤー・敵・弾丸） | DeepSeaShooterPage.tsx 内の移動関連 |
| `collision.ts` | 衝突判定 | DeepSeaShooterPage.tsx 内の衝突判定 |
| `enemy-ai.ts` | 敵AI・行動パターン | DeepSeaShooterPage.tsx 内の敵AI |
| `audio.ts` | Web Audio API 初期化・サウンド生成 | DeepSeaShooterPage.tsx 内の Audio 関連 |
| `game-logic.ts` | ゲーム進行・状態遷移・スコア計算 | DeepSeaShooterPage.tsx 内のロジック |
| `hooks.ts` | useGameLoop, useInput 等のカスタムフック | DeepSeaShooterPage.tsx 内のフック |
| `styles.ts` | スタイル定義 | DeepSeaShooterPage.tsx 内のスタイル |
| `components/PlayerSprite.tsx` | プレイヤー描画 | DeepSeaShooterPage.tsx 内のプレイヤー描画 |
| `components/EnemySprite.tsx` | 敵描画 | DeepSeaShooterPage.tsx 内の敵描画 |
| `components/BulletSprite.tsx` | 弾丸描画 | DeepSeaShooterPage.tsx 内の弾丸描画 |
| `components/HUD.tsx` | スコア・HP等のUI | DeepSeaShooterPage.tsx 内のHUD |
| `index.ts` | re-export | 新規作成 |

**ページファイル変更**: `DeepSeaShooterPage.tsx` は薄いラッパーに変更

---

### 5. Labyrinth Echo（P2）

**現状**: `src/features/labyrinth-echo/LabyrinthEchoGame.tsx`（4,133行）が巨大

**移動先**: 既存の `src/features/labyrinth-echo/` 内で分割

**ファイル分割**:

| ファイル | 責務 | 抽出元 |
|---------|------|--------|
| `contracts.ts` | 型定義・インターフェース | LabyrinthEchoGame.tsx 冒頭 |
| `audio.ts` | Web Audio API 関連 | LabyrinthEchoGame.tsx 内の Audio 関連 |
| `events/event-data.ts` | イベントデータ定義（約2,561行のデータ） | LabyrinthEchoGame.tsx 内のイベントデータ |
| `events/event-utils.ts` | イベント処理ユーティリティ | LabyrinthEchoGame.tsx 内のイベント関連関数 |
| `definitions.ts` | ゲーム定義・設定 | LabyrinthEchoGame.tsx 内の定義 |
| `styles.ts` | スタイル定義 | LabyrinthEchoGame.tsx 内のスタイル |
| `components/Page.tsx` | ページレイアウトコンポーネント | LabyrinthEchoGame.tsx 内のページ描画 |
| `components/Section.tsx` | セクションコンポーネント | LabyrinthEchoGame.tsx 内のセクション描画 |
| `components/Badge.tsx` | バッジコンポーネント | LabyrinthEchoGame.tsx 内のバッジ描画 |
| `hooks.ts` | カスタムフック | LabyrinthEchoGame.tsx 内のフック |
| `index.ts` | re-export | 新規作成 |

**目標**: `LabyrinthEchoGame.tsx` を約300行に縮小

---

### 6. Keys & Arms（P2）

**現状**: `src/features/keys-and-arms/engine.ts`（2,467行）が巨大

**移動先**: 既存の `src/features/keys-and-arms/` 内で分割

**ファイル分割**:

| ファイル | 責務 | 抽出元 |
|---------|------|--------|
| `types.ts` | ゲーム状態・エンティティの型定義 | engine.ts 冒頭 |
| `constants.ts` | ゲーム定数 | engine.ts 冒頭 |
| `core/math.ts` | 数学ユーティリティ | engine.ts 内の数学関数 |
| `core/rendering.ts` | Canvas 描画ユーティリティ | engine.ts 内の描画関数 |
| `core/particles.ts` | パーティクルシステム | engine.ts 内のパーティクル関連 |
| `core/audio.ts` | Web Audio API 関連 | engine.ts 内の Audio 関連 |
| `core/hud.ts` | HUD描画 | engine.ts 内のHUD描画 |
| `stages/cave/index.ts` | 洞窟ステージロジック | engine.ts 内の洞窟ステージ |
| `stages/prairie/index.ts` | 草原ステージロジック | engine.ts 内の草原ステージ |
| `stages/boss/index.ts` | ボスステージロジック | engine.ts 内のボスステージ |
| `screens/title.ts` | タイトル画面 | engine.ts 内のタイトル画面 |
| `screens/game-over.ts` | ゲームオーバー画面 | engine.ts 内のゲームオーバー画面 |
| `screens/ending.ts` | エンディング画面 | engine.ts 内のエンディング |
| `screens/true-end.ts` | トゥルーエンド画面 | engine.ts 内のトゥルーエンド |
| `index.ts` | re-export | 新規作成 |

**アーキテクチャ**: EngineContext パターン導入

```typescript
// EngineContext: 共有状態をコンテキストオブジェクトとして各モジュールに渡す
interface EngineContext {
  ctx: CanvasRenderingContext2D;
  state: GameState;
  audio: AudioManager;
  input: InputState;
  dt: number;
}
```

各ステージ・画面モジュールは `EngineContext` を受け取って処理を行う純粋な関数群として実装する。

---

### 7. Air Hockey（P3）

**現状**: `src/pages/AirHockeyPage.tsx`（751行）。core/ は既に分離済み

**移動先**: `src/features/air-hockey/`（既存 core/ は維持）

**ファイル分割**:

| ファイル | 責務 | 抽出元 |
|---------|------|--------|
| `hooks/useGameLoop.ts` | ゲームループフック | AirHockeyPage.tsx 内のゲームループ |
| `hooks/useInput.ts` | 入力処理フック | AirHockeyPage.tsx 内の入力処理 |
| `components/Field.tsx` | フィールド描画 | AirHockeyPage.tsx 内のフィールド描画 |
| `components/Scoreboard.tsx` | スコアボード | AirHockeyPage.tsx 内のスコアボード |
| `components/TitleScreen.tsx` | タイトル画面 | AirHockeyPage.tsx 内のタイトル画面 |
| `components/ResultScreen.tsx` | リザルト画面 | AirHockeyPage.tsx 内のリザルト画面 |
| `index.ts` | re-export | 新規作成 |

**注意**: 既存の `core/` ディレクトリはそのまま維持する

---

### 8. IPNE（P4）

**現状**: `src/pages/IpnePage.tsx`（2,028行）。テスト542件が存在

**移動先**: `src/features/ipne/presentation/` 配下に分割

**ファイル分割**:

| ファイル | 責務 | 抽出元 |
|---------|------|--------|
| `presentation/config.ts` | 画面設定・定数 | IpnePage.tsx 内の設定 |
| `presentation/screens/Title.tsx` | タイトル画面 | IpnePage.tsx 内のタイトル画面 |
| `presentation/screens/Prologue.tsx` | プロローグ画面 | IpnePage.tsx 内のプロローグ画面 |
| `presentation/screens/Game.tsx` | ゲーム画面 | IpnePage.tsx 内のゲーム画面 |
| `presentation/screens/Clear.tsx` | クリア画面 | IpnePage.tsx 内のクリア画面 |
| `presentation/hooks/useGameState.ts` | ゲーム状態管理フック | IpnePage.tsx 内の状態管理 |
| `presentation/hooks/useGameLoop.ts` | ゲームループフック | IpnePage.tsx 内のゲームループ |
| `index.ts` | re-export 更新 | 既存ファイル更新 |

**重要**: 既存542テストのインポートパス修正が必要。`index.ts` での re-export で対応する。

---

### 9. Risk LCD（P4）

**現状**: `src/features/risk-lcd/hooks/useGameEngine.ts`（1,033行）

**移動先**: `src/features/risk-lcd/hooks/phases/` 配下に分割

**ファイル分割**:

| ファイル | 責務 | 抽出元 |
|---------|------|--------|
| `phases/useRunningPhase.ts` | ランニングフェーズの状態管理 | useGameEngine.ts 内のランニングフェーズ |
| `phases/usePerkPhase.ts` | パークフェーズの状態管理 | useGameEngine.ts 内のパークフェーズ |
| `phases/useShopPhase.ts` | ショップフェーズの状態管理 | useGameEngine.ts 内のショップフェーズ |
| `phases/useResultPhase.ts` | リザルトフェーズの状態管理 | useGameEngine.ts 内のリザルトフェーズ |

**アーキテクチャ**: `useGameEngine` は各フェーズフックを組み合わせるオーケストレーターに変更

---

### 10. Non-Brake Descent（P4）

**現状**: `src/features/non-brake-descent/renderers.tsx`（880行）

**移動先**: `src/features/non-brake-descent/renderers/` サブディレクトリ

**ファイル分割**:

| ファイル | 責務 | 抽出元 |
|---------|------|--------|
| `renderers/environment/index.tsx` | 背景・地形描画 | renderers.tsx 内の環境描画 |
| `renderers/entities/index.tsx` | エンティティ描画 | renderers.tsx 内のエンティティ描画 |
| `renderers/effects/index.tsx` | エフェクト描画 | renderers.tsx 内のエフェクト描画 |
| `renderers/ui/index.tsx` | UI描画 | renderers.tsx 内のUI描画 |
| `renderers/index.tsx` | re-export | 新規作成 |

---

### 11. Agile Quiz Sugoroku（P4）

**現状**: `src/features/agile-quiz-sugoroku/components/styles.ts`（1,070行）

**移動先**: `src/features/agile-quiz-sugoroku/components/styles/` サブディレクトリ

**ファイル分割**:

| ファイル | 責務 | 抽出元 |
|---------|------|--------|
| `styles/animations.ts` | アニメーション定義 | styles.ts 内のアニメーション |
| `styles/layout.ts` | レイアウトスタイル | styles.ts 内のレイアウト |
| `styles/quiz.ts` | クイズ関連スタイル | styles.ts 内のクイズスタイル |
| `styles/result.ts` | リザルト画面スタイル | styles.ts 内のリザルトスタイル |
| `styles/common.ts` | 共通スタイル | styles.ts 内の共通スタイル |
| `styles/index.ts` | re-export | 新規作成 |

**追加作業**: コンポーネントテストの追加
