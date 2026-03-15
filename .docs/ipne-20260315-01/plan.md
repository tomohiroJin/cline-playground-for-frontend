# IPNE 大規模リファクタリング計画

## 目標

**将来の機能追加・バランス調整を安全かつ迅速に行えるコードベースを実現する。**

具体的には以下の5つの柱で改善を行う：

1. **DDD の本格導入** — ドメイン知識をコードに正しく反映し、境界を明確化
2. **副作用の除去と純粋関数化** — テスタブルで予測可能なコードへ
3. **SOLID 原則の適用** — 責務分離・拡張性・依存性逆転の実現
4. **DRY 原則の徹底** — 重複コードの統合とパターン化
5. **テスト品質の向上と統合・シナリオテストの導入** — 信頼性の高いテスト体系の構築

---

## 現状分析

### 良い点（維持すべき要素）

| 要素 | 評価 |
|------|------|
| レイヤード設計の骨格 | application / domain / infrastructure / presentation の4層は存在 |
| Domain Policy パターン | 敵AIにStrategy/Policyパターンが部分的に導入済み |
| Infrastructure 抽象化 | Browser / Clock / Random / Storage のプロバイダーが存在 |
| DbC アサーション | shared/contracts/ にアサーションユーティリティが存在 |
| テスト数 | 30+ テストファイルで主要機能をカバー |

### 改善が必要な点

| 課題 | 詳細 | 優先度 |
|------|------|--------|
| types.ts 一極集中 | 654行の1ファイルに全ドメインの型が混在 | **最高** |
| ルート直下にドメインロジック散在 | combat.ts, player.ts, enemy.ts 等がレイヤー未分類 | **最高** |
| useGameState.ts の巨大化 | 520行、80+ プロパティの返り値、7つ以上の責務 | **最高** |
| Game.tsx の巨大化 | 1531行の単一コンポーネント | **最高** |
| tickGameState.ts の責務過多 | 272行、7つ以上の処理を1関数で実行 | **高** |
| グローバル可変状態（IDカウンタ） | enemy/trap/item の ID 生成がモジュールスコープ変数に依存 | **高** |
| 敵AIロジックの二重管理 | enemyAI.ts と domain/policies/ で重複 | **高** |
| マジックナンバーの分散 | 各モジュールに定数が散在、バランス調整時に全ファイル確認が必要 | **高** |
| テスト品質の不均一 | テストユーティリティの使用が統一されていない | **中** |
| DRY 違反（Factory パターン） | enemy/trap/wall の作成パターンが類似しているが統一されていない | **中** |

---

## フェーズ構成

### Phase 1: 型定義の分割とドメインモデルの整理

**目的**: 型の凝集度を高め、ドメイン境界を明確にする

#### 作業内容

1. **types.ts（654行）を9つのドメイン別ファイルに分割**

```
types.ts →
  domain/types/world.ts        — TileType, GameMap, Position, Direction, MazeConfig, Room, Corridor, Rectangle
  domain/types/player.ts       — Player, PlayerClass, ClassConfig, PlayerStats, StatType, LevelUpChoice
  domain/types/enemy.ts        — Enemy, EnemyType, EnemyState
  domain/types/gimmicks.ts     — Trap, TrapType, TrapState, Wall, WallType, WallState
  domain/types/items.ts        — Item, ItemType
  domain/types/stage.ts        — StageNumber, StageConfig, GimmickPlacementConfig, StageRewardType, StageRewardHistory, StageCarryOver, StoryScene, StorySceneSlide
  domain/types/game-state.ts   — GameState, ScreenState, CombatState, Rating, EpilogueText, GameRecord, BestRecords
  domain/types/feedback.ts     — FeedbackType, FeedbackEffect, TutorialStep, TutorialState, TimerState, GameTimer
  domain/types/audio.ts        — AudioSettings, SoundEffectType, BgmType, SoundConfig, MelodyNote, StoryImageEntry
  domain/types/index.ts        — barrel export（後方互換用）
```

2. **既存の `types.ts` を barrel export として維持し、段階的に移行**

