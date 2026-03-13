# RISK LCD リファクタリング仕様書

## 1. 現状分析

### 1.1 モジュール構成（現状）

| ファイル | 行数 | 責務数 | 問題 |
|---------|------|--------|------|
| useRunningPhase.ts | 593 | 7+ | ゲームループ全体、UI更新とドメインロジック結合 |
| useGameEngine.ts | 489 | 5+ | 状態管理・タイマー・RNG・入力・フェーズ遷移が混在 |
| useStore.ts | 229 | 4 | ポイント・スタイル・アンロック・デイリーの4ドメイン |
| useAudio.ts | 153 | 1 | マジックナンバー多数 |
| types.ts | 198 | - | 適切な規模。分割不要 |
| game-logic.ts | 140 | 1 | 良好。ただし抽出可能なロジックが他ファイルにも散在 |

### 1.2 テスト状況（現状）

| 対象 | テスト有無 | 備考 |
|------|-----------|------|
| utils/game-logic.ts | あり（14テスト） | 品質良好 |
| utils/ghost.ts | あり（10テスト） | 品質良好 |
| utils/random.ts | あり（5テスト） | 境界値のみ |
| utils/seeded-random.ts | あり（10テスト） | 品質良好 |
| utils/share.ts | あり（10テスト） | 品質良好 |
| hooks/useStore.ts | あり（12テスト） | 品質良好 |
| components/RiskLcdGame.tsx | あり（3テスト） | 初期レンダリングのみ |
| hooks/useGameEngine.ts | **なし** | テスト困難（副作用混在） |
| hooks/phases/*.ts | **なし** | テスト困難（副作用混在） |
| hooks/useInput.ts | **なし** | 小規模のため優先度低 |
| hooks/useAudio.ts | **なし** | Web Audio モック必要 |
| UI コンポーネント 13個 | **なし** | メニュー画面は追加可能 |

### 1.3 主要な技術的負債

1. **副作用の混在**: `resolve()` 内で被弾判定（ドメイン）と UI 更新（`patch`, `showPop`, `audio`）が交互に実行
2. **循環依存**: `endGameRef`、`showPerksRef`、`announceRef` による ref 経由のフェーズ間通信
3. **状態の二重管理**: `gRef`（ミュータブル・高速参照）と `rsRef`（React state・描画用）の手動同期
4. **DRY 違反**: セグメント初期化が3箇所で重複
5. **マジックナンバー**: useAudio.ts の周波数・時間、useRunningPhase.ts のタイミング値

### 1.4 良好な設計（維持すべき点）

1. **game-logic.ts**: 純粋関数として適切に分離済み
2. **RngApi**: 乱数インターフェースが既に定義されている（Strategy パターンの素地）
3. **フェーズ別フック**: useRunningPhase / usePerkPhase / useShopPhase / useResultPhase の分離
4. **types.ts**: 198行で適切な規模。GameState の型定義は包括的
5. **既存テスト**: utils 層のテストは品質が高く、AAA パターン準拠

---

## 2. GameState の設計方針

### 2.1 現状の GameState

GameState は30+フィールドのフラットな構造で、タイマー内で **ミュータブルに直接操作** される。

```typescript
// 現在の操作パターン（40箇所以上）
g.score += pts;
g.comboCount++;
g.shields--;
g.alive = false;
g.phase = 'warn';
```

### 2.2 方針：ミュータブル操作を維持し、論理グルーピングのみ導入

GameState を Immutable 値オブジェクトに変換すると：
- 40箇所以上の代入文の書き換えが必要
- スプレッド演算子による新オブジェクト生成がゲームループの性能に影響
- 開発効率が大幅に低下

**代わりに**: 型定義上で論理グルーピングを整理し、ドキュメントとして不変条件を明示する。
GameState の構造自体は変更しない。

```typescript
// types.ts に不変条件をコメントで明示（実装は変更しない）
/**
 * ゲーム実行状態
 *
 * 不変条件:
 * - lane は 0, 1, 2 のいずれか
 * - shields >= 0
 * - comboCount >= 0, maxCombo >= comboCount
 * - score >= 0
 */
export interface GameState {
  // --- プレイヤー状態 ---
  lane: LaneIndex;
  alive: boolean;
  shields: number;
  frozen: number;
  moveOk: boolean;
  moveCd: number;
  revive: number;
  shelterSaves: number;

