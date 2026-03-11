# KEYS & ARMS 大規模リファクタリング — 詳細仕様書

## Phase 1: 型システム基盤（Type Foundation）

### 1.1 型定義ファイル群

#### 1.1.1 `types/game-state.ts` — ゲーム全体状態

```typescript
/** ゲーム画面状態 */
export type GameScreen =
  | 'title'
  | 'help'
  | 'cave'
  | 'grass'
  | 'boss'
  | 'over'
  | 'ending1'
  | 'trueEnd';

/** ゲーム全体の状態 */
export interface GameState {
  // 画面制御
  readonly state: GameScreen;
  readonly tick: number;
  readonly loop: number;

  // プレイヤー
  readonly hp: number;
  readonly score: number;
  readonly hi: number;           // ハイスコア

  // 入力
  readonly jp: InputState;       // 「押された」フラグ（1フレーム）
  readonly kd: InputState;       // 「押下中」フラグ

  // ポーズ・リセット
  readonly paused: boolean;
  readonly resetConfirm: number;

  // トランジション
  readonly trT: number;          // トランジションタイマー
  readonly trTxt: string;        // トランジションテキスト
  readonly trSub: string;        // サブテキスト
  readonly trFn: (() => void) | undefined;

  // ヘルプ
  readonly helpPage: number;

  // ビート
  readonly bgmBeat: number;

  // ヒットストップ
  readonly hitStop: number;
  readonly hitFlash: number;

  // 画面エフェクト
  readonly shakeX: number;
  readonly shakeY: number;
  readonly dmgFlash: number;

  // ステージ状態
  readonly cav: CaveState;
  readonly grs: PrairieState;
  readonly bos: BossState;

  // パーティクル
  readonly particles: ParticlePools;

  // 獲得シールド（ステージ間共有）
  readonly earnedShields: number;

  // ステージ初期化関数（遅延バインド）
  cavInit: () => void;
  grsInit: () => void;
  bosInit: () => void;
}
```

**設計意図**:
- `readonly` で不変性を明示（実際のミューテーションは制御された箇所のみ）
- ステージ状態は各ステージ型で定義（後述）
- 入力状態は別型で管理

#### 1.1.2 `types/input.ts` — 入力状態

```typescript
/** キー名 → 押下状態のマップ */
export interface InputState {
  readonly [key: string]: boolean;
}

/** 入力コマンド（Command パターン用） */
export interface InputCommand {
  /** コマンドを実行し、新しい状態を返す */
  execute(state: GameState): GameState;
}

/** 入力ハンドラーインターフェース */
export interface InputHandler {
  /** 現在のフレームで押されたキーを返す */
  justPressed(key: string): boolean;
  /** 現在押下中のキーを返す */
  isDown(key: string): boolean;
  /** フレーム終了時にリセット */
  clearFrame(): void;
}
```

#### 1.1.3 `types/stage.ts` — ステージ共通インターフェース

```typescript
/** ステージ共通インターフェース */
export interface Stage {
  /** ゲームティック（ロジック更新） */
  update(): void;
  /** 描画 */
  draw(): void;
  /** ステージ初期化 */
  init(): void;
}

/** 洞窟ステージ状態 */
export interface CaveState {
  readonly pos: number;           // 現在の部屋位置
  readonly keysPlaced: number;    // 設置済み鍵数
  readonly hasKey: boolean;       // 鍵所持フラグ
  readonly hazardTimer: number;   // ハザードタイマー
  readonly doorOpen: boolean;     // ドア開放フラグ
  // BAT 状態
  readonly batPhase: number;
  readonly batY: number;
  readonly batTimer: number;
  // SPIDER 状態
  readonly spiderPhase: number;
  readonly spiderY: number;
  // MIMIC 状態
  readonly mimicHits: number;
  readonly mimicOpen: boolean;
  // CAGE 状態
  readonly cageProgress: number;
  readonly cageMax: number;
  // キャラクター表示
  readonly playerFrame: number;
  readonly playerFlip: boolean;
}

/** 草原ステージ状態 */
export interface PrairieState {
  readonly lane: number;          // 現在レーン
  readonly ens: ReadonlyArray<PrairieEnemy>;
  readonly combo: number;
  readonly maxCombo: number;
  readonly kills: number;
  readonly goal: number;
  readonly shieldCount: number;
  readonly sweepReady: boolean;
  readonly guardActive: boolean;
  readonly attackCooldown: number;
}

/** 草原の敵 */
export interface PrairieEnemy {
  readonly type: 'normal' | 'shifter' | 'dasher';
  readonly lane: number;
  readonly stage: number;
  readonly hp: number;
  readonly dead: boolean;
}

/** ボスステージ状態 */
export interface BossState {
  readonly arms: ReadonlyArray<BossArm>;
  readonly peds: ReadonlyArray<0 | 1>;  // 台座（0: 空, 1: 宝石設置済み）
  readonly playerAngle: number;
  readonly rageLevel: number;
  readonly rageWave: number;
  readonly gemsPlaced: number;
  readonly shieldsRemaining: number;
  readonly counterWindow: number;
}

/** ボスの腕 */
export interface BossArm {
  readonly stage: number;
  readonly dir: number;
  readonly speed: number;
  readonly restTimer: number;
  readonly active: boolean;
}
```

#### 1.1.4 `types/screen.ts` — 画面共通インターフェース

