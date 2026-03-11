# 原始進化録 - PRIMAL PATH 大規模リファクタリング仕様書

本書は `plan.md` の各フェーズにおける**変更後の構造・設計仕様**を定義する。
すべてのリファクタリングは振る舞いを変更しない（外部から見た動作は同一）。

---

## P1: ドメインモデルの定義と型の再構築

### 1.1 ディレクトリ構造

```
src/features/primal-path/
└── types/
    ├── index.ts           # barrel export
    ├── common.ts          # 共通型
    ├── player.ts          # プレイヤー状態
    ├── battle.ts          # 戦闘状態
    ├── progression.ts     # 進行状態
    ├── evolution.ts       # 進化状態
    ├── skill.ts           # スキル状態
    ├── awakening.ts       # 覚醒状態
    ├── stats.ts           # 統計状態
    ├── challenge.ts       # チャレンジ状態
    ├── endless.ts         # エンドレス状態
    └── save.ts            # セーブデータ
```

### 1.2 PlayerState

```typescript
/** プレイヤーの戦闘ステータス */
export interface PlayerState {
  readonly hp: number;      // 現在HP
  readonly mhp: number;     // 最大HP
  readonly atk: number;     // 攻撃力
  readonly def: number;     // 防御力
  readonly cr: number;      // 会心率（0〜100）
  readonly burn: number;    // 火傷ダメージ/ターン
  readonly aM: number;      // 攻撃倍率
  readonly dm: number;      // 被ダメージ倍率
}
```

**不変条件**:
- `hp >= 0 && hp <= mhp`
- `mhp > 0`
- `atk >= 0`
- `def >= 0`
- `cr >= 0 && cr <= 100`

### 1.3 BattleState

```typescript
/** 戦闘の進行状態 */
export interface BattleState {
  readonly en: Enemy | null;  // 現在の敵（非戦闘時は null）
  readonly turn: number;      // 現在ターン数
  readonly cW: number;        // バイオーム内の撃破数
  readonly wpb: number;       // バイオームあたりの敵数
  readonly cT: number;        // ティックカウンター
  readonly cL: number;        // 現在のログインデックス
  readonly cR: number;        // 会心発生回数
  readonly bE: number;        // バイオーム環境ダメージ
}
```

### 1.4 ProgressState

```typescript
/** ゲーム進行状態 */
export interface ProgressState {
  readonly di: number;                // 現在の難易度インデックス
  readonly dd: Difficulty;            // 難易度定義
  readonly bc: number;                // クリア済みバイオーム数
  readonly bms: readonly BiomeId[];   // バイオーム順序
  readonly cB: number;                // 現在のバイオームインデックス
  readonly cBT: BiomeIdExt;           // 現在のバイオームタイプID
  readonly fe: CivTypeExt | null;     // 最終進化の文明タイプ（未達成は null）
  readonly evoN: number;              // 進化回数
  readonly fReq: number;              // 最終進化要件（必要文明レベル）
}
```

### 1.5 EvolutionState

```typescript
/** 進化関連の状態 */
export interface EvolutionState {
  readonly evs: readonly Evolution[];  // 取得済み進化リスト
  readonly maxEvo?: number;            // 最大進化回数（チャレンジ用）
}
```

### 1.6 SkillState

```typescript
/** スキル関連の状態 */
export interface SkillState {
  readonly sk: SkillSt;              // スキルスロット状態
  readonly al: readonly Ally[];      // 仲間リスト
  readonly mxA: number;              // 最大仲間数
  readonly skillUseCount: number;    // スキル使用回数
}
```

### 1.7 AwakeningState

```typescript
/** 覚醒関連の状態 */
export interface AwakeningState {
  readonly awoken: readonly AwokenRecord[];  // 覚醒済みリスト
  readonly saReq: number;                    // 覚醒条件チェック要否（0 or 1）
  readonly rvU: number;                      // 復活使用済みフラグ（0 or 1）
}
```

### 1.8 RunStatsState

```typescript
/** ランの統計データ（集計用） */
export interface RunStatsState {
  readonly kills: number;
  readonly dmgDealt: number;
  readonly dmgTaken: number;
  readonly maxHit: number;
  readonly wDmg: number;
  readonly wTurn: number;
  readonly totalHealing: number;
}
```