  // --- スコア・コンボ ---
  score: number;
  total: number;
  comboCount: number;
  maxCombo: number;
  nearMiss: number;
  riskScore: number;
  scoreMult: number;
  comboBonus: number;

  // --- ステージ進行 ---
  stage: number;
  cycle: number;
  maxStg: number;
  curStgCfg: RuntimeStageConfig | null;
  stageMod: ModDef | null;

  // --- ビルド修飾 ---
  slowMod: number;
  speedMod: number;
  bfAdj: number;
  bfAdj_lane: number;
  bfAdj_extra: number;
  baseBonus: number;

  // --- ビジュアル ---
  artState: ArtKey;
  walkFrame: number;
  artFrame: number;

  // --- その他 ---
  st: MergedStyle;
  phase: GamePhase;
  perks: PerkDef[];
  perkChoices: PerkDef[] | null;
  curBf0: number[];
  curObs?: number[];
  dailyMode: boolean;
  practiceMode: boolean;
  ghostLog: number[];
}
```

### 2.3 DbC アサーション関数

開発時の検証用に、不変条件チェック関数を追加する：

```typescript
// domain/assertions.ts
export function assertGameStateInvariant(g: GameState): void {
  if (process.env.NODE_ENV === 'production') return;

  console.assert(g.lane >= 0 && g.lane <= 2, `lane は 0-2: ${g.lane}`);
  console.assert(g.shields >= 0, `shields >= 0: ${g.shields}`);
  console.assert(g.comboCount >= 0, `comboCount >= 0: ${g.comboCount}`);
  console.assert(g.maxCombo >= g.comboCount, `maxCombo >= comboCount`);
  console.assert(g.score >= 0, `score >= 0: ${g.score}`);
}
```

---

## 3. ドメインサービス仕様（純粋関数）

### 3.1 judgment.ts（被弾判定）

`useRunningPhase.ts` の `resolve()` からドメインロジック部分のみを抽出する。

```typescript
/** サイクルの判定結果 */
export interface CycleJudgment {
  hit: boolean;
  nearMiss: boolean;
  sheltered: boolean;
  shieldUsed: boolean;
  scoreGained: number;
}

/**
 * サイクルの判定を行う純粋関数
 *
 * 事前条件: obstacles.length > 0
 * 事後条件: hit === true のとき scoreGained === 0
 */
export function judgeCycle(params: {
  playerLane: LaneIndex;
  obstacles: readonly number[];
  shields: number;
  shelterLanes: readonly number[];
  laneMultiplier: number;
  comboCount: number;
  comboBonus: number;
  scoreMult: number;
  stageScoreMod: number;
  baseBonus: number;
}): CycleJudgment;
```

**呼び出し側（useRunningPhase の resolve）の変更**:
```typescript
// Before: resolve 内に判定ロジック + UI更新が混在
// After: 純粋関数で判定 → 結果に基づいて UI 更新
const judgment = judgeCycle({ ... });
if (judgment.hit) {
  audio.hit();
  showPop(g.lane, 'HIT!');
} else {
  audio.ok();
  showPop(g.lane, `+${judgment.scoreGained}`);
}
```

### 3.2 scoring.ts（スコア計算）

既存の `game-logic.ts` から移行・拡充する。

```typescript
// 既存関数の移行（インターフェースは維持）
export { comboMult, computePoints, computeStageBonus, getRank } from '../utils/game-logic';

// 新規追加：デイリー報酬計算（useStore.recordDailyPlay から抽出）
export function calculateDailyReward(params: {
  score: number;
  previousBest: number;
  isFirstPlay: boolean;
}): { reward: number; isNewBest: boolean };
```

### 3.3 obstacle.ts（障害物配置）

`useRunningPhase.ts` の `pickObs()` から抽出する。

```typescript
/**
 * 障害物を配置する純粋関数
 *
 * 事前条件: stageConfig の obs 配列が空でない
 * 事後条件: 戻り値の各要素は 0-2 の範囲
 */
export function placeObstacles(params: {
  rng: RngApi;
  stageConfig: RuntimeStageConfig;
  restrictedLanes: readonly number[];
  previousObstacles: readonly number[];
}): number[];
```

### 3.4 stage-progress.ts（ステージ進行）

```typescript
/**
 * ステージクリア判定
 */
export function isStageCleared(cycle: number, stageConfig: RuntimeStageConfig): boolean;