#### 完了条件

- [ ] 各型ファイルが単一ドメインの型のみを含む
- [ ] `types.ts` が barrel export のみになっている
- [ ] 全テストが通る
- [ ] import パスの更新が完了

---

### Phase 2: ドメイン層への集約（ルート直下ファイルの移動）

**目的**: ルート直下に散在するドメインロジックを適切なレイヤーに配置する

#### 移動計画

| 現在のファイル | 移動先 | 理由 |
|--------------|--------|------|
| `player.ts` | `domain/entities/player.ts` | プレイヤーのドメインロジック |
| `enemy.ts` | `domain/entities/enemy.ts` | 敵エンティティのドメインロジック |
| `item.ts` | `domain/entities/item.ts` | アイテムエンティティのドメインロジック |
| `combat.ts` | `domain/services/combatService.ts` | 戦闘ドメインサービス |
| `collision.ts` | `domain/services/collisionService.ts` | 衝突判定ドメインサービス |
| `movement.ts` | `domain/services/movementService.ts` | 移動ドメインサービス |
| `pathfinder.ts` | `domain/services/pathfinderService.ts` | 経路探索ドメインサービス |
| `trap.ts` | `domain/entities/trap.ts` | 罠エンティティ |
| `wall.ts` | `domain/entities/wall.ts` | 壁エンティティ |
| `class.ts` | `domain/valueObjects/playerClass.ts` | 職業設定（値オブジェクト） |
| `progression.ts` | `domain/services/progressionService.ts` | 成長システム |
| `stageConfig.ts` | `domain/config/stageConfig.ts` | ステージ設定（ドメイン定数） |
| `mazeGenerator.ts` | `domain/services/mazeGenerator.ts` | 迷路生成 |
| `enemySpawner.ts` | `application/usecases/enemySpawner.ts` | 敵スポーン（ユースケース） |
| `gimmickPlacement.ts` | → 既存 `domain/services/gimmickPlacement/` に統合 | ギミック配置 |
| `autoMapping.ts` | `application/usecases/autoMapping.ts` | マッピング（アプリケーション層） |
| `goal.ts` | `domain/services/goalService.ts` | ゴール判定 |
| `tutorial.ts` | `presentation/services/tutorialService.ts` | チュートリアル（UI関連） |
| `record.ts` | `infrastructure/storage/recordStorage.ts` | 記録管理（ストレージ依存） |
| `timer.ts` | `application/services/timerService.ts` | タイマー |
| `ending.ts` | `domain/services/endingService.ts` | エンディング判定 |
| `feedback.ts` | `presentation/services/feedbackService.ts` | フィードバック（UI表示関連） |
| `viewport.ts` | `presentation/services/viewportService.ts` | ビューポート（表示関連） |
| `map.ts` | `domain/services/mapService.ts` | マップ管理 |
| `debug.ts` | `infrastructure/debug/debugService.ts` | デバッグ |
| `combo.ts` | `domain/services/comboService.ts` | コンボ管理 |

#### 完了条件

- [ ] ルート直下のドメインファイルが0になる（index.ts, types.ts のみ残存）
- [ ] 全テストが通る
- [ ] レイヤー間の依存方向が正しい（domain ← application ← presentation、domain ← infrastructure）

---

### Phase 3: 副作用の除去と依存性注入

**目的**: 純粋関数化とテスタビリティの向上

#### 3.1 グローバル ID カウンタの排除

**現状の問題**:
```typescript
// enemy.ts:67-76 — グローバル可変状態
let enemyIdCounter = 0;
export const generateEnemyId = (): string => {
  enemyIdCounter += 1;
  return `enemy-${enemyIdCounter}`;
};
```

**解決策**: ID 生成器インターフェースの導入

```typescript
// domain/ports/IdGenerator.ts
export interface IdGenerator {
  generateEnemyId(): string;
  generateTrapId(): string;
  generateItemId(): string;
}
```