### 1.9 ChallengeState

```typescript
/** チャレンジモード固有の状態 */
export interface ChallengeState {
  readonly challengeId?: string;
  readonly enemyAtkMul?: number;
  readonly noHealing?: boolean;
  readonly timeLimit?: number;
  readonly timerStart?: number;
}
```

### 1.10 EndlessState

```typescript
/** エンドレスモード固有の状態 */
export interface EndlessState {
  readonly isEndless: boolean;
  readonly endlessWave: number;
}
```

### 1.11 RunState（合成型）

```typescript
/** 後方互換のための合成型 */
export interface RunState extends
  PlayerState,
  BattleState,
  ProgressState,
  EvolutionState,
  SkillState,
  AwakeningState,
  RunStatsState,
  ChallengeState,
  EndlessState {
  readonly log: readonly LogEntry[];
  readonly loopCount: number;
  readonly btlCount: number;
  readonly eventCount: number;
  readonly bb: number;
  readonly _fPhase: number;
  readonly _fbk: string;
  readonly _wDmgBase: number;
  readonly tb: TreeBonus;
}
```

**移行戦略**: P1では合成型を維持し、サブステートはドキュメント用の型として定義。P2〜P4で段階的に関数のシグネチャをサブステートに移行。

### 1.12 GamePhase ステートマシン

```typescript
/** ゲームフェーズの明示的定義 */
export type GamePhase =
  | 'title'
  | 'diff'
  | 'how'
  | 'tree'
  | 'biome'
  | 'evo'
  | 'battle'
  | 'awakening'
  | 'prefinal'
  | 'endless_checkpoint'
  | 'ally_revive'
  | 'event'
  | 'over'
  | 'stats'
  | 'achievements'
  | 'challenge';

/** フェーズ遷移の許可テーブル */
export const PHASE_TRANSITIONS: Record<GamePhase, readonly GamePhase[]> = {
  title: ['diff', 'how', 'tree', 'challenge'],
  diff: ['biome', 'title'],
  how: ['title'],
  tree: ['title'],
  challenge: ['biome', 'title'],
  biome: ['evo'],
  evo: ['battle'],
  battle: ['evo', 'awakening', 'prefinal', 'over', 'event', 'ally_revive', 'endless_checkpoint'],
  awakening: ['battle', 'evo', 'prefinal'],
  prefinal: ['battle'],
  endless_checkpoint: ['battle', 'over'],
  ally_revive: ['evo', 'prefinal'],
  event: ['battle'],
  over: ['stats', 'title'],
  stats: ['achievements', 'title'],
  achievements: ['title'],
};
```

---

## P2: game-logic.ts のドメイン分割

### 2.1 ディレクトリ構造

```
src/features/primal-path/
└── domain/
    ├── battle/
    │   ├── battle-service.ts
    │   ├── combat-calculator.ts
    │   ├── tick-phases.ts
    │   └── boss-service.ts
    ├── evolution/
    │   ├── evolution-service.ts
    │   └── synergy-service.ts
    ├── skill/
    │   └── skill-service.ts
    ├── awakening/
    │   └── awakening-service.ts
    ├── event/
    │   └── event-service.ts
    ├── progression/
    │   ├── run-service.ts
    │   ├── biome-service.ts
    │   └── tree-service.ts
    ├── achievement/
    │   └── achievement-service.ts
    ├── challenge/
    │   └── challenge-service.ts
    └── shared/
        ├── utils.ts
        └── civ-utils.ts
```

### 2.2 各ドメインサービスの公開API

※ 現在の関数シグネチャを正確に反映。`rng` パラメータは乱数注入用。

#### battle-service.ts

```typescript
export function startBattle(run: RunState, _finalMode: boolean): RunState;
export function afterBattle(run: RunState): AfterBattleResult;
```

#### combat-calculator.ts

