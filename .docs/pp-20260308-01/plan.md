# 原始進化録 - PRIMAL PATH 大規模リファクタリング計画

## 1. コンテキスト

### 背景

PRIMAL PATH は機能追加を重ねて成長したが、以下の構造的問題が蓄積している:

- `game-logic.ts`（1,355行）、`hooks.ts`（744行）、`constants.ts`（743行）、`types.ts`（647行）が巨大化
- `RunState` が56フィールドの God Object 化
- `gameReducer` が34アクションを単一 switch で処理
- 30行超過の関数が13個存在（最大71行: `applyEventChoice`）
- ドメイン境界が曖昧で、スキル追加・イベント追加・実績追加のたびに既存関数を修正（OCP違反）
- シナジーボーナスの適用が4箇所に分散（DRY違反）
- E2Eテストが未導入

### 目的

- DDD の導入によるドメイン境界の強化
- SOLID 原則の適用による拡張性の向上
- DRY 原則の徹底による重複排除
- DbC（Design by Contract）の強化による堅牢性向上
- デザインパターンの導入によるカスタマイズ性向上
- E2E テストの導入によるテスト強化
- 単体テストのリファクタリング

### 対象範囲

`src/features/primal-path/` 配下の全ファイル

### 制約

- 既存の振る舞い・ゲームプレイに変更を加えない（リファクタリングのみ）
- セーブデータの後方互換性を維持
- 各フェーズ完了時点でテスト・ビルドが通ること

---

## 2. フェーズ構成

| フェーズ | 内容 | 依存 |
|---------|------|------|
| P1 | ドメインモデルの定義と型の再構築 | なし |
| P2 | game-logic.ts のドメイン分割 | P1 |
| P3 | デザインパターン導入（Strategy / Registry） | P2 |
| P4 | hooks.ts の分割とReducerリファクタリング | P2, P3 |
| P5 | constants.ts のドメイン別分割 | P1 |
| P6 | コンポーネントのリファクタリング | P4 |
| P7 | DbC 強化と契約の追加 | P2 |
| P8 | 単体テストのリファクタリング | P2〜P6 |
| P9 | E2E テストの導入 | P8 |

---

## 3. フェーズ1: ドメインモデルの定義と型の再構築

### 目的

56フィールドの `RunState` を DDD の境界に沿って分割し、型安全性を強化する。

### RunState の分割案

```
RunState（再構築後）
├── player: PlayerState        # hp, mhp, atk, def, cr, burn, aM, dm
├── battle: BattleState        # en (Enemy|null), turn, cW, wpb, cT, cL, cR, bE
├── progression: ProgressState # di, dd, bc, bms (BiomeId[]), cB (number), cBT (BiomeIdExt), fe (CivTypeExt|null), evoN, fReq (number)
├── evolution: EvolutionState  # evs, maxEvo?
├── skills: SkillState         # sk (SkillSt), al (Ally[]), mxA, skillUseCount
├── awakening: AwakeningState  # awoken (AwokenRecord[]), saReq (number), rvU (number)
├── stats: RunStatsState       # kills, dmgDealt, dmgTaken, maxHit, wDmg, wTurn, totalHealing
├── challenge: ChallengeState  # challengeId?, enemyAtkMul?, noHealing?, timeLimit?, timerStart?
├── endless: EndlessState      # isEndless, endlessWave
├── meta: RunMetaState         # loopCount, btlCount, eventCount, log, bb, _fPhase, _fbk, _wDmgBase
└── tree: TreeBonus            # tb（既存型を流用）
```

### 作業内容

1. `types/` ディレクトリを新設し、ドメインごとの型定義ファイルを作成
2. `RunState` を上記サブステートに分割
3. 後方互換のため、移行期間中は `RunState` をサブステートの合成型として定義
4. GamePhase 型を明示的なステートマシンとして再定義

### 修正ファイル