```typescript
// infrastructure/id/SequentialIdGenerator.ts
export class SequentialIdGenerator implements IdGenerator {
  private counters = { enemy: 0, trap: 0, item: 0 };

  generateEnemyId(): string {
    this.counters.enemy += 1;
    return `enemy-${this.counters.enemy}`;
  }
  // ...
}
```

#### 3.2 乱数の依存性注入

**現状**: `Math.random()` がデフォルト引数として直接使用
**解決策**: `infrastructure/random/RandomProvider.ts` を全箇所で活用

#### 3.3 純粋関数化の対象

| 関数 | ファイル | 副作用 | 解決策 |
|------|---------|--------|--------|
| `generateEnemyId()` | enemy.ts | グローバルカウンタ変更 | IdGenerator DI |
| `generateTrapId()` | trap.ts | グローバルカウンタ変更 | IdGenerator DI |
| `generateItemId()` | item.ts | グローバルカウンタ変更 | IdGenerator DI |
| `createDropItem()` | enemy.ts | Math.random() デフォルト呼び出し | RandomProvider DI |
| `damagePlayer()` | player.ts | 参照同等性に依存した判定 | 明示的な Result 型を返す |

#### 完了条件

- [ ] グローバル可変状態が0
- [ ] Math.random() の直接呼び出しが0（テスト以外）
- [ ] testUtils.ts の reset 関数が不要になる
- [ ] 全テストが通る

---

### Phase 4: 責務分離（SRP の適用）

**目的**: 巨大ファイルの分割と単一責任の実現

#### 4.1 useGameState.ts の分割（520行 → 4つのフック）

```
useGameState.ts →
  useGameSetup.ts      — マップ生成・プレイヤー初期化・敵スポーン・ギミック配置
  useScreenTransition.ts — 画面遷移ハンドラー（11個）
  useStageManagement.ts — 5ステージ進行・報酬・引き継ぎ
  useGameAudio.ts      — BGM/SE 管理・切り替え
  useGameState.ts      — 上記を統合する Facade フック（薄いラッパー）
```

#### 4.2 Game.tsx の分割（1531行 → 5つのコンポーネント）

```
Game.tsx →
  Game.tsx              — メインコンポーネント（統合・レイアウト）
  GameCanvas.tsx        — Canvas 描画
  GameHUD.tsx           — HUD（HP、レベル、マップ切替）
  GameControls.tsx      — 入力操作（モバイル十字キー含む）
  GameModals.tsx        — レベルアップ選択・チュートリアル・ヘルプ
```

#### 4.3 tickGameState.ts の分割（272行 → 5つのユースケース）

```
tickGameState.ts →
  engine/
    tickGameState.ts       — オーケストレーター（各 usecase を呼び出す）
  usecases/
    resolvePlayerDamage.ts — （既存、改善）
    resolveItemPickupEffects.ts — （既存、改善）
    resolveKnockback.ts    — （既存、維持）
    resolveTraps.ts        — 罠トリガー処理（新規抽出）
    resolveRegen.ts        — リジェネ処理（新規抽出）
    resolveEnemyUpdates.ts — 敵更新・死亡フィルタ（新規抽出）
```

#### 4.4 useGameLoop.ts の責務分離（287行）

```
useGameLoop.ts →
  useGameLoop.ts            — ゲームループ本体
  useEffectDispatcher.ts    — エフェクトディスパッチ（新規抽出）
```

#### 完了条件

- [ ] 各ファイルが200行以内
- [ ] 各関数が30行以内を目安
- [ ] 全テストが通る

---

### Phase 5: DRY 原則の適用とデザインパターン導入

**目的**: 重複コードの統合とパターンによる拡張性の確保

#### 5.1 Factory パターンの統一

**現状**: enemy.ts / trap.ts / wall.ts に類似した Factory メソッドが散在

**解決策**: 各エンティティの Factory を統一インターフェースで整理

```typescript
// domain/factories/entityFactory.ts
export interface EntityFactory<TType, TEntity> {
  create(type: TType, x: number, y: number, options?: Partial<TEntity>): TEntity;
}
```

#### 5.2 敵AI の Strategy パターン統一