```typescript
/** 画面共通インターフェース */
export interface Screen {
  /** 画面描画 */
  draw(): void;
  /** 入力処理・状態更新 */
  update(): void;
}
```

#### 1.1.5 `types/rendering.ts` — 描画 API

```typescript
/** 描画 API インターフェース */
export interface DrawingAPI {
  /** Canvas 2D コンテキスト */
  readonly $: CanvasRenderingContext2D;

  /** ON 色で塗りつぶし（alpha 指定） */
  onFill(alpha: number): void;
  /** 矩形描画（LCD スタイル） */
  R(x: number, y: number, w: number, h: number, on: boolean): void;
  /** テキスト描画 */
  txt(str: string, x: number, y: number, size: number): void;
  /** 中央揃えテキスト描画 */
  txtC(str: string, x: number, y: number, size: number): void;
  /** 円描画（塗りつぶし） */
  circle(x: number, y: number, r: number): void;
  /** 円描画（枠線） */
  circleS(x: number, y: number, r: number): void;
  /** スプライト描画 */
  px(data: SpriteData, dx: number, dy: number, s: number, on: boolean, flip?: boolean): void;

  // アイコン描画
  iHeart(): void;
  iGem(): void;
  iSlime(): void;
  iGoblin(): void;
  iSkel(): void;
  iBoss(): void;
}
```

#### 1.1.6 `types/audio.ts` — オーディオ API

```typescript
/** オーディオサービスインターフェース */
export interface AudioService {
  /** AudioContext の遅延初期化 */
  ensureContext(): void;
  /** BGM ティック更新 */
  bgmTick(state: GameScreen): void;
  /** ヒットストップ設定 */
  doHitStop(frames: number): void;

  /** 効果音 */
  readonly sfx: SoundEffects;
}

/** 効果音一覧 */
export interface SoundEffects {
  tick(): void;
  move(): void;
  grab(): void;
  hit(): void;
  kill(): void;
  hurt(): void;
  doorOpen(): void;
  combo(n: number): void;
  sweep(): void;
  shield(): void;
  counter(): void;
  gemPlace(): void;
  bossDie(): void;
  fanfare(): void;
  trueEndFanfare(): void;
}
```

#### 1.1.7 `types/particles.ts` — パーティクル

```typescript
/** 単一パーティクル */
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  s: number;        // サイズ
  rot: number;      // 回転角
  gravity: number;
}

/** パーティクルプール */
export type ParticlePool = Particle[];

/** 全パーティクルプール */
export interface ParticlePools {
  readonly footstep: ParticlePool;
  readonly spark: ParticlePool;
  readonly smoke: ParticlePool;
  readonly feather: ParticlePool;
  readonly shieldBreak: ParticlePool;
  readonly slash: ParticlePool;
  readonly gemGlow: ParticlePool;
  readonly bossExplode: ParticlePool;
}

/** パーティクル生成パラメータ */
export interface ParticleSpawnParams {
  readonly x: number;
  readonly y: number;
  readonly n: number;
  readonly vxSpread: number;
  readonly vySpread: number;
  readonly vyBase?: number;
  readonly life: number;
  readonly s: number;
  readonly rot?: number;
  readonly gravity?: number;
}

/** パーティクルシステム API */
export interface ParticleSystem {
  spawn(pool: ParticlePool, params: ParticleSpawnParams): void;
  updateAndDraw(pool: ParticlePool, color: string): void;
}

/** ポップアップテキスト */
export interface Popup {
  x: number;
  y: number;
  text: string;
  life: number;
}

/** ポップアップシステム API */
export interface PopupSystem {
  add(x: number, y: number, text: string): void;
  clear(): void;
  updateAndDraw(): void;
}
```

#### 1.1.8 `types/hud.ts` — HUD API

```typescript
/** HUD API インターフェース */
export interface HUDAPI {
  /** ビート長を返す */
  beatLength(): number;
  /** ビートカウント処理 */
  doBeat(): void;
  /** ダメージ処理 */
  doHurt(): void;
  /** HUD 描画（スコア、HP、ビートバー） */
  drawHUD(): void;
  /** トランジション開始 */
  transTo(text: string, fn: () => void, sub?: string): void;
  /** トランジション描画 */
  drawTrans(): boolean;
}
```

#### 1.1.9 `types/engine-context.ts` — エンジンコンテキスト

```typescript
/** エンジンコンテキスト（各モジュールに渡される依存関係の束） */
export interface EngineContext {
  readonly G: GameState;
  readonly draw: DrawingAPI;
  readonly audio: AudioService;
  readonly particles: ParticleSystem;
  readonly popups: PopupSystem;
  readonly hud: HUDAPI;
  readonly input: InputHandler;
}
```

#### 1.1.10 `types/enemies.ts` — 敵共通型

```typescript
/** 洞窟の敵タイプ */
export type CaveEnemyType = 'bat' | 'spider' | 'mimic' | 'rat' | 'cage';

/** 草原の敵タイプ */
export type PrairieEnemyType = 'normal' | 'shifter' | 'dasher';

/** 敵の共通ベース */
export interface EnemyBase {
  readonly type: string;
  readonly x: number;
  readonly y: number;
  readonly hp: number;
  readonly dead: boolean;
}

/** 敵行動インターフェース（Strategy パターン） */
export interface EnemyBehavior<TEnemy extends EnemyBase, TContext> {
  /** 敵の更新処理 */
  update(enemy: TEnemy, context: TContext): TEnemy;
  /** 敵の描画処理 */
  render(enemy: TEnemy, draw: DrawingAPI): void;
}
```