| ファイル | 変更内容 |
|---------|---------|
| `types/index.ts` | barrel export |
| `types/player.ts` | PlayerState 型定義 |
| `types/battle.ts` | BattleState, Enemy 型定義 |
| `types/progression.ts` | ProgressState, Biome 型定義 |
| `types/evolution.ts` | EvolutionState, Evolution 型定義 |
| `types/skill.ts` | SkillState, ASkillDef 型定義 |
| `types/awakening.ts` | AwakeningState 型定義 |
| `types/stats.ts` | RunStatsState, RunStats 型定義 |
| `types/challenge.ts` | ChallengeState, ChallengeModifier 型定義 |
| `types/endless.ts` | EndlessState 型定義 |
| `types/common.ts` | 共通型（LogEntry, Popup 等） |
| `types.ts` | 後方互換の合成型 RunState を再定義 |

---

## 4. フェーズ2: game-logic.ts のドメイン分割

### 目的

1,355行の `game-logic.ts` を、DDD の境界に沿って複数のドメインサービスファイルに分割する。

### 分割構造

```
domain/
├── battle/
│   ├── battle-service.ts      # startBattle, afterBattle
│   ├── combat-calculator.ts   # calcPlayerAtk, effATK, biomeBonus, calcEnvDmg, aliveAllies, deadAllies, scaleEnemy
│   ├── tick-phases.ts         # tick, tickEnvPhase, tickPlayerPhase, tickAllyPhase, tickRegenPhase, tickEnemyPhase, tickDeathCheck
│   └── boss-service.ts        # resolveFinalBossKey, startFinalBoss, handleFinalBossKill
├── evolution/
│   ├── evolution-service.ts   # rollE, applyEvo, simEvo
│   └── synergy-service.ts     # calcSynergies, applySynergyBonuses
├── skill/
│   └── skill-service.ts       # applySkill, calcAvlSkills, tickBuffs, decSkillCds
├── awakening/
│   └── awakening-service.ts   # checkAwakeningRules, applyAwkFx, awkInfo
├── event/
│   └── event-service.ts       # rollEvent, applyEventChoice, computeEventResult, formatEventResult, getEffectHintColor, getEffectHintIcon
├── progression/
│   ├── run-service.ts         # startRunState, calcRunStats, calcBoneReward, allyReviveCost
│   ├── biome-service.ts       # pickBiomeAuto, applyBiomeSelection, applyFirstBiome, applyAutoLastBiome, calcEndlessScale, calcEndlessScaleWithAM, applyEndlessLoop
│   └── tree-service.ts        # getTB, tbSummary, bestDiffLabel
├── achievement/
│   └── achievement-service.ts # checkAchievement
├── challenge/
│   └── challenge-service.ts   # applyChallenge
└── shared/
    ├── utils.ts               # clamp, mkPopup, updatePopups, getSnap, applyStatFx
    └── civ-utils.ts           # civLvs, civMin, civLv, dominantCiv
```

※ `checkAllAchievements` は hooks.ts のローカルヘルパー（`transitionAfterBiome`, `updateAggregate` と同様）のため、reducer 分割時に対応

### 移行戦略

1. まずファイルを分割し、`game-logic.ts` を re-export の barrel ファイルに変換
2. 各消費側は `game-logic.ts` 経由でインポートするため、外部インターフェースは不変
3. テストが全てパスすることを確認後、段階的に直接インポートに切り替え

---

## 5. フェーズ3: デザインパターン導入

### 目的

OCP 違反を解消し、新しいスキル・イベント・実績を追加するときに既存コードの修正が不要な構造にする。

### 導入パターン

#### 5.1 Strategy パターン — スキル効果

```typescript
// 現状: applySkill 内の if-else-if（63行）
// 改善後: スキルハンドラーの登録制

interface SkillHandler {
  execute(run: RunState, def: ASkillDef): SkillResult;
}

const skillRegistry = new Map<string, SkillHandler>();
skillRegistry.set('dmgAll', new DmgAllHandler());
skillRegistry.set('healAll', new HealAllHandler());
skillRegistry.set('buffAtk', new BuffAtkHandler());
skillRegistry.set('shield', new ShieldHandler());
```

