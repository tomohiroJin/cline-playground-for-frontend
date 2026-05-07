# Racing Game ファミコン風キャンペーン — 実装仕様

> 本書は `plan.md` を前提とする実装仕様書。データ構造・状態遷移・UI 仕様・既存ドメインへの差分を詳述する。
> Phase 1 を主、Phase 2/3 の仕様は末尾に追記する。

---

## 1. 全体像

### 1.1 フェーズ遷移図

既存フェーズに **キャンペーン専用フェーズ** を追加する。フェーズ Sum 型はキャンペーンと既存モードで共有する。

#### Phase 1 のフロー（`stage_intro` 無し）

```
[menu]
   │
   ├── (mode=solo|2p|cpu) ─────────────────────────────► (既存フロー)
   │
   └── (mode=campaign) ─► [stage_select]  ◄───────────────┐
                              │                            │
                              ▼ (lives=3 にリセット)       │
                          [countdown]                      │
                              │                            │
                              ▼                            │
                          [race] ◄── CP 通過で時間延長     │
                              │                            │
                ┌─────────────┼──────────────┐             │
                ▼             ▼              ▼             │
          ゴールイン     時間切れ        (進行中)          │
                │             │                            │
                ▼             ▼                            │
          [stage_clear]   lives--                         │
                │       ┌─────┴────┐                      │
                │     残>0       残=0                     │
                │       │          │                      │
                │       ▼          ▼                      │
                │    [retry]?  [game_over]                │
                │       │          │                      │
                │       └──────────┘──────────────────────┤
                ▼                                          │
         次ステージ有?                                     │
              │                                            │
       Yes ───┤ No                                         │
              │  └──► [ending] ───────────────────────────┤
              ▼                                            │
        次ステージへ (countdown)                           │
              │                                            │
              └────────────────────────────────────────────┘
```

#### Phase 2 のフロー（`stage_intro` 挿入）

Phase 1 のフローのうち、`stage_select → countdown` の間に `stage_intro` を挟む。
ステージ番号 + タイトル + intro テキストを 4 秒間表示し、任意キーでスキップ可能。

```
... [stage_select] → [stage_intro] → [countdown] → [race] → ...
```

その他の遷移は Phase 1 と同一。

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

| # | タイトル | コース | 分岐 | 初期時間 | CP 延長 | GOLD/SILVER | 難易度 |
|---|---------|-------|-----|--------|--------|------------|-------|
| 1 | FOREST CALLING | Forest (16pt) | — | 80s | +12s | 50/65 | easy |
| 2 | BEACHSIDE RALLY | Beach (16pt) | — | 72s | +11s | 48/62 | easy |
| 3 | NEON STREET | City (16pt) | A: 大通り / B: 路地裏ショート | 66s | +10s | 44/58 | normal |
| 4 | MOUNTAIN PASS | Mountain (20pt) | — | 70s | +10s | 56/68 | normal |
| 5 | WHITE OUT | Snow (18pt) | A: 凍結ロング / B: 雪原ショート | 60s | +9s | 50/62 | hard |
| 6 | MIDNIGHT CHASE | Night (20pt) | — | 58s | +8s | 52/64 | hard |
| 7 | GRAND PRIX FINAL | Forest 高難度版 (16pt) | — | 50s | +7s | 38/50 | extreme |
| 8 | OVERDRIVE | Mountain 高難度版 (20pt) | A: 標準 / B: ショート & 障害物多 | 46s | +6s | 50/60 | extreme |

> **設計意図（カーブ調整、#15・#16 対応）**:
> - 初期時間は単調減少にせず、**コース距離（コース長 = ポイント数）に応じて変動**させる（#18 対応）。Stage 4・5・6・8 は 18-20pt の長距離コースなので時間を多めに付与
> - チェックポイント延長は **ステージが進むほど減少**（+12 → +6）させ、終盤ほど 1 ミスが致命的になる
> - Stage 7・8 で延長時間を **+7 / +6** に分け、最終ステージを最難関に（旧仕様では 7・8 が同じ +8 で同難度になっていた）
>
> **「高難度バリアント」の実装方針**: 新規コースは作らず、既存コースに対して `wallDensity` / `decorationDensity` / `cpuDifficulty` 等を上げる「ステージ修飾子」を `stage.ts` 内で定義する。
>
> **Phase 0 で確定すべき係数**: tasks.md Phase 0 で各既存コースの実距離を計測し、`initialTimeSec = baseTimePerPoint[difficulty] × coursePoints` の式で再算出する。本表の値は **その計測前の暫定値** であり、Phase 0 完了後に上書きする。