```typescript
export function calcPlayerAtk(run: RunState, rng: () => number): number;
export function effATK(run: RunState): number;
export function biomeBonus(biome: BiomeIdExt, lvs: CivLevels): number;
export function calcEnvDmg(biome: BiomeIdExt, envScale: number, tb: TreeBonus, fe: CivTypeExt | null): number;
export function aliveAllies(al: readonly Ally[]): Ally[];
export function deadAllies(al: readonly Ally[]): Ally[];
```

#### tick-phases.ts

```typescript
export function tick(run: RunState, finalMode: boolean, rng: () => number): TickResult;
export function tickEnvPhase(run: RunState): RunState;
export function tickPlayerPhase(run: RunState, rng: () => number): RunState;
export function tickAllyPhase(run: RunState, rng: () => number): RunState;
export function tickRegenPhase(run: RunState): RunState;
export function tickEnemyPhase(run: RunState, rng: () => number): RunState;
export function tickDeathCheck(run: RunState): TickResult;
```

#### boss-service.ts

```typescript
export function resolveFinalBossKey(run: RunState): string;
export function startFinalBoss(run: RunState): RunState;
export function handleFinalBossKill(run: RunState): FinalBossResult;
```

#### evolution-service.ts

```typescript
export function rollE(run: RunState, rng: () => number): readonly Evolution[];
export function applyEvo(run: RunState, ev: Evolution, rng: () => number): RunState;
export function simEvo(run: RunState, ev: Evolution): EvoSimResult;
```

#### synergy-service.ts

```typescript
export function calcSynergies(evolutions: readonly Evolution[]): SynergyBonusResult;
export function applySynergyBonuses(synergies: SynergyBonusResult): SynergyEffects;
```

#### skill-service.ts

```typescript
export function applySkill(run: RunState, sid: ASkillId): SkillResult;
export function calcAvlSkills(run: RunState): readonly AvailableSkill[];
export function tickBuffs(sk: SkillSt): SkillSt;
export function decSkillCds(sk: SkillSt): SkillSt;
```

#### event-service.ts

```typescript
export function rollEvent(run: RunState, rng: () => number): RandomEventDef | undefined;
export function applyEventChoice(nextRun: RunState, choice: EventChoice): RunState;
export function computeEventResult(choice: EventChoice, run: RunState): EventResult;
export function formatEventResult(effect: EventEffect, run: RunState): string;
export function getEffectHintColor(effect: EventEffect): string;
export function getEffectHintIcon(effect: EventEffect): string;
```

#### run-service.ts

```typescript
export function startRunState(di: number, save: SaveData): RunState;
export function calcRunStats(run: RunState, result: boolean, boneEarned: number): RunStats;
```

#### biome-service.ts

```typescript
export function pickBiomeAuto(run: RunState): RunState;
export function applyBiomeSelection(run: RunState, biome: BiomeId): RunState;
export function applyFirstBiome(run: RunState): RunState;
export function applyAutoLastBiome(run: RunState): RunState;
export function calcEndlessScale(wave: number): number;
export function calcEndlessScaleWithAM(wave: number, playerAM: number): number;
export function applyEndlessLoop(run: RunState): RunState;
```

#### tree-service.ts

```typescript
export function getTB(tree: Record<string, number>): TreeBonus;
export function tbSummary(tb: TreeBonus): string;
export function bestDiffLabel(save: SaveData): string;
```

### 2.3 game-logic.ts の変換

分割完了後、`game-logic.ts` は全ドメインサービスの barrel re-export に変換:

```typescript
// game-logic.ts（変換後）
export * from './domain/battle/battle-service';
export * from './domain/battle/combat-calculator';
export * from './domain/battle/tick-phases';
export * from './domain/battle/boss-service';
export * from './domain/evolution/evolution-service';
export * from './domain/evolution/synergy-service';
export * from './domain/skill/skill-service';
export * from './domain/awakening/awakening-service';
export * from './domain/event/event-service';
export * from './domain/progression/run-service';
export * from './domain/progression/biome-service';
export * from './domain/progression/tree-service';
export * from './domain/achievement/achievement-service';
export * from './domain/challenge/challenge-service';
export * from './domain/shared/utils';
export * from './domain/shared/civ-utils';
```

---

## P3: デザインパターン導入

### 3.1 SkillHandler（Strategy パターン）

