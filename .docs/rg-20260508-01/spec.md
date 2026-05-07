# Racing Game ファミコン風キャンペーン — 実装仕様

> 本書は `plan.md` を前提とする実装仕様書。データ構造・状態遷移・UI 仕様・既存ドメインへの差分を詳述する。
> Phase 1 を主、Phase 2/3 の仕様は末尾に追記する。

---

## 1. 全体像

### 1.1 フェーズ遷移図

既存フェーズに **キャンペーン専用フェーズ** を追加する。フェーズ Sum 型はキャンペーンと既存モードで共有する。

```
[menu]
   │
   ├── (mode=solo|2p|cpu) ──────────────────────────► (既存フロー)
   │
   └── (mode=campaign) ──► [stage_select]
                              │
                              ▼
                          [stage_intro]
                              │   (Phase 2 で導入。Phase 1 では即 countdown)
                              ▼
                          [countdown]
                              │
                              ▼
                          [race]  ◄──── (チェックポイント通過 → 時間延長イベント)
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        [stage_clear]    [game_over]    (制限時間切れ)
              │               │               │
              │               │               ▼
              │               │           [game_over]
              ▼               │
        次ステージ有? ◄──────┘
              │
       Yes ─┐ │ No
            │ ▼
            │ [ending]
            │     │
            ▼     ▼
        次ステージへ → stage_intro → ...
```

### 1.2 既存 `GamePhase` への追加

```ts
// 既存（推測）: 'menu' | 'countdown' | 'race' | 'draft' | 'result'
type GamePhase =
  | 'menu'
  | 'stage_select'   // 追加: キャンペーンのステージ選択
  | 'stage_intro'    // 追加（Phase 2）: ステージ開始時のナラティブ
  | 'countdown'
  | 'race'
  | 'draft'          // キャンペーンでは到達しない（cardsEnabled=false）
  | 'stage_clear'    // 追加: ステージクリア表示
  | 'game_over'      // 追加: 残機 0 で全リセット
  | 'ending'         // 追加: 全 8 ステージクリア演出
  | 'result';        // 既存（フリー対戦・2P・CPU 用）
```

---

## 2. データモデル

### 2.1 ステージ定義

```ts
// src/features/racing-game/domain/race/stage.ts

export type StageId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type StageDifficultyHint = 'easy' | 'normal' | 'hard' | 'extreme';

export type Branch = {
  /** プレイヤーに見せる選択肢のラベル（例: "海岸線ルート"） */
  readonly label: string;
  /** 採用する既存コース ID */
  readonly courseId: CourseId;
};

export type Stage = {
  readonly id: StageId;
  /** ステージタイトル（英大文字想定。8bit タイポで表示） */
  readonly title: string;
  /** ステージ番号表記（"STAGE 1" 等） */
  readonly numberLabel: string;
  /** Phase 2 で intro テキストに使う 1〜2 行のナラティブ */
  readonly intro: string;
  /** 既存の CourseId。分岐ステージでは未定義（branch を見る） */
  readonly courseId?: CourseId;
  /** 分岐ステージのみ */
  readonly branch?: { readonly a: Branch; readonly b: Branch };
  /** 難易度ヒント（UI と時間係数で使用） */
  readonly difficulty: StageDifficultyHint;
  /** ステージ開始時の残り時間（秒） */
  readonly initialTimeSec: number;
  /** チェックポイント 1 個通過で増える時間（秒） */
  readonly checkpointBonusSec: number;
  /** GOLD ランク到達タイム（秒）。ゴールタイム ≤ goldRankTimeSec */
  readonly goldRankTimeSec: number;
  /** SILVER ランク到達タイム（秒）。 silverRankTimeSec 未満なら SILVER */
  readonly silverRankTimeSec: number;
  /** クリア必須のラップ数。本キャンペーンは原則 1 ラップでステージクリア */
  readonly lapsToClear: number;
};
```

### 2.2 ステージカタログ（初期案）