#### 5.2 Strategy パターン — イベント効果

```typescript
// 現状: applyEventChoice 内の switch（71行）
// 改善後: イベント効果ハンドラーの登録制

interface EventEffectHandler {
  apply(run: RunState, effect: EventEffect): RunState;
}

const eventEffectRegistry = new Map<string, EventEffectHandler>();
```

#### 5.3 Strategy パターン — 実績判定

```typescript
// 現状: checkAchievement 内の switch（46行）
// 改善後: 実績チェッカーの登録制

interface AchievementChecker {
  check(aggregate: AggregateStats, stats: RunStats): boolean;
}

const achievementRegistry = new Map<string, AchievementChecker>();
```

#### 5.4 Observer パターン — 戦闘ログ

```typescript
// 現状: tick関数内でログ追加が散在
// 改善後: BattleLogger がイベントを購読

interface BattleObserver {
  onDamage(source: string, target: string, amount: number): void;
  onHeal(target: string, amount: number): void;
  onSkillUse(skillName: string): void;
}
```

### 修正ファイル

| ファイル | 変更内容 |
|---------|---------|
| `domain/skill/skill-registry.ts` | SkillHandler インターフェース + 登録 |
| `domain/skill/handlers/*.ts` | 各スキルハンドラー |
| `domain/event/event-effect-registry.ts` | EventEffectHandler + 登録 |
| `domain/event/handlers/*.ts` | 各イベント効果ハンドラー |
| `domain/achievement/achievement-registry.ts` | AchievementChecker + 登録 |
| `domain/achievement/checkers/*.ts` | 各実績チェッカー |

---

## 6. フェーズ4: hooks.ts の分割と Reducer リファクタリング

### 目的

744行の `hooks.ts` を責務ごとに分割し、34アクションの `gameReducer` を管理可能な単位に分割する。

### Reducer の分割方針

```typescript
// 現状: 単一の gameReducer が34アクションを処理
// 改善後: ドメイン別の sub-reducer に分割

// メイン reducer はドメイン別 reducer にディスパッチ
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    // 戦闘関連 → battleReducer
    case 'BATTLE_TICK': case 'AFTER_BATTLE': case 'USE_SKILL':
      return battleReducer(state, action);
    // 進化関連 → evolutionReducer
    case 'SELECT_EVO': case 'SKIP_EVO': case 'SHOW_EVO':
      return evolutionReducer(state, action);
    // イベント関連 → eventReducer
    case 'TRIGGER_EVENT': case 'CHOOSE_EVENT': case 'APPLY_EVENT_RESULT':
      return eventReducer(state, action);
    // ...
  }
}
```

### フック分割

```
hooks/
├── index.ts               # barrel export
├── use-game-state.ts      # useGameState（メインフック）
├── use-battle.ts          # useBattle（バトルループ）
├── use-audio.ts           # useAudio（音声管理）
├── use-overlay.ts         # useOverlay（通知表示）
├── use-persistence.ts     # usePersistence（セーブ/ロード）
└── reducers/
    ├── game-reducer.ts    # メイン reducer（ルーター）
    ├── battle-reducer.ts  # 戦闘アクション処理
    ├── evolution-reducer.ts # 進化アクション処理
    ├── event-reducer.ts   # イベントアクション処理
    ├── progression-reducer.ts # 進行アクション処理
    └── meta-reducer.ts    # セーブ・設定アクション処理
```

---

## 7. フェーズ5: constants.ts のドメイン別分割

### 目的

743行の `constants.ts` をドメイン別に整理し、関連する定数を近い場所に配置する。

### 分割構造