```typescript
/** スキル効果の実行結果 */
export interface SkillResult {
  readonly nextRun: RunState;
  readonly logEntries: readonly LogEntry[];
  readonly popups: readonly Popup[];
}

/** スキルハンドラーインターフェース */
export interface SkillHandler {
  /** スキル効果を実行する */
  execute(run: RunState, def: ASkillDef): SkillResult;
}

/** スキルハンドラー登録 */
export type SkillRegistry = ReadonlyMap<string, SkillHandler>;
```

**実装クラス（関数ベース）**:

```typescript
// dmg-all-handler.ts
export const dmgAllHandler: SkillHandler = {
  execute(run, def) {
    const dmg = Math.round(run.atk * (def.fx.v ?? 0));
    // ... ダメージ計算
    return { nextRun, logEntries, popups };
  },
};
```

**applySkill 変換後**:

```typescript
export function applySkill(run: RunState, sid: ASkillId): SkillResult {
  const def = A_SKILLS.find(s => s.id === sid);
  invariant(def, `未知のスキルID: ${sid}`);
  const handler = skillRegistry.get(def.fx.t);
  invariant(handler, `未知のスキルタイプ: ${def.fx.t}`);
  return handler.execute(run, def);
}
```

### 3.2 EventEffectHandler（Strategy パターン）

```typescript
export interface EventEffectHandler {
  apply(run: RunState, effect: EventEffect, event: RandomEventDef): EventEffectResult;
}

export type EventEffectRegistry = ReadonlyMap<string, EventEffectHandler>;
```

**変換対象の効果タイプ**:

| タイプ | ハンドラー |
|--------|-----------|
| `stat_change` | `statChangeHandler` |
| `heal` | `healHandler` |
| `damage` | `damageHandler` |
| `bone_change` | `boneChangeHandler` |
| `add_ally` | `addAllyHandler` |
| `random_evolution` | `randomEvolutionHandler` |
| `civ_level_up` | `civLevelUpHandler` |
| `nothing` | `nothingHandler` |

### 3.3 AchievementChecker（Strategy パターン）

```typescript
export interface AchievementChecker {
  check(aggregate: AggregateStats, stats: RunStats): boolean;
}

export type AchievementRegistry = ReadonlyMap<string, AchievementChecker>;
```

### 3.4 戦闘ログ（Observer パターン - 軽量版）

純粋関数を維持するため、副作用を持つ Observer ではなく、ログエントリを収集する Collector パターンで実装:

```typescript
/** ログコレクター：tick内で発生したイベントを収集 */
export interface BattleLogCollector {
  readonly entries: readonly LogEntry[];
  addDamage(source: string, target: string, amount: number, isCrit: boolean): BattleLogCollector;
  addHeal(target: string, amount: number): BattleLogCollector;
  addSkillUse(skillName: string): BattleLogCollector;
  addStatus(message: string, color: string): BattleLogCollector;
}
```

---

## P4: hooks.ts の分割と Reducer リファクタリング

### 4.1 Reducer 分割構造

```typescript
// reducers/game-reducer.ts
export function gameReducer(state: GameState, action: GameAction): GameState {
  // フェーズ遷移の検証
  if (isPhaseTransition(action)) {
    const nextPhase = getNextPhase(action);
    assertValidTransition(state.phase, nextPhase);
  }

  // ドメイン別にディスパッチ
  if (isBattleAction(action)) return battleReducer(state, action);
  if (isEvolutionAction(action)) return evolutionReducer(state, action);
  if (isEventAction(action)) return eventReducer(state, action);
  if (isProgressionAction(action)) return progressionReducer(state, action);
  return metaReducer(state, action);
}
```

### 4.2 アクション型のグループ化