| # | タイトル | コース | 分岐 | 初期時間 | CP 延長 | 難易度 |
|---|---------|-------|-----|--------|--------|-------|
| 1 | FOREST CALLING | Forest | — | 80s | +12s | easy |
| 2 | BEACHSIDE RALLY | Beach | — | 75s | +12s | easy |
| 3 | NEON STREET | City | A: City直走 / B: 路地裏ショート | 70s | +10s | normal |
| 4 | MOUNTAIN PASS | Mountain | — | 65s | +10s | normal |
| 5 | WHITE OUT | Snow | A: 凍結ロング / B: 雪原ショート | 60s | +10s | hard |
| 6 | MIDNIGHT CHASE | Night | — | 60s | +9s | hard |
| 7 | GRAND PRIX FINAL | Forest（高難度バリアント） | — | 55s | +8s | extreme |
| 8 | OVERDRIVE | Mountain（高難度バリアント） | A: 標準 / B: ショートカット & 障害物多 | 50s | +8s | extreme |

> **「高難度バリアント」の実装方針**: 新規コースは作らず、既存コースに対して `wallDensity` / `decorationDensity` / `cpuDifficulty` 等を上げる「ステージ修飾子」を `stage.ts` 内で定義（後述 §6.2）。

### 2.3 キャンペーン進捗

```ts
// src/features/racing-game/domain/race/campaign-progress.ts

export type StageRank = 'GOLD' | 'SILVER' | 'BRONZE' | 'NONE';

export type StageRecord = {
  /** ベストタイム（秒）。未クリアは undefined */
  readonly bestTimeSec?: number;
  /** ベストランク。未クリアは 'NONE' */
  readonly rank: StageRank;
  /** 分岐ステージの場合に選択された側 */
  readonly chosenBranch?: 'a' | 'b';
};

export type CampaignProgress = {
  /** ステージ ID → 記録 */
  readonly records: Record<StageId, StageRecord>;
  /** 解放されている最大ステージ ID */
  readonly highestUnlocked: StageId;
  /** クリア済みなら true */
  readonly completed: boolean;
};
```

### 2.4 ランタイム状態

```ts
// src/features/racing-game/application/campaign-runtime.ts

export type CampaignRuntime = {
  readonly stage: Stage;
  /** 残り時間（秒、float 可） */
  readonly timeRemainingSec: number;
  /** 通過済みチェックポイントの累計 */
  readonly checkpointsHit: number;
  /** ステージ開始からの経過時間 */
  readonly elapsedSec: number;
  /** 残機 */
  readonly livesRemaining: number;
};
```

---

## 3. 進行ロジック（純粋関数）

### 3.1 残り時間の更新

```ts
// src/features/racing-game/domain/race/time-limit.ts

export const tickTime = (
  timeRemainingSec: number,
  dt: number
): number => Math.max(0, timeRemainingSec - dt);

export const isTimeUp = (timeRemainingSec: number): boolean =>
  timeRemainingSec <= 0;
```

### 3.2 チェックポイントボーナス

```ts
// src/features/racing-game/domain/race/checkpoint-bonus.ts

export const applyCheckpointBonus = (
  timeRemainingSec: number,
  bonusSec: number
): number => timeRemainingSec + bonusSec;
```

### 3.3 ランク判定

```ts
// src/features/racing-game/domain/race/rank.ts

export const judgeRank = (
  goalTimeSec: number,
  stage: Stage
): StageRank => {
  if (goalTimeSec <= stage.goldRankTimeSec) return 'GOLD';
  if (goalTimeSec <= stage.silverRankTimeSec) return 'SILVER';
  return 'BRONZE';
};
```

### 3.4 ステージ進行

```ts
// src/features/racing-game/domain/race/stage-progress.ts

export type StageOutcome =
  | { readonly kind: 'cleared'; readonly goalTimeSec: number; readonly rank: StageRank }
  | { readonly kind: 'time_up' }
  | { readonly kind: 'in_progress' };

export const evaluateStage = (
  runtime: CampaignRuntime,
  hasCrossedFinishLine: boolean
): StageOutcome => {
  if (hasCrossedFinishLine) {
    const rank = judgeRank(runtime.elapsedSec, runtime.stage);
    return { kind: 'cleared', goalTimeSec: runtime.elapsedSec, rank };
  }
  if (isTimeUp(runtime.timeRemainingSec)) {
    return { kind: 'time_up' };
  }
  return { kind: 'in_progress' };
};
```

### 3.5 残機とゲームオーバー

