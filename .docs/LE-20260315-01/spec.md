# 迷宮の残響 大規模リファクタリング — 仕様書

## 目次

1. [ドメインモデル仕様](#1-ドメインモデル仕様)
2. [条件評価システム仕様](#2-条件評価システム仕様)
3. [乱数ソース抽象化仕様](#3-乱数ソース抽象化仕様)
4. [ドメインサービス仕様](#4-ドメインサービス仕様)
5. [アプリケーション層（ユースケース）仕様](#5-アプリケーション層ユースケース仕様)
6. [ポートインターフェース仕様](#6-ポートインターフェース仕様)
7. [インフラ層仕様](#7-インフラ層仕様)
8. [プレゼンテーション層仕様](#8-プレゼンテーション層仕様)
9. [状態管理仕様](#9-状態管理仕様)
10. [テスト仕様](#10-テスト仕様)
11. [E2E テスト仕様](#11-e2e-テスト仕様)

---

## 1. ドメインモデル仕様

### 1.1 Player 値オブジェクト

```typescript
// domain/models/player.ts

/** プレイヤーのステータス値 */
interface PlayerStats {
  readonly hp: number;
  readonly maxHp: number;
  readonly mn: number;
  readonly maxMn: number;
  readonly inf: number;
}

/** プレイヤー値オブジェクト（イミュータブル） */
interface Player extends PlayerStats {
  readonly statuses: readonly StatusEffectId[];
}

/** ステータス効果ID（文字列リテラル型） */
type StatusEffectId = '負傷' | '混乱' | '出血' | '恐怖' | '呪い';
```

**不変条件（DbC）**:
- `hp >= 0 && hp <= maxHp`
- `mn >= 0 && mn <= maxMn`
- `inf >= 0`
- `maxHp > 0 && maxMn > 0`

**変更点**:
- `st: string[]` → `statuses: readonly StatusEffectId[]`（型安全化）
- イミュータブル（`readonly`）に統一
- 不変条件をファクトリ関数で検証

### 1.2 GameState 集約ルート

```typescript
// domain/models/game-state.ts

/** ゲームフェーズ（Discriminated Union） */
type GamePhase =
  | { type: 'title' }
  | { type: 'diff_select' }
  | { type: 'floor_intro'; floor: number }
  | { type: 'event'; event: GameEvent; floor: number; step: number }
  | { type: 'result'; result: ChoiceResult; floor: number; step: number }
  | { type: 'game_over'; cause: DeathCause }
  | { type: 'victory'; ending: EndingDef }
  | { type: 'menu'; screen: MenuScreen };

/** 死因 */
type DeathCause = '体力消耗' | '精神崩壊';

/** メニュー画面種別 */
type MenuScreen = 'unlocks' | 'titles' | 'records' | 'settings' | 'reset_confirm1' | 'reset_confirm2';

/** ゲーム状態（1ラン分） */
interface GameState {
  readonly phase: GamePhase;
  readonly player: Player | null;
  readonly difficulty: DifficultyDef | null;
  readonly floor: number;
  readonly step: number;
  readonly usedEventIds: readonly string[];
  readonly log: readonly LogEntry[];
  readonly chainNextId: string | null;
  readonly usedSecondLife: boolean;
}
```

**変更点**:
- `phase: string` → `GamePhase` Discriminated Union（型による網羅性チェック）
- フェーズに関連データを同梱（`floor_intro` にフロア番号等）
- 全フィールドを `readonly` に統一

### 1.3 MetaState 集約ルート

```typescript
// domain/models/meta-state.ts

/** メタデータ（周回情報） */
interface MetaState {
  readonly runs: number;
  readonly escapes: number;
  readonly kp: number;
  readonly unlocked: readonly string[];
  readonly bestFloor: number;
  readonly totalEvents: number;
  readonly endings: readonly string[];
  readonly clearedDifficulties: readonly DifficultyId[];
  readonly totalDeaths: number;
  readonly lastRun: LastRunInfo | null;
  readonly activeTitle: string | null;
}

/** 前回ラン情報 */
interface LastRunInfo {
  readonly cause: string;
  readonly floor: number;
  readonly endingId: string | null;
  readonly hp: number;
  readonly mn: number;
  readonly inf: number;
}
```

**変更点**:
- `lastRun: any` → `LastRunInfo | null`（型安全化）
- `bestFl` → `bestFloor`（命名の明確化）
- `clearedDiffs: string[]` → `clearedDifficulties: readonly DifficultyId[]`（型の厳格化）
- `title` → `activeTitle`（命名の明確化）

### 1.4 Difficulty 値オブジェクト

```typescript
// domain/models/difficulty.ts

/** 難易度ID */
type DifficultyId = 'easy' | 'normal' | 'hard' | 'abyss';

/** 難易度定義（イミュータブル） */
interface DifficultyDef {
  readonly id: DifficultyId;
  readonly name: string;
  readonly subtitle: string;
  readonly color: string;
  readonly icon: string;
  readonly description: string;
  readonly modifiers: DifficultyModifiers;
  readonly rewards: DifficultyRewards;
}

/** 難易度による修正値 */
interface DifficultyModifiers {
  readonly hpMod: number;
  readonly mnMod: number;
  readonly drainMod: number;
  readonly dmgMult: number;
}

/** 難易度によるKP報酬 */
interface DifficultyRewards {
  readonly kpOnDeath: number;
  readonly kpOnWin: number;
}
```

**変更点**:
- `sub` → `subtitle`（命名の明確化）
- `desc` → `description`（命名の明確化）
- 修正値と報酬をサブオブジェクトに分離（SRP）
- `kpDeath` → `kpOnDeath`, `kpWin` → `kpOnWin`（命名の明確化）

### 1.5 StatusEffect 値オブジェクト

```typescript
// domain/models/status-effect.ts

/** 状態異常の視覚情報 */
interface StatusEffectVisual {
  readonly primaryColor: string;
  readonly bgColor: string;
  readonly borderColor: string;
}

/** 状態異常のターン経過効果 */
interface StatusEffectTick {
  readonly hpDelta: number;
  readonly mnDelta: number;
}

/** 状態異常定義 */
interface StatusEffectDef {
  readonly id: StatusEffectId;
  readonly visual: StatusEffectVisual;
  readonly tick: StatusEffectTick | null;
}
```

**変更点**:
- `colors: [string, string, string]` → `StatusEffectVisual`（各色の意味を明示）
- `tick: { hp, mn }` → `StatusEffectTick`（命名の明確化）

### 1.6 Unlock エンティティ

```typescript
// domain/models/unlock.ts

/** アンロックカテゴリ */
type UnlockCategory = 'basic' | 'special' | 'trophy' | 'achieve';

/** アンロック効果のキー */
type UnlockEffectKey =
  | 'hpBonus' | 'mentalBonus' | 'infoBonus'
  | 'infoMult' | 'healMult' | 'mnReduce' | 'hpReduce'
  | 'dangerSense' | 'bleedReduce' | 'drainImmune'
  | 'curseImmune' | 'secondLife' | 'chainBoost'
  | 'negotiator' | 'mentalSense';

/** アンロック効果値 */
type UnlockEffectValue = number | boolean;

/** アンロック定義 */
interface UnlockDef {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly cost: number;
  readonly icon: string;
  readonly category: UnlockCategory;
  readonly effects: Readonly<Record<UnlockEffectKey, UnlockEffectValue>>;
  readonly gateRequirement?: DifficultyId;
  readonly difficultyRequirement?: DifficultyId;
  readonly achievementCondition?: (meta: MetaState) => boolean;
  readonly achievementDescription?: string;
}
```

**変更点**:
- `desc` → `description`、`cat` → `category`（命名の明確化）
- `fx: UnlockFx` → `effects: Record<UnlockEffectKey, UnlockEffectValue>`（型安全化）
- `gate` → `gateRequirement`、`req` → `difficultyRequirement`（命名の明確化）
- `achReq` → `achievementCondition`、`achDesc` → `achievementDescription`（命名の明確化）

### 1.7 FxState（集約済みアンロック効果）

```typescript
// domain/models/unlock.ts

/** 集約済みアンロック効果 */
interface FxState {
  // 加算効果
  readonly hpBonus: number;
  readonly mentalBonus: number;
  readonly infoBonus: number;
  // 乗算効果
  readonly infoMult: number;
  readonly healMult: number;
  readonly mnReduce: number;
  readonly hpReduce: number;
  // ブール効果
  readonly dangerSense: boolean;
  readonly bleedReduce: boolean;
  readonly drainImmune: boolean;
  readonly curseImmune: boolean;
  readonly secondLife: boolean;
  readonly chainBoost: boolean;
  readonly negotiator: boolean;
  readonly mentalSense: boolean;
}
```

**変更点**: 構造変更なし。コメントで加算/乗算/ブールの分類を明示。

---

## 2. 条件評価システム仕様

### 2.1 現状の問題

現行の `evalCond` は文字列パース方式:
```typescript
// 現状: 型安全性なし
evalCond("hp>30", player, fx)  // "hp>30" がタイプミスでも実行時まで検出不可
```

### 2.2 新しい条件モデル

```typescript
// domain/events/condition.ts

/** 比較演算子 */
type ComparisonOp = '>' | '<' | '>=' | '<=';

/** 条件の Discriminated Union */
type Condition =
  | { type: 'default' }
  | { type: 'hp'; op: ComparisonOp; value: number }
  | { type: 'mn'; op: ComparisonOp; value: number }
  | { type: 'inf'; op: ComparisonOp; value: number }
  | { type: 'status'; statusId: StatusEffectId };
```

### 2.3 条件評価サービス（Strategy パターン）

```typescript
// domain/events/condition.ts

/** 条件を評価する純粋関数 */
const evaluateCondition = (condition: Condition, player: Player, fx: FxState): boolean => {
  switch (condition.type) {
    case 'default': return true;
    case 'status': return player.statuses.includes(condition.statusId);
    case 'hp': return evaluateStatCondition(getEffectiveHp(player, fx), condition);
    case 'mn': return evaluateStatCondition(getEffectiveMn(player, fx), condition);
    case 'inf': return evaluateStatCondition(player.inf, condition);
  }
};
```

### 2.4 イベントデータの移行戦略

**重要**: `event-data.ts`（212KB）のイベントデータ内の条件文字列 `"hp>30"` 等は、型付きオブジェクトに**段階的に**移行する。

- **Phase 1**: 文字列 → 型付きオブジェクトへの変換関数 `parseCondition` を実装
- **Phase 2**: `evaluateCondition` が新旧両方の形式を受け付ける
- **Phase 3**: イベントデータの条件を型付きオブジェクトに段階的に書き換え
- **Phase 4**: 旧形式のサポートを除去

```typescript
/** 旧形式の文字列条件を新形式に変換（移行期間用） */
const parseCondition = (condStr: string): Condition => {
  if (condStr === 'default') return { type: 'default' };
  if (condStr.startsWith('status:')) return { type: 'status', statusId: condStr.slice(7) as StatusEffectId };
  // hp>, hp<, mn>, mn<, inf>, inf< をパース
  const match = condStr.match(/^(hp|mn|inf)([><]=?)(\d+)$/);
  if (match) {
    const [, stat, op, val] = match;
    return { type: stat as 'hp' | 'mn' | 'inf', op: op as ComparisonOp, value: parseInt(val, 10) };
  }
  throw new Error(`Unknown condition format: "${condStr}"`);
};
```

---

## 3. 乱数ソース抽象化仕様

### 3.1 問題の背景

現行の `pickEvent` は `shuffle`（内部で `Math.random`）に直接依存しているため、どのイベントが選出されるかが非決定論的である。
これにより以下の問題が生じる：

- **E2E テストのフレーキーネス**: ゲームオーバー・エンディング到達等のシナリオを安定して再現できない
- **単体テストの困難**: `pickEvent` のテストで特定のイベントが選出されることを保証できない
- **デバッグの困難**: 特定のイベント列を再現してバグを調査できない

### 3.2 RandomSource インターフェース

```typescript
// domain/events/random.ts

/** 乱数ソースのインターフェース */
interface RandomSource {
  /** 0 以上 1 未満の乱数を返す（Math.random() と同じ契約） */
  random(): number;
}

/** デフォルト乱数ソース（本番用） */
class DefaultRandomSource implements RandomSource {
  random(): number {
    return Math.random();
  }
}

/**
 * seed 固定乱数ソース（テスト・デバッグ用）
 * 同一 seed からは常に同一の乱数列が生成される
 * アルゴリズム: xorshift32（軽量・十分な品質）
 */
class SeededRandomSource implements RandomSource {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  random(): number {
    this.state ^= this.state << 13;
    this.state ^= this.state >> 17;
    this.state ^= this.state << 5;
    return (this.state >>> 0) / 0xFFFFFFFF;
  }
}
```

### 3.3 shuffle への注入

```typescript
// domain/events/random.ts（または utils/math-utils.ts を拡張）

/** 乱数ソース注入可能な shuffle */
const shuffleWith = <T>(array: readonly T[], rng: RandomSource = new DefaultRandomSource()): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
```

### 3.4 pickEvent への注入

```typescript
// domain/events/event-selector.ts

/** イベント選出（乱数ソース注入対応） */
const pickEvent = (
  events: readonly GameEvent[],
  floor: number,
  usedIds: readonly string[],
  meta: MetaState,
  fx: FxState,
  rng: RandomSource = new DefaultRandomSource()
): GameEvent | null => {
  const pool = events.filter(e =>
    e.fl.includes(floor) && !usedIds.includes(e.id) && !e.chainOnly
    && (!e.metaCond || e.metaCond(meta))
  );
  if (pool.length === 0) return null;
  const weighted = buildWeightedPool(pool, fx);
  return shuffleWith(weighted, rng)[0];
};
```

**設計方針**:
- `rng` パラメータはデフォルト引数付き → 既存の呼び出しを変更不要
- 本番コードは `DefaultRandomSource`（`Math.random` ラッパー）を使用
- E2E テストは `SeededRandomSource` を注入してイベント列を確定

### 3.5 E2E テストでの注入方法

E2E テスト（ブラウザ環境）では、以下の方法で seed 固定の乱数ソースを注入する：

```typescript
// 方法: window グローバルに乱数ソースを公開し、E2E テストから制御

// プロダクションコード側（presentation/LabyrinthEchoGame.tsx）
const getRandomSource = (): RandomSource => {
  if (typeof window !== 'undefined' && window.__LE_TEST_RNG__) {
    return window.__LE_TEST_RNG__;
  }
  return new DefaultRandomSource();
};

// E2E テスト側（e2e/labyrinth-echo/helpers/le-page.ts）
async injectSeededRng(seed: number): Promise<void> {
  await this.page.evaluate((s) => {
    // SeededRandomSource の実装をブラウザ内で再現
    let state = s;
    window.__LE_TEST_RNG__ = {
      random() {
        state ^= state << 13;
        state ^= state >> 17;
        state ^= state << 5;
        return (state >>> 0) / 0xFFFFFFFF;
      }
    };
  }, seed);
}
```

**制約**:
- `window.__LE_TEST_RNG__` は `NODE_ENV !== 'production'` 時のみ参照
- 型定義は `declare global` で拡張
- seed 値はテストケースごとに固定値を使用し、コメントで期待されるイベント列を記録

---

## 4. ドメインサービス仕様

### 4.1 CombatService（戦闘計算サービス）

```typescript
// domain/services/combat-service.ts

/** ダメージ/回復修正値を適用（純粋関数） */
const applyModifiers = (
  outcome: Outcome,
  fx: FxState,
  difficulty: DifficultyDef | null,
  playerStatuses: readonly StatusEffectId[]
): StatChanges

/** プレイヤーにステータス変更を適用（純粋関数） */
const applyChangesToPlayer = (
  player: Player,
  changes: StatChanges,
  statusAction: StatusAction | null
): Player

/** ターン経過ドレインを計算（純粋関数） */
const computeDrain = (
  player: Player,
  fx: FxState,
  difficulty: DifficultyDef | null
): DrainResult

/** SecondLife 復活判定（純粋関数） */
const checkSecondLife = (
  player: Player,
  fx: FxState,
  usedSecondLife: boolean
): SecondLifeResult
```

**不変条件（DbC）**:
- `applyModifiers`: outcome が null でないこと
- `applyChangesToPlayer`: 返却値の hp, mn が 0 以上 max 以下
- `computeDrain`: player が null でないこと

### 4.2 UnlockService（アンロック計算サービス）

```typescript
// domain/services/unlock-service.ts

/** アンロック効果を集約（純粋関数） */
const computeFx = (unlockedIds: readonly string[]): FxState

/** プレイヤーの初期ステータスを生成（Factory パターン） */
const createPlayer = (difficulty: DifficultyDef, fx: FxState): Player

/** アンロック購入可否を判定 */
const canPurchaseUnlock = (
  unlockId: string,
  meta: MetaState
): { purchasable: boolean; reason?: string }

/** トロフィー・実績の自動解放判定 */
const checkAutoUnlocks = (meta: MetaState): readonly string[]
```

### 4.3 EndingService（エンディング判定サービス）

```typescript
// domain/services/ending-service.ts

/** エンディングを判定（Chain of Responsibility パターン） */
const determineEnding = (
  player: Player,
  log: readonly LogEntry[],
  difficulty: DifficultyDef | null
): EndingDef

/** 死亡フレーバーテキストを取得 */
const getDeathFlavor = (cause: DeathCause, runCount: number): string

/** 死亡時のコンテキストヒントを取得 */
const getDeathTip = (cause: DeathCause, floor: number): string
```

### 4.4 TitleService（称号判定サービス）

```typescript
// domain/services/title-service.ts

/** 解放済み称号を全取得 */
const getUnlockedTitles = (meta: MetaState): readonly TitleDef[]

/** アクティブ称号を取得 */
const getActiveTitle = (meta: MetaState): TitleDef
```

---

## 5. アプリケーション層（ユースケース）仕様

### 5.1 StartRunUseCase

```typescript
// application/use-cases/start-run.ts

interface StartRunInput {
  difficulty: DifficultyDef;
  meta: MetaState;
}

interface StartRunOutput {
  gameState: GameState;
  updatedMeta: MetaState;
}

/** ラン開始ユースケース */
const startRun = (input: StartRunInput): StartRunOutput
```

**処理フロー**:
1. `computeFx(meta.unlocked)` で FX 集約
2. `createPlayer(difficulty, fx)` でプレイヤー生成
3. `GameState` を初期化（phase: floor_intro, floor: 1, step: 0）
4. `meta.runs` をインクリメント

### 5.2 ProcessChoiceUseCase

```typescript
// application/use-cases/process-choice.ts

interface ProcessChoiceInput {
  gameState: GameState;
  choiceIndex: number;
  meta: MetaState;
}

interface ProcessChoiceOutput {
  gameState: GameState;
  updatedMeta: MetaState;
  feedback: ChoiceFeedback;
}

/** 選択肢の処理結果に含まれるフィードバック情報 */
interface ChoiceFeedback {
  impact: 'bigDmg' | 'dmg' | 'heal' | null;
  statChanges: StatChanges;
  drain: DrainInfo | null;
  statusAdded: StatusEffectId | null;
  statusRemoved: StatusEffectId | null;
  secondLifeActivated: boolean;
  chainTriggered: boolean;
  resultText: string;
}
```

**処理フロー**:
1. イベントから選択肢を取得
2. `resolveOutcome` で結果を決定
3. `applyModifiers` で修正値を計算
4. `applyChangesToPlayer` でプレイヤー状態を更新
5. `computeDrain` でドレインを適用
6. `checkSecondLife` で復活判定
7. 死亡/脱出の判定
8. `ChoiceFeedback` を生成（UI側の副作用のトリガーに使用）

**重要な設計方針**: このユースケースは**副作用を持たない純粋な計算**。音声再生・タイマー設定等の副作用は、返却された `ChoiceFeedback` を元にプレゼンテーション層が実行する。

### 5.3 ProceedStepUseCase

```typescript
// application/use-cases/proceed-step.ts

interface ProceedStepInput {
  gameState: GameState;
  events: readonly GameEvent[];
  meta: MetaState;
  rng: RandomPort;  // 乱数ソース（イベント選出に使用）
}

interface ProceedStepOutput {
  gameState: GameState;
  transition: StepTransition;
}

/** ステップ遷移の種別 */
type StepTransition =
  | { type: 'next_event'; event: GameEvent }
  | { type: 'floor_change'; newFloor: number }
  | { type: 'boss_encounter' }
  | { type: 'game_over'; cause: DeathCause }
  | { type: 'chain_event'; event: GameEvent };
```

### 5.4 ManageUnlocksUseCase

```typescript
// application/use-cases/manage-unlocks.ts

interface PurchaseUnlockInput {
  unlockId: string;
  meta: MetaState;
}

interface PurchaseUnlockOutput {
  updatedMeta: MetaState;
  success: boolean;
  reason?: string;
}

const purchaseUnlock = (input: PurchaseUnlockInput): PurchaseUnlockOutput
```

---

## 6. ポートインターフェース仕様

### 6.1 StoragePort

```typescript
// application/ports/storage-port.ts

/** ストレージポート（依存性逆転の原則） */
interface StoragePort {
  /** メタデータを保存 */
  saveMeta(meta: MetaState): Promise<void>;
  /** メタデータを読み込み */
  loadMeta(): Promise<MetaState | null>;
  /** メタデータをリセット */
  resetMeta(): Promise<void>;
  /** オーディオ設定を保存 */
  saveAudioSettings(settings: AudioSettings): void;
  /** オーディオ設定を読み込み */
  loadAudioSettings(): AudioSettings;
}
```

### 6.2 AudioPort

```typescript
// application/ports/audio-port.ts

/** オーディオポート */
interface AudioPort {
  /** AudioContext を初期化 */
  initialize(): void;
  /** 効果音を再生 */
  playSfx(sfxType: SfxType): void;
  /** BGM を開始 */
  startBgm(floor: number): void;
  /** BGM を停止 */
  stopBgm(): void;
  /** イベントムードを設定 */
  setMood(mood: EventMood): void;
  /** 危機状態を更新 */
  updateCrisis(hpRatio: number, mnRatio: number): void;
  /** BGM 音量を設定 */
  setVolume(volume: number): void;
}

/** 効果音種別 */
type SfxType =
  | 'tick' | 'hit' | 'bigHit' | 'heal'
  | 'status' | 'clear' | 'floor' | 'over'
  | 'victory' | 'choice' | 'drain' | 'levelUp'
  | 'page' | 'unlock' | 'titleGlow'
  | 'endingFanfare' | 'curseApply' | 'secondLife'
  | 'ambient';

/** イベントムード */
type EventMood = 'exploration' | 'encounter' | 'trap' | 'rest' | 'boss';
```

### 6.3 RandomPort

```typescript
// application/ports/random-port.ts

/** 乱数ソースポート（依存性逆転の原則） */
interface RandomPort {
  /** 0 以上 1 未満の乱数を返す */
  random(): number;
}
```

**仕様**:
- 本番: `DefaultRandomSource`（`Math.random` ラッパー）
- E2E テスト: `SeededRandomSource`（seed 固定、xorshift32）
- 単体テスト: モック（特定の値を返す関数）

---

## 7. インフラ層仕様

### 7.1 LocalStorageAdapter

```typescript
// infrastructure/storage/local-storage-adapter.ts

/** localStorage を使ったストレージ実装 */
class LocalStorageAdapter implements StoragePort {
  // キー定数を一元管理
  private static readonly META_KEY = 'labyrinth-echo-save';
  private static readonly AUDIO_KEY = 'labyrinth-echo-audio-settings';

  async saveMeta(meta: MetaState): Promise<void>
  async loadMeta(): Promise<MetaState | null>
  async resetMeta(): Promise<void>
  saveAudioSettings(settings: AudioSettings): void
  loadAudioSettings(): AudioSettings
}
```

**仕様**:
- 全操作を `try-catch` でラップし、localStorage 利用不可時は静かに失敗
- `loadMeta` はスキーマバリデーションを実施し、不整合データはフォールバック
- キー定数は private static で一元管理

### 7.2 AudioAdapter

```typescript
// infrastructure/audio/audio-adapter.ts

/** AudioEngine をラップした AudioPort 実装 */
class AudioAdapter implements AudioPort {
  private engine: AudioEngine;

  initialize(): void
  playSfx(sfxType: SfxType): void
  startBgm(floor: number): void
  stopBgm(): void
  setMood(mood: EventMood): void
  updateCrisis(hpRatio: number, mnRatio: number): void
  setVolume(volume: number): void
}
```

**仕様**:
- `AudioEngine` のシングルトンインスタンスを内部で保持
- `playSfx` は `SfxType` から対応するエンジンメソッドへのマッピング
- 音声無効時は呼び出しをスキップ（NullObject パターン）

### 7.3 NullAudioAdapter（テスト用）

```typescript
// infrastructure/audio/null-audio-adapter.ts

/** テスト用のノーオプ AudioPort 実装 */
class NullAudioAdapter implements AudioPort {
  // 全メソッドが何もしない
}
```

---

## 8. プレゼンテーション層仕様

### 8.1 LabyrinthEchoGame（エントリーポイント）

```typescript
// presentation/LabyrinthEchoGame.tsx

/** メインゲームコンポーネント — 薄いシェル */
function LabyrinthEchoGame() {
  return (
    <ErrorBoundary>
      <GameProvider>
        <GameRouter />
      </GameProvider>
    </ErrorBoundary>
  );
}
```

**仕様**:
- `GameProvider` が状態管理とポート（Storage, Audio）を提供
- `GameRouter` がフェーズに応じた画面を表示
- ビジネスロジックを一切持たない

### 8.2 GameRouter（フェーズルーティング）

```typescript
// presentation/components/GameRouter.tsx

/** フェーズに応じた画面の切り替え */
function GameRouter() {
  const { phase } = useGameState();

  // Discriminated Union の型による網羅性チェック（exhaustive switch）
  switch (phase.type) {
    case 'title': return <TitleScreen />;
    case 'diff_select': return <DiffSelectScreen />;
    case 'floor_intro': return <FloorIntroScreen floor={phase.floor} />;
    case 'event': return <EventScreen event={phase.event} />;
    case 'result': return <ResultScreen result={phase.result} />;
    case 'game_over': return <GameOverScreen cause={phase.cause} />;
    case 'victory': return <VictoryScreen ending={phase.ending} />;
    case 'menu': return <MenuScreen screen={phase.screen} />;
  }
}
```

### 8.3 コンポーネントディレクトリ構成

```
presentation/components/
├── screens/
│   ├── TitleScreen.tsx
│   ├── DiffSelectScreen.tsx
│   ├── FloorIntroScreen.tsx
│   ├── EventScreen.tsx         # 旧 EventResultScreen の event 部分
│   ├── ResultScreen.tsx        # 旧 EventResultScreen の result 部分
│   ├── GameOverScreen.tsx
│   ├── VictoryScreen.tsx
│   └── menus/
│       ├── UnlocksScreen.tsx
│       ├── TitlesScreen.tsx
│       ├── RecordsScreen.tsx
│       └── SettingsScreen.tsx
├── overlays/
│   ├── StatusOverlay.tsx
│   ├── GuidanceOverlay.tsx
│   └── VignetteOverlay.tsx
└── shared/
    ├── Page.tsx
    ├── Section.tsx
    ├── Badge.tsx
    ├── ParallaxBg.tsx
    └── Particles.tsx
```

**仕様**:
- 各画面コンポーネントは 200 行以内
- Props は最小限（必要なデータのみ。コールバックは Context 経由）
- スタイルは styled-components で co-locate

---

## 9. 状態管理仕様

### 9.1 GameReducer

```typescript
// presentation/hooks/use-game-orchestrator.ts

/** ゲームアクション（Discriminated Union） */
type GameAction =
  | { type: 'START_RUN' }
  | { type: 'SELECT_DIFFICULTY'; difficulty: DifficultyDef }
  | { type: 'ENTER_FLOOR' }
  | { type: 'MAKE_CHOICE'; choiceIndex: number }
  | { type: 'PROCEED' }
  | { type: 'PURCHASE_UNLOCK'; unlockId: string }
  | { type: 'NAVIGATE_MENU'; screen: MenuScreen }
  | { type: 'BACK_TO_TITLE' }
  | { type: 'TOGGLE_AUDIO' }
  | { type: 'UPDATE_AUDIO_SETTINGS'; settings: AudioSettings }
  | { type: 'RESET_META' };

/** Reducer（純粋関数） */
const gameReducer = (state: GameState, action: GameAction): GameState
```

**仕様**:
- `useReducer` で状態遷移を一元管理
- Reducer は**純粋関数**（副作用なし）
- 副作用（音声、ストレージ）は `useEffect` + `ChoiceFeedback` で分離

### 9.2 副作用フック

```typescript
// presentation/hooks/use-audio-effects.ts

/** 音声副作用フック — ChoiceFeedback に応じて音声を再生 */
const useAudioEffects = (feedback: ChoiceFeedback | null, audio: AudioPort): void

// presentation/hooks/use-persistence-sync.ts

/** 永続化同期フック — MetaState 変更時に自動保存 */
const usePersistenceSync = (meta: MetaState, storage: StoragePort): void
```

---

## 10. テスト仕様

### 10.1 テストディレクトリ構成

```
__tests__/
├── domain/
│   ├── models/
│   │   ├── player.test.ts          # Player 値オブジェクトのテスト
│   │   ├── game-state.test.ts      # GameState のテスト
│   │   └── meta-state.test.ts      # MetaState のテスト
│   ├── events/
│   │   ├── condition.test.ts       # 条件評価のテスト
│   │   └── event-selector.test.ts  # イベント選択のテスト
│   └── services/
│       ├── combat-service.test.ts  # 戦闘計算のテスト
│       ├── unlock-service.test.ts  # アンロック計算のテスト
│       ├── ending-service.test.ts  # エンディング判定のテスト
│       └── title-service.test.ts   # 称号判定のテスト
├── application/
│   └── use-cases/
│       ├── start-run.test.ts
│       ├── process-choice.test.ts
│       ├── proceed-step.test.ts
│       └── manage-unlocks.test.ts
├── infrastructure/
│   ├── local-storage-adapter.test.ts
│   └── audio-adapter.test.ts
├── presentation/
│   ├── hooks/
│   │   ├── use-game-orchestrator.test.ts
│   │   ├── use-text-reveal.test.ts
│   │   └── use-visual-fx.test.ts
│   └── components/
│       ├── title-screen.test.tsx
│       ├── diff-select-screen.test.tsx
│       ├── event-screen.test.tsx
│       ├── result-screen.test.tsx
│       └── game-over-screen.test.tsx
└── helpers/
    ├── factories.ts                # テスト用ファクトリ関数
    ├── builders.ts                 # テスト用ビルダー
    └── mocks.ts                    # 共通モック
```

### 10.2 テストヘルパー仕様

```typescript
// __tests__/helpers/factories.ts

/** テスト用のデフォルト Player を生成 */
const createTestPlayer = (overrides?: Partial<Player>): Player

/** テスト用のデフォルト MetaState を生成 */
const createTestMeta = (overrides?: Partial<MetaState>): MetaState

/** テスト用のデフォルト GameEvent を生成 */
const createTestEvent = (overrides?: Partial<GameEvent>): GameEvent

/** テスト用の FxState を生成（全デフォルト値） */
const createTestFx = (overrides?: Partial<FxState>): FxState
```

### 10.3 テスト記述規約

```typescript
describe('CombatService', () => {
  describe('applyModifiers', () => {
    describe('正常系', () => {
      it('回復効果に healMult が乗算される', () => {
        // Arrange
        const outcome = createTestOutcome({ hp: 10 });
        const fx = createTestFx({ healMult: 1.5 });

        // Act
        const result = applyModifiers(outcome, fx, null, []);

        // Assert
        expect(result.hp).toBe(15);
      });
    });

    describe('異常系', () => {
      it('outcome が null の場合に例外を投げる', () => {
        // Arrange & Act & Assert
        expect(() => applyModifiers(null as never, createTestFx(), null, []))
          .toThrow('Invariant violation');
      });
    });

    describe('境界値', () => {
      it('HP変更が0の場合、修正値は適用されない', () => {
        // Arrange
        const outcome = createTestOutcome({ hp: 0 });
        const fx = createTestFx({ healMult: 2.0, hpReduce: 0.5 });

        // Act
        const result = applyModifiers(outcome, fx, null, []);

        // Assert
        expect(result.hp).toBe(0);
      });
    });
  });
});
```

### 10.4 カバレッジ目標

| レイヤー | Lines | Branches | Functions |
|----------|-------|----------|-----------|
| domain/models | 95% | 90% | 95% |
| domain/services | 90% | 85% | 90% |
| domain/events | 90% | 85% | 90% |
| application/use-cases | 85% | 80% | 85% |
| infrastructure | 80% | 75% | 80% |
| presentation/hooks | 75% | 70% | 75% |
| presentation/components | 70% | 65% | 70% |

---

## 11. E2E テスト仕様

### 11.1 テスト環境

- **フレームワーク**: Playwright（既存の `playwright.config.ts` を拡張）
- **ブラウザ**: Chromium（既存設定と同一）
- **ワーカー数**: 1（ゲーム状態の干渉防止）

### 11.2 テストディレクトリ

```
e2e/
└── labyrinth-echo/
    ├── basic-flow.spec.ts       # 基本フロー（seed 固定）
    ├── game-over.spec.ts        # ゲームオーバーフロー（seed 固定）
    ├── ending.spec.ts           # エンディング到達（seed 固定）
    ├── persistence.spec.ts      # データ永続化
    ├── keyboard-nav.spec.ts     # キーボードナビゲーション（seed 固定）
    ├── unlock-system.spec.ts    # アンロックシステム（seed 固定）
    └── helpers/
        ├── le-page.ts           # Page Object Model
        └── seed-registry.ts     # テスト用 seed 定義（期待イベント列をコメント記録）
```

### 11.3 Page Object Model

```typescript
// e2e/labyrinth-echo/helpers/le-page.ts

class LabyrinthEchoPage {
  constructor(private page: Page) {}

  /** タイトル画面に移動 */
  async goto(): Promise<void>

  /** seed 固定の乱数ソースを注入（ゲーム開始前に呼ぶ） */
  async injectSeededRng(seed: number): Promise<void>

  /** ゲームを開始 */
  async startGame(): Promise<void>

  /** 難易度を選択 */
  async selectDifficulty(id: DifficultyId): Promise<void>

  /** フロアに進入 */
  async enterFloor(): Promise<void>

  /** 選択肢を選ぶ */
  async makeChoice(index: number): Promise<void>

  /** テキスト表示完了を待つ */
  async waitForTextReveal(): Promise<void>

  /** 結果画面で次に進む */
  async proceed(): Promise<void>

  /** 現在のフェーズを取得 */
  async getCurrentPhase(): Promise<string>

  /** プレイヤーのHPを取得 */
  async getPlayerHp(): Promise<number>

  /** localStorage をクリア */
  async clearStorage(): Promise<void>
}
```

### 11.4 テストシナリオ（seed 固定による決定論的テスト）

**前提**: 全ゲームプレイシナリオは `injectSeededRng(seed)` で乱数を固定してから実行する。
seed 値ごとに期待されるイベント列を `seed-registry.ts` に記録し、テストの意図を明確にする。

#### E2E-1: 基本ゲームフロー（seed 固定）

```
前提: injectSeededRng(SEED_BASIC_FLOW) を実行
1. タイトル画面が表示される
2. 「探索を始める」をクリック
3. 難易度「探索者」を選択
4. フロア紹介画面が表示される（フロア名・説明が正しい）
5. フロアに進入
6. イベントが表示される（seed により確定したイベント）
7. 選択肢をクリック
8. 結果テキストが表示される
9. ステータス変化が表示される
10. 「次へ進む」をクリック
11. 次のイベントが表示される（seed により確定）
```

#### E2E-2: ゲームオーバーフロー（seed 固定）

```
前提: injectSeededRng(SEED_GAME_OVER) を実行
  ※ SEED_GAME_OVER は修羅難度で HP/MN が 0 になるイベント列を生成する seed
1. ゲームを開始（難易度「修羅」）
2. seed 確定のイベント列に従い選択肢を選ぶ
3. HP or MN が 0 になる（seed で保証）
4. ゲームオーバー画面が表示される
5. 死因（体力消耗 or 精神崩壊）が正しく表示される
6. KP が加算されている
7. 「タイトルに戻る」でタイトル画面に戻る
8. タイトル画面の周回数・KP が更新されている
```

#### E2E-3: エンディング到達（seed 固定）

```
前提: injectSeededRng(SEED_ENDING) を実行
  ※ SEED_ENDING は探索者難度でクリア可能なイベント列を生成する seed
1. ゲームを開始（難易度「探索者」）
2. seed 確定のイベント列に従い全フロアを進む
3. 脱出イベントで「escape」フラグが発生
4. エンディング画面が表示される
5. エンディング名・説明が正しく表示される
6. KP がクリア報酬分加算されている
7. タイトルに戻ると周回情報が更新されている
```

#### E2E-4: データ永続化

```
前提: injectSeededRng(SEED_BASIC_FLOW) を実行
1. ゲームを開始して数イベント進める
2. ページをリロード
3. タイトル画面のラン数が正しい
4. KP が保持されている
5. アンロック状態が保持されている
6. リセット操作を実行
7. 全データが初期化されている
```

#### E2E-5: キーボードナビゲーション（seed 固定）

```
前提: injectSeededRng(SEED_BASIC_FLOW) を実行
1. タイトル画面で Enter キーを押す
2. 難易度選択画面で ↑↓ キーで選択、ハイライトが移動する
3. Enter で決定
4. フロア紹介画面で Enter で進入
5. イベント画面で 1-9 の数字キーで選択肢を選択
6. 結果画面で Enter で次に進む
7. テキスト表示中にスペースキーでスキップ可能
```

#### E2E-6: アンロックシステム（seed 固定）

```
前提: injectSeededRng(SEED_GAME_OVER) を実行
1. ゲームを開始して死亡（KP を獲得）
2. タイトル画面に戻る
3. 「知見の継承」画面に遷移
4. KP が表示されている
5. 購入可能なアンロックが表示されている
6. KP を使ってアンロック（例: 「鋼の心臓」HP+5）を購入
7. 購入後の KP 残高が正しい
前提: injectSeededRng(SEED_BASIC_FLOW) を再注入
8. ゲームを開始
9. 初期 HP がアンロック効果分（+5）増加している
```
