# Falldown Shooter リファクタリング仕様書

## 1. 概要

本仕様書は、Falldown Shooter ゲームの大規模リファクタリングにおける設計仕様を定義します。
リファクタリングの目的は、DDD レイヤー構造の導入、SOLID 原則の徹底、テスト品質の向上です。

**重要な制約:** 外部から見たゲームの振る舞い（ユーザー体験）は一切変更しません。

---

## 2. ドメインモデル仕様

### 2.1 Grid（グリッド値オブジェクト）

#### 責務
- ゲーム盤面のセル状態管理
- ライン消去判定
- 不変操作（すべての変更は新しいインスタンスを返す）

#### インターフェース

```typescript
interface IGrid {
  readonly width: number;
  readonly height: number;
  readonly cells: ReadonlyArray<ReadonlyArray<string | null>>;

  // クエリ
  getCell(x: number, y: number): string | null;
  isRowFull(y: number): boolean;
  findHighestRow(): number;
  isEmpty(): boolean;

  // コマンド（新しいインスタンスを返す）
  setCell(x: number, y: number, value: string | null): IGrid;
  clearRow(y: number): IGrid;
  clearColumn(x: number): { grid: IGrid; clearedCount: number };
  clearFullLines(): { grid: IGrid; clearedCount: number };
}
```

#### 契約（DbC）
- **事前条件:** `x` は `[0, width)` の範囲内、`y` は `[0, height)` の範囲内
- **不変条件:** `cells` の行数は常に `height` と等しく、各行の長さは `width` と等しい
- **事後条件:** `setCell` の後、指定座標の値が更新されている。元のインスタンスは変更されない

### 2.2 Block（ブロック値オブジェクト）

#### 責務
- ブロックの形状・位置・色・パワーアップ情報の保持
- セル座標の計算
- 移動可能性の判定

#### インターフェース

```typescript
interface IBlock {
  readonly id: string;
  readonly position: Position;    // { x: number; y: number }
  readonly shape: ReadonlyShape;  // ReadonlyArray<ReadonlyArray<number>>
  readonly color: string;
  readonly power: PowerType | null;

  // クエリ
  getCells(): ReadonlyArray<Cell>;
  getFutureCells(extraRows: number): ReadonlyArray<Cell>;
  canMoveTo(targetY: number, grid: IGrid, others: ReadonlyArray<IBlock>): boolean;

  // コマンド（新しいインスタンスを返す）
  moveTo(y: number): IBlock;
  toSingleCells(): ReadonlyArray<IBlock>;
}
```

#### 契約（DbC）
- **事前条件:** `shape` は空でない2次元配列
- **不変条件:** `id` は生成後変更されない
- **事後条件:** `moveTo` は新しい `IBlock` を返し、元の `position` は変更されない

### 2.3 Bullet（弾丸値オブジェクト）

#### 責務
- 弾丸の位置・方向・貫通属性の保持
- 移動処理
- 有効範囲の判定

#### インターフェース

```typescript
interface IBullet {
  readonly id: string;
  readonly position: Position;
  readonly direction: Direction;  // { dx: number; dy: number }
  readonly isPiercing: boolean;

  // クエリ
  isInBounds(width: number, height: number): boolean;

  // コマンド（新しいインスタンスを返す）
  move(): IBullet;
}
```

### 2.4 Score（スコア値オブジェクト）

#### 責務
- スコア計算ロジックの一元管理
- 同時消しボーナス、コンボ倍率、ステージ倍率、難易度倍率の適用

#### インターフェース

```typescript
interface IScoreCalculator {
  // ブロック破壊スコア
  calculateBlockScore(hitCount: number, scoreMultiplier: number): number;

  // ライン消しスコア
  calculateLineScore(params: {
    clearedLines: number;
    stage: number;
    scoreMultiplier: number;
    comboMultiplier: number;
  }): number;

  // スキル使用時のスコア
  calculateSkillScore(cellCount: number): number;
}
```

#### 契約（DbC）
- **事前条件:** 各パラメータは 0 以上の数値
- **事後条件:** 返り値は 0 以上の整数

---

## 3. ドメインサービス仕様

### 3.1 CollisionService（衝突判定サービス）

#### 責務
- 弾丸とブロック/グリッドの衝突判定
- 衝突マップの構築と管理
- 爆発範囲の計算

#### インターフェース