```ts
// 既存ドメイン未追加なので新規
export const decrementLives = (n: number): number => Math.max(0, n - 1);
export const isGameOver = (n: number): boolean => n <= 0;
```

> **Rad Racer 模倣**: 制限時間が尽きても、車両が即停止せず **約 5 秒間惰性で進む** 余地を Phase 2 で与えてもよい（時間切れ後に「IN GRACE」フラグ立てて速度を線形減衰、ゴール到達で救済）。Phase 1 では実装しない。

---

## 4. 既存ドメインへの差分

### 4.1 race-handler.ts への分岐追加（最小）

擬似コード:

```ts
// race-handler.ts
const updateRace = (state, input, dt) => {
  // 既存の更新ロジック
  state = updatePhysics(state, input, dt);
  state = checkCollisions(state);
  const checkpointHit = checkCheckpoint(state);

  // ★ キャンペーンモードのみ追加
  if (state.mode === 'campaign') {
    state = tickCampaignTime(state, dt);  // 残り時間を減らす
    if (checkpointHit) {
      state = grantCheckpointBonus(state);  // 時間延長
    }
    const outcome = evaluateStage(state.campaign, hasCrossedFinishLine);
    if (outcome.kind === 'cleared') return transitionToStageClear(state, outcome);
    if (outcome.kind === 'time_up') return transitionToGameOver(state);
  }

  // 既存の draftQueue 等の処理は cardsEnabled=false の場合スキップされるため
  // キャンペーンでは追加変更なし（既に分岐済み）
  return state;
};
```

### 4.2 RaceConfig 拡張

```ts
// 既存: { cardsEnabled, maxLaps, ... }
type RaceConfig = {
  readonly cardsEnabled: boolean;
  readonly maxLaps: number;
  // ★ 追加
  readonly mode: 'free' | 'campaign';
  readonly campaignStage?: Stage;
};
```

キャンペーン突入時の生成例:

```ts
const config: RaceConfig = {
  cardsEnabled: false,
  maxLaps: stage.lapsToClear,
  mode: 'campaign',
  campaignStage: stage,
};
```

### 4.3 既存 use-cases の不変条件

- `complete-puzzle.ts` 等とは違うが、Racing の既存ハンドラ（`race-handler.ts` / `draft-handler.ts`）の **既存テストは全件無変更で通る** ことを必須条件とする

---

## 5. 永続化（localStorage）

### 5.1 保存キー

```
racing-campaign-progress-v1
```

### 5.2 保存スキーマ

```ts
type StoredProgress = {
  version: 1;
  records: Record<StageId, StageRecord>;
  highestUnlocked: StageId;
  completed: boolean;
};
```

### 5.3 既存 score-repository との関係

既存のキャンペーン外スコア保存（フリー対戦のハイスコア）は **無変更**。キャンペーンは独立キーで管理する。

### 5.4 マイグレーション

`version: 1` のみ。将来 `version: 2` を追加する場合は v1 を読み込んで変換するアダプタを `infrastructure/storage/` に置く。

---

## 6. UI / 画面設計

### 6.1 メニュー画面

既存メニュー画面に **「CAMPAIGN」** ボタンを追加する。配置はメニュー先頭。

```
┌─────────────────────┐
│   RACING GAME       │
│                     │
│   ▶ CAMPAIGN        │  ← 新規（先頭、強調）
│     SOLO            │
│     2P MATCH        │
│     VS CPU          │
│     OPTIONS         │
└─────────────────────┘
```

### 6.2 ステージセレクト画面

8 ステージを横一列または 2 行のグリッドで表示。

- 解放済み: 通常表示（タイトル + ベストタイム + ランクアイコン）
- ロック中: 鍵アイコン + グレースケール
- 全クリア後: ALL CLEAR リボン + クレジット再生ボタン

```
┌──────────────────────────────────┐
│ STAGE SELECT                     │
│                                  │
│ [01]  [02]  [03]  [04]           │
│ ★      ☆     ★     ・            │ ← ★=GOLD ☆=SILVER
│                                  │
│ [05]  [06]  [07]  [08]           │
│ 🔒    🔒    🔒    🔒              │
└──────────────────────────────────┘
```

### 6.3 ステージ実走 HUD

既存 HUD に **残り時間** を最も目立つ位置（中央上）に追加。