#### 1.1.11 `types/constants.ts` — 定数の型

```typescript
/** スプライトデータ（ピクセル配列） */
export type SpriteData = ReadonlyArray<ReadonlyArray<number>>;

/** 2D 座標 */
export interface Position {
  readonly x: number;
  readonly y: number;
}

/** 洞窟の部屋ナビゲーション */
export interface RoomNavigation {
  readonly [roomId: number]: {
    readonly up?: number;
    readonly down?: number;
    readonly left?: number;
    readonly right?: number;
  };
}

/** LCD カラーパレット */
export interface LCDPalette {
  readonly fg: string;    // 前景色（ON）
  readonly bg: string;    // 背景色（OFF）
  readonly scanline: string;
}
```

---

### 1.2 `@ts-nocheck` 除去手順

各ファイルについて以下の手順を実施:

1. `@ts-nocheck` コメントを削除
2. `npm run typecheck` で型エラーを確認
3. 型エラーを修正（型注釈の追加、型アサーションの適用）
4. `npm test` で既存テスト通過を確認

#### 除去順序と予想される型エラー

| 順番 | ファイル | 予想エラー数 | 主な対処 |
|------|---------|------------|---------|
| 1 | `core/math.ts` | 0-2 | 引数の型注釈追加 |
| 2 | `constants.ts` | 5-10 | `as const` 適用、SpriteData 型適用 |
| 3 | `difficulty.ts` | 2-5 | 引数・戻り値の型注釈追加 |
| 4 | `core/particles.ts` | 5-10 | Particle 型適用、DrawingAPI 参照 |
| 5 | `core/rendering.ts` | 10-15 | CanvasRenderingContext2D 型、DrawingAPI 実装 |
| 6 | `core/audio.ts` | 10-15 | AudioContext 型、AudioService 実装 |
| 7 | `core/hud.ts` | 10-15 | GameState 参照、HUDAPI 実装 |
| 8 | `screens/title.ts` | 5-8 | EngineContext 型適用 |
| 9 | `screens/help.ts` | 5-8 | EngineContext 型適用 |
| 10 | `screens/game-over.ts` | 3-5 | EngineContext 型適用 |
| 11 | `screens/ending.ts` | 3-5 | EngineContext 型適用 |
| 12 | `screens/true-end.ts` | 3-5 | EngineContext 型適用 |
| 13 | `engine.ts` | 20-30 | GameState 型適用、モジュール型参照 |
| 14 | `stages/cave/index.ts` | 30-50 | CaveState 型適用、敵型適用 |
| 15 | `stages/prairie/index.ts` | 20-40 | PrairieState 型適用、敵型適用 |
| 16 | `stages/boss/index.ts` | 30-50 | BossState 型適用、腕型適用 |

---

## Phase 2: ドメイン層の抽出（Domain Layer）

### 2.1 ドメインディレクトリ構成

```
domain/
├── shared/
│   ├── value-objects.ts    # Position, HP, Score 等
│   └── game-events.ts      # GameEvent 型定義
├── contracts/
│   └── assertions.ts       # DbC アサーション関数
├── player/
│   ├── player-state.ts     # プレイヤー状態管理
│   └── player-actions.ts   # プレイヤーアクション（移動、攻撃等）
├── enemies/
│   ├── bat-behavior.ts     # BAT AI
│   ├── spider-behavior.ts  # SPIDER AI
│   ├── mimic-behavior.ts   # MIMIC ロジック
│   ├── shifter-behavior.ts # SHIFTER AI
│   ├── dasher-behavior.ts  # DASHER AI
│   └── enemy-registry.ts   # 敵タイプレジストリ
├── combat/
│   ├── damage-calculator.ts # ダメージ計算
│   └── combo-system.ts     # コンボ管理
├── stage-flow/
│   ├── stage-transition.ts  # ステージ遷移ルール
│   └── loop-manager.ts     # ループ進行管理
├── items/
│   ├── key-manager.ts      # 鍵の収集・設置
│   ├── gem-manager.ts      # 宝石の設置
│   └── shield-manager.ts   # シールド管理
└── boss/
    ├── arm-ai.ts           # 腕の進攻 AI
    ├── rage-system.ts      # レイジウェーブシステム
    └── counter-system.ts   # カウンターシステム
```

### 2.2 バリューオブジェクト（`domain/shared/value-objects.ts`）