```
constants/
├── index.ts               # barrel export（後方互換）
├── battle.ts              # ENM, BOSS, BOSS_CHAIN_SCALE, FINAL_BOSS_ORDER, SPEED_OPTS, WAVES_PER_BIOME, ENEMY_COLORS, ENEMY_DETAILS, ENEMY_SMALL_DETAILS
├── evolution.ts           # EVOS, SYNERGY_BONUSES, SYNERGY_TAG_INFO
├── biome.ts               # BIO, BIOME_COUNT, BIOME_AFFINITY, ENV_DMG
├── difficulty.ts          # DIFFS
├── skill.ts               # A_SKILLS, SFX_DEFS
├── event.ts               # RANDOM_EVENTS, EVENT_CHANCE, EVENT_MIN_BATTLES
├── tree.ts                # TREE, TIER_UNLOCK, TIER_NAMES
├── achievement.ts         # ACHIEVEMENTS, CHALLENGES
├── awakening.ts           # AWK_SA, AWK_FA
├── ally.ts                # ALT
├── ui.ts                  # CIV_TYPES, CIV_KEYS, TC, TN, CAT_CL, LOG_COLORS, TB_SUMMARY, TB_DEFAULTS, TB_KEY_COLOR
├── save.ts                # FRESH_SAVE, SAVE_KEY, STATS_KEY, ACHIEVEMENTS_KEY, AGGREGATE_KEY, MAX_RUN_STATS
├── scaling.ts             # LOOP_SCALE_FACTOR, ENDLESS_LINEAR_SCALE, ENDLESS_EXP_BASE, ENDLESS_AM_REFLECT_RATIO
└── audio.ts               # BGM_PATTERNS, VOLUME_KEY
```

---

## 8. フェーズ6: コンポーネントのリファクタリング

### 目的

200行超のコンポーネントを分割し、表示ロジックとゲームロジックの分離を徹底する。

### 対象コンポーネント

#### BattleScreen.tsx（346行）→ 分割

```
components/battle/
├── BattleScreen.tsx        # レイアウト + 状態管理（100行以内）
├── BattleCanvas.tsx        # Canvas描画部分
├── BattleStatusBar.tsx     # HP/ATK/DEF等のステータス表示
├── BattleLog.tsx           # 戦闘ログ表示
├── SkillPanel.tsx          # スキルボタン群
└── BossCounter.tsx         # ボス連戦カウンター
```

#### EventScreen.tsx（217行）→ 分割

```
components/event/
├── EventScreen.tsx         # レイアウト（80行以内）
├── EventCard.tsx           # イベント内容表示
└── EventChoices.tsx        # 選択肢ボタン群
```

#### shared.tsx（237行）→ 分割

```
components/shared/
├── index.ts               # barrel export
├── ProgressBar.tsx
├── HpBar.tsx
├── StatLabel.tsx
├── BoneDisplay.tsx
└── OverlayNotification.tsx
```

---

## 9. フェーズ7: DbC 強化

### 目的

既存の `contracts.tsx`（invariant + ErrorBoundary）を拡張し、ドメインサービスの入出力に契約を追加する。

### 導入内容

```typescript
// 事前条件（Precondition）
function requireValidPlayerState(player: PlayerState): void {
  invariant(player.hp >= 0, 'HP は0以上でなければならない');
  invariant(player.mhp > 0, '最大HPは正の数でなければならない');
  invariant(player.atk >= 0, 'ATKは0以上でなければならない');
}

// 事後条件（Postcondition）
function ensureBattleResult(result: BattleTickResult): void {
  invariant(result.nextRun.player.hp <= result.nextRun.player.mhp, 'HPは最大HPを超えない');
}

// 不変条件（Invariant）
function assertRunStateInvariant(run: RunState): void {
  invariant(run.player.hp <= run.player.mhp, 'HP <= maxHP');
  invariant(run.progression.bc >= 0, 'バイオームクリア数は非負');
  invariant(run.evolution.evs.length <= (run.evolution.maxEvo ?? Infinity), '進化数は上限以内');
}
```

### 適用箇所

- ドメインサービスの public メソッドの入口（事前条件）
- 戦闘 tick の出口（事後条件）
- Reducer の状態遷移後（不変条件）

---

## 10. フェーズ8: 単体テストのリファクタリング

### 目的

テストコードの品質を向上させ、ドメイン分割に合わせたテスト構造に再編する。

### テスト構造の再編