```typescript
// Battle アクション（6個）
type BattleAction =
  | { type: 'BATTLE_TICK' }
  | { type: 'AFTER_BATTLE' }
  | { type: 'USE_SKILL'; idx: number }
  | { type: 'CHANGE_SPEED'; di: number }
  | { type: 'SURRENDER' }
  | { type: 'FINAL_BOSS_KILLED' };

// Evolution アクション（4個）
type EvolutionAction =
  | { type: 'SELECT_EVO'; evo: Evolution }
  | { type: 'SKIP_EVO' }
  | { type: 'SHOW_EVO' }
  | { type: 'PROCEED_AFTER_AWK' };

// Event アクション（3個）
type EventAction =
  | { type: 'TRIGGER_EVENT'; event: RandomEventDef }
  | { type: 'CHOOSE_EVENT'; choiceIdx: number }
  | { type: 'APPLY_EVENT_RESULT' };

// Progression アクション（11個）
type ProgressionAction =
  | { type: 'START_RUN'; di: number }
  | { type: 'START_CHALLENGE'; challengeId: string; di: number }
  | { type: 'GO_DIFF' }
  | { type: 'GO_HOW' }
  | { type: 'GO_TREE' }
  | { type: 'PREPARE_BIOME_SELECT' }
  | { type: 'PICK_BIOME'; biome: BiomeId }
  | { type: 'GO_FINAL_BOSS' }
  | { type: 'BIOME_CLEARED' }
  | { type: 'PROCEED_TO_BATTLE' }
  | { type: 'SET_PHASE'; phase: GamePhase };

// Meta アクション（11個）
type MetaAction =
  | { type: 'GAME_OVER' }
  | { type: 'RETURN_TO_TITLE' }
  | { type: 'BUY_TREE_NODE'; nodeIdx: number }
  | { type: 'RESET_SAVE' }
  | { type: 'LOAD_SAVE'; save: SaveData }
  | { type: 'LOAD_META'; meta: MetaStorage }
  | { type: 'RECORD_RUN_END' }
  | { type: 'REVIVE_ALLY'; allyIdx: number }
  | { type: 'SKIP_REVIVE' }
  | { type: 'ENDLESS_CONTINUE' }
  | { type: 'ENDLESS_RETIRE' };

// 統合型
type GameAction = BattleAction | EvolutionAction | EventAction | ProgressionAction | MetaAction;
```

### 4.3 フック分割の仕様

| フック | ファイル | 責務 |
|--------|---------|------|
| `useGameState` | `use-game-state.ts` | メインの状態管理（useReducer + dispatch） |
| `useBattle` | `use-battle.ts` | バトルのティックループ（requestAnimationFrame/setInterval） |
| `useAudio` | `use-audio.ts` | AudioEngine + BgmEngine のライフサイクル管理 |
| `useOverlay` | `use-overlay.ts` | 通知オーバーレイの表示/非表示 |
| `usePersistence` | `use-persistence.ts` | localStorage との同期 |

---

## P5: constants.ts のドメイン別分割

### 5.1 分割対応表

| 現在の定数名 | 移動先 | カテゴリ |
|-------------|--------|---------|
| `ENM`, `BOSS`, `ENEMY_COLORS`, `ENEMY_DETAILS`, `ENEMY_SMALL_DETAILS` | `constants/battle.ts` | 敵定義 |
| `BOSS_CHAIN_SCALE`, `FINAL_BOSS_ORDER`, `SPEED_OPTS`, `WAVES_PER_BIOME` | `constants/battle.ts` | 戦闘設定 |
| `EVOS` | `constants/evolution.ts` | 進化定義 |
| `SYNERGY_BONUSES`, `SYNERGY_TAG_INFO` | `constants/evolution.ts` | シナジー定義 |
| `BIO`, `BIOME_COUNT`, `BIOME_AFFINITY`, `ENV_DMG` | `constants/biome.ts` | バイオーム定義 |
| `DIFFS` | `constants/difficulty.ts` | 難易度定義 |
| `A_SKILLS`, `SFX_DEFS` | `constants/skill.ts` | スキル定義 |
| `RANDOM_EVENTS`, `EVENT_CHANCE`, `EVENT_MIN_BATTLES` | `constants/event.ts` | イベント定義 |
| `TREE`, `TIER_UNLOCK`, `TIER_NAMES` | `constants/tree.ts` | ツリー定義 |
| `ACHIEVEMENTS`, `CHALLENGES` | `constants/achievement.ts` | 実績・チャレンジ定義 |
| `AWK_SA`, `AWK_FA` | `constants/awakening.ts` | 覚醒定義 |
| `ALT` | `constants/ally.ts` | 仲間定義 |
| `CIV_TYPES`, `CIV_KEYS`, `TC`, `TN`, `CAT_CL` | `constants/ui.ts` | 文明・カテゴリ表示 |
| `LOG_COLORS`, `TB_SUMMARY`, `TB_DEFAULTS`, `TB_KEY_COLOR` | `constants/ui.ts` | UI定数 |
| `FRESH_SAVE`, `SAVE_KEY` | `constants/save.ts` | セーブ初期値 |
| `STATS_KEY`, `ACHIEVEMENTS_KEY`, `AGGREGATE_KEY`, `MAX_RUN_STATS` | `constants/save.ts` | メタデータキー |
| `LOOP_SCALE_FACTOR`, `ENDLESS_LINEAR_SCALE`, `ENDLESS_EXP_BASE`, `ENDLESS_AM_REFLECT_RATIO` | `constants/scaling.ts` | スケーリング定数 |
| `BGM_PATTERNS`, `VOLUME_KEY` | `constants/audio.ts` | オーディオ定数 |