```typescript
import { assert, assertRange } from '../contracts/assertions';

/** HP バリューオブジェクト */
export class HP {
  private constructor(private readonly value: number) {}

  static create(value: number): HP {
    assertRange(value, 0, 99, 'HP');
    return new HP(value);
  }

  get current(): number { return this.value; }
  get isDead(): boolean { return this.value <= 0; }

  damage(amount: number): HP {
    assert(amount >= 0, 'ダメージ量は 0 以上');
    return HP.create(Math.max(0, this.value - amount));
  }

  heal(amount: number): HP {
    assert(amount >= 0, '回復量は 0 以上');
    return HP.create(Math.min(99, this.value + amount));
  }
}

/** スコア バリューオブジェクト */
export class Score {
  private constructor(private readonly value: number) {}

  static create(value: number): Score {
    assert(value >= 0, 'スコアは 0 以上');
    return new Score(value);
  }

  get current(): number { return this.value; }

  add(points: number): Score {
    assert(points >= 0, '加算ポイントは 0 以上');
    return Score.create(this.value + points);
  }
}

/** ビートカウンター バリューオブジェクト */
export class BeatCounter {
  private constructor(
    private readonly count: number,
    private readonly period: number,
  ) {}

  static create(period: number): BeatCounter {
    assert(period > 0, 'ビート周期は 1 以上');
    return new BeatCounter(0, period);
  }

  get current(): number { return this.count; }
  get isOnBeat(): boolean { return this.count === 0; }

  tick(): BeatCounter {
    const next = (this.count + 1) % this.period;
    return new BeatCounter(next, this.period);
  }
}
```

### 2.3 DbC アサーション（`domain/contracts/assertions.ts`）

```typescript
/**
 * 事前条件チェック
 * プロダクションビルドでは除去可能（tree-shaking）
 */
export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`[Contract] ${message}`);
  }
}

/**
 * 数値範囲チェック
 */
export function assertRange(
  value: number,
  min: number,
  max: number,
  name: string,
): void {
  assert(
    value >= min && value <= max,
    `${name} は ${min}〜${max} の範囲内であること（実際: ${value}）`,
  );
}

/**
 * 整数チェック
 */
export function assertInteger(value: number, name: string): void {
  assert(
    Number.isInteger(value),
    `${name} は整数であること（実際: ${value}）`,
  );
}

/**
 * 非 null/undefined チェック
 */
export function assertDefined<T>(
  value: T | undefined | null,
  name: string,
): asserts value is T {
  assert(value != null, `${name} は定義されていること`);
}
```

### 2.4 敵 AI の抽出例（`domain/enemies/bat-behavior.ts`）

```typescript
import type { CaveState } from '../../types/stage';
import { assert } from '../contracts/assertions';

/** BAT のフェーズ */
export type BatPhase = 'idle' | 'flying' | 'attacking';

/** BAT の状態 */
export interface BatState {
  readonly phase: BatPhase;
  readonly y: number;
  readonly timer: number;
  readonly direction: number;
}

/** BAT の初期状態を生成 */
export function createBatState(): BatState {
  return { phase: 'idle', y: 0, timer: 0, direction: 1 };
}

/**
 * BAT の行動を更新（純粋関数）
 * @returns 更新後の BAT 状態
 */
export function updateBat(
  bat: BatState,
  playerInRoom: boolean,
  beatCount: number,
): BatState {
  assert(bat.timer >= 0, 'BAT タイマーは 0 以上');

  switch (bat.phase) {
    case 'idle':
      if (playerInRoom && beatCount % 4 === 0) {
        return { ...bat, phase: 'flying', timer: 30 };
      }
      return bat;

    case 'flying':
      if (bat.timer <= 0) {
        return { ...bat, phase: 'attacking', timer: 15 };
      }
      return {
        ...bat,
        y: bat.y + bat.direction * 2,
        timer: bat.timer - 1,
      };

    case 'attacking':
      if (bat.timer <= 0) {
        return createBatState();
      }
      return { ...bat, timer: bat.timer - 1 };
  }
}

/**
 * BAT がプレイヤーに命中したか判定（純粋関数）
 */
export function isBatHittingPlayer(
  bat: BatState,
  playerY: number,
  hitRange: number,
): boolean {
  return bat.phase === 'attacking' && Math.abs(bat.y - playerY) < hitRange;
}
```

### 2.5 コンボシステムの抽出例（`domain/combat/combo-system.ts`）

```typescript
import { assert } from '../contracts/assertions';

/** コンボ状態 */
export interface ComboState {
  readonly count: number;
  readonly maxCombo: number;
  readonly sweepReady: boolean;
}

/** コンボ定数 */
const SWEEP_THRESHOLD = 4;

/** コンボ初期状態 */
export function createComboState(): ComboState {
  return { count: 0, maxCombo: 0, sweepReady: false };
}

/**
 * キル時のコンボ更新（純粋関数）
 */
export function incrementCombo(state: ComboState): ComboState {
  const next = state.count + 1;
  return {
    count: next,
    maxCombo: Math.max(state.maxCombo, next),
    sweepReady: next >= SWEEP_THRESHOLD,
  };
}

/**
 * コンボリセット（純粋関数）
 */
export function resetCombo(state: ComboState): ComboState {
  return { ...state, count: 0, sweepReady: false };
}

/**
 * スウィープ実行後のコンボ更新（純粋関数）
 */
export function afterSweep(state: ComboState): ComboState {
  assert(state.sweepReady, 'スウィープはコンボ到達後のみ実行可能');
  return { ...state, count: 0, sweepReady: false };
}

/**
 * コンボボーナスポイント計算（純粋関数）
 */
export function comboBonus(comboCount: number): number {
  assert(comboCount >= 0, 'コンボ数は 0 以上');
  if (comboCount <= 1) return 0;
  return (comboCount - 1) * 50;
}
```

### 2.6 ゲームイベント（`domain/shared/game-events.ts`）