/**
 * 次のステージ設定を生成
 */
export function createStageConfig(params: {
  stageIndex: number;
  stages: readonly StageConfig[];
  perks: readonly PerkDef[];
  modifier: ModDef | undefined;
}): RuntimeStageConfig;
```

### 3.5 style-merge.ts（スタイルマージ）

`game-logic.ts` の `mergeStyles` を移行する。

```typescript
/**
 * 複数スタイルをマージする純粋関数
 *
 * マージ戦略:
 * - 倍率(mu): 各レーンの最大値を取る
 * - 速度修飾(wm, cm): 加算
 * - 制限レーン(rs): 和集合
 * - 避難所(sf): 和集合
 *
 * 事前条件: ids.length > 0
 */
export function mergeStyles(ids: readonly string[]): MergedStyle;
```

---

## 4. インターフェース仕様

既存の `RngApi`（phases/types.ts）を参考に、他のインフラ依存にもインターフェースを定義する。

### 4.1 RngApi（既存の昇格）

```typescript
// interfaces/rng.ts
// 既存の RngApi をそのまま昇格（互換性維持）
export interface RngApi {
  int(n: number): number;
  pick<T>(a: readonly T[]): T;
  chance(p: number): boolean;
  shuffle<T>(a: readonly T[]): T[];
  random(): number;
}
```

### 4.2 StorageApi

```typescript
// interfaces/storage.ts
export interface StorageApi {
  load<T>(key: string): T | undefined;
  save<T>(key: string, data: T): void;
  remove(key: string): void;
}
```

### 4.3 AudioApi

```typescript
// interfaces/audio.ts
// 既存の useAudio の戻り値型を明示化
export interface AudioApi {
  mv(): void;   // 移動音
  ok(): void;   // 回避音
  hit(): void;  // 被弾音
  sh(): void;   // シールド音
  stg(): void;  // ステージクリア音
  go(): void;   // ゲームオーバー音
  tick(): void;  // ティック音
  seq(notes: Note[]): void;  // シーケンス再生
}
```

**注意**: 既存の useAudio の関数名（mv, ok, hit 等）をそのまま採用し、互換性を維持する。

---

## 5. useRunningPhase の分割仕様

### 5.1 現状の責務（593行に7つの責務）

| 関数 | 行数 | 責務 |
|------|------|------|
| pickObs | ~30 | 障害物配置（ドメイン） |
| cont | ~20 | サイクル継続判定 |
| resolve | ~120 | 被弾判定 + UI更新（ドメイン + 副作用混在） |
| nextCycle | ~100 | カスケードアニメーション（タイマーチェーン） |
| announce | ~80 | ステージ開始演出 |
| startGame | ~60 | ゲーム初期化 |
| movePlayer | ~40 | プレイヤー移動 |

### 5.2 分割方針

**ドメインロジックの抽出**（→ domain/）:
- `pickObs` → `domain/obstacle.ts` の `placeObstacles`
- `resolve` のドメイン部分 → `domain/judgment.ts` の `judgeCycle`
- スコア計算 → `domain/scoring.ts`

**useRunningPhase に残すもの**:
- `nextCycle`: タイマーベースのカスケードアニメーション（本質的に副作用）
- `announce`: ステージ開始演出（タイマー + UI 更新）
- `resolve` の UI 更新部分: `patch`, `showPop`, `audio` の呼び出し
- `cont`, `startGame`, `movePlayer`: フック内の制御フロー

**分割後の行数目標**: 300行以下

### 5.3 resolve の分割例

```typescript
// Before（useRunningPhase.ts resolve内、約120行）
// ドメインロジックと UI 更新が交互に実行

// After
function resolve(obs: number[], cfg: RuntimeStageConfig, animDur: number) {
  const g = gRef.current;
  if (!g) return;

  // 1. ドメインロジック（純粋関数呼び出し）
  const judgment = judgeCycle({
    playerLane: g.lane,
    obstacles: obs,
    shields: g.shields,
    shelterLanes: g.st.sf,
    laneMultiplier: g.st.mu[g.lane],
    comboCount: g.comboCount,
    comboBonus: g.comboBonus,
    scoreMult: g.scoreMult,
    stageScoreMod: cfg._scoreMod ?? 1,
    baseBonus: g.baseBonus,
  });

  // 2. 状態更新（judgment の結果に基づく）
  g.ghostLog.push(g.lane);
  if (judgment.hit) {
    applyHitEffect(g, judgment);
  } else {
    applyDodgeEffect(g, judgment);
  }

  // 3. UI 更新（副作用）
  renderJudgmentResult(judgment, g, animDur);
}