```typescript
interface ICollisionService {
  // 衝突マップの構築
  buildCollisionMap(blocks: ReadonlyArray<IBlock>, grid: IGrid): CollisionMap;

  // 弾丸の衝突判定（副作用なし、結果のみ返す）
  detectCollision(bullet: IBullet, collisionMap: CollisionMap): CollisionResult | null;

  // 爆発範囲の取得
  getExplosionArea(center: Position, grid: IGrid): ReadonlyArray<Cell>;
}

interface CollisionResult {
  target: CollisionTarget;
  position: Position;
}
```

### 3.2 SpawnService（ブロック生成サービス）

#### 責務
- ブロックの安全なスポーン位置決定
- スポーン可否の判定
- Factory パターンによるブロック生成

#### インターフェース

```typescript
interface ISpawnService {
  // スポーン可否の判定
  canSpawn(existingBlocks: ReadonlyArray<IBlock>): boolean;

  // ブロックの生成（配置位置決定を含む）
  spawnBlock(params: {
    gridWidth: number;
    existingBlocks: ReadonlyArray<IBlock>;
    powerUpChance: number;
  }): IBlock;
}
```

### 3.3 SkillService（スキルサービス）

#### 責務
- スキル発動処理の実行
- Strategy パターンによるスキル種類の拡張性確保

#### インターフェース

```typescript
// Strategy インターフェース
interface ISkillStrategy {
  execute(params: SkillExecuteParams): SkillExecuteResult;
}

interface SkillExecuteParams {
  blocks: ReadonlyArray<IBlock>;
  grid: IGrid;
  playerX: number;
}

interface SkillExecuteResult {
  blocks: ReadonlyArray<IBlock>;
  grid: IGrid;
  score: number;
  effects: SkillEffect[];
}

// スキルサービス
interface ISkillService {
  activate(skillType: SkillType, params: SkillExecuteParams): SkillExecuteResult;
}
```

---

## 4. アプリケーション層仕様

### 4.1 AudioService（音声サービス）

#### 責務
- ゲーム音声の再生抽象化
- 環境依存（Web Audio API）の隔離

#### インターフェース

```typescript
// 抽象インターフェース
interface IAudioService {
  playShoot(): void;
  playHit(): void;
  playLand(): void;
  playLineClear(): void;
  playPowerUp(): void;
  playBomb(): void;
  playGameOver(): void;
  playWin(): void;
  playSkill(): void;
  playCharge(): void;
}
```

#### 実装
- `WebAudioAdapter`: Web Audio API を使用した実装（現在の `audio.ts` を移行）
- `NullAudioAdapter`: サウンド無効時のNull Object パターン実装

### 4.2 ScoreStorageAdapter（スコア保存アダプター）

#### 責務
- スコアの永続化処理の抽象化
- Repository パターンによる保存先の隔離

#### インターフェース

```typescript
interface IScoreRepository {
  saveScore(gameId: string, score: number, difficulty: Difficulty): Promise<void>;
  getHighScore(gameId: string, difficulty: Difficulty): Promise<number>;
  getScores(gameId: string): Promise<ScoreEntry[]>;
}
```

---

## 5. プレゼンテーション層仕様

### 5.1 フック構成

| フック | 責務 |
|--------|------|
| `useGameEngine` | ゲームループ全体のオーケストレーション |
| `useGameState` | ゲーム状態の管理（変更なし） |
| `useGameFlow` | ゲームフロー（開始・終了・ステージ遷移） |
| `useGameControls` | プレイヤー操作（移動・射撃） |
| `useSkillSystem` | スキルゲージ・スキル発動 |
| `usePowerUp` | パワーアップ効果管理 |
| `useComboSystem` | コンボシステム（変更なし） |
| `useScreenShake` | 画面シェイクエフェクト（変更なし） |
| `useFloatingScores` | フローティングスコア（変更なし） |
| `useResponsiveSize` | レスポンシブレイアウト（変更なし） |
| `useTestMode` | テストモード（変更なし） |

### 5.2 フックのリファクタリング詳細

#### `useGameControls` の改善
- `setTimeout` を `useSafeTimeout` に置換
- 弾丸生成ロジックを `BulletFactory` に委譲

#### `useSkillSystem` の改善
- `setTimeout` を `useSafeTimeout` に置換
- スキル発動ロジックを `SkillService` に委譲
- スキルチャージ計算をドメインサービスに移動

#### `useGameLoop` の改善
- スコア計算を `ScoreCalculator` に委譲
- イベント通知を Observer パターンで実装（ライン消し、ゲームオーバー等）