```
              ┌────────────┐
              │  TIME 0:42 │ ← 残り 10 秒以下で点滅
              └────────────┘
SPEED 180  STAGE 3/8                LAP 1/1
```

### 6.4 チェックポイント通過時

中央に "+12 SECONDS" を 1 秒間表示してフェードアウト。視覚的にタイマーが増えるアニメーションも入れる。

### 6.5 ステージクリア画面

```
┌──────────────────────────┐
│      STAGE CLEAR!        │
│                          │
│   TIME    1:23:45        │
│   RANK    ★ GOLD ★        │
│                          │
│   [CONTINUE]             │
└──────────────────────────┘
```

### 6.6 ゲームオーバー画面

```
┌──────────────────────────┐
│       GAME OVER          │
│                          │
│   STAGE 5 / 8            │
│                          │
│   [RETRY STAGE]          │
│   [STAGE SELECT]         │
└──────────────────────────┘
```

### 6.7 エンディング画面（Phase 2 で本実装、Phase 1 は簡易版）

簡易版（Phase 1）: "CONGRATULATIONS!" + "YOU CLEARED ALL 8 STAGES" + 戻るボタン

本実装（Phase 2）:
- 黒背景 → ドライバーの 1 行独白テキスト 3 画面分
- "THANK YOU FOR PLAYING" 大型タイポ
- ステージタイトル一覧 + プレイヤーの記録 + クレジットロール

### 6.8 タイポと配色

- 主要テキストは **大文字英字**（ファミコン感）
- 数字は等幅。1 桁は ` 0` のようにスペース埋め
- 配色（既存トークン優先）: 背景濃紺 / 主文字白 / 警告赤 / 達成金
- 点滅は **2Hz**（500ms 周期）

---

## 7. 演出仕様（Phase 2）

### 7.1 ステージタイトル表示

`stage_intro` フェーズで実装。

- 黒フェードイン → ステージ番号 + タイトル + intro 1〜2 行 → カウントダウンへ
- 全体 4 秒。スキップ可能（任意キーで即 countdown）

### 7.2 BGM 仕様

| シーン | 仕様 | 備考 |
|--------|------|------|
| メニュー | チップチューン中速 | 既存 audio-engine.ts に追加 |
| キャンペーンレース中 | ステージごとに 8bit BGM 8 種 | リソースが用意できなければステージ難度別 3 種で開始 |
| ステージクリア | 短いファンファーレ（2 秒） | |
| ゲームオーバー | 短い悲しい SE（1.5 秒） | |
| エンディング | 落ち着いた長尺 BGM | 30 秒以上 |

### 7.3 タイマー警告音

残り時間 10 秒で「ピッピッ」音を 1 秒ごとに鳴らす（Excitebike / F-Zero 模倣）。

---

## 8. 分岐ルート（Phase 3）

### 8.1 対象ステージ

ステージ 3 / 5 / 8 の 3 箇所（Phase 1 では 1 ルート固定で実装）。

### 8.2 UI

```
┌──────────────────────────┐
│   STAGE 3 - NEON STREET  │
│                          │
│   ▶ A: 大通りルート       │
│     B: 路地裏ショートカット│
└──────────────────────────┘
```

### 8.3 データ駆動

`Stage.branch` を参照し、選択された側の `courseId` を採用する。新コース生成は禁止（既存 6 コースのいずれか + 修飾子で実現する）。

### 8.4 進捗保存

`StageRecord.chosenBranch` に保存。次回プレイ時に「前回選んだルート」をデフォルト選択にする。

---

## 9. ディレクトリと新規ファイル一覧