// 副作用を明示的に分離
function applyHitEffect(g: GameState, j: CycleJudgment) { ... }
function applyDodgeEffect(g: GameState, j: CycleJudgment) { ... }
function renderJudgmentResult(j: CycleJudgment, g: GameState, dur: number) { ... }
```

---

## 6. useStore の分割仕様

### 6.1 現状（229行、15メソッド、4ドメイン混在）

### 6.2 方針：フック内でヘルパー関数に分離

useStore を複数フックに分割すると、呼び出し側の変更が広範囲になる。
代わりに、**内部のヘルパー関数を別ファイルに抽出**し、useStore は薄いラッパーとして維持する。

```typescript
// hooks/store-helpers/point-ops.ts
export function addPoints(data: SaveData, amount: number): SaveData { ... }
export function spendPoints(data: SaveData, cost: number): SaveData | undefined { ... }

// hooks/store-helpers/style-ops.ts
export function toggleEquip(data: SaveData, id: string): SaveData | undefined { ... }
export function maxEquipSlots(data: SaveData): number { ... }

// hooks/store-helpers/daily-ops.ts
export function recordDaily(data: SaveData, score: number): { data: SaveData; reward: number } { ... }
```

### 6.3 メリット

- useStore の公開 API は変更なし（呼び出し側への影響ゼロ）
- ヘルパー関数は純粋関数になるためテスト容易
- 段階的に移行可能

---

## 7. テスト仕様

### 7.1 テスト戦略の全体像

| テストレベル | ツール | 対象 | 目的 |
|------------|--------|------|------|
| 単体テスト | Jest | domain/ の純粋関数 | ドメインロジックの正確性 |
| 単体テスト | Jest | store-helpers/ | ヘルパー関数の正確性 |
| コンポーネントテスト | Testing Library | メニュー画面 | UI 表示・操作の検証 |
| 統合テスト | Jest + fake timers + renderHook | ゲームサイクル | フェーズ遷移・状態変化 |

### 7.2 E2E テストを採用しない理由

RISK LCD は以下の特性により、Playwright E2E テストが **不適切**：

1. **タイマー駆動の自動進行**: ゲームサイクルが `setTimeout` チェーンで進行。
   Playwright ではタイマーの正確な制御ができない
2. **非決定論的 RNG**: 通常モードは `Math.random()` で障害物配置が毎回異なる。
   再現性のあるテストが書けない
3. **操作タイミング依存**: プレイヤーの移動がサイクルのどのタイミングで行われたかが結果に影響。
   ブラウザの実行速度に依存するためテストが不安定になる
4. **状態の検証困難**: ゲーム状態（スコア、コンボ等）が DOM に即時反映されるとは限らない。
   LCD 風の表示制御により、表示タイミングがタイマーに依存

### 7.3 統合テスト（E2E の代替）

Jest の `useFakeTimers` と `@testing-library/react` の `renderHook` を使い、
ゲームフローを決定論的に検証する：

```typescript
describe('ゲームサイクル統合テスト', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('サイクルが正しく進行し、回避時にスコアが加算される', () => {
    // Arrange: シード固定の RNG でゲーム開始
    const mockRng = createSeededRng(42);
    const { result } = renderHook(() => useGameEngine({ rng: mockRng }));

    // Act: ゲーム開始 → サイクル進行
    act(() => result.current.dispatch('act')); // ゲーム開始
    act(() => jest.advanceTimersByTime(3000)); // サイクル完了まで進める

    // Assert: 状態を検証
    expect(result.current.gameState.cycle).toBe(1);
    expect(result.current.gameState.score).toBeGreaterThan(0);
  });

  it('被弾時にゲームオーバーになる', () => {
    // シード固定で被弾するパターンを再現
    // ...
  });

  it('ステージクリア後にパーク選択画面に遷移する', () => {
    // 全サイクルをタイマーで進めてクリア
    // ...
  });
});
```

### 7.4 単体テスト（domain/ の純粋関数）

| テスト対象 | テスト内容 | テスト数目安 |
|-----------|-----------|-------------|
| judgment.judgeCycle | 被弾/回避/ニアミス/シールド/シェルター | 10-15 |
| scoring.comboMult | コンボ数 0, 1, 5, 10, 20 の倍率 | 5 |
| scoring.computePoints | パラメータ組み合わせ | 5-8 |
| scoring.calculateDailyReward | 初回/更新/非更新 | 3-5 |
| obstacle.placeObstacles | ステージ設定別パターン | 5-8 |
| stage-progress.isStageCleared | 境界値 | 3-5 |
| style-merge.mergeStyles | 単一/複数/空エラー | 3-5 |

### 7.5 コンポーネントテスト（メニュー画面）

| テスト対象 | テスト内容 | 優先度 |
|-----------|-----------|--------|
| TitleScreen | メニュー項目の表示・選択 | 高 |
| ResultScreen | スコア・ランクの表示 | 高 |
| PerkSelectScreen | パーク一覧の表示・選択操作 | 中 |
| StyleListScreen | スタイル一覧・装備トグル | 中 |
| UnlockShopScreen | ショップ一覧・購入操作 | 中 |
| TutorialScreen | ステップ遷移 | 低 |

**注意**: GameScreen はタイマー駆動のアニメーション画面のため、コンポーネントテストは困難。
統合テストでカバーする。

### 7.6 カバレッジ目標

```javascript
// jest.config.js に追加
coverageThreshold: {
  './src/features/risk-lcd/domain/': {
    branches: 85,
    functions: 90,
    lines: 90,
    statements: 90
  },
  './src/features/risk-lcd/': {
    branches: 50,
    functions: 60,
    lines: 60,
    statements: 60
  }
}
```

---

## 8. デザインパターン適用仕様

### 8.1 Strategy パターン（RNG 切り替え）

既存の RngApi インターフェースを活用。既に実質的に適用されている。

```
RngApi (interface) ← 既存
├── defaultRng (Math.random ラッパー) ← 既存
└── SeededRand (mulberry32 PRNG)     ← 既存
```

変更点: RngApi を `interfaces/rng.ts` に昇格し、型の所在を明確化する。

### 8.2 Extract Function パターン（純粋関数の抽出）

最も多用するパターン。フック内の複雑なロジックを純粋関数に抽出する。

```
useRunningPhase.resolve()
  → judgeCycle()     // domain/judgment.ts
  → computePoints() // domain/scoring.ts
  → placeObstacles() // domain/obstacle.ts