### 2.3 キャンペーン進捗（永続化対象）

```ts
// src/features/racing-game/domain/race/campaign-progress.ts

export type StageRank = 'GOLD' | 'SILVER' | 'BRONZE' | 'NONE';

export type StageRecord = {
  /** ベストタイム（秒）。未クリアは undefined */
  readonly bestTimeSec?: number;
  /** ベストランク。未クリアは 'NONE' */
  readonly rank: StageRank;
  /**
   * 分岐ステージの場合に選択された側。Phase 1〜2 では分岐ステージは a を既定とし
   * 必ず 'a' を記録する。Phase 3 で B を選んだ場合に 'b' を保存する。
   * 既存セーブで undefined が混在した場合、読み込み時に 'a' とみなしてマイグレーションする
   * （§5.4 参照）
   */
  readonly chosenBranch?: 'a' | 'b';
};

export type CampaignProgress = {
  /** ステージ ID → 記録 */
  readonly records: Record<StageId, StageRecord>;
  /** 解放されている最大ステージ ID */
  readonly highestUnlocked: StageId;
};

/**
 * 「キャンペーン全クリア」は派生プロパティとして関数で求める（Single Source of Truth）。
 * `completed` を別フィールドとして持たせると更新漏れによる不整合を生むため避ける。
 */
export const isCampaignCompleted = (p: CampaignProgress): boolean =>
  p.highestUnlocked === 8 && p.records[8]?.rank !== 'NONE';
```