```typescript
/** ゲームイベントの種別 */
export type GameEventType =
  | 'score:add'
  | 'player:hurt'
  | 'player:heal'
  | 'enemy:kill'
  | 'combo:increment'
  | 'combo:reset'
  | 'sweep:execute'
  | 'key:collect'
  | 'key:place'
  | 'gem:place'
  | 'shield:gain'
  | 'shield:break'
  | 'stage:clear'
  | 'stage:transition'
  | 'boss:rage'
  | 'boss:counter'
  | 'boss:defeat'
  | 'game:over'
  | 'game:complete';

/** ゲームイベント */
export interface GameEvent {
  readonly type: GameEventType;
  readonly payload?: Record<string, unknown>;
}

/** イベントハンドラー */
export type EventHandler = (event: GameEvent) => void;

/** イベントバス インターフェース */
export interface GameEventBus {
  emit(event: GameEvent): void;
  on(type: GameEventType, handler: EventHandler): () => void;
  off(type: GameEventType, handler: EventHandler): void;
}
```

---

## Phase 3: アーキテクチャ再構築

### 3.1 ステージファイル分割仕様

#### cave/index.ts（2,500行）→ 分割後

```
cave/
├── index.ts              # オーケストレーター（~100行）
├── cave-logic.ts         # ゲームロジック（~200行）
├── cave-renderer.ts      # キャラクター・UI描画（~300行）
├── cave-background.ts    # 背景描画（~280行）
└── enemies/
    ├── bat.ts            # BAT 描画・アニメーション（~100行）
    ├── spider.ts         # SPIDER 描画・アニメーション（~80行）
    ├── mimic.ts          # MIMIC 描画・アニメーション（~80行）
    ├── rat.ts            # RAT 描画・アニメーション（~60行）
    └── cage-trap.ts      # ケージトラップ描画（~60行）
```

**分割基準**:
- `cave-logic.ts`: ドメイン層を呼び出し、状態を更新する薄いレイヤー
- `cave-renderer.ts`: キャラクター位置に基づく描画、UI 要素
- `cave-background.ts`: 静的・準静的な背景要素（鍾乳石、松明、水滴等）
- `enemies/*.ts`: 各敵の描画とアニメーション（ロジックはドメイン層）

#### prairie/index.ts（1,800行）→ 分割後

```
prairie/
├── index.ts              # オーケストレーター（~100行）
├── prairie-logic.ts      # ゲームロジック（~200行）
├── prairie-renderer.ts   # キャラクター・UI描画（~250行）
├── prairie-background.ts # 背景描画（~200行）
└── enemies/
    ├── normal.ts         # 通常敵描画（~60行）
    ├── shifter.ts        # SHIFTER 描画（~80行）
    └── dasher.ts         # DASHER 描画（~80行）
```

#### boss/index.ts（2,200行）→ 分割後

```
boss/
├── index.ts              # オーケストレーター（~100行）
├── boss-logic.ts         # ゲームロジック（~200行）
├── boss-renderer.ts      # ボス・プレイヤー描画（~300行）
├── boss-background.ts    # 城背景描画（~250行）
├── arm-renderer.ts       # 腕の描画（ベジェ曲線等）（~150行）
└── pedestal-renderer.ts  # 台座・宝石描画（~100行）
```

### 3.2 イベントバス実装（`domain/shared/event-bus.ts`）

```typescript
import type { GameEvent, GameEventType, EventHandler, GameEventBus } from './game-events';

/**
 * 同期イベントバス実装
 * ゲームループ内で使用するため、非同期は使用しない
 */
export function createEventBus(): GameEventBus {
  const handlers = new Map<GameEventType, Set<EventHandler>>();

  return {
    emit(event: GameEvent): void {
      const typeHandlers = handlers.get(event.type);
      if (typeHandlers) {
        typeHandlers.forEach(handler => handler(event));
      }
    },

    on(type: GameEventType, handler: EventHandler): () => void {
      if (!handlers.has(type)) {
        handlers.set(type, new Set());
      }
      handlers.get(type)!.add(handler);
      // アンサブスクライブ関数を返す
      return () => handlers.get(type)?.delete(handler);
    },

    off(type: GameEventType, handler: EventHandler): void {
      handlers.get(type)?.delete(handler);
    },
  };
}
```

### 3.3 敵 AI の Strategy パターン実装（`domain/enemies/enemy-registry.ts`）

```typescript
import type { EnemyBehavior, EnemyBase } from '../../types/enemies';

/**
 * 敵行動レジストリ
 * 新しい敵タイプの追加が容易（OCP 準拠）
 */
export class EnemyBehaviorRegistry<TEnemy extends EnemyBase, TContext> {
  private readonly behaviors = new Map<string, EnemyBehavior<TEnemy, TContext>>();

  register(type: string, behavior: EnemyBehavior<TEnemy, TContext>): void {
    this.behaviors.set(type, behavior);
  }

  getBehavior(type: string): EnemyBehavior<TEnemy, TContext> {
    const behavior = this.behaviors.get(type);
    if (!behavior) {
      throw new Error(`[EnemyRegistry] 未登録の敵タイプ: ${type}`);
    }
    return behavior;
  }

  update(enemy: TEnemy, context: TContext): TEnemy {
    return this.getBehavior(enemy.type).update(enemy, context);
  }

  render(enemy: TEnemy, draw: import('../../types/rendering').DrawingAPI): void {
    this.getBehavior(enemy.type).render(enemy, draw);
  }
}
```

### 3.4 engine.ts リファクタリング仕様