**現状**: `enemyAI.ts` に `updatePatrolEnemy()`, `updateChargeEnemy()`, `updateRangedEnemy()` が個別実装 + `domain/policies/` にも Policy パターン

**解決策**: Policy パターンに統一し、`enemyAI.ts` から個別関数を削除

#### 5.3 マジックナンバーの集約

**現状**: 各モジュールに定数が分散

**解決策**: `domain/config/gameBalance.ts` に全バランス定数を集約

```typescript
// domain/config/gameBalance.ts
export const GAME_BALANCE = {
  combat: {
    attackCooldownMs: 500,
    knockbackDistance: 1,
    invincibleDurationMs: 1000,
  },
  regen: {
    baseIntervalMs: 12000,
    bonusReductionMs: 1000,
    minIntervalMs: 5000,
  },
  movement: {
    baseMoveIntervalMs: 140,
    initialMoveDelayMs: 180,
  },
  enemyAi: {
    updateIntervalMs: 200,
    chaseTimeoutMs: 3000,
    returnTimeoutMs: 1000,
  },
} as const;
```

#### 5.4 DbC（Design by Contract）の強化

**現状**: `shared/contracts/` にアサーションが存在するが限定的

**拡張**:
- ドメインエンティティの不変条件（invariant）を定義
- ファクトリメソッドの事前条件（precondition）を追加
- サービスメソッドの事後条件（postcondition）を追加

#### 完了条件

- [ ] Factory パターンが統一されている
- [ ] 敵 AI が Policy パターンのみで動作
- [ ] マジックナンバーが `gameBalance.ts` に集約
- [ ] DbC アサーションが主要エンティティに適用
- [ ] 全テストが通る

---

### Phase 6: テストのリファクタリング

**目的**: テスト品質の統一とカバレッジ向上

#### 6.1 テストユーティリティの整理

- `testUtils.ts` の使用を全テストで統一
- グローバル状態リセット関数の削除（Phase 3 でグローバル状態を排除済み）
- テストデータビルダーパターンの導入

```typescript
// __tests__/builders/playerBuilder.ts
export class PlayerBuilder {
  private player: Player = createDefaultPlayer();

  withHp(hp: number): this { this.player.hp = hp; return this; }
  withLevel(level: number): this { this.player.level = level; return this; }
  build(): Player { return { ...this.player }; }
}
```

#### 6.2 テストカバレッジ目標の設定

| レイヤー | 現在（推定） | 目標 |
|---------|-------------|------|
| domain/entities | 60% | 90% |
| domain/services | 50% | 85% |
| application/usecases | 40% | 85% |
| application/engine | 30% | 80% |
| presentation/hooks | 20% | 70% |
| presentation/screens | 10% | 50% |

#### 6.3 テスト構造の統一

- AAA パターンの徹底
- `describe` / `it` の日本語記述の統一
- モックの最小化（DI 導入後はモック不要になる箇所が多い）

#### 完了条件

- [ ] テストビルダーが主要エンティティに存在
- [ ] テストカバレッジが目標を達成
- [ ] 全テストが AAA パターンに従っている

---

### Phase 7: 統合テスト・シナリオテストの導入

**目的**: ゲームロジックの結合レベルでの品質保証

#### E2E テストを採用しない理由

IPNE は Canvas 2D ベースのリアルタイムゲームであり、E2E テストには以下の本質的な課題がある：

| 課題 | 詳細 |
|------|------|
| Canvas 描画 | DOM 要素がなく、画面状態の検証にはテスト専用コード（data属性等）の追加が必要 |
| ランダム生成迷路 | 毎回マップが異なり、再現性のあるシナリオが書けない |
| リアルタイム戦闘 | フレーム依存でタイミング制御が困難、テストがフレーキーになりやすい |
| 費用対効果 | テスト用の仕込みコストに対して得られる保証が限定的 |

代わりに、**統合テスト（Jest）** と **決定的シナリオテスト** で同等以上の品質保証を実現する。

#### 7.1 統合テスト（ゲームエンジン結合テスト）

`tickGameState` を連続呼び出しして、複数ユースケースの結合動作を検証する。