### 5.2 後方互換

`constants.ts` を barrel re-export に変換:

```typescript
// constants.ts（変換後）
export * from './constants/battle';
export * from './constants/evolution';
export * from './constants/biome';
export * from './constants/difficulty';
export * from './constants/skill';
export * from './constants/event';
export * from './constants/tree';
export * from './constants/achievement';
export * from './constants/ui';
export * from './constants/save';
export * from './constants/scaling';
```

---

## P6: コンポーネントのリファクタリング

### 6.1 BattleScreen 分割仕様

| コンポーネント | 行数目安 | Props |
|--------------|---------|-------|
| `BattleScreen` | 80行 | `run, dispatch, speed, finalMode` |
| `BattleCanvas` | 60行 | `run, canvasRef` |
| `BattleStatusBar` | 40行 | `run, treeSummary` |
| `BattleLog` | 30行 | `log, logColors` |
| `SkillPanel` | 40行 | `skills, onUseSkill` |
| `BossCounter` | 15行 | `bossWave, totalBosses` |

### 6.2 shared.tsx 分割仕様

各共通コンポーネントを独立ファイルに分割。Props の型定義を明示化。

| コンポーネント | Props |
|--------------|-------|
| `ProgressBar` | `value: number, max: number, color?: string, label?: string` |
| `HpBar` | `hp: number, mhp: number` |
| `StatLabel` | `icon: string, label: string, value: number \| string` |
| `BoneDisplay` | `bones: number` |

---

## P7: DbC 強化

### 7.1 契約の分類

| 種別 | 配置場所 | 検証タイミング |
|------|---------|--------------|
| 事前条件 | ドメインサービスの入口 | 関数呼び出し時 |
| 事後条件 | ドメインサービスの出口 | 戻り値返却前 |
| 不変条件 | Reducer の遷移後 | 状態更新後 |

### 7.2 事前条件の仕様

```typescript
// contracts/player-contracts.ts
export function requireValidPlayer(p: PlayerState): void {
  invariant(p.hp >= 0, `HP が負の値: ${p.hp}`);
  invariant(p.mhp > 0, `最大HPが0以下: ${p.mhp}`);
  invariant(p.atk >= 0, `ATKが負の値: ${p.atk}`);
}

// contracts/battle-contracts.ts
export function requireActiveBattle(b: BattleState): void {
  invariant(b.en !== undefined, '敵が存在しない状態で戦闘操作');
  invariant(b.turn >= 0, `ターン数が負: ${b.turn}`);
}
```

### 7.3 不変条件の仕様

```typescript
// contracts/run-invariants.ts
export function assertRunInvariant(run: RunState): void {
  invariant(run.hp <= run.mhp, `HP(${run.hp}) > maxHP(${run.mhp})`);
  invariant(run.bc >= 0, `バイオームクリア数が負: ${run.bc}`);
  invariant(run.evs.length <= (run.maxEvo ?? Infinity), '進化数が上限超過');
  invariant(run.kills >= 0, `撃破数が負: ${run.kills}`);
}
```