**変更前**: 400 行（状態管理 + 入力 + ティック + 描画 + セットアップ）

**変更後**: 200 行以内（組み立て + メインループのみ）

```typescript
// engine.ts（リファクタリング後のイメージ）
import type { GameState } from './types/game-state';
import type { EngineContext } from './types/engine-context';

export function createEngine(canvas: HTMLCanvasElement) {
  // 1. Canvas セットアップ
  const $ = canvas.getContext('2d')!;

  // 2. モジュール組み立て（DI）
  const eventBus = createEventBus();
  const audio = createAudio(eventBus);
  const draw = createRendering($);
  const particles = createParticles(draw);
  const popups = createPopups(draw);
  const input = createInputHandler();
  const hud = createHUD(draw, audio);

  // 3. 状態初期化
  const state = createInitialState();

  // 4. コンテキスト構築
  const ctx: EngineContext = { G: state, draw, audio, particles, popups, hud, input };

  // 5. ステージ・画面の生成
  const stages = createStages(ctx, eventBus);
  const screens = createScreens(ctx, eventBus);

  // 6. イベント購読
  setupEventSubscriptions(eventBus, audio, ctx);

  // 7. メインループ
  function gameTick() { /* 100行以内 */ }
  function render() { /* 100行以内 */ }
  function frame(now: number) { /* 固定タイムステップ */ }

  return {
    start() { requestAnimationFrame(frame); },
    stop() { cancelAnimationFrame(rafId); },
  };
}
```

---

## Phase 4: 副作用の隔離

### 4.1 Repository パターン（`infrastructure/storage-repository.ts`）

```typescript
/** ゲームストレージのインターフェース */
export interface GameStorageRepository {
  loadHighScore(): number;
  saveHighScore(score: number): void;
}

/** localStorage 実装 */
export class LocalStorageRepository implements GameStorageRepository {
  private static readonly HIGH_SCORE_KEY = 'kaG';

  loadHighScore(): number {
    try {
      const raw = localStorage.getItem(LocalStorageRepository.HIGH_SCORE_KEY);
      return raw ? Number(raw) : 0;
    } catch {
      return 0;
    }
  }

  saveHighScore(score: number): void {
    try {
      localStorage.setItem(LocalStorageRepository.HIGH_SCORE_KEY, String(score));
    } catch {
      // localStorage が使用不可の場合は無視
    }
  }
}

/** テスト用インメモリ実装 */
export class InMemoryStorageRepository implements GameStorageRepository {
  private highScore = 0;

  loadHighScore(): number { return this.highScore; }
  saveHighScore(score: number): void { this.highScore = score; }
}
```

### 4.2 NullAudioService（テスト用）

```typescript
import type { AudioService, SoundEffects } from '../types/audio';

/** テスト用の音声なしサービス */
export class NullAudioService implements AudioService {
  ensureContext(): void { /* noop */ }
  bgmTick(): void { /* noop */ }
  doHitStop(): void { /* noop */ }

  readonly sfx: SoundEffects = {
    tick: () => {},
    move: () => {},
    grab: () => {},
    hit: () => {},
    kill: () => {},
    hurt: () => {},
    doorOpen: () => {},
    combo: () => {},
    sweep: () => {},
    shield: () => {},
    counter: () => {},
    gemPlace: () => {},
    bossDie: () => {},
    fanfare: () => {},
    trueEndFanfare: () => {},
  };
}
```

### 4.3 ProgrammaticInputHandler（テスト用）

```typescript
import type { InputHandler } from '../types/input';

/**
 * プログラム的にキー入力を注入するハンドラー（テスト用）
 */
export class ProgrammaticInputHandler implements InputHandler {
  private pressedKeys = new Set<string>();
  private downKeys = new Set<string>();

  /** テストからキーを押す */
  pressKey(key: string): void {
    this.pressedKeys.add(key.toLowerCase());
    this.downKeys.add(key.toLowerCase());
  }

  /** テストからキーを離す */
  releaseKey(key: string): void {
    this.downKeys.delete(key.toLowerCase());
  }

  justPressed(key: string): boolean {
    return this.pressedKeys.has(key.toLowerCase());
  }

  isDown(key: string): boolean {
    return this.downKeys.has(key.toLowerCase());
  }

  clearFrame(): void {
    this.pressedKeys.clear();
  }
}
```

---

## Phase 5: テスト基盤強化

### 5.1 テストヘルパー

#### `__tests__/helpers/test-state-builder.ts`

```typescript
import type { GameState } from '../../types/game-state';

/**
 * テスト用 GameState ビルダー
 * デフォルト値を持ち、必要な部分のみオーバーライド可能
 */
export class GameStateBuilder {
  private state: Partial<GameState> = {};

  withScreen(screen: GameState['state']): this {
    this.state.state = screen;
    return this;
  }

  withHP(hp: number): this {
    this.state.hp = hp;
    return this;
  }

  withScore(score: number): this {
    this.state.score = score;
    return this;
  }

  withLoop(loop: number): this {
    this.state.loop = loop;
    return this;
  }

  withPaused(paused: boolean): this {
    this.state.paused = paused;
    return this;
  }

  build(): GameState {
    return {
      state: 'title',
      tick: 0,
      loop: 1,
      hp: 3,
      score: 0,
      hi: 0,
      paused: false,
      resetConfirm: 0,
      // ... 全デフォルト値
      ...this.state,
    } as GameState;
  }
}

/** ショートカット */
export function gameState(): GameStateBuilder {
  return new GameStateBuilder();
}
```