```typescript
// __tests__/integration/gameEngine.test.ts
describe('ゲームエンジン統合テスト', () => {
  it('敵と接触してダメージを受け、無敵時間中は追加ダメージを受けない', () => {
    // Arrange
    const state = aGameState()
      .withPlayer(aPlayer().at(5, 5).withHp(10).build())
      .withEnemy(anEnemy().at(5, 6).withDamage(3).build())
      .build();
    const context = createTestTickContext({ currentTime: 1000 });

    // Act: 1ティック目 — ダメージ発生
    const result1 = tickGameState(state, context);
    expect(result1.gameState.player.hp).toBe(7);

    // Act: 2ティック目 — 無敵時間中
    const context2 = { ...context, currentTime: 1100 };
    const result2 = tickGameState(result1.gameState, context2);
    expect(result2.gameState.player.hp).toBe(7); // 変化なし
  });

  it('敵を撃破するとアイテムがドロップし、レベルアップ判定が行われる', () => { ... });
  it('リジェネが時間経過で発動する', () => { ... });
  it('罠を踏むとダメージ/スロー/テレポートが適用される', () => { ... });
});
```

#### 7.2 決定的シナリオテスト（シード固定ゲームプレイ）

`RandomProvider` を固定シードにして「同じ入力なら同じ結果」を保証する。
ゲーム開始からステージクリアまでの一連の流れを検証する。

```typescript
// __tests__/scenarios/stagePlaythrough.test.ts
describe('ステージ通しプレイ シナリオテスト', () => {
  it('ステージ1を開始し、敵を全滅させてボスを倒し、クリアできる', () => {
    // Arrange: 固定シードの RandomProvider でマップを決定的に生成
    const random = new SeededRandomProvider(12345);
    const idGen = new SequentialIdGenerator();
    const clock = new MockClockProvider(0);
    const setup = setupStage(1, random, idGen);

    // Act: プレイヤーの移動・攻撃をシミュレーション
    let state = setup.initialState;
    // 右に3歩移動
    for (let i = 0; i < 3; i++) {
      state = applyPlayerMove(state, Direction.RIGHT, clock);
      clock.advance(150);
    }
    // 攻撃
    state = applyPlayerAttack(state, clock);

    // Assert: ゲーム状態が期待通り
    expect(state.player.killCount).toBeGreaterThan(0);
  });

  it('ステージ間の引き継ぎでプレイヤーの能力値が維持される', () => { ... });
});
```

#### 7.3 画面遷移テスト（useGameState フック統合テスト）

React フックをテストして画面遷移のフローを検証する。

```typescript
// __tests__/integration/screenTransition.test.ts
describe('画面遷移フロー', () => {
  it('TITLE → CLASS_SELECT → PROLOGUE → GAME の順に遷移する', () => {
    const { result } = renderHook(() => useGameState());

    // タイトルから開始
    expect(result.current.screen).toBe(ScreenState.TITLE);

    // ゲーム開始
    act(() => result.current.handleStartGame());
    expect(result.current.screen).toBe(ScreenState.CLASS_SELECT);

    // 職業選択
    act(() => result.current.handleClassSelect(PlayerClass.WARRIOR));
    expect(result.current.screen).toBe(ScreenState.PROLOGUE);

    // プロローグスキップ
    act(() => result.current.handleSkipPrologue());
    expect(result.current.screen).toBe(ScreenState.GAME);
  });

  it('GAME → DYING → GAME_OVER → TITLE の死亡フローが正しく動作する', () => { ... });
  it('STAGE_CLEAR → STAGE_REWARD → STAGE_STORY → GAME のステージ進行が正しい', () => { ... });
  it('FINAL_CLEAR 後にタイトルに戻れる', () => { ... });
});
```

#### 7.4 テストヘルパー