```

### 8.3 Facade パターン（useStore）

useStore はヘルパー関数群の Facade として機能する。
外部 API は変更せず、内部を整理する。

```
useStore (Facade)
├── point-ops.ts   (addPoints, spendPoints)
├── style-ops.ts   (toggleEquip, maxEquipSlots)
└── daily-ops.ts   (recordDaily)
```

---

## 9. 移行戦略

### 9.1 Strangler Fig パターン（段階的移行）

既存のフック内のロジックを `domain/` の純粋関数に **段階的に委譲** していく。
一度に全てを書き換えない。

```
Step 1: domain/judgment.ts を作成 → useRunningPhase.resolve 内から呼び出し
Step 2: domain/scoring.ts を作成 → resolve 内のスコア計算を委譲
Step 3: domain/obstacle.ts を作成 → pickObs を委譲
...
```

各ステップで：
- 既存テストが全て通過すること
- ブラウザでの動作が変わらないこと

### 9.2 後方互換性

- `utils/game-logic.ts` は `domain/scoring.ts` からの re-export に変更
  → 既存のインポートパスが壊れない
- `types.ts` は変更しない
  → 型定義の互換性を完全に維持
- `useStore` の公開 API は変更しない
  → 呼び出し側への影響ゼロ

---

## 10. 非機能要件

### 10.1 パフォーマンス

- 純粋関数の抽出がゲームループの tick 間隔に影響を与えないこと
- wPick の計算量を O(n) → O(1) に改善（excludes に Set を使用）
- 不要な re-render を防止（必要に応じて React.memo を適用）

### 10.2 バンドルサイズ

- リファクタリングによるバンドルサイズ増加は 5% 以内
- 新規ファイルは純粋関数中心のため、tree-shaking が効く

### 10.3 ブラウザ互換性

- 既存の対象ブラウザ（ES2024 サポート）を維持
- Web Audio API、Web Share API の動作を維持