### 5.2 ドメインテスト仕様

#### テストカバレッジ目標

| ドメインモジュール | テスト数 | カバレッジ目標 |
|------------------|---------|-------------|
| `shared/value-objects` | 15 | 90% |
| `contracts/assertions` | 10 | 90% |
| `player/` | 12 | 85% |
| `enemies/bat` | 8 | 85% |
| `enemies/spider` | 6 | 85% |
| `enemies/mimic` | 6 | 85% |
| `enemies/shifter` | 6 | 85% |
| `enemies/dasher` | 6 | 85% |
| `combat/damage-calculator` | 8 | 90% |
| `combat/combo-system` | 8 | 90% |
| `stage-flow/stage-transition` | 8 | 85% |
| `stage-flow/loop-manager` | 6 | 85% |
| `items/key-manager` | 6 | 85% |
| `items/gem-manager` | 4 | 85% |
| `items/shield-manager` | 4 | 85% |
| `boss/arm-ai` | 8 | 85% |
| `boss/rage-system` | 6 | 85% |
| `boss/counter-system` | 4 | 85% |
| **合計** | **~131** | **85%+ 平均** |

#### テスト例（コンボシステム）

```typescript
describe('ComboSystem', () => {
  describe('incrementCombo', () => {
    it('コンボカウントが 1 増加する', () => {
      // Arrange
      const state = createComboState();

      // Act
      const result = incrementCombo(state);

      // Assert
      expect(result.count).toBe(1);
    });

    it('最大コンボが更新される', () => {
      // Arrange
      let state = createComboState();
      state = incrementCombo(state);
      state = incrementCombo(state);
      state = resetCombo(state);

      // Act
      state = incrementCombo(state);

      // Assert
      expect(state.maxCombo).toBe(2);
      expect(state.count).toBe(1);
    });

    it('コンボ 4 でスウィープが有効になる', () => {
      // Arrange
      let state = createComboState();

      // Act
      for (let i = 0; i < 4; i++) {
        state = incrementCombo(state);
      }

      // Assert
      expect(state.sweepReady).toBe(true);
    });
  });

  describe('afterSweep', () => {
    it('スウィープ未到達で実行するとエラーになる', () => {
      // Arrange
      const state = createComboState();

      // Act & Assert
      expect(() => afterSweep(state)).toThrow('[Contract]');
    });
  });
});
```

### 5.3 統合テスト仕様

統合テストでは、ドメイン層 + ステージロジックの連携を検証する。副作用（Canvas, Audio, localStorage）はモック化し、ゲームロジックの状態遷移に焦点を当てる。

#### テスト用エンジン（`__tests__/helpers/test-engine.ts`）

```typescript
import type { GameState } from '../../types/game-state';
import { NullAudioService } from '../../infrastructure/null-audio-service';
import { ProgrammaticInputHandler } from '../../infrastructure/programmatic-input-handler';
import { InMemoryStorageRepository } from '../../infrastructure/storage-repository';

/**
 * テスト用エンジン
 * 副作用を全てモック化し、ゲームロジックのみを実行可能にする
 */
export class TestEngine {
  readonly input = new ProgrammaticInputHandler();
  readonly storage = new InMemoryStorageRepository();
  readonly audio = new NullAudioService();
  private state: GameState;

  constructor() {
    this.state = createInitialState();
  }

  /** 現在の状態を取得 */
  getState(): Readonly<GameState> {
    return this.state;
  }

  /** 指定ティック数だけゲームを進行 */
  advanceTicks(count: number): void {
    for (let i = 0; i < count; i++) {
      this.gameTick();
      this.input.clearFrame();
    }
  }

  /** キーを押してから指定ティック進行 */
  pressKeyAndAdvance(key: string, ticks = 1): void {
    this.input.pressKey(key);
    this.advanceTicks(ticks);
  }

  /** 特定の画面状態まで進行（最大 maxTicks） */
  advanceUntilScreen(screen: GameState['state'], maxTicks = 300): void {
    for (let i = 0; i < maxTicks; i++) {
      if (this.state.state === screen) return;
      this.gameTick();
      this.input.clearFrame();
    }
    throw new Error(`${maxTicks} ティック以内に画面 '${screen}' に到達しなかった`);
  }

  private gameTick(): void {
    // ドメイン層のゲームロジックを実行（描画・音声はスキップ）
  }
}
```

#### 統合テストスペック

**1. `__tests__/integration/cave-flow.test.ts`**

| テストケース | 内容 |
|------------|------|
| 洞窟ステージが初期化される | 初期位置、鍵 0 個、HP 正常 |
| 部屋間を移動できる | 矢印キー入力 → 位置変更 |
| 鍵を 3 つ設置すると草原に遷移する | 鍵管理ロジック → ステージ遷移 |
| ハザードでダメージを受ける | HP 減少、無敵時間の発動 |
| HP 0 でゲームオーバーに遷移する | ダメージ → HP 0 → game over |

**2. `__tests__/integration/prairie-flow.test.ts`**