```typescript
// __tests__/helpers/scenarioHelpers.ts

/** 固定シード乱数プロバイダー */
export class SeededRandomProvider implements RandomProvider {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }
  random(): number { /* xorshift 等の決定的乱数 */ }
  randomInt(min: number, max: number): number { ... }
  pick<T>(array: readonly T[]): T { ... }
  shuffle<T>(array: readonly T[]): T[] { ... }
}

/** テスト用 TickContext 生成 */
export const createTestTickContext = (overrides?: Partial<TickContext>): TickContext => ({
  currentTime: 0,
  deltaTime: 16,
  idGenerator: new SequentialIdGenerator(),
  random: new SeededRandomProvider(42),
  clock: new MockClockProvider(0),
  ...overrides,
});

/** プレイヤー移動のシミュレーション */
export const applyPlayerMove = (
  state: GameState,
  direction: DirectionValue,
  clock: ClockProvider
): GameState;

/** プレイヤー攻撃のシミュレーション */
export const applyPlayerAttack = (
  state: GameState,
  clock: ClockProvider
): GameState;
```

#### 完了条件

- [ ] 統合テスト（ゲームエンジン）が5シナリオ以上実装されている
- [ ] 決定的シナリオテスト（シード固定）が3シナリオ以上実装されている
- [ ] 画面遷移テスト（フック統合）が4シナリオ以上実装されている
- [ ] テストヘルパー（SeededRandomProvider, createTestTickContext 等）が実装されている
- [ ] 全テストが安定して通る

---

## フェーズ間の依存関係

```
Phase 1 (型分割)
    ↓
Phase 2 (レイヤー移動) ← Phase 1 の型パスに依存
    ↓
Phase 3 (副作用除去)   ← Phase 2 の配置に依存
    ↓
Phase 4 (責務分離)     ← Phase 3 の DI 基盤に依存
    ↓
Phase 5 (DRY・パターン) ← Phase 4 の分割結果に依存
    ↓
Phase 6 (テスト改善)   ← Phase 3-5 の変更を反映
    ↓
Phase 7 (統合・シナリオテスト) ← Phase 3-6 の DI 基盤に依存（Phase 6 と並行可能）
```

---

## リスク管理

| リスク | 影響 | 対策 |
|--------|------|------|
| import パス変更による大量修正 | 全ファイルに影響 | barrel export で後方互換維持、段階的移行 |
| リファクタリング中の機能退行 | ゲームが動かなくなる | 各 Phase 完了時にフルテスト実行 |
| Phase 間の作業量見積もり誤差 | スケジュール遅延 | 各 Phase を独立してリリース可能に設計 |
| Game.tsx 分割時のレンダリング性能劣化 | FPS 低下 | コンポーネント分割時に React.memo / useMemo を適用 |
| テスト追加による CI 時間増加 | 開発速度低下 | テストの並列実行、不要なテストの削除 |

---

## 成功指標

| 指標 | 現状 | 目標 |
|------|------|------|
| ルート直下のドメインファイル数 | 25+ | 0 |
| types.ts の行数 | 654行 | barrel export のみ |
| useGameState.ts の行数 | 520行 | 150行以内 |
| Game.tsx の行数 | 1531行 | 300行以内 |
| グローバル可変状態の数 | 3+ | 0 |
| マジックナンバーの数 | 20+ | 0（定数化済み） |
| テストカバレッジ（domain） | 推定50% | 85%以上 |
| 統合・シナリオテスト数 | 0 | 12以上 |

---

## Phase 間レビュー残課題トラッカー

各 Phase のレビューで発見され、即時対応せず後続 Phase に引き継ぐ課題を追跡する。
新しい残課題が発生した場合はここに追記し、対応完了時にチェックを入れる。

### Phase 3 → Phase 4

- [ ] **R3-1**: `resolvePlayerDamage` の戻り値に `actualDamage` を追加（→ P4-4b-1）
  - `damagePlayer()` が返す `DamageResult.actualDamage` が `resolvePlayerDamage` で捨てられており、フィードバック表示に使えない
- [ ] **R3-2**: 後方互換シングルトン `MATH_RANDOM_PROVIDER` / `SYSTEM_CLOCK_PROVIDER` の整理（→ P4-4b-2）
  - `recordStorage.ts` を `ClockProvider` DI に変更後、不要になったシングルトンを削除する