### 5.3 コンポーネント構成

既存のコンポーネント構成は基本的に維持します。変更点は:

- `FalldownShooterGame.tsx` から接続ロジックを `useGameEngine` フックに抽出
- Props の型を Interface Segregation に従い必要最小限に整理

---

## 6. テスト仕様

### 6.1 テストヘルパー

```typescript
// __tests__/helpers/factories.ts
const createBlock = (overrides?: Partial<BlockData>): IBlock;
const createBullet = (overrides?: Partial<BulletData>): IBullet;
const createGrid = (width?: number, height?: number): IGrid;
const createGameState = (overrides?: Partial<GameState>): GameState;
```

### 6.2 テストカバレッジ目標

| レイヤー | カバレッジ目標 |
|----------|---------------|
| domain/models | 95% 以上 |
| domain/services | 90% 以上 |
| application | 85% 以上 |
| presentation/hooks | 80% 以上 |
| presentation/components | 70% 以上 |

### 6.3 テスト追加計画

#### 新規テスト（Phase 1 で先行作成）

| テスト対象 | テスト内容 |
|-----------|-----------|
| `processBullets` | 弾丸移動、衝突検出、貫通処理、パワーアップ取得、爆弾処理 |
| `applyExplosion` | 3x3 範囲のグリッド・ブロック破壊、スコア計算、端部処理 |

#### テストリファクタリング（Phase 6）

| 対象 | 改善内容 |
|------|----------|
| 全テスト | `makeBlock` 等のヘルパーを共通ファクトリに統合 |
| `audio.test.ts` | `eslint-disable` を除去、型安全なモック化 |
| `integration.test.tsx` | DOM 構造依存の削減、ロール・テキストベースのクエリに統一 |
| フックテスト | `use-game-flow`, `use-game-loop`, `use-skill-system` のテスト追加 |

### 6.4 E2E テストについて

**E2E テストは導入しません。**

理由:
1. リアルタイムアクションゲームであり、タイミング依存の操作を E2E で安定テストすることが困難
2. ゲームループが `setInterval` ベースで動作しており、非決定的な動作を含む
3. 統合テスト（Testing Library）で UI フローのテストは十分にカバー可能
4. ドメインロジックの単体テスト強化により、品質は担保できる

---

## 7. 移行戦略

### 7.1 段階的移行

リファクタリングは「ストラングラーフィグ」パターンに従い、段階的に実施します。

1. 新しいモジュールを作成
2. 既存コードから新モジュールへの呼び出しを追加
3. 既存ロジックを削除
4. テストがパスすることを確認

この手順により、各ステップで動作するコードを維持します。

### 7.2 公開 API の維持

`index.ts` のエクスポートは段階的に移行します。

```typescript
// 移行期間中は旧名と新名の両方をエクスポート
export { Grid } from './domain/models/grid';           // 新
export { Block } from './domain/models/block';         // 新
export { GameLogic } from './game-logic';              // 旧（非推奨マーク）
```

最終的に旧エクスポートを削除します。

### 7.3 コミット粒度

各 Phase 内のコミットは以下の粒度を目安とします。

| Phase | コミット数（目安） | コミットタイプ |
|-------|-------------------|---------------|
| Phase 1 | 2-3 | `test` |
| Phase 2 | 3-4 | `refactor` |
| Phase 3 | 2-3 | `refactor` |
| Phase 4 | 2-3 | `refactor` |
| Phase 5 | 2-3 | `refactor` |
| Phase 6 | 2-3 | `test` |
| Phase 7 | 1-2 | `chore` |

---

## 8. 非機能要件

### 8.1 パフォーマンス
- ゲームループのパフォーマンスを劣化させないこと
- 値オブジェクトのイミュータブル操作によるメモリ負荷増加は、ゲームの規模（12x18 グリッド）では許容範囲

### 8.2 互換性
- 外部から見たゲームの振る舞い（操作感、スコア計算、タイミング）は変更しない
- styled-components のスタイル定義は変更しない（プレゼンテーション層のリファクタリングで import パスのみ変更可能性あり）

### 8.3 メンテナンス性
- 各レイヤーの依存方向は常に上位→下位（presentation → application → domain）
- domain 層は React やブラウザ API に依存しない純粋な TypeScript コードとする
- テストカバレッジは Phase 完了ごとに低下しないことを確認する