| テストケース | 内容 |
|------------|------|
| 草原ステージが初期化される | レーン、敵配列、コンボの初期状態 |
| 敵を倒すとコンボが増加する | キル → コンボカウント + スコア |
| 目標キル数でボスに遷移する | kills >= goal → ステージ遷移 |
| コンボ 4 でスウィープが発動可能になる | コンボシステム統合確認 |
| シールドが 5 キルごとに獲得される | シールド管理統合確認 |

**3. `__tests__/integration/boss-flow.test.ts`**

| テストケース | 内容 |
|------------|------|
| ボスステージが初期化される | 腕、台座、シールドの初期状態 |
| 宝石を 6 個設置するとステージクリアする | 台座管理 → クリア判定 |
| カウンターが腕を弾き返す | カウンターシステム統合確認 |
| レイジウェーブが発動する | レイジレベル → 複数腕起動 |
| ループ 3 以上でトゥルーエンドに到達する | ループ管理 → エンディング分岐 |

**4. `__tests__/integration/game-loop.test.ts`**

| テストケース | 内容 |
|------------|------|
| 洞窟→草原→ボスの順に遷移する | ステージフロー全体の確認 |
| ボスクリア後にループが増加する | loop 1 → 2 |
| ループ増加で難易度が上昇する | DifficultyService 統合確認 |
| ハイスコアが保存される | StorageRepository 統合確認 |

---

### 5.4 E2E テストを導入しない理由

Canvas 2D ベースのリアルタイムアクションゲームでは、以下の理由により E2E テスト（Playwright）は採用しない：

1. **Canvas は DOM 要素を持たない** — `getByText()` / `getByRole()` 等のセレクタが使用不可
2. **リアルタイムアクション操作が必要** — ビート同期、敵回避、カウンター等のタイミング依存操作を自動化不可能
3. **確率的要素** — 敵出現パターン、ダメージ判定がフレーム単位で変動し再現性が低い
4. **Primal Path との構造差** — 既存 E2E が成立する Primal Path は「React DOM ベース + 自動進行型」であり、「Canvas + リアルタイムアクション」の KEYS & ARMS とは根本的に異なる

**代替戦略**: テストピラミッドの下層（ドメインユニットテスト + 統合テスト）を厚くし、描画・操作感の確認は手動ブラウザ検証で補完する。

---

## Phase 6: 品質・仕上げ

### 6.1 パーティクルプリセット（DRY 改善）

```typescript
/** パーティクル生成プリセット */
export const PARTICLE_PRESETS = {
  footstep: { n: 3, vxSpread: 0.5, vySpread: 0.3, vyBase: -0.5, life: 12, s: 1, gravity: 0 },
  spark: { n: 8, vxSpread: 1.5, vySpread: 1.2, vyBase: -0.8, life: 15, s: 1.5, gravity: 0 },
  smoke: { n: 5, vxSpread: 0.8, vySpread: 0.6, vyBase: -1.0, life: 20, s: 2, gravity: 0 },
  shieldBreak: { n: 12, vxSpread: 2.0, vySpread: 2.0, vyBase: -1.5, life: 25, s: 2, gravity: 0.05 },
  gemGlow: { n: 6, vxSpread: 0.3, vySpread: 1.0, vyBase: -1.2, life: 30, s: 1.5, gravity: 0 },
} as const satisfies Record<string, Omit<ParticleSpawnParams, 'x' | 'y'>>;
```

### 6.2 マジックナンバーの定数化

```typescript
/** ゲームプレイ定数 */
export const GAMEPLAY = {
  /** ヒットストップフレーム数 */
  HIT_STOP: { LIGHT: 3, MEDIUM: 4, HEAVY: 6 },
  /** ポーズクールダウンフレーム数 */
  PAUSE_COOLDOWN: 90,
  /** リセット確認フレーム数 */
  RESET_CONFIRM_FRAMES: 90,
  /** トランジション総フレーム数 */
  TRANSITION_TOTAL: 56,
  /** トランジション中間点 */
  TRANSITION_MID: 28,
  /** スウィープ必要コンボ数 */
  SWEEP_COMBO_THRESHOLD: 4,
  /** シールド獲得に必要なキル数 */
  SHIELD_KILL_THRESHOLD: 5,
  /** ボス台座数 */
  BOSS_PEDESTAL_COUNT: 6,
  /** ボス腕数 */
  BOSS_ARM_COUNT: 6,
  /** トゥルーエンドに必要なループ数 */
  TRUE_END_LOOP: 3,
} as const;
```

### 6.3 パフォーマンス最適化

#### パーティクル配列のスワップ削除

```typescript
// 変更前（O(n)）
pool.splice(i, 1);

// 変更後（O(1)）
function removeParticle(pool: Particle[], index: number): void {
  const last = pool.length - 1;
  if (index !== last) {
    pool[index] = pool[last];
  }
  pool.pop();
}
```

#### 背景の OffscreenCanvas キャッシュ

```typescript
/**
 * 静的背景をキャッシュして毎フレームの再描画を回避
 */
function createCachedBackground(width: number, height: number, drawFn: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext('2d');
  if (ctx) {
    drawFn(ctx);
  }
  return offscreen;
}
```

---

## テストケース合計

| カテゴリ | 数量 |
|---------|------|
| 既存テスト（リファクタリング後） | 80 |
| ドメインユニットテスト | ~131 |
| 統合テスト | ~19 |
| **合計** | **~230** |

**目標**: 200 ケース以上、ドメイン層カバレッジ 85% 以上