```
__tests__/
├── domain/
│   ├── battle/
│   │   ├── battle-service.test.ts
│   │   ├── combat-calculator.test.ts
│   │   └── tick-phases.test.ts
│   ├── evolution/
│   │   ├── evolution-service.test.ts
│   │   └── synergy-service.test.ts
│   ├── skill/
│   │   └── skill-service.test.ts
│   ├── event/
│   │   └── event-service.test.ts
│   └── achievement/
│       └── achievement-service.test.ts
├── hooks/
│   ├── reducers/
│   │   ├── battle-reducer.test.ts
│   │   └── evolution-reducer.test.ts
│   └── use-battle.test.ts
├── components/
│   ├── battle/
│   │   ├── BattleScreen.test.tsx
│   │   └── BattleLog.test.tsx
│   └── ...
└── test-helpers.ts
```

### テスト品質向上

1. **テストビルダーパターンの導入**: `makeRun` をビルダーに昇格
   ```typescript
   const run = RunStateBuilder.create()
     .withPlayer({ hp: 100, mhp: 100, atk: 10 })
     .withBattle({ en: mockEnemy })
     .withProgression({ di: 0, bc: 0 })
     .build();
   ```

2. **カスタムマッチャーの追加**:
   ```typescript
   expect(run).toHavePlayerState({ hp: 80 });
   expect(result).toBeBattleVictory();
   ```

3. **テストカバレッジ目標の引き上げ**:
   | 対象 | 現目標 | 新目標 |
   |------|--------|--------|
   | lines | 30% | 70% |
   | functions | 30% | 75% |
   | branches | 20% | 60% |
   | statements | 30% | 70% |

---

## 11. フェーズ9: E2E テストの導入

### 目的

Playwright を用いた E2E テストを導入し、ユーザーフロー全体の品質を保証する。

### 技術選定

- **フレームワーク**: Playwright（既にプロジェクトで利用実績あり）
- **実行環境**: CI/CD で自動実行
- **テストサーバー**: webpack-dev-server（localhost:3000）

### E2E テストシナリオ

```
e2e/
├── primal-path/
│   ├── title-to-battle.spec.ts    # タイトル→ステージ選択→バトル開始
│   ├── battle-flow.spec.ts        # バトル→進化→次バトルの基本フロー
│   ├── evolution-select.spec.ts   # 進化選択→ステータス反映
│   ├── boss-battle.spec.ts        # ボス戦→最終ボス連戦
│   ├── game-over.spec.ts          # ゲームオーバー→リザルト→タイトル
│   ├── tree-purchase.spec.ts      # 文明ツリー購入→効果反映
│   ├── challenge-mode.spec.ts     # チャレンジモード選択→制約反映
│   ├── event-encounter.spec.ts    # ランダムイベント→選択→効果
│   ├── save-load.spec.ts          # セーブ/ロード→データ永続化
│   └── endless-mode.spec.ts       # エンドレスモード→ループ動作
```

### Playwright 設定

```typescript
// playwright.config.ts
{
  testDir: './e2e',
  webServer: {
    command: 'npm start',
    port: 3000,
    reuseExistingServer: true,
  },
  use: {
    baseURL: 'http://localhost:3000',
  },
}
```

---

## 12. リスク管理

| リスク | 影響 | 対策 |
|--------|------|------|
| RunState 分割によるデグレ | 高 | 移行期間中は合成型で後方互換を維持、全テスト通過を確認 |
| Reducer 分割による状態不整合 | 高 | 不変条件のアサーションを追加 |
| パフォーマンス劣化 | 中 | ベンチマーク計測（tick関数の実行時間） |
| テスト工数の増大 | 中 | テストビルダー導入で記述コスト削減 |
| E2E テストの不安定性 | 中 | リトライ設定 + 安定したセレクタ使用 |

---

## 13. 検証方法

各フェーズ完了時に以下を実行:

```bash
# 全テスト
npm test

# 型チェック
npx tsc --noEmit

# ビルド
npm run build

# Lint
npx eslint src/features/primal-path/

# E2E（P9以降）
npx playwright test
```