### 2.4 ランタイム状態（**非永続**）

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
  /** 残機（セッション内のみ保持。永続化しない） */
  readonly livesRemaining: number;
};
```

#### 残機（lives）の意味論

ファミコン時代のクリア型ゲーム感を出すため、残機は以下のルールで扱う。

| ルール | 内容 |
|--------|------|
| 機数 | キャンペーン突入時に 3 機 |
| 範囲 | **キャンペーン 1 回（STAGE SELECT 入場〜エンディング or GAME OVER）** で共有 |
| 永続化 | **しない**（`StoredProgress` には含めない） |
| リセットタイミング | 以下のいずれかで 3 にリセット<br>① メニューから "CAMPAIGN" を選んで STAGE SELECT に入った瞬間<br>② GAME OVER 後に STAGE SELECT へ戻った瞬間<br>③ ENDING を見て STAGE SELECT へ戻った瞬間 |
| 減算タイミング | ステージで時間切れ → 1 機減らす → 残機 > 0 なら同ステージリトライ確認、残機 0 なら GAME OVER フェーズへ |

> **設計理由**: 永続化しないことで、ブラウザを閉じたあとに再開したプレイヤーが「前回の残機 0 で詰んでいる」状態を回避できる。一方でセッション内では緊張感を保つ。

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

キャンペーン突入時の生成例（**`stage.lapsToClear` を `RaceConfig.maxLaps` にマッピングする** — #4 対応）:

```ts
const config: RaceConfig = {
  cardsEnabled: false,
  maxLaps: stage.lapsToClear,  // 例: 全ステージ 1 周（lapsToClear: 1）
  mode: 'campaign',
  campaignStage: stage,
};
```

> 本キャンペーンは原則 **全ステージ 1 周でクリア** とする。`Stage.lapsToClear` を残す理由は、将来 Phase 3 以降で「ファイナルだけ 2 周」を導入する余地を残すため。Phase 1〜2 ではすべて `1` で実装する。

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

### 5.3 既存 score-repository との関係（#20 対応）

責務を明確に分離する:

| リポジトリ | 役割 | 対象 |
|-----------|------|------|
| `score-repository`（既存） | フリー対戦・2P・CPU 戦のハイスコアと記録 | 無変更 |
| `campaign-progress-repository`（新規） | キャンペーンの進捗・ベストタイム・ランク | 新規 |

**規約**: キャンペーンのベストタイムは `campaign-progress-repository` が **単独で管理** し、`score-repository` には書き込まない。両方に書き込む実装は禁止。

### 5.4 保存タイミング（#21 対応）

| イベント | 保存有無 | 理由 |
|---------|---------|------|
| ステージクリア（ベスト更新時） | **保存** | ベストタイム / ランク / `chosenBranch` を確定 |
| ステージクリア（ベスト未更新時） | 保存（記録上書き） | ステージのアンロック更新（`highestUnlocked`）のため |
| GAME OVER | **保存しない** | セッション中の中間データ（チェックポイント通過時刻等）は破棄。プレイヤーが「失敗の悔いを残さず再挑戦できる」体験を優先 |
| RESET PROGRESS 確定時 | 保存（消去） | localStorage キーを削除 |

### 5.5 マイグレーション（#5 対応）

- `version: 1` のみ
- 既存セーブで分岐ステージの `chosenBranch` が `undefined` の場合、読み込み時に `'a'`（既定値）として扱う
- 将来 `version: 2` を導入する場合は v1 を読み込んで変換するアダプタを `infrastructure/storage/` に置く

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

8 ステージを横一列または 2 行のグリッドで表示。**この画面に到達した瞬間に lives を 3 にリセットする**（§2.4 残機の意味論）。

#### 表示要素

- **解放済み**: ステージ番号 + タイトル + ベストタイム + ランクアイコン（★ GOLD / ☆ SILVER / · BRONZE）
- **ロック中**: 鍵アイコン + グレースケール
- **全クリア後** (`isCampaignCompleted(progress) === true`): 画面上部に "ALL CLEAR!" リボン + 後述の追加メニュー

#### ロック中ステージのクリック挙動（#9 対応）

ロック中ステージをクリック / タップしたときの動作を以下に固定する:

1. 短い `DENIED` SE を 1 回再生（既存 audio-engine に登録）
2. 画面下部に `STAGE LOCKED — CLEAR STAGE N FIRST` を 1.5 秒表示してフェードアウト
3. 画面の他の状態は変えない（ナビゲーションしない）

#### 追加メニュー（画面下部 or サイド）

- `[BACK TO MENU]`: 常に表示
- `[VIEW ENDING]`: `isCampaignCompleted(progress) === true` のときだけ表示。ENDING フェーズに直接遷移
- `[RESET PROGRESS]`: 常に表示。クリック時に確認ダイアログを出し、`OK` 選択で `localStorage` のキャンペーン進捗を消去 → ステージ 1 のみアンロック状態に戻す

```
┌──────────────────────────────────────┐
│ STAGE SELECT          LIVES: 3 / 3   │
│                                      │
│ [01]  [02]  [03]  [04]               │
│ ★      ☆     ★     ·                 │ ← ★=GOLD ☆=SILVER ·=BRONZE
│                                      │
│ [05]  [06]  [07]  [08]               │
│ 🔒    🔒    🔒    🔒                  │
│                                      │
│ [BACK TO MENU]      [RESET PROGRESS] │
│ [VIEW ENDING]  ← completed のみ      │
└──────────────────────────────────────┘
```

#### キャンペーン全クリア後の挙動

`isCampaignCompleted` が true でも、プレイヤーは引き続き各ステージに挑戦してタイムを更新できる。
`VIEW ENDING` ボタンによりエンディングを **何度でも再生可能**（#7 対応）。

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

残機 0 で時間切れとなった場合に表示される。**STAGE SELECT に戻った瞬間に lives は 3 にリセット**される（§2.4）。

```
┌──────────────────────────┐
│       GAME OVER          │
│                          │
│   STAGE 5 / 8            │
│                          │
│   [STAGE SELECT]         │
└──────────────────────────┘
```

> **注**: GAME OVER 画面では `RETRY STAGE` を出さず、必ず STAGE SELECT に戻る。理由: lives リセット規則を 1 ヶ所（STAGE SELECT 入場時）に統一するため。リトライしたければプレイヤーは STAGE SELECT から同じステージを選び直せばよい。

### 6.7 エンディング画面（Phase 2 で本実装、Phase 1 は簡易版）

簡易版（Phase 1）: "CONGRATULATIONS!" + "YOU CLEARED ALL 8 STAGES" + STAGE SELECT へ戻るボタン

本実装（Phase 2）:
- 黒背景 → ドライバーの独白テキスト 3 画面分（構成は §6.7.2 のテンプレに従う）
- "THANK YOU FOR PLAYING" 大型タイポ
- 各ステージのタイトル + プレイヤーの記録（タイム + ランク）一覧表示
- ランク集計表示（GOLD ×N / SILVER ×N / BRONZE ×N）— #13 対応
- クレジットロール

#### 6.7.1 ドライバー（主人公）キャラクターシート（#10 対応）

| 項目 | 設定 |
|------|------|
| 名前 | 設定しない（プレイヤー自身を投影できる空白） |
| 性別 | 中性的（テキストで断定しない） |
| 年齢 | 中性的（特定しない） |
| 一人称 | **「俺」** |
| 二人称 | 「お前」「あんた」（場面で使い分け） |
| 文体 | **常体（だ・である）**。タメ口、感嘆符は控えめ |
| 性格 | 寡黙・冷静・自己評価が辛口。レースに対しては勝ち負けより「走り切ること」を優先 |
| 動機 | 「なぜ走るのか」を **明示しない**。プレイヤーに想像の余地を残す |
| 縦糸シンボル | **「夜明け」** — 各ステージ intro に最低 1 度、夜明け／光／東の空 を想起させる単語を含める。エンディングで回収する |
| してはいけない | 自虐的になる / 観客や審判に語りかける / 競争相手を貶す / プレイヤーキャラ自身を「俺たち」と複数形にする |

> **記述のブレ防止**: ナラティブ執筆時は本シートを必ず参照する。複数の AI / 人間ライターで分担する場合も、シートを唯一の真実とする。

#### 6.7.2 エンディング独白の構成テンプレ（#14 対応）

3 画面構成。各画面 60 字以内（全角）。

| 画面 | 役割 | 内容ガイド |
|------|------|-----------|
| 1 | 旅の振り返り | "8 ステージを走り抜けたこと" を、固有名詞ではなく感覚で描く（風 / 光 / アスファルト 等） |
| 2 | 今の感情 | 達成感ではなく **「夜明けがまだ来ない」「もう一度スタートラインに立ちたい」** に寄せる。ドライバーの動機の核心に触れない |
| 3 | プレイヤーへの一言 | "ここまで走ってくれて、ありがとう" を直接的でなく寡黙に。最後の一文で **「夜明け」** を回収する |

> 例（参考、最終版ではない）:
> - 1: 「風の温度が、最初のステージとは違っていた。」
> - 2: 「夜明けは、まだ来ない。」
> - 3: 「だが、お前と走ったこの道は、確かに東を向いていた。」

#### 6.7.3 ステージ間ナラティブ（intro）の指針

- 各ステージ `Stage.intro` は **1〜2 行 / 1 行 = 全角 28 文字、最大 56 文字**（#17 対応）
- ドライバーシート（§6.7.1）の文体に従う
- 各 intro に **最低 1 度、縦糸シンボル「夜明け」関連語**（夜明け / 朝 / 東 / 光 / 影 / 闇）を含める（#11 伏線対応）
- ステージごとの舞台描写を主にし、内省は短く

例:
- Stage 1 FOREST: 「霧の向こうで、東の空がうっすらと白んでいる。」
- Stage 8 OVERDRIVE: 「夜明けまで、あとひと走りだ。」

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

### 7.3 タイマー警告音（#19 対応）

Excitebike / F-Zero 模倣の警告音。動作規則:

- 状態: `isWarning = timeRemainingSec <= 10`
- `isWarning === true` の間、毎秒 1 回「ピッ」を再生（タイマーは整数秒の境界をまたいだタイミング）
- **チェックポイント通過で残り時間が +N されて `isWarning === false` に戻った場合、即座に警告音を停止する**
- 再び 10 秒以下に減少したら自動的に再開

実装位置: `application/use-cases/advance-stage-time.ts` から `audio-port.playWarningTick()` を呼び、停止判断もそこで行う。

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