```
src/features/racing-game/
├── domain/
│   └── race/
│       ├── stage.ts                       # 新規 §2.1
│       ├── stage-catalog.ts               # 新規 §2.2 のデータ
│       ├── stage-progress.ts              # 新規 §3.4
│       ├── time-limit.ts                  # 新規 §3.1
│       ├── checkpoint-bonus.ts            # 新規 §3.2
│       ├── rank.ts                        # 新規 §3.3
│       └── campaign-progress.ts           # 新規 §2.3
├── application/
│   ├── use-cases/
│   │   ├── start-campaign-stage.ts        # 新規
│   │   ├── advance-stage-time.ts          # 新規
│   │   ├── checkpoint-time-bonus.ts       # 新規
│   │   ├── handle-stage-clear.ts          # 新規
│   │   ├── handle-game-over.ts            # 新規
│   │   └── complete-campaign.ts           # 新規
│   ├── ports/
│   │   └── campaign-progress-port.ts      # 新規
│   └── campaign-runtime.ts                # 新規 §2.4
├── infrastructure/
│   └── storage/
│       └── campaign-progress-repository.ts  # 新規 §5
├── components/
│   ├── CampaignMenuButton.tsx             # 新規（メニュー §6.1）
│   ├── StageSelectScreen.tsx              # 新規 §6.2
│   ├── StageIntroOverlay.tsx              # 新規（Phase 2 §7.1）
│   ├── StageHud.tsx                       # 新規 §6.3
│   ├── CheckpointBonusToast.tsx           # 新規 §6.4
│   ├── StageClearOverlay.tsx              # 新規 §6.5
│   ├── GameOverOverlay.tsx                # 新規 §6.6
│   └── EndingScreen.tsx                   # 新規 §6.7
└── presentation/
    └── RacingGameCampaign.tsx             # 新規（既存 RacingGameNew.tsx を流用、ラップ）
```

---

## 10. 受け入れ基準（テスト）

### 10.1 ドメイン単体テスト（必須）

| ファイル | テスト観点 |
|---------|----------|
| `time-limit.test.ts` | tickTime: 正常減算 / 0 でクランプ。isTimeUp: 境界 0 / 0.0001 / -1 |
| `checkpoint-bonus.test.ts` | applyCheckpointBonus: 加算正常 / 0 加算 / 残時間 0 から加算 |
| `rank.test.ts` | judgeRank: GOLD/SILVER/BRONZE 境界 / 等号挙動 |
| `stage-progress.test.ts` | evaluateStage: cleared / time_up / in_progress の 3 分岐 |
| `campaign-progress.test.ts` | アンロック / ベストタイム更新 / ランク格上げ更新 |

### 10.2 ユースケース統合テスト

- ステージ開始 → チェックポイント 4 回通過 → ゴールイン の正常フロー
- ステージ開始 → チェックポイント未通過で時間切れ → game_over フェーズ
- 全 8 ステージ連続クリア → ending フェーズ

### 10.3 Repository テスト

- localStorage への保存と読み込みのラウンドトリップ
- 未保存 → デフォルト進捗（ステージ 1 のみアンロック）が返る
- 不正データ（壊れた JSON）→ 例外を握りつぶしてデフォルトを返す

### 10.4 既存テストの不変

既存の Domain / Application / Infrastructure テスト 28 件は **無変更で全件パス**。

### 10.5 E2E（Phase 3 で導入）

- Playwright で「メニュー → キャンペーン → ステージ 1 開始 → コース完走 → 結果表示」を 1 シナリオ
- 「ステージ選択画面でロック中ステージはクリック無視」
- 「全クリア → エンディング表示」（時間がかかるため抽象化）

---

## 11. 既知の前提・制約

- **物理は固定タイムステップ（1/60s）** を継続。フレームレート可変対応は本計画スコープ外
- **ドラフトカードはキャンペーンで完全無効**。`cardsEnabled: false` の挙動は既存テストでカバー済（と仮定）。実装時に再確認
- **2P 入力周辺の既知未確認リスク**（`feature/games-brushup-plan-20260507` の調査でフラグ済）はキャンペーン側に影響しない（キャンペーンはソロのみ）

---

## 12. 既存実装で確認しておくべき箇所（実装着手前チェック）

実装に入る前に、以下を grep / コードリーディングで再確認する:

- [ ] `RaceConfig` の現在のフィールド一覧（`mode` 追加が衝突しないか）
- [ ] `GamePhase` Sum 型の正確な定義場所
- [ ] `race-handler.ts` のフェーズ遷移箇所（ラップ完了時の draft トリガ）
- [ ] `score-repository` の保存キー命名規則（`racing-campaign-progress-v1` が衝突しないか）
- [ ] 既存 `cardsEnabled` フラグの全参照箇所
- [ ] チェックポイントヒットイベントの出力場所（時間延長 Use Case をどこから呼ぶか）

これらの結果をふまえ、`tasks.md` の最初のタスク群「事前調査」を実施する。