### 7.4 本番環境での扱い

- `invariant` は開発時のみ実行（`process.env.NODE_ENV !== 'production'`）
- Webpack の DefinePlugin で本番ビルド時に除去

---

## P8: 単体テストのリファクタリング

### 8.1 RunStateBuilder の仕様

```typescript
export class RunStateBuilder {
  private state: RunState;

  static create(): RunStateBuilder;

  withPlayer(overrides: Partial<PlayerState>): this;
  withBattle(overrides: Partial<BattleState>): this;
  withProgression(overrides: Partial<ProgressState>): this;
  withEvolution(overrides: Partial<EvolutionState>): this;
  withSkills(overrides: Partial<SkillState>): this;
  withChallenge(overrides: Partial<ChallengeState>): this;
  withEndless(overrides: Partial<EndlessState>): this;

  build(): RunState;
}
```

**使用例**:

```typescript
// Before（現在のテストヘルパー）
const run = makeRun({ hp: 50, mhp: 100, atk: 10, en: mockEnemy });

// After（ビルダーパターン）
const run = RunStateBuilder.create()
  .withPlayer({ hp: 50, mhp: 100, atk: 10 })
  .withBattle({ en: mockEnemy })
  .build();
```

### 8.2 カスタムマッチャーの仕様

```typescript
// jest-matchers.ts
declare global {
  namespace jest {
    interface Matchers<R> {
      toHavePlayerHp(expected: number): R;
      toHaveKills(expected: number): R;
      toBeBattleVictory(): R;
      toBeBattleDefeat(): R;
    }
  }
}

expect.extend({
  toHavePlayerHp(received: RunState, expected: number) {
    const pass = received.hp === expected;
    return {
      pass,
      message: () => `HP: 期待値 ${expected}, 実際 ${received.hp}`,
    };
  },
});
```

### 8.3 テストファイルの再編ルール

1. テストファイルはドメインサービスファイルと1対1対応
2. `describe` のネストは最大2段（ドメインサービス名 / シナリオ名）
3. テスト名は日本語で「〜した場合に〜する」形式
4. 各テストは AAA パターンに従う

### 8.4 カバレッジ設定変更

```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 60,
    functions: 75,
    lines: 70,
    statements: 70,
  },
  './src/features/primal-path/domain/': {
    branches: 80,
    functions: 90,
    lines: 85,
    statements: 85,
  },
},
```

---

## P9: E2E テストの導入

### 9.1 テスト基盤

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 2,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm start',
    port: 3000,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
```

### 9.2 テストシナリオ仕様

#### タイトル→バトル開始フロー

```typescript
test('タイトルからバトルまで遷移できる', async ({ page }) => {
  await page.goto('/primal-path');
  // タイトル画面
  await expect(page.getByText('原始進化録')).toBeVisible();
  await page.getByRole('button', { name: /はじめる/ }).click();
  // ステージ選択
  await expect(page.getByText('ステージ選択')).toBeVisible();
  await page.getByRole('button', { name: /原始/ }).click();
  // バイオーム選択 or 進化画面
  // ...バトル画面到達確認
});
```

#### バトルフロー

```typescript
test('バトルで敵を倒すと進化画面に遷移する', async ({ page }) => {
  // ... バトル開始まで遷移
  // バトルティックが進行することを確認
  await expect(page.getByText(/ターン/)).toBeVisible();
  // バトル終了を待機
  await page.waitForSelector('text=進化', { timeout: 60_000 });
});
```

#### セーブ/ロード

```typescript
test('ゲームデータが保存・復元される', async ({ page }) => {
  // ツリーノード購入
  // ページリロード
  // 購入済みノードが保持されていることを確認
});
```

### 9.3 テストヘルパー

```typescript
// e2e/helpers/primal-path-helper.ts
export class PrimalPathHelper {
  constructor(private page: Page) {}

  async navigateToGame(): Promise<void>;
  async startRun(difficulty?: string): Promise<void>;
  async waitForBattleEnd(): Promise<void>;
  async selectEvolution(index?: number): Promise<void>;
  async getCurrentPhase(): Promise<string>;
}
```
